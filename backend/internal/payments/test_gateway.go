package payments

import (
	"fmt"

	"github.com/gofiber/fiber/v2"

	"webstore/internal/crypto"
	"webstore/internal/models"
)

// TestGateway is a built-in sandbox driver. It "confirms" payment via a signed
// callback so the full checkout + delivery flow can be exercised without real money.
// It is only usable when enabled by an admin.
type TestGateway struct{}

func (g *TestGateway) Name() string { return "test" }

// CreateCheckoutSession returns a redirect to the frontend's sandbox success page.
// The externalID is deterministic from the order public id for easy testing.
func (g *TestGateway) CreateCheckoutSession(order models.Order, cfg GatewayCredentials) (string, string, error) {
	externalID := "test_" + order.PublicID
	// The redirect points at our own webhook simulate endpoint which the sandbox page calls.
	url := fmt.Sprintf("%s/api/v1/webhooks/test/pay?order=%s&txn=%s",
		cfg.BaseURL, order.PublicID, externalID)
	return url, externalID, nil
}

// VerifyWebhook accepts a signed sandbox confirmation. The signature is an HMAC of
// the raw body using the configured WebhookKey (defaults handled by caller).
func (g *TestGateway) VerifyWebhook(c *fiber.Ctx, cfg GatewayCredentials) (WebhookEvent, error) {
	order := c.Query("order")
	txn := c.Query("txn")
	if order == "" || txn == "" {
		// Fall back to body params (POST form / json)
		order = firstNonEmpty(order, c.FormValue("order"))
		txn = firstNonEmpty(txn, c.FormValue("txn"))
	}
	if order == "" || txn == "" {
		return WebhookEvent{}, fmt.Errorf("missing order/txn")
	}

	// Optional signature check: if a webhook key is configured, enforce it.
	if cfg.WebhookKey != "" {
		sig := c.Get("X-Signature")
		msg := []byte(order + ":" + txn)
		if !crypto.VerifyHMAC(cfg.WebhookKey, msg, sig) {
			return WebhookEvent{}, fmt.Errorf("invalid test webhook signature")
		}
	}

	return WebhookEvent{
		ExternalTxnID: txn,
		OrderPublicID: order,
		Paid:          true,
		Currency:      "USD",
		Raw:           string(c.Body()),
	}, nil
}

func firstNonEmpty(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

func init() {
	Register(&TestGateway{})
}
