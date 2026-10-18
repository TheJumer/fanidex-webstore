package handlers

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"webstore/internal/config"
	"webstore/internal/payments"
	"webstore/internal/services"
)

// WebhookHandler verifies provider webhooks and finalizes payment idempotently.
type WebhookHandler struct {
	db       *gorm.DB
	cfg      *config.Config
	checkout *services.CheckoutService
	delivery *services.DeliveryService
	gateways *services.GatewayService
	audit    *services.AuditService
}

func NewWebhookHandler(
	db *gorm.DB,
	cfg *config.Config,
	checkout *services.CheckoutService,
	delivery *services.DeliveryService,
	gateways *services.GatewayService,
	audit *services.AuditService,
) *WebhookHandler {
	return &WebhookHandler{db, cfg, checkout, delivery, gateways, audit}
}

// Handle verifies a webhook for the named gateway and triggers delivery.
func (h *WebhookHandler) Handle(c *fiber.Ctx) error {
	gatewayName := c.Params("gateway")

	driver, ok := payments.Get(gatewayName)
	if !ok {
		return fiber.NewError(fiber.StatusNotFound, "unknown gateway")
	}
	if !h.gateways.IsEnabled(gatewayName) {
		return fiber.NewError(fiber.StatusForbidden, "gateway disabled")
	}

	creds, err := h.gateways.Credentials(gatewayName, h.cfg.AppBaseURL)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	// Signature verification uses the RAW body inside the driver.
	event, err := driver.VerifyWebhook(c, creds)
	if err != nil {
		h.audit.Log(nil, "", "webhook_signature_fail", gatewayName+": "+err.Error(), c.IP(), false)
		return fiber.NewError(fiber.StatusBadRequest, "webhook verification failed")
	}

	if !event.Paid {
		return c.JSON(fiber.Map{"status": "ignored", "reason": "not paid"})
	}

	// Idempotent finalization with row-level locking.
	order, err := h.checkout.MarkPaidAndDeliver(event.OrderPublicID, event.ExternalTxnID, h.delivery)
	if err != nil {
		return fiber.NewError(fiber.StatusConflict, err.Error())
	}

	return c.JSON(fiber.Map{
		"status":   "ok",
		"order_id": order.PublicID,
		"state":    order.Status,
	})
}

// TestPay is the sandbox convenience endpoint the test gateway redirects to.
// It constructs a fake webhook and runs the normal verification/delivery pipeline.
func (h *WebhookHandler) TestPay(c *fiber.Ctx) error {
	if !h.gateways.IsEnabled("test") {
		return fiber.NewError(fiber.StatusForbidden, "test gateway disabled")
	}
	driver, _ := payments.Get("test")
	creds, _ := h.gateways.Credentials("test", h.cfg.AppBaseURL)

	event, err := driver.VerifyWebhook(c, creds)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	order, err := h.checkout.MarkPaidAndDeliver(event.OrderPublicID, event.ExternalTxnID, h.delivery)
	if err != nil {
		return fiber.NewError(fiber.StatusConflict, err.Error())
	}
	// Redirect the browser back to the frontend success page.
	return c.Redirect(h.cfg.FrontendURL+"/checkout/success?order="+order.PublicID, fiber.StatusSeeOther)
}
