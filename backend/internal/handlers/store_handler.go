package handlers

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"webstore/internal/models"
	"webstore/internal/services"
)

// StoreHandler serves the public storefront.
type StoreHandler struct {
	db       *gorm.DB
	settings *services.SettingsService
	promo    *services.PromoService
}

func NewStoreHandler(db *gorm.DB, settings *services.SettingsService, promo *services.PromoService) *StoreHandler {
	return &StoreHandler{db: db, settings: settings, promo: promo}
}

// GetSettings returns storefront-safe (non-secret) settings.
func (h *StoreHandler) GetSettings(c *fiber.Ctx) error {
	return c.JSON(h.settings.Public())
}

// GetCategories returns the category tree (top-level with nested children).
func (h *StoreHandler) GetCategories(c *fiber.Ctx) error {
	var categories []models.Category
	if err := h.db.
		Where("parent_id IS NULL").
		Preload("Children").
		Order("sort_order ASC").
		Find(&categories).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(categories)
}

// GetProducts lists active products, optionally filtered by category slug.
func (h *StoreHandler) GetProducts(c *fiber.Ctx) error {
	slug := c.Query("category")
	q := h.db.Model(&models.Product{}).
		Where("active = ?", true).
		Preload("Variants", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Order("sort_order ASC")

	if slug != "" && slug != "home" {
		var cat models.Category
		if err := h.db.First(&cat, "slug = ?", slug).Error; err == nil {
			q = q.Where("category_id = ?", cat.ID)
		}
	}

	var products []models.Product
	if err := q.Find(&products).Error; err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	// Strip server-only command fields from the public payload.
	for i := range products {
		products[i].PurchaseCommands = ""
		products[i].ExpiryCommands = ""
	}
	return c.JSON(products)
}

// GetProduct returns a single product by slug.
func (h *StoreHandler) GetProduct(c *fiber.Ctx) error {
	slug := c.Params("slug")
	var product models.Product
	if err := h.db.Preload("Variants").First(&product, "slug = ? AND active = ?", slug, true).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "product not found")
	}
	product.PurchaseCommands = ""
	product.ExpiryCommands = ""
	return c.JSON(product)
}

// TopCustomer returns the biggest donor (by delivered/paid spend).
func (h *StoreHandler) TopCustomer(c *fiber.Ctx) error {
	type row struct {
		MinecraftUsername string
		TotalCents        int
	}
	var r row
	h.db.Model(&models.Order{}).
		Select("minecraft_username, SUM(total_cents) as total_cents").
		Where("status IN ?", []string{models.StatusPaid, models.StatusDelivered, models.StatusExpired}).
		Group("minecraft_username").
		Order("total_cents DESC").
		Limit(1).
		Scan(&r)

	if r.MinecraftUsername == "" {
		return c.JSON(fiber.Map{"username": "", "total_cents": 0})
	}
	return c.JSON(fiber.Map{
		"username":    r.MinecraftUsername,
		"total_cents": r.TotalCents,
		"avatar_url":  "https://mc-heads.net/body/" + r.MinecraftUsername,
	})
}
