package models

import "time"

// Setting is a single key/value configuration row. Secret values are stored AES-GCM encrypted.
type Setting struct {
	Key       string    `gorm:"primaryKey;size:64" json:"key"`
	Value     string    `gorm:"type:text" json:"value"`
	Secret    bool      `gorm:"default:false" json:"secret"`
	UpdatedAt time.Time `json:"updated_at"`
}

// PaymentGatewayConfig toggles & stores encrypted keys for a gateway driver.
type PaymentGatewayConfig struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Driver    string    `gorm:"uniqueIndex;size:32;not null" json:"driver"` // stripe, paypal, test, ...
	Enabled   bool      `gorm:"default:false" json:"enabled"`
	// Encrypted (AES-GCM). Never returned raw.
	APIKey     string    `gorm:"type:text" json:"-"`
	SecretKey  string    `gorm:"type:text" json:"-"`
	WebhookKey string    `gorm:"type:text" json:"-"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// UsedNonce tracks consumed plugin nonces to prevent replay attacks.
type UsedNonce struct {
	Nonce     string    `gorm:"primaryKey;size:128" json:"nonce"`
	SeenAt    time.Time `gorm:"index" json:"seen_at"`
}

// AdminAuditLog is an append-only record of sensitive admin actions.
type AdminAuditLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	AdminID   *uint     `gorm:"index" json:"admin_id"`
	Email     string    `gorm:"size:191" json:"email"`
	Action    string    `gorm:"size:64;index" json:"action"`
	Detail    string    `gorm:"type:text" json:"detail"`
	IP        string    `gorm:"size:64" json:"ip"`
	Success   bool      `json:"success"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}
