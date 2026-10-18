package middleware

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"webstore/internal/crypto"
	"webstore/internal/models"
	"webstore/internal/services"
)

// PluginHMAC authenticates the Minecraft plugin with HMAC-SHA256 request signing,
// a timestamp freshness window, and a single-use nonce to defeat replay attacks.
func PluginHMAC(db *gorm.DB, settings *services.SettingsService) fiber.Handler {
	const maxSkew = 30 * time.Second

	return func(c *fiber.Ctx) error {
		secret, err := settings.Get(services.KeyPluginSecret)
		if err != nil || secret == "" {
			return fiber.NewError(fiber.StatusServiceUnavailable, "plugin API not configured")
		}

		sig := c.Get("X-Signature")
		tsStr := c.Get("X-Timestamp")
		nonce := c.Get("X-Nonce")
		if sig == "" || tsStr == "" || nonce == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "missing signature headers")
		}

		// Timestamp freshness (anti-replay window).
		tsUnix, err := strconv.ParseInt(tsStr, 10, 64)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid timestamp")
		}
		ts := time.Unix(tsUnix, 0)
		if diff := time.Since(ts); diff > maxSkew || diff < -maxSkew {
			return fiber.NewError(fiber.StatusUnauthorized, "stale request timestamp")
		}

		// Signature is HMAC over "timestamp.nonce.rawbody".
		body := c.Body()
		signed := []byte(tsStr + "." + nonce + "." + string(body))
		if !crypto.VerifyHMAC(secret, signed, sig) {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid signature")
		}

		// Nonce single-use enforcement.
		used := models.UsedNonce{Nonce: nonce, SeenAt: time.Now()}
		if err := db.Create(&used).Error; err != nil {
			// Duplicate primary key => replay attempt.
			return fiber.NewError(fiber.StatusUnauthorized, "nonce already used (replay detected)")
		}

		return c.Next()
	}
}
