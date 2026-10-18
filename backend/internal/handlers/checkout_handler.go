package handlers

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"webstore/internal/config"
	"webstore/internal/models"
	"webstore/internal/payments"
	"webstore/internal/security"
	"webstore/internal/services"
)

// CheckoutHandler handles cart validation, checkout and payment session creation.
type CheckoutHandler struct {
	db       *gorm.DB
	cfg      *config.Config
	checkout *services.CheckoutService
	promo    *services.PromoService
	delivery *services.DeliveryService
	settings *services.SettingsService
	gateways *services.GatewayService
}

func NewCheckoutHandler(
	db *gorm.DB,
	cfg *config.Config,
	checkout *services.CheckoutService,
	promo *services.PromoService,
	delivery *services.DeliveryService,
	settings *services.SettingsService,
	gateways *services.GatewayService,
) *CheckoutHandler {
	return &CheckoutHandler{db, cfg, checkout, promo, delivery, settings, gateways}
}

// ValidateUsername checks a Minecraft username format (used before cart actions).
func (h *CheckoutHandler) ValidateUsername(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	clean, err := security.ValidateUsername(body.Username)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"valid": false, "error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"valid":      true,
		"username":   clean,
		"avatar_url": "https://mc-heads.net/body/" + clean,
	})
}

// ValidatePromo validates a promo code against a cart (server computes everything).
func (h *CheckoutHandler) ValidatePromo(c *fiber.Ctx) error {
	var body struct {
		Code  string                        `json:"code"`
		Items []services.CheckoutItemInput  `json:"items"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}

	// Recompute subtotal server-side from product ids only.
	subtotal := 0
	productIDs := []uint{}
	categoryIDs := []uint{}
	for _, it := range body.Items {
		if it.Quantity < 1 {
			it.Quantity = 1
		}
		var p models.Product
		if err := h.db.First(&p, "id = ? AND active = ?", it.ProductID, true).Error; err != nil {
			continue
		}
		productIDs = append(productIDs, p.ID)
		categoryIDs = append(categoryIDs, p.CategoryID)
		unit := 0
		if p.HasVariants && it.DurationVariantID != nil {
			var v models.DurationVariant
			if err := h.db.First(&v, "id = ? AND product_id = ?", *it.DurationVariantID, p.ID).Error; err == nil {
				unit = pickPrice(v.PriceCents, v.SalePriceCents)
			}
		} else {
			unit = pickPrice(p.BasePriceCents, p.SalePriceCents)
		}
		subtotal += unit * it.Quantity
	}

	res, _, err := h.promo.Validate(body.Code, subtotal, productIDs, categoryIDs)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(res)
}

// Checkout creates an order + a payment session. Accepts ONLY ids/qty/promo/username.
func (h *CheckoutHandler) Checkout(c *fiber.Ctx) error {
	var in services.CheckoutInput
	if err := c.BodyParser(&in); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	var body struct {
		Gateway string `json:"gateway"`
	}
	_ = c.BodyParser(&body)
	gatewayName := body.Gateway
	if gatewayName == "" {
		gatewayName = "test"
	}

	// Ensure the requested gateway is enabled by an admin.
	if !h.gateways.IsEnabled(gatewayName) {
		return fiber.NewError(fiber.StatusBadRequest, "payment gateway not available")
	}

	order, err := h.checkout.CreateOrder(in)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	driver, ok := payments.Get(gatewayName)
	if !ok {
		return fiber.NewError(fiber.StatusBadRequest, "unknown gateway")
	}
	creds, err := h.gateways.Credentials(gatewayName, h.cfg.AppBaseURL)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	redirectURL, externalID, err := driver.CreateCheckoutSession(*order, creds)
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	// Persist the gateway + external id reference on the order.
	h.db.Model(&models.Order{}).Where("id = ?", order.ID).
		Updates(map[string]interface{}{"gateway": gatewayName, "external_txn_id": externalID})

	return c.JSON(fiber.Map{
		"order_id":     order.PublicID,
		"redirect_url": redirectURL,
		"total_cents":  order.TotalCents,
		"currency":     order.Currency,
	})
}

func pickPrice(base int, sale *int) int {
	if sale != nil && *sale >= 0 && *sale < base {
		return *sale
	}
	return base
}
