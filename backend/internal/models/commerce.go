package models

import (
	"time"

	"gorm.io/gorm"
)

// OrderStatus enum.
const (
	StatusPending   = "PENDING"
	StatusPaid      = "PAID"
	StatusDelivered = "DELIVERED"
	StatusExpired   = "EXPIRED"
	StatusRefunded  = "REFUNDED"
	StatusFailed    = "FAILED"
)

// Order represents a checkout.
type Order struct {
	ID                uint   `gorm:"primaryKey" json:"id"`
	PublicID          string `gorm:"uniqueIndex;size:64" json:"public_id"`
	MinecraftUsername string `gorm:"size:32;index" json:"minecraft_username"`
	Status            string `gorm:"size:16;index;default:PENDING" json:"status"`
	Currency          string `gorm:"size:8;default:USD" json:"currency"`
	// Authoritative server-computed total, in USD cents.
	SubtotalCents int    `json:"subtotal_cents"`
	DiscountCents int    `json:"discount_cents"`
	TotalCents    int    `json:"total_cents"`
	PromoCode     string `gorm:"size:64" json:"promo_code"`

	Gateway string `gorm:"size:32" json:"gateway"`
	// Idempotency: unique external transaction id from the payment provider.
	ExternalTxnID string `gorm:"uniqueIndex;size:191" json:"external_txn_id"`

	Items     []OrderItem    `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	PaidAt    *time.Time     `json:"paid_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// OrderItem is a line in an order with server-trusted pricing snapshot.
type OrderItem struct {
	ID                uint `gorm:"primaryKey" json:"id"`
	OrderID           uint `gorm:"index;not null" json:"order_id"`
	ProductID         uint `gorm:"index" json:"product_id"`
	DurationVariantID *uint `json:"duration_variant_id"`
	ProductName       string `gorm:"size:191" json:"product_name"`
	VariantLabel      string `gorm:"size:64" json:"variant_label"`
	Quantity          int    `gorm:"default:1" json:"quantity"`
	UnitPriceCents    int    `json:"unit_price_cents"`
	LineTotalCents    int    `json:"line_total_cents"`
	// DurationDays snapshot (0 = permanent).
	DurationDays int       `json:"duration_days"`
	CreatedAt    time.Time `json:"created_at"`
}

// TempGrant tracks an active temporary rank/package for expiry processing.
type TempGrant struct {
	ID                uint   `gorm:"primaryKey" json:"id"`
	OrderID           uint   `gorm:"index" json:"order_id"`
	ProductID         uint   `gorm:"index" json:"product_id"`
	MinecraftUsername string `gorm:"size:32;index" json:"minecraft_username"`
	// JSON-encoded []string of expiry commands with placeholders already resolved.
	ExpiryCommands string     `gorm:"type:text" json:"expiry_commands"`
	ExpiresAt      time.Time  `gorm:"index" json:"expires_at"`
	Expired        bool       `gorm:"default:false;index" json:"expired"`
	ExpiredAt      *time.Time `json:"expired_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

// PromoCode supports percentage or fixed discounts.
type PromoCode struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Code string `gorm:"uniqueIndex;size:64;not null" json:"code"`
	// Type = "percent" | "fixed"
	Type string `gorm:"size:16;not null" json:"type"`
	// Percent (0-100) OR fixed amount in USD cents depending on Type.
	Value       int        `gorm:"not null" json:"value"`
	MaxUses     int        `gorm:"default:0" json:"max_uses"` // 0 = unlimited
	Uses        int        `gorm:"default:0" json:"uses"`
	ExpiresAt   *time.Time `json:"expires_at"`
	// Optional restriction: JSON-encoded []uint of category IDs / product IDs (empty = all).
	RestrictCategoryIDs string         `gorm:"type:text" json:"restrict_category_ids"`
	RestrictProductIDs  string         `gorm:"type:text" json:"restrict_product_ids"`
	Active              bool           `gorm:"default:true" json:"active"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`
}

// DeliveryJob queued for Plugin API (Mode B) or audit of RCON (Mode A).
type DeliveryJob struct {
	ID                uint   `gorm:"primaryKey" json:"id"`
	OrderID           uint   `gorm:"index" json:"order_id"`
	MinecraftUsername string `gorm:"size:32;index" json:"minecraft_username"`
	// JSON-encoded []string of sanitized commands.
	Commands      string     `gorm:"type:text" json:"commands"`
	RequireOnline bool       `gorm:"default:false" json:"require_online"`
	Status        string     `gorm:"size:16;index;default:PENDING" json:"status"` // PENDING | SENT | CONFIRMED | FAILED
	Attempts      int        `gorm:"default:0" json:"attempts"`
	ConfirmedAt   *time.Time `json:"confirmed_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
