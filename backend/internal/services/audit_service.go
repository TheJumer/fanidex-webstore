package services

import (
	"time"

	"gorm.io/gorm"

	"webstore/internal/models"
)

// AuditService writes immutable admin audit log entries.
type AuditService struct {
	db *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{db: db}
}

// Log records an admin action. Failures are swallowed to never block the request.
func (a *AuditService) Log(adminID *uint, email, action, detail, ip string, success bool) {
	entry := models.AdminAuditLog{
		AdminID:   adminID,
		Email:     email,
		Action:    action,
		Detail:    detail,
		IP:        ip,
		Success:   success,
		CreatedAt: time.Now(),
	}
	_ = a.db.Create(&entry).Error
}

// List returns recent audit entries (newest first).
func (a *AuditService) List(limit int) ([]models.AdminAuditLog, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	var logs []models.AdminAuditLog
	err := a.db.Order("created_at DESC").Limit(limit).Find(&logs).Error
	return logs, err
}
