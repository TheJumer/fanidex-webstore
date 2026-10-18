package services

import (
	"encoding/json"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"webstore/internal/models"
)

// PromoService validates and applies promo codes — strictly server-side.
type PromoService struct {
	db *gorm.DB
}

func NewPromoService(db *gorm.DB) *PromoService {
	return &PromoService{db: db}
}

// PromoResult is the validated discount outcome.
type PromoResult struct {
	Code          string `json:"code"`
	DiscountCents int    `json:"discount_cents"`
	Valid         bool   `json:"valid"`
	Message       string `json:"message"`
}

// Validate checks a promo code against the given subtotal and item set (USD cents).
// productIDs/categoryIDs describe the cart so restrictions can be enforced.
func (p *PromoService) Validate(code string, subtotalCents int, productIDs, categoryIDs []uint) (PromoResult, *models.PromoCode, error) {
	code = strings.ToUpper(strings.TrimSpace(code))
	if code == "" {
		return PromoResult{Valid: false, Message: "empty code"}, nil, nil
	}
	var promo models.PromoCode
	if err := p.db.First(&promo, "code = ? AND active = ?", code, true).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return PromoResult{Code: code, Valid: false, Message: "invalid code"}, nil, nil
		}
		return PromoResult{}, nil, err
	}

	if promo.ExpiresAt != nil && promo.ExpiresAt.Before(time.Now()) {
		return PromoResult{Code: code, Valid: false, Message: "code expired"}, nil, nil
	}
	if promo.MaxUses > 0 && promo.Uses >= promo.MaxUses {
		return PromoResult{Code: code, Valid: false, Message: "code usage limit reached"}, nil, nil
	}

	// Restriction checks.
	if !p.matchesRestriction(promo.RestrictProductIDs, productIDs) {
		return PromoResult{Code: code, Valid: false, Message: "code not valid for these products"}, nil, nil
	}
	if !p.matchesRestriction(promo.RestrictCategoryIDs, categoryIDs) {
		return PromoResult{Code: code, Valid: false, Message: "code not valid for these categories"}, nil, nil
	}

	discount := 0
	switch promo.Type {
	case "percent":
		discount = subtotalCents * promo.Value / 100
	case "fixed":
		discount = promo.Value
	}
	if discount > subtotalCents {
		discount = subtotalCents
	}

	return PromoResult{
		Code:          code,
		DiscountCents: discount,
		Valid:         true,
		Message:       "applied",
	}, &promo, nil
}

// matchesRestriction returns true if restriction is empty (all) or any id matches.
func (p *PromoService) matchesRestriction(restrictJSON string, ids []uint) bool {
	if strings.TrimSpace(restrictJSON) == "" {
		return true
	}
	var allowed []uint
	if err := json.Unmarshal([]byte(restrictJSON), &allowed); err != nil || len(allowed) == 0 {
		return true
	}
	set := map[uint]bool{}
	for _, a := range allowed {
		set[a] = true
	}
	for _, id := range ids {
		if set[id] {
			return true
		}
	}
	return false
}
