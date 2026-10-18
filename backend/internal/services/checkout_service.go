package services

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"webstore/internal/models"
	"webstore/internal/security"
)

// CheckoutService performs trusted, server-side order creation.
type CheckoutService struct {
	db       *gorm.DB
	promo    *PromoService
	settings *SettingsService
}

func NewCheckoutService(db *gorm.DB, promo *PromoService, settings *SettingsService) *CheckoutService {
	return &CheckoutService{db: db, promo: promo, settings: settings}
}

// CheckoutItemInput is the ONLY cart data accepted from the client.
// Note: no prices, no totals — the server computes everything.
type CheckoutItemInput struct {
	ProductID         uint  `json:"product_id"`
	DurationVariantID *uint `json:"duration_variant_id"`
	Quantity          int   `json:"quantity"`
}

// CheckoutInput is the validated checkout request body.
type CheckoutInput struct {
	MinecraftUsername string              `json:"minecraft_username"`
	Currency          string              `json:"currency"`
	PromoCode         string              `json:"promo_code"`
	Items             []CheckoutItemInput `json:"items"`
}

// CreateOrder builds an order inside a DB transaction with authoritative pricing.
func (s *CheckoutService) CreateOrder(in CheckoutInput) (*models.Order, error) {
	username, err := security.ValidateUsername(in.MinecraftUsername)
	if err != nil {
		return nil, err
	}
	if len(in.Items) == 0 {
		return nil, errors.New("cart is empty")
	}
	currency := in.Currency
	rates := s.settings.Rates()
	if currency == "" || !SupportedCurrencyWithRates(currency, rates) {
		currency = "USD"
	}

	var order *models.Order
	err = s.db.Transaction(func(tx *gorm.DB) error {
		o := models.Order{
			PublicID:          uuid.NewString(),
			MinecraftUsername: username,
			Status:            models.StatusPending,
			Currency:          currency,
		}

		subtotalUSD := 0
		productIDs := []uint{}
		categoryIDs := []uint{}
		var items []models.OrderItem

		for _, ci := range in.Items {
			if ci.Quantity < 1 {
				ci.Quantity = 1
			}
			if ci.Quantity > 64 {
				return fmt.Errorf("quantity too large")
			}

			var product models.Product
			if err := tx.First(&product, "id = ? AND active = ?", ci.ProductID, true).Error; err != nil {
				return fmt.Errorf("product %d not available", ci.ProductID)
			}
			productIDs = append(productIDs, product.ID)
			categoryIDs = append(categoryIDs, product.CategoryID)

			unitUSD := 0
			durationDays := 0
			variantLabel := ""

			if product.HasVariants {
				if ci.DurationVariantID == nil {
					return fmt.Errorf("product %q requires a duration variant", product.Name)
				}
				var variant models.DurationVariant
				if err := tx.First(&variant, "id = ? AND product_id = ?", *ci.DurationVariantID, product.ID).Error; err != nil {
					return fmt.Errorf("invalid variant for product %q", product.Name)
				}
				unitUSD = effectivePrice(variant.PriceCents, variant.SalePriceCents)
				durationDays = variant.DurationDays
				variantLabel = variant.Label
			} else {
				unitUSD = effectivePrice(product.BasePriceCents, product.SalePriceCents)
			}

			lineUSD := unitUSD * ci.Quantity
			subtotalUSD += lineUSD

			items = append(items, models.OrderItem{
				ProductID:         product.ID,
				DurationVariantID: ci.DurationVariantID,
				ProductName:       product.Name,
				VariantLabel:      variantLabel,
				Quantity:          ci.Quantity,
				UnitPriceCents:    unitUSD,
				LineTotalCents:    lineUSD,
				DurationDays:      durationDays,
			})
		}

		// Promo validation — strictly server side.
		discountUSD := 0
		if in.PromoCode != "" {
			res, promo, err := s.promo.Validate(in.PromoCode, subtotalUSD, productIDs, categoryIDs)
			if err != nil {
				return err
			}
			if res.Valid {
				discountUSD = res.DiscountCents
				o.PromoCode = res.Code
				// Increment usage atomically within the transaction.
				if promo != nil {
					if err := tx.Model(&models.PromoCode{}).
						Where("id = ?", promo.ID).
						UpdateColumn("uses", gorm.Expr("uses + 1")).Error; err != nil {
						return err
					}
				}
			}
		}

		totalUSD := subtotalUSD - discountUSD
		if totalUSD < 0 {
			totalUSD = 0
		}

		// Convert to the requested display currency (authoritative, server-side).
		o.SubtotalCents = ConvertFromUSDCentsWithRates(subtotalUSD, currency, rates)
		o.DiscountCents = ConvertFromUSDCentsWithRates(discountUSD, currency, rates)
		o.TotalCents = ConvertFromUSDCentsWithRates(totalUSD, currency, rates)

		if err := tx.Create(&o).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].OrderID = o.ID
		}
		if len(items) > 0 {
			if err := tx.Create(&items).Error; err != nil {
				return err
			}
		}
		o.Items = items
		order = &o
		return nil
	})
	if err != nil {
		return nil, err
	}
	return order, nil
}

// MarkPaidAndDeliver finalizes payment idempotently using row-level locking.
func (s *CheckoutService) MarkPaidAndDeliver(orderPublicID, externalTxnID string, delivery *DeliveryService) (*models.Order, error) {
	var order models.Order
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Lock the order row to prevent concurrent double-delivery.
		q := tx.Clauses(clause.Locking{Strength: "UPDATE"})
		if err := q.Preload("Items").First(&order, "public_id = ?", orderPublicID).Error; err != nil {
			return err
		}

		// Idempotency: if already paid/delivered, do nothing.
		if order.Status == models.StatusPaid || order.Status == models.StatusDelivered {
			return nil
		}

		// Enforce unique external transaction id.
		if externalTxnID != "" {
			var existing int64
			tx.Model(&models.Order{}).
				Where("external_txn_id = ? AND id <> ?", externalTxnID, order.ID).
				Count(&existing)
			if existing > 0 {
				return fmt.Errorf("duplicate external transaction id")
			}
			order.ExternalTxnID = externalTxnID
		}

		now := timeNow()
		order.Status = models.StatusPaid
		order.PaidAt = &now
		if err := tx.Save(&order).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	// Deliver outside the lock; mark delivered on success.
	if order.Status == models.StatusPaid {
		if derr := delivery.DeliverOrder(&order); derr == nil {
			order.Status = models.StatusDelivered
			s.db.Model(&models.Order{}).Where("id = ?", order.ID).Update("status", models.StatusDelivered)
		}
	}
	return &order, nil
}

// effectivePrice returns sale price if set & lower, else base price.
func effectivePrice(base int, sale *int) int {
	if sale != nil && *sale >= 0 && *sale < base {
		return *sale
	}
	return base
}
