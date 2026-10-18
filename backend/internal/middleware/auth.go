package middleware

import (
	"github.com/gofiber/fiber/v2"

	"webstore/internal/services"
)

const (
	AccessCookieName  = "ws_access"
	RefreshCookieName = "ws_refresh"
	CSRFCookieName    = "ws_csrf"
	CSRFHeaderName    = "X-CSRF-Token"
	ContextAdminID    = "admin_id"
	ContextAdminEmail = "admin_email"
)

// RequireAdmin validates the access JWT from the HttpOnly cookie.
func RequireAdmin(auth *services.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Cookies(AccessCookieName)
		if token == "" {
			// Also allow Authorization: Bearer for API clients/tools.
			h := c.Get("Authorization")
			if len(h) > 7 && h[:7] == "Bearer " {
				token = h[7:]
			}
		}
		if token == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "missing access token")
		}
		claims, err := auth.ParseAccess(token)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid access token")
		}
		c.Locals(ContextAdminID, claims.AdminID)
		c.Locals(ContextAdminEmail, claims.Email)
		return c.Next()
	}
}

// CSRFProtect enforces the double-submit cookie pattern for state-changing requests.
func CSRFProtect() fiber.Handler {
	return func(c *fiber.Ctx) error {
		switch c.Method() {
		case fiber.MethodGet, fiber.MethodHead, fiber.MethodOptions:
			return c.Next()
		}
		cookie := c.Cookies(CSRFCookieName)
		header := c.Get(CSRFHeaderName)
		if cookie == "" || header == "" || cookie != header {
			return fiber.NewError(fiber.StatusForbidden, "CSRF token mismatch")
		}
		return c.Next()
	}
}

// IPWhitelist restricts access to a configured set of IPs (empty = allow all).
func IPWhitelist(allowed []string) fiber.Handler {
	set := map[string]bool{}
	for _, ip := range allowed {
		set[ip] = true
	}
	return func(c *fiber.Ctx) error {
		if len(set) == 0 {
			return c.Next()
		}
		if set[c.IP()] {
			return c.Next()
		}
		return fiber.NewError(fiber.StatusForbidden, "IP not allowed")
	}
}
