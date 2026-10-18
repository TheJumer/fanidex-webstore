package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"webstore/internal/config"
	"webstore/internal/crypto"
	"webstore/internal/middleware"
	"webstore/internal/models"
	"webstore/internal/services"
)

// AuthHandler handles admin login/logout/refresh + TOTP setup.
type AuthHandler struct {
	db    *gorm.DB
	cfg   *config.Config
	auth  *services.AuthService
	audit *services.AuditService
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config, auth *services.AuthService, audit *services.AuditService) *AuthHandler {
	return &AuthHandler{db, cfg, auth, audit}
}

func (h *AuthHandler) setAuthCookies(c *fiber.Ctx, access, refresh, csrf string) {
	common := func(name, val string, maxAge int) *fiber.Cookie {
		return &fiber.Cookie{
			Name:     name,
			Value:    val,
			Path:     "/",
			MaxAge:   maxAge,
			HTTPOnly: true,
			Secure:   h.cfg.CookieSecure,
			SameSite: "Strict",
			Domain:   h.cfg.CookieDomain,
		}
	}
	c.Cookie(common(middleware.AccessCookieName, access, h.cfg.JWTAccessTTLMin*60))
	c.Cookie(common(middleware.RefreshCookieName, refresh, h.cfg.JWTRefreshTTLHrs*3600))
	// CSRF cookie is readable by JS (double-submit pattern) so it is NOT HttpOnly.
	c.Cookie(&fiber.Cookie{
		Name:     middleware.CSRFCookieName,
		Value:    csrf,
		Path:     "/",
		MaxAge:   h.cfg.JWTAccessTTLMin * 60,
		HTTPOnly: false,
		Secure:   h.cfg.CookieSecure,
		SameSite: "Strict",
		Domain:   h.cfg.CookieDomain,
	})
}

// Login authenticates an admin and sets HttpOnly cookies.
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		TOTPCode string `json:"totp_code"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}

	admin, err := h.auth.Login(body.Email, body.Password, body.TOTPCode)
	if err != nil {
		h.audit.Log(nil, body.Email, "login", err.Error(), c.IP(), false)
		if err == services.ErrTOTPRequired {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "totp_required"})
		}
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	access, refresh, err := h.auth.IssueTokens(admin)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	csrf := crypto.RandomHex(32)
	h.setAuthCookies(c, access, refresh, csrf)
	h.audit.Log(&admin.ID, admin.Email, "login", "success", c.IP(), true)

	return c.JSON(fiber.Map{
		"email":        admin.Email,
		"totp_enabled": admin.TOTPEnabled,
		"csrf_token":   csrf,
	})
}

// Refresh exchanges a valid refresh cookie for a new access token.
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	token := c.Cookies(middleware.RefreshCookieName)
	if token == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "missing refresh token")
	}
	claims, err := h.auth.ParseRefresh(token)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid refresh token")
	}
	var admin models.Admin
	if err := h.db.First(&admin, claims.AdminID).Error; err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "admin not found")
	}
	access, refresh, err := h.auth.IssueTokens(&admin)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	csrf := crypto.RandomHex(32)
	h.setAuthCookies(c, access, refresh, csrf)
	return c.JSON(fiber.Map{"csrf_token": csrf})
}

// Logout clears auth cookies.
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	for _, name := range []string{middleware.AccessCookieName, middleware.RefreshCookieName, middleware.CSRFCookieName} {
		c.Cookie(&fiber.Cookie{Name: name, Value: "", Path: "/", MaxAge: -1, Expires: time.Now().Add(-time.Hour)})
	}
	return c.JSON(fiber.Map{"status": "ok"})
}

// Me returns the current admin from the access token.
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	id := c.Locals(middleware.ContextAdminID)
	email := c.Locals(middleware.ContextAdminEmail)
	return c.JSON(fiber.Map{"admin_id": id, "email": email})
}

// TOTPSetup generates a new TOTP secret + provisioning URL.
func (h *AuthHandler) TOTPSetup(c *fiber.Ctx) error {
	id := c.Locals(middleware.ContextAdminID).(uint)
	var admin models.Admin
	if err := h.db.First(&admin, id).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "admin not found")
	}
	secret, url, err := h.auth.SetupTOTP(&admin, "Webstore Admin")
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	h.audit.Log(&id, admin.Email, "totp_setup", "secret generated", c.IP(), true)
	return c.JSON(fiber.Map{"secret": secret, "otpauth_url": url})
}

// TOTPEnable verifies a code and activates 2FA.
func (h *AuthHandler) TOTPEnable(c *fiber.Ctx) error {
	id := c.Locals(middleware.ContextAdminID).(uint)
	var body struct {
		Code string `json:"code"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	var admin models.Admin
	if err := h.db.First(&admin, id).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "admin not found")
	}
	if err := h.auth.EnableTOTP(&admin, body.Code); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	h.audit.Log(&id, admin.Email, "totp_enable", "2FA enabled", c.IP(), true)
	return c.JSON(fiber.Map{"status": "ok"})
}
