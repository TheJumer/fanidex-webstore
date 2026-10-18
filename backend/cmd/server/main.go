package main

import (
	"log"

	"webstore/internal/config"
	"webstore/internal/crypto"
	"webstore/internal/database"
	"webstore/internal/router"
	"webstore/internal/services"
	"webstore/internal/worker"
)

func main() {
	cfg := config.Load()

	// Initialize AES-256-GCM master key (fatal if invalid).
	if err := crypto.InitMasterKey(cfg.MasterKey); err != nil {
		log.Fatalf("[fatal] master key: %v", err)
	}

	// Database driver factory + migrations.
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("[fatal] db connect: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		log.Fatalf("[fatal] migrate: %v", err)
	}
	if err := database.Seed(db, cfg); err != nil {
		log.Fatalf("[fatal] seed: %v", err)
	}

	// Services.
	settings := services.NewSettingsService(db)
	promo := services.NewPromoService(db)
	delivery := services.NewDeliveryService(db, settings)
	checkout := services.NewCheckoutService(db, promo, settings)
	gateways := services.NewGatewayService(db)
	audit := services.NewAuditService(db)
	auth := services.NewAuthService(db, cfg)

	// Background expiry worker.
	w := worker.NewExpiryWorker(db, delivery, settings, cfg.ExpiryTickSeconds)
	w.Start()
	defer w.Stop()

	// HTTP server.
	app := router.Setup(router.Deps{
		DB:       db,
		Cfg:      cfg,
		Auth:     auth,
		Settings: settings,
		Promo:    promo,
		Checkout: checkout,
		Delivery: delivery,
		Gateways: gateways,
		Audit:    audit,
	})

	log.Printf("[http] listening on :%s (env=%s)", cfg.AppPort, cfg.AppEnv)
	if err := app.Listen(":" + cfg.AppPort); err != nil {
		log.Fatalf("[fatal] server: %v", err)
	}
}
