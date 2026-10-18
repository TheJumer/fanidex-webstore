package router

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"gorm.io/gorm"

	"webstore/internal/config"
	"webstore/internal/handlers"
	"webstore/internal/middleware"
	"webstore/internal/services"
)

// Deps bundles everything the router needs.
type Deps struct {
	DB       *gorm.DB
	Cfg      *config.Config
	Auth     *services.AuthService
	Settings *services.SettingsService
	Promo    *services.PromoService
	Checkout *services.CheckoutService
	Delivery *services.DeliveryService
	Gateways *services.GatewayService
	Audit    *services.AuditService
}

// Setup builds the Fiber app with all middleware and routes.
func Setup(d Deps) *fiber.App {
	app := fiber.New(fiber.Config{
		BodyLimit:    256 * 1024, // 256 KB body limit
		ErrorHandler: errorHandler,
	})

	// ---- Global security middleware ----
	app.Use(helmet.New(helmet.Config{
		XFrameOptions:         "DENY",
		ContentSecurityPolicy: "default-src 'self'; img-src 'self' https://mc-heads.net data:; style-src 'self' 'unsafe-inline'; script-src 'self'",
		HSTSMaxAge:            31536000,
		HSTSPreloadEnabled:    true,
		ReferrerPolicy:        "no-referrer",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     joinOrigins(d.Cfg.CORSOrigins),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-CSRF-Token",
		AllowCredentials: true,
	}))

	// ---- Handlers ----
	store := handlers.NewStoreHandler(d.DB, d.Settings, d.Promo)
	checkout := handlers.NewCheckoutHandler(d.DB, d.Cfg, d.Checkout, d.Promo, d.Delivery, d.Settings, d.Gateways)
	webhook := handlers.NewWebhookHandler(d.DB, d.Cfg, d.Checkout, d.Delivery, d.Gateways, d.Audit)
	plugin := handlers.NewPluginHandler(d.DB)
	authH := handlers.NewAuthHandler(d.DB, d.Cfg, d.Auth, d.Audit)
	adminH := handlers.NewAdminHandler(d.DB, d.Cfg, d.Settings, d.Gateways, d.Delivery, d.Audit)

	api := app.Group("/api/v1")
	api.Get("/health", func(c *fiber.Ctx) error { return c.JSON(fiber.Map{"status": "ok"}) })

	// ---- Public storefront ----
	api.Get("/settings", store.GetSettings)
	api.Get("/categories", store.GetCategories)
	api.Get("/products", store.GetProducts)
	api.Get("/products/:slug", store.GetProduct)
	api.Get("/top-customer", store.TopCustomer)

	// Per-endpoint rate limiting on sensitive public routes.
	checkoutLimiter := limiter.New(limiter.Config{Max: 20, Expiration: time.Minute})
	api.Post("/username/validate", checkout.ValidateUsername)
	api.Post("/promo/validate", checkoutLimiter, checkout.ValidatePromo)
	api.Post("/checkout", checkoutLimiter, checkout.Checkout)

	// ---- Payment webhooks (signature verified inside handler, raw body) ----
	webhookLimiter := limiter.New(limiter.Config{Max: 60, Expiration: time.Minute})
	api.Post("/webhooks/:gateway", webhookLimiter, webhook.Handle)
	// Sandbox convenience (GET redirect) for the built-in test gateway.
	api.Get("/webhooks/test/pay", webhook.TestPay)

	// ---- Plugin API (HMAC + timestamp + nonce) ----
	pluginGroup := api.Group("/plugin", middleware.PluginHMAC(d.DB, d.Settings))
	pluginGroup.Get("/queue", plugin.GetQueue)
	pluginGroup.Post("/confirm", plugin.Confirm)

	// ---- Admin auth (brute-force limited) ----
	loginLimiter := limiter.New(limiter.Config{
		Max:        5,
		Expiration: 15 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string { return c.IP() },
	})
	api.Post("/admin/login", loginLimiter, authH.Login)
	api.Post("/admin/refresh", authH.Refresh)
	api.Post("/admin/logout", authH.Logout)

	// ---- Protected admin routes ----
	admin := api.Group("/admin",
		middleware.IPWhitelist(d.Cfg.AdminIPWhitelist),
		middleware.RequireAdmin(d.Auth),
		middleware.CSRFProtect(),
	)
	admin.Get("/me", authH.Me)
	admin.Post("/totp/setup", authH.TOTPSetup)
	admin.Post("/totp/enable", authH.TOTPEnable)

	admin.Get("/overview", adminH.Overview)
	admin.Get("/revenue", adminH.RevenueSeries)
	admin.Post("/orders/:public_id/rerun", adminH.RerunDelivery)
	admin.Get("/audit-logs", adminH.AuditLogs)

	admin.Get("/categories", adminH.ListCategories)
	admin.Post("/categories", adminH.CreateCategory)
	admin.Put("/categories/:id", adminH.UpdateCategory)
	admin.Delete("/categories/:id", adminH.DeleteCategory)

	admin.Get("/products", adminH.ListProducts)
	admin.Get("/products/:id", adminH.GetProduct)
	admin.Post("/products", adminH.CreateProduct)
	admin.Put("/products/:id", adminH.UpdateProduct)
	admin.Delete("/products/:id", adminH.DeleteProduct)

	admin.Get("/promos", adminH.ListPromos)
	admin.Post("/promos", adminH.CreatePromo)
	admin.Delete("/promos/:id", adminH.DeletePromo)

	admin.Get("/settings", adminH.GetSettings)
	admin.Put("/settings", adminH.UpdateSettings)
	admin.Post("/settings/rcon/test", adminH.TestRCON)
	admin.Post("/settings/plugin/rotate", adminH.RotatePluginSecret)
	admin.Get("/settings/plugin/queue", adminH.PluginQueuePeek)

	admin.Get("/gateways", adminH.ListGateways)
	admin.Put("/gateways", adminH.UpsertGateway)
	admin.Get("/gateways/webhook-urls", adminH.WebhookURLs)

	return app
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error()})
}

func joinOrigins(origins []string) string {
	out := ""
	for i, o := range origins {
		if i > 0 {
			out += ","
		}
		out += o
	}
	if out == "" {
		return "*"
	}
	return out
}
