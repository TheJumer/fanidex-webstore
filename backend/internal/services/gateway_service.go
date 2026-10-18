package services

import (
	"errors"

	"gorm.io/gorm"

	"webstore/internal/crypto"
	"webstore/internal/models"
	"webstore/internal/payments"
)

// GatewayService manages payment gateway config rows (toggles + encrypted keys).
type GatewayService struct {
	db *gorm.DB
}

func NewGatewayService(db *gorm.DB) *GatewayService {
	return &GatewayService{db: db}
}

// IsEnabled reports whether a driver is toggled on in the admin panel.
func (g *GatewayService) IsEnabled(driver string) bool {
	var cfg models.PaymentGatewayConfig
	if err := g.db.First(&cfg, "driver = ?", driver).Error; err != nil {
		return false
	}
	return cfg.Enabled
}

// Credentials returns decrypted credentials for a driver at call time.
func (g *GatewayService) Credentials(driver, baseURL string) (payments.GatewayCredentials, error) {
	var cfg models.PaymentGatewayConfig
	if err := g.db.First(&cfg, "driver = ?", driver).Error; err != nil {
		return payments.GatewayCredentials{BaseURL: baseURL}, nil
	}
	api, _ := crypto.Decrypt(cfg.APIKey)
	secret, _ := crypto.Decrypt(cfg.SecretKey)
	webhook, _ := crypto.Decrypt(cfg.WebhookKey)
	return payments.GatewayCredentials{
		APIKey:     api,
		SecretKey:  secret,
		WebhookKey: webhook,
		BaseURL:    baseURL,
	}, nil
}

// Upsert stores a gateway config, encrypting any provided secrets.
// Empty secret strings keep the existing stored value (so masked values aren't overwritten).
func (g *GatewayService) Upsert(driver string, enabled bool, apiKey, secretKey, webhookKey string) error {
	if driver == "" {
		return errors.New("driver required")
	}
	var cfg models.PaymentGatewayConfig
	err := g.db.First(&cfg, "driver = ?", driver).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		cfg = models.PaymentGatewayConfig{Driver: driver}
	} else if err != nil {
		return err
	}

	cfg.Enabled = enabled
	if apiKey != "" {
		if enc, e := crypto.Encrypt(apiKey); e == nil {
			cfg.APIKey = enc
		}
	}
	if secretKey != "" {
		if enc, e := crypto.Encrypt(secretKey); e == nil {
			cfg.SecretKey = enc
		}
	}
	if webhookKey != "" {
		if enc, e := crypto.Encrypt(webhookKey); e == nil {
			cfg.WebhookKey = enc
		}
	}
	return g.db.Save(&cfg).Error
}

// GatewayView is the masked, frontend-safe representation.
type GatewayView struct {
	Driver     string `json:"driver"`
	Enabled    bool   `json:"enabled"`
	APIKey     string `json:"api_key"`     // masked
	SecretKey  string `json:"secret_key"`  // masked
	WebhookKey string `json:"webhook_key"` // masked
	Registered bool   `json:"registered"`
}

// List returns all known drivers merged with their stored config (masked).
func (g *GatewayService) List() []GatewayView {
	stored := map[string]models.PaymentGatewayConfig{}
	var rows []models.PaymentGatewayConfig
	g.db.Find(&rows)
	for _, r := range rows {
		stored[r.Driver] = r
	}

	views := []GatewayView{}
	for _, name := range payments.Names() {
		cfg := stored[name]
		views = append(views, GatewayView{
			Driver:     name,
			Enabled:    cfg.Enabled,
			APIKey:     crypto.Mask(cfg.APIKey),
			SecretKey:  crypto.Mask(cfg.SecretKey),
			WebhookKey: crypto.Mask(cfg.WebhookKey),
			Registered: true,
		})
	}
	return views
}
