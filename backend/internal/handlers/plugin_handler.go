package handlers

import (
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"webstore/internal/models"
)

// PluginHandler exposes the secure queue/confirm endpoints for the Minecraft plugin.
// All routes are protected by the PluginHMAC middleware (signature + timestamp + nonce).
type PluginHandler struct {
	db *gorm.DB
}

func NewPluginHandler(db *gorm.DB) *PluginHandler {
	return &PluginHandler{db: db}
}

// QueueItem is the plugin-facing representation of a pending delivery job.
type QueueItem struct {
	ID                uint     `json:"id"`
	MinecraftUsername string   `json:"minecraft_username"`
	Commands          []string `json:"commands"`
	RequireOnline     bool     `json:"require_online"`
}

// GetQueue returns pending delivery jobs for the plugin to execute.
func (h *PluginHandler) GetQueue(c *fiber.Ctx) error {
	var jobs []models.DeliveryJob
	if err := h.db.
		Where("status = ?", models.StatusPending).
		Order("created_at ASC").
		Limit(50).
		Find(&jobs).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	out := make([]QueueItem, 0, len(jobs))
	for _, j := range jobs {
		var cmds []string
		_ = json.Unmarshal([]byte(j.Commands), &cmds)
		out = append(out, QueueItem{
			ID:                j.ID,
			MinecraftUsername: j.MinecraftUsername,
			Commands:          cmds,
			RequireOnline:     j.RequireOnline,
		})

		// Mark as SENT so it isn't re-fetched before confirmation.
		h.db.Model(&models.DeliveryJob{}).
			Where("id = ?", j.ID).
			Updates(map[string]interface{}{"status": "SENT", "attempts": gorm.Expr("attempts + 1")})
	}
	return c.JSON(fiber.Map{"jobs": out})
}

// Confirm marks a delivery job as executed by the plugin.
func (h *PluginHandler) Confirm(c *fiber.Ctx) error {
	var body struct {
		ID      uint `json:"id"`
		Success bool `json:"success"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}

	status := "CONFIRMED"
	if !body.Success {
		status = models.StatusFailed
	}
	now := time.Now()
	if err := h.db.Model(&models.DeliveryJob{}).
		Where("id = ?", body.ID).
		Updates(map[string]interface{}{"status": status, "confirmed_at": &now}).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"status": "ok"})
}
