package models

import (
	"time"

	"gorm.io/gorm"
)

// Admin is a dashboard administrator account.
type Admin struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Email        string         `gorm:"uniqueIndex;size:191;not null" json:"email"`
	PasswordHash string         `gorm:"not null" json:"-"`
	TOTPSecret   string         `json:"-"` // AES-GCM encrypted
	TOTPEnabled  bool           `gorm:"default:false" json:"totp_enabled"`
	FailedLogins int            `gorm:"default:0" json:"-"`
	LockedUntil  *time.Time     `json:"-"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// Category of store products, supporting nesting via ParentID.
type Category struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:191;not null" json:"name"`
	Slug        string         `gorm:"uniqueIndex;size:191;not null" json:"slug"`
	Description string         `json:"description"`
	// Optional Ukrainian localization. Empty => falls back to the default fields.
	NameUK        string       `gorm:"size:191" json:"name_uk"`
	DescriptionUK string       `json:"description_uk"`
	ParentID    *uint          `gorm:"index" json:"parent_id"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	Children    []Category     `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	Products    []Product      `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// Product / package in the store.
type Product struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	CategoryID  uint    `gorm:"index;not null" json:"category_id"`
	Name        string  `gorm:"size:191;not null" json:"name"`
	Slug        string  `gorm:"uniqueIndex;size:191;not null" json:"slug"`
	Description string  `json:"description"` // markdown/html
	// Optional Ukrainian localization. Empty => falls back to the default fields.
	NameUK        string `gorm:"size:191" json:"name_uk"`
	DescriptionUK string `gorm:"type:text" json:"description_uk"`
	ImageURL    string  `json:"image_url"`
	// BasePrice/SalePrice in USD cents (integer money — no float rounding bugs).
	BasePriceCents int  `gorm:"not null;default:0" json:"base_price_cents"`
	SalePriceCents *int `json:"sale_price_cents"`
	// If the product has duration variants, these base prices are ignored in favour of variants.
	HasVariants bool `gorm:"default:false" json:"has_variants"`
	// Commands executed on purchase / expiry. JSON-encoded []string.
	PurchaseCommands string `gorm:"type:text" json:"purchase_commands"`
	ExpiryCommands   string `gorm:"type:text" json:"expiry_commands"`
	SortOrder        int    `gorm:"default:0" json:"sort_order"`
	Active           bool   `gorm:"default:true" json:"active"`

	Variants  []DurationVariant `gorm:"foreignKey:ProductID" json:"variants,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
	DeletedAt gorm.DeletedAt    `gorm:"index" json:"-"`
}

// DurationVariant is a time-limited (or permanent) purchase tier for a product.
type DurationVariant struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	ProductID uint   `gorm:"index;not null" json:"product_id"`
	Label     string `gorm:"size:64;not null" json:"label"` // "7 Days", "30 Days", "Forever"
	// DurationDays == 0 means permanent / one-time.
	DurationDays   int            `gorm:"default:0" json:"duration_days"`
	PriceCents     int            `gorm:"not null;default:0" json:"price_cents"`
	SalePriceCents *int           `json:"sale_price_cents"`
	SortOrder      int            `gorm:"default:0" json:"sort_order"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}
