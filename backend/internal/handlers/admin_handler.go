package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"webstore/internal/config"
	"webstore/internal/middleware"
	"webstore/internal/models"
	"webstore/internal/services"
)

// AdminHandler provides dashboard CRUD + analytics.
type AdminHandler struct {
	db       *gorm.DB
	cfg      *config.Config
	settings *services.SettingsService
	gateways *services.GatewayService
	delivery *services.DeliveryService
	audit    *services.AuditService
}

func NewAdminHandler(
	db *gorm.DB,
	cfg *config.Config,
	settings *services.SettingsService,
	gateways *services.GatewayService,
	delivery *services.DeliveryService,
	audit *services.AuditService,
) *AdminHandler {
	return &AdminHandler{db, cfg, settings, gateways, delivery, audit}
}

func (h *AdminHandler) actor(c *fiber.Ctx) (*uint, string) {
	idv := c.Locals(middleware.ContextAdminID)
	emailv := c.Locals(middleware.ContextAdminEmail)
	var id *uint
	if u, ok := idv.(uint); ok {
		id = &u
	}
	email, _ := emailv.(string)
	return id, email
}

// ---- Overview / Analytics ----

// Overview returns KPI cards + recent payments.
func (h *AdminHandler) Overview(c *fiber.Ctx) error {
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	paidStatuses := []string{models.StatusPaid, models.StatusDelivered, models.StatusExpired}

	sum := func(since *time.Time) int {
		var total struct{ Total int }
		q := h.db.Model(&models.Order{}).
			Select("COALESCE(SUM(total_cents),0) as total").
			Where("status IN ?", paidStatuses)
		if since != nil {
			q = q.Where("paid_at >= ?", *since)
		}
		q.Scan(&total)
		return total.Total
	}

	var totalOrders int64
	h.db.Model(&models.Order{}).Where("status IN ?", paidStatuses).Count(&totalOrders)

	var activeTemp int64
	h.db.Model(&models.TempGrant{}).Where("expired = ?", false).Count(&activeTemp)

	// Top donor.
	type donor struct {
		MinecraftUsername string
		TotalCents        int
	}
	var d donor
	h.db.Model(&models.Order{}).
		Select("minecraft_username, SUM(total_cents) as total_cents").
		Where("status IN ?", paidStatuses).
		Group("minecraft_username").
		Order("total_cents DESC").
		Limit(1).Scan(&d)

	var recent []models.Order
	h.db.Preload("Items").Order("created_at DESC").Limit(15).Find(&recent)

	return c.JSON(fiber.Map{
		"revenue_today":   sum(&startOfDay),
		"revenue_month":   sum(&startOfMonth),
		"revenue_all":     sum(nil),
		"total_orders":    totalOrders,
		"active_temp":     activeTemp,
		"top_donor":       fiber.Map{"username": d.MinecraftUsername, "total_cents": d.TotalCents},
		"recent_payments": recent,
	})
}

// RevenueSeries returns daily revenue between two dates for the chart.
func (h *AdminHandler) RevenueSeries(c *fiber.Ctx) error {
	fromStr := c.Query("from")
	toStr := c.Query("to")
	to := time.Now()
	from := to.AddDate(0, 0, -30)
	if t, err := time.Parse("2006-01-02", fromStr); err == nil {
		from = t
	}
	if t, err := time.Parse("2006-01-02", toStr); err == nil {
		to = t.AddDate(0, 0, 1)
	}

	var orders []models.Order
	h.db.Where("status IN ? AND paid_at BETWEEN ? AND ?",
		[]string{models.StatusPaid, models.StatusDelivered, models.StatusExpired}, from, to).
		Find(&orders)

	buckets := map[string]int{}
	for _, o := range orders {
		if o.PaidAt == nil {
			continue
		}
		key := o.PaidAt.Format("2006-01-02")
		buckets[key] += o.TotalCents
	}

	type point struct {
		Date  string `json:"date"`
		Cents int    `json:"cents"`
	}
	series := []point{}
	for d := from; d.Before(to); d = d.AddDate(0, 0, 1) {
		key := d.Format("2006-01-02")
		series = append(series, point{Date: key, Cents: buckets[key]})
	}
	return c.JSON(series)
}

// RerunDelivery re-queues the delivery commands for an order.
func (h *AdminHandler) RerunDelivery(c *fiber.Ctx) error {
	id, email := h.actor(c)
	publicID := c.Params("public_id")
	var order models.Order
	if err := h.db.Preload("Items").First(&order, "public_id = ?", publicID).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "order not found")
	}
	if err := h.delivery.DeliverOrder(&order); err != nil {
		h.audit.Log(id, email, "rerun_delivery", publicID+": "+err.Error(), c.IP(), false)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": err.Error()})
	}
	h.audit.Log(id, email, "rerun_delivery", publicID, c.IP(), true)
	return c.JSON(fiber.Map{"status": "ok"})
}

// AuditLogs returns recent audit entries.
func (h *AdminHandler) AuditLogs(c *fiber.Ctx) error {
	logs, err := h.audit.List(200)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(logs)
}
