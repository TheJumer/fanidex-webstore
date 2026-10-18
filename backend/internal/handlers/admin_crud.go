package handlers

import (
	"github.com/gofiber/fiber/v2"

	"webstore/internal/models"
)

// ---- Categories CRUD ----

func (h *AdminHandler) ListCategories(c *fiber.Ctx) error {
	var cats []models.Category
	h.db.Where("parent_id IS NULL").Preload("Children").Order("sort_order ASC").Find(&cats)
	return c.JSON(cats)
}

func (h *AdminHandler) CreateCategory(c *fiber.Ctx) error {
	var cat models.Category
	if err := c.BodyParser(&cat); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	if err := h.db.Create(&cat).Error; err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	id, email := h.actor(c)
	h.audit.Log(id, email, "category_create", cat.Name, c.IP(), true)
	return c.JSON(cat)
}

func (h *AdminHandler) UpdateCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	var cat models.Category
	if err := h.db.First(&cat, id).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "category not found")
	}
	if err := c.BodyParser(&cat); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	h.db.Save(&cat)
	aid, email := h.actor(c)
	h.audit.Log(aid, email, "category_update", cat.Name, c.IP(), true)
	return c.JSON(cat)
}

func (h *AdminHandler) DeleteCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	h.db.Delete(&models.Category{}, id)
	aid, email := h.actor(c)
	h.audit.Log(aid, email, "category_delete", "id="+id, c.IP(), true)
	return c.JSON(fiber.Map{"status": "ok"})
}

// ---- Products CRUD ----

func (h *AdminHandler) ListProducts(c *fiber.Ctx) error {
	var products []models.Product
	h.db.Preload("Variants").Order("sort_order ASC").Find(&products)
	return c.JSON(products)
}

func (h *AdminHandler) GetProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	var product models.Product
	if err := h.db.Preload("Variants").First(&product, id).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "product not found")
	}
	return c.JSON(product)
}

func (h *AdminHandler) CreateProduct(c *fiber.Ctx) error {
	var product models.Product
	if err := c.BodyParser(&product); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	if err := h.db.Create(&product).Error; err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	id, email := h.actor(c)
	h.audit.Log(id, email, "product_create", product.Name, c.IP(), true)
	return c.JSON(product)
}

func (h *AdminHandler) UpdateProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	var product models.Product
	if err := h.db.First(&product, id).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "product not found")
	}
	// Replace variants if supplied.
	var incoming models.Product
	if err := c.BodyParser(&incoming); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	incoming.ID = product.ID
	variants := incoming.Variants
	incoming.Variants = nil
	// Persist scalar fields (Save updates all columns of the existing row).
	if err := h.db.Save(&incoming).Error; err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	// Sync variants explicitly: wipe then recreate.
	if variants != nil {
		h.db.Where("product_id = ?", product.ID).Delete(&models.DurationVariant{})
		for i := range variants {
			variants[i].ID = 0
			variants[i].ProductID = product.ID
			h.db.Create(&variants[i])
		}
		incoming.Variants = variants
	}
	aid, email := h.actor(c)
	h.audit.Log(aid, email, "product_update", incoming.Name, c.IP(), true)
	return c.JSON(incoming)
}

func (h *AdminHandler) DeleteProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	h.db.Delete(&models.Product{}, id)
	aid, email := h.actor(c)
	h.audit.Log(aid, email, "product_delete", "id="+id, c.IP(), true)
	return c.JSON(fiber.Map{"status": "ok"})
}

// ---- Promo Codes CRUD ----

func (h *AdminHandler) ListPromos(c *fiber.Ctx) error {
	var promos []models.PromoCode
	h.db.Order("created_at DESC").Find(&promos)
	return c.JSON(promos)
}

func (h *AdminHandler) CreatePromo(c *fiber.Ctx) error {
	var promo models.PromoCode
	if err := c.BodyParser(&promo); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	if err := h.db.Create(&promo).Error; err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	id, email := h.actor(c)
	h.audit.Log(id, email, "promo_create", promo.Code, c.IP(), true)
	return c.JSON(promo)
}

func (h *AdminHandler) DeletePromo(c *fiber.Ctx) error {
	id := c.Params("id")
	h.db.Delete(&models.PromoCode{}, id)
	aid, email := h.actor(c)
	h.audit.Log(aid, email, "promo_delete", "id="+id, c.IP(), true)
	return c.JSON(fiber.Map{"status": "ok"})
}
