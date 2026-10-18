package handlers

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"

	"webstore/internal/crypto"
	"webstore/internal/services"
)

// ---- Settings ----

// GetSettings returns all non-secret settings + masked secret indicators.
func (h *AdminHandler) GetSettings(c *fiber.Ctx) error {
	get := h.settings.GetDefault
	// Secrets are reported only as masked booleans/placeholders.
	rconPass, _ := h.settings.Get(services.KeyRconPassword)
	pluginSecret, _ := h.settings.Get(services.KeyPluginSecret)

	return c.JSON(fiber.Map{
		"store_name":            get(services.KeyStoreName, "Webstore Name"),
		"server_ip":             get(services.KeyServerIP, "PLAY.WEBSTORE.COM"),
		"discord_url":           get(services.KeyDiscordURL, ""),
		"currencies":            get(services.KeyCurrencies, "USD,EUR,UAH"),
		"exchange_rates":        h.settings.Rates(),
		"delivery_mode":         get(services.KeyDeliveryMode, "plugin"),
		"rcon_host":             get(services.KeyRconHost, ""),
		"rcon_port":             get(services.KeyRconPort, "25575"),
		"rcon_password_set":     rconPass != "",
		"plugin_require_online": get(services.KeyPluginRequire, "false"),
		"plugin_secret_set":     pluginSecret != "",
	})
}

// UpdateSettings persists store + delivery configuration.
func (h *AdminHandler) UpdateSettings(c *fiber.Ctx) error {
	var body struct {
		StoreName           *string             `json:"store_name"`
		ServerIP            *string             `json:"server_ip"`
		DiscordURL          *string             `json:"discord_url"`
		Currencies          *string             `json:"currencies"`
		ExchangeRates       *map[string]float64 `json:"exchange_rates"`
		DeliveryMode        *string             `json:"delivery_mode"`
		RconHost            *string             `json:"rcon_host"`
		RconPort            *string             `json:"rcon_port"`
		RconPassword        *string             `json:"rcon_password"`
		PluginRequireOnline *string             `json:"plugin_require_online"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}

	set := func(key string, v *string, secret bool) {
		if v != nil {
			_ = h.settings.Set(key, *v, secret)
		}
	}
	set(services.KeyStoreName, body.StoreName, false)
	set(services.KeyServerIP, body.ServerIP, false)
	set(services.KeyDiscordURL, body.DiscordURL, false)
	set(services.KeyCurrencies, body.Currencies, false)
	set(services.KeyDeliveryMode, body.DeliveryMode, false)
	set(services.KeyRconHost, body.RconHost, false)
	set(services.KeyRconPort, body.RconPort, false)
	set(services.KeyPluginRequire, body.PluginRequireOnline, false)
	// Exchange rates: validate & persist as JSON (USD is always forced to 1.0).
	if body.ExchangeRates != nil {
		rates := map[string]float64{}
		for k, v := range *body.ExchangeRates {
			if v > 0 {
				rates[k] = v
			}
		}
		rates["USD"] = 1.0
		if encoded, err := json.Marshal(rates); err == nil {
			_ = h.settings.Set(services.KeyExchangeRates, string(encoded), false)
		}
	}
	// RCON password only overwritten when a non-empty value is provided.
	if body.RconPassword != nil && *body.RconPassword != "" {
		_ = h.settings.Set(services.KeyRconPassword, *body.RconPassword, true)
	}

	id, email := h.actor(c)
	h.audit.Log(id, email, "settings_update", "store/delivery settings changed", c.IP(), true)
	return c.JSON(fiber.Map{"status": "ok"})
}

// TestRCON verifies the current (or provided) RCON configuration.
func (h *AdminHandler) TestRCON(c *fiber.Ctx) error {
	var body struct {
		Host     string `json:"host"`
		Port     int    `json:"port"`
		Password string `json:"password"`
	}
	_ = c.BodyParser(&body)
	if body.Host == "" {
		body.Host = h.settings.GetDefault(services.KeyRconHost, "")
	}
	if body.Port == 0 {
		body.Port = h.settings.GetInt(services.KeyRconPort, 25575)
	}
	if body.Password == "" {
		body.Password, _ = h.settings.Get(services.KeyRconPassword)
	}

	out, err := h.delivery.TestRCON(body.Host, body.Port, body.Password)
	id, email := h.actor(c)
	if err != nil {
		h.audit.Log(id, email, "rcon_test", err.Error(), c.IP(), false)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"ok": false, "error": err.Error()})
	}
	h.audit.Log(id, email, "rcon_test", "success", c.IP(), true)
	return c.JSON(fiber.Map{"ok": true, "response": out})
}

// RotatePluginSecret generates a fresh HMAC secret for the plugin API and returns it once.
func (h *AdminHandler) RotatePluginSecret(c *fiber.Ctx) error {
	secret := crypto.RandomHex(32)
	if err := h.settings.Set(services.KeyPluginSecret, secret, true); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	id, email := h.actor(c)
	h.audit.Log(id, email, "plugin_secret_rotate", "rotated", c.IP(), true)
	// Returned ONCE so the admin can copy it into the plugin config.
	return c.JSON(fiber.Map{"plugin_secret": secret})
}

// ---- Payment gateways ----

func (h *AdminHandler) ListGateways(c *fiber.Ctx) error {
	return c.JSON(h.gateways.List())
}

func (h *AdminHandler) UpsertGateway(c *fiber.Ctx) error {
	var body struct {
		Driver     string `json:"driver"`
		Enabled    bool   `json:"enabled"`
		APIKey     string `json:"api_key"`
		SecretKey  string `json:"secret_key"`
		WebhookKey string `json:"webhook_key"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	if err := h.gateways.Upsert(body.Driver, body.Enabled, body.APIKey, body.SecretKey, body.WebhookKey); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	id, email := h.actor(c)
	h.audit.Log(id, email, "gateway_update", body.Driver, c.IP(), true)
	return c.JSON(fiber.Map{"status": "ok"})
}

// PluginQueuePeek lets an admin view pending plugin delivery jobs.
func (h *AdminHandler) PluginQueuePeek(c *fiber.Ctx) error {
	var jobs []struct {
		ID                uint   `json:"id"`
		OrderID           uint   `json:"order_id"`
		MinecraftUsername string `json:"minecraft_username"`
		Status            string `json:"status"`
	}
	h.db.Table("delivery_jobs").
		Select("id, order_id, minecraft_username, status").
		Where("status IN ?", []string{"PENDING", "SENT"}).
		Order("created_at ASC").
		Scan(&jobs)
	return c.JSON(jobs)
}

// WebhookURLs returns the webhook URL for each gateway (for copy buttons).
func (h *AdminHandler) WebhookURLs(c *fiber.Ctx) error {
	base := h.cfg.AppBaseURL
	out := map[string]string{}
	for _, v := range h.gateways.List() {
		out[v.Driver] = base + "/api/v1/webhooks/" + v.Driver
	}
	return c.JSON(out)
}
