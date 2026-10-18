package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all runtime configuration loaded from the environment.
type Config struct {
	AppPort     string
	AppEnv      string
	AppBaseURL  string
	FrontendURL string

	MasterKey string

	JWTAccessSecret  string
	JWTRefreshSecret string
	JWTAccessTTLMin  int
	JWTRefreshTTLHrs int

	DBDriver string
	DBDSN    string

	AdminEmail    string
	AdminPassword string

	AdminIPWhitelist []string
	CookieSecure     bool
	CookieDomain     string
	CORSOrigins      []string

	ExpiryTickSeconds int
}

var C *Config

// Load reads the .env file (if present) and populates the global config.
func Load() *Config {
	_ = godotenv.Load()

	C = &Config{
		AppPort:           env("APP_PORT", "8080"),
		AppEnv:            env("APP_ENV", "development"),
		AppBaseURL:        env("APP_BASE_URL", "http://localhost:8080"),
		FrontendURL:       env("FRONTEND_URL", "http://localhost:5173"),
		MasterKey:         env("APP_MASTER_KEY", ""),
		JWTAccessSecret:   env("JWT_ACCESS_SECRET", "dev-access"),
		JWTRefreshSecret:  env("JWT_REFRESH_SECRET", "dev-refresh"),
		JWTAccessTTLMin:   envInt("JWT_ACCESS_TTL_MIN", 15),
		JWTRefreshTTLHrs:  envInt("JWT_REFRESH_TTL_HOURS", 168),
		DBDriver:          env("DB_DRIVER", "sqlite"),
		DBDSN:             env("DB_DSN", "webstore.db"),
		AdminEmail:        env("ADMIN_EMAIL", "admin@webstore.com"),
		AdminPassword:     env("ADMIN_PASSWORD", "ChangeMe_Str0ng!"),
		AdminIPWhitelist:  splitCSV(env("ADMIN_IP_WHITELIST", "")),
		CookieSecure:      envBool("COOKIE_SECURE", false),
		CookieDomain:      env("COOKIE_DOMAIN", ""),
		CORSOrigins:       splitCSV(env("CORS_ORIGINS", "http://localhost:5173")),
		ExpiryTickSeconds: envInt("EXPIRY_TICK_SECONDS", 60),
	}
	return C
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func envBool(key string, def bool) bool {
	if v := os.Getenv(key); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return def
}

func splitCSV(s string) []string {
	if strings.TrimSpace(s) == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}
