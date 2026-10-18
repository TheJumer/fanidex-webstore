package payments

import (
	"encoding/json"
	"fmt"

	"github.com/gofiber/fiber/v2"

	"webstore/internal/crypto"
	"webstore/internal/models"
)

// StripeGateway is an example modular driver demonstrating the registry pattern.
// It performs HMAC-SHA256 verification of the raw webhook body (Stripe-style
// "t=...,v1=..." signatures are simplified here to a single HMAC for portability).
// Swap the CreateCheckoutSession body with the real Stripe SDK call in production.
type StripeGateway struct{}

func (g *StripeGateway) Name() string { return "stripe" }

func (g *StripeGateway) CreateCheckoutSession(order models.Order, cfg GatewayCredentials) (string, string, error) {
	if cfg.SecretKey == "" {
		return "", "", fmt.Errorf("stripe secret key not configured")
	}
	// In production: call Stripe API to create a Checkout Session and return session.URL + session.ID.
	// Here we return a deterministic placeholder so the flow is wired end-to-end.
	externalID := "cs_" + order.PublicID
	url := fmt.Sprintf("%s/api/v1/webhooks/stripe/simulate?order=%s&txn=%s",
		cfg.BaseURL, order.PublicID, externalID)
	return url, externalID, nil
}

func (g *StripeGateway) VerifyWebhook(c *fiber.Ctx, cfg GatewayCredentials) (WebhookEvent, error) {
	raw := c.Body()
	sig := c.Get("X-Signature")
	if cfg.WebhookKey == "" {
		return WebhookEvent{}, fmt.Errorf("stripe webhook secret not configured")
	}
	// Verify HMAC-SHA256 of the RAW body (never the parsed struct).
	if !crypto.VerifyHMAC(cfg.WebhookKey, raw, sig) {
		return WebhookEvent{}, fmt.Errorf("invalid stripe signature")
	}

	var payload struct {
		Type string `json:"type"`
		Data struct {
			Object struct {
				ID       string `json:"id"`
				Metadata struct {
					OrderPublicID string `json:"order_public_id"`
				} `json:"metadata"`
				AmountTotal int    `json:"amount_total"`
				Currency    string `json:"currency"`
				Paid        bool   `json:"paid"`
			} `json:"object"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return WebhookEvent{}, err
	}

	return WebhookEvent{
		ExternalTxnID: payload.Data.Object.ID,
		OrderPublicID: payload.Data.Object.Metadata.OrderPublicID,
		Paid:          payload.Type == "checkout.session.completed" && payload.Data.Object.Paid,
		AmountCents:   payload.Data.Object.AmountTotal,
		Currency:      payload.Data.Object.Currency,
		Raw:           string(raw),
	}, nil
}

func init() {
	Register(&StripeGateway{})
}
