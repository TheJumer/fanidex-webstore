package payments

import (
	"sync"

	"github.com/gofiber/fiber/v2"

	"webstore/internal/models"
)

// WebhookEvent is the normalized result of verifying a provider webhook.
type WebhookEvent struct {
	ExternalTxnID string // provider's unique transaction id (idempotency key)
	OrderPublicID string // our order reference echoed back by the provider
	Paid          bool   // whether payment succeeded
	AmountCents   int    // amount reported by provider (for optional cross-check)
	Currency      string
	Raw           string // raw body for audit
}

// PaymentGateway is the pluggable driver interface.
type PaymentGateway interface {
	// Name returns the driver key (e.g. "stripe", "test").
	Name() string
	// CreateCheckoutSession returns a redirect URL and the provider's external id.
	CreateCheckoutSession(order models.Order, cfg GatewayCredentials) (redirectURL string, externalID string, err error)
	// VerifyWebhook validates signature using raw body and returns a normalized event.
	VerifyWebhook(c *fiber.Ctx, cfg GatewayCredentials) (WebhookEvent, error)
}

// GatewayCredentials carries decrypted secrets to a driver at call time.
type GatewayCredentials struct {
	APIKey     string
	SecretKey  string
	WebhookKey string
	BaseURL    string // our app base url for building return/callback links
}

// Registry holds all registered gateway drivers.
type Registry struct {
	mu      sync.RWMutex
	drivers map[string]PaymentGateway
}

var defaultRegistry = &Registry{drivers: map[string]PaymentGateway{}}

// Register adds a driver to the global registry.
func Register(d PaymentGateway) {
	defaultRegistry.mu.Lock()
	defer defaultRegistry.mu.Unlock()
	defaultRegistry.drivers[d.Name()] = d
}

// Get returns a registered driver by name.
func Get(name string) (PaymentGateway, bool) {
	defaultRegistry.mu.RLock()
	defer defaultRegistry.mu.RUnlock()
	d, ok := defaultRegistry.drivers[name]
	return d, ok
}

// Names returns all registered driver names.
func Names() []string {
	defaultRegistry.mu.RLock()
	defer defaultRegistry.mu.RUnlock()
	out := make([]string, 0, len(defaultRegistry.drivers))
	for k := range defaultRegistry.drivers {
		out = append(out, k)
	}
	return out
}
