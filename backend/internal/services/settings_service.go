package services

import (
	"encoding/json"
	"strconv"

	"gorm.io/gorm"

	"webstore/internal/crypto"
	"webstore/internal/models"
)

// Setting keys.
const (
	KeyStoreName     = "store_name"
	KeyServerIP      = "server_ip"
	KeyDiscordURL    = "discord_url"
	KeyCurrencies    = "currencies"
	KeyExchangeRates = "exchange_rates" // JSON map of currency -> rate relative to USD
	KeyDeliveryMode  = "delivery_mode"  // "rcon" | "plugin"
	KeyRconHost      = "rcon_host"
	KeyRconPort      = "rcon_port"
	KeyRconPassword  = "rcon_password" // secret
	KeyPluginSecret  = "plugin_secret" // secret
	KeyPluginRequire = "plugin_require_online"
)

// SettingsService manages key/value config with transparent encryption.
type SettingsService struct {
	db *gorm.DB
}

func NewSettingsService(db *gorm.DB) *SettingsService {
	return &SettingsService{db: db}
}

// Get returns the plaintext value (decrypting secrets automatically).
func (s *SettingsService) Get(key string) (string, error) {
	var st models.Setting
	if err := s.db.First(&st, "key = ?", key).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", nil
		}
		return "", err
	}
	if st.Secret {
		return crypto.Decrypt(st.Value)
	}
	return st.Value, nil
}

func (s *SettingsService) GetDefault(key, def string) string {
	v, err := s.Get(key)
	if err != nil || v == "" {
		return def
	}
	return v
}

func (s *SettingsService) GetInt(key string, def int) int {
	v, err := s.Get(key)
	if err != nil || v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

// Set stores a value, encrypting it if secret is true.
func (s *SettingsService) Set(key, value string, secret bool) error {
	stored := value
	if secret && value != "" {
		enc, err := crypto.Encrypt(value)
		if err != nil {
			return err
		}
		stored = enc
	}
	st := models.Setting{Key: key, Value: stored, Secret: secret}
	return s.db.Save(&st).Error
}

// Rates returns the configured exchange-rate table (currency -> rate relative to USD).
// Falls back to DefaultFXRates when unset or malformed, and always guarantees USD = 1.0.
func (s *SettingsService) Rates() map[string]float64 {
	raw, _ := s.Get(KeyExchangeRates)
	rates := map[string]float64{}
	if raw != "" {
		if err := json.Unmarshal([]byte(raw), &rates); err != nil || len(rates) == 0 {
			rates = map[string]float64{}
		}
	}
	if len(rates) == 0 {
		// Clone defaults so callers can't mutate the package-level map.
		for k, v := range DefaultFXRates {
			rates[k] = v
		}
	}
	// Base currency is always 1.0.
	rates["USD"] = 1.0
	return rates
}

// PublicSettings is the non-secret config exposed to the storefront.
type PublicSettings struct {
	StoreName  string             `json:"store_name"`
	ServerIP   string             `json:"server_ip"`
	DiscordURL string             `json:"discord_url"`
	Currencies []string           `json:"currencies"`
	Rates      map[string]float64 `json:"rates"`
}

// Public returns storefront-safe settings (never secrets).
func (s *SettingsService) Public() PublicSettings {
	currencies := s.GetDefault(KeyCurrencies, "USD,EUR,UAH")
	return PublicSettings{
		StoreName:  s.GetDefault(KeyStoreName, "Webstore Name"),
		ServerIP:   s.GetDefault(KeyServerIP, "PLAY.WEBSTORE.COM"),
		DiscordURL: s.GetDefault(KeyDiscordURL, "https://discord.gg/webstore"),
		Currencies: splitTrim(currencies),
		Rates:      s.Rates(),
	}
}

func splitTrim(s string) []string {
	out := []string{}
	cur := ""
	for _, r := range s {
		if r == ',' {
			if cur != "" {
				out = append(out, cur)
			}
			cur = ""
			continue
		}
		cur += string(r)
	}
	if cur != "" {
		out = append(out, cur)
	}
	return out
}
