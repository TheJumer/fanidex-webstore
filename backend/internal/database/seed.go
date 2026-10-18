package database

import (
	"encoding/json"
	"log"

	"gorm.io/gorm"

	"webstore/internal/config"
	"webstore/internal/crypto"
	"webstore/internal/models"
)

// Seed creates the initial admin account, default settings, and sample catalog.
func Seed(db *gorm.DB, cfg *config.Config) error {
	if err := seedAdmin(db, cfg); err != nil {
		return err
	}
	if err := seedSettings(db); err != nil {
		return err
	}
	if err := seedGateways(db); err != nil {
		return err
	}
	return seedCatalog(db)
}

func seedAdmin(db *gorm.DB, cfg *config.Config) error {
	var count int64
	db.Model(&models.Admin{}).Count(&count)
	if count > 0 {
		return nil
	}
	hash, err := crypto.HashPassword(cfg.AdminPassword)
	if err != nil {
		return err
	}
	admin := models.Admin{Email: cfg.AdminEmail, PasswordHash: hash}
	if err := db.Create(&admin).Error; err != nil {
		return err
	}
	log.Printf("[seed] created admin %s", cfg.AdminEmail)
	return nil
}

func seedSettings(db *gorm.DB) error {
	defaults := []models.Setting{
		{Key: "store_name", Value: "DIAMOND STORE"},
		{Key: "server_ip", Value: "PLAY.WEBSTORE.COM"},
		{Key: "discord_url", Value: "https://discord.gg/webstore"},
		{Key: "currencies", Value: "USD,EUR,UAH"},
		{Key: "delivery_mode", Value: "plugin"},
		{Key: "rcon_port", Value: "25575"},
		{Key: "plugin_require_online", Value: "false"},
	}
	for _, s := range defaults {
		var existing models.Setting
		if err := db.First(&existing, "key = ?", s.Key).Error; err == gorm.ErrRecordNotFound {
			db.Create(&s)
		}
	}
	// Generate an initial plugin HMAC secret if none exists.
	var ps models.Setting
	if err := db.First(&ps, "key = ?", "plugin_secret").Error; err == gorm.ErrRecordNotFound {
		enc, _ := crypto.Encrypt(crypto.RandomHex(32))
		db.Create(&models.Setting{Key: "plugin_secret", Value: enc, Secret: true})
	}
	return nil
}

func seedGateways(db *gorm.DB) error {
	// Enable the sandbox/test gateway by default so the flow works immediately.
	var existing models.PaymentGatewayConfig
	if err := db.First(&existing, "driver = ?", "test").Error; err == gorm.ErrRecordNotFound {
		webhook, _ := crypto.Encrypt(crypto.RandomHex(16))
		db.Create(&models.PaymentGatewayConfig{Driver: "test", Enabled: true, WebhookKey: webhook})
	}
	return nil
}

func seedCatalog(db *gorm.DB) error {
	var count int64
	db.Model(&models.Category{}).Count(&count)
	if count > 0 {
		return nil
	}

	cmds := func(s ...string) string { b, _ := json.Marshal(s); return string(b) }
	cents := func(c int) int { return c }

	categories := []models.Category{
		{Name: "OBJECTS", Slug: "objects", Description: "Decorative and utility objects for your base.", SortOrder: 1},
		{Name: "CHESTS", Slug: "chests", Description: "Mystery and loot chests full of rewards.", SortOrder: 2},
		{Name: "WEAPONS", Slug: "weapons", Description: "Powerful weapons and gear for combat.", SortOrder: 3},
	}
	if err := db.Create(&categories).Error; err != nil {
		return err
	}

	// CAULDRON — permanent one-time product in OBJECTS.
	sale := cents(80)
	cauldron := models.Product{
		CategoryID:       categories[0].ID,
		Name:             "CAULDRON",
		Slug:             "cauldron",
		Description:      "## Cauldron\nA magical cauldron that grants brewing perks.\n\n- Permanent unlock\n- Cosmetic particle effects",
		ImageURL:         "https://mc-heads.net/head/MHF_Cauldron",
		BasePriceCents:   cents(100),
		SalePriceCents:   &sale,
		HasVariants:      false,
		PurchaseCommands: cmds("give {player} cauldron 1", "say {player} purchased {package_name}!"),
		ExpiryCommands:   cmds(),
		SortOrder:        1,
		Active:           true,
	}
	db.Create(&cauldron)

	// CROWN — temporary VIP product with duration variants in WEAPONS.
	crown := models.Product{
		CategoryID:       categories[2].ID,
		Name:             "CROWN",
		Slug:             "crown",
		Description:      "## Crown of Kings\nGrants the **tempvip** rank with glowing crown cosmetic.\n\nChoose a duration below.",
		ImageURL:         "https://mc-heads.net/head/MHF_Gold",
		HasVariants:      true,
		PurchaseCommands: cmds("lp user {player} parent add tempvip", "broadcast {player} is now VIP for {duration}!"),
		ExpiryCommands:   cmds("lp user {player} parent remove tempvip", "msg {player} your VIP has expired."),
		SortOrder:        1,
		Active:           true,
	}
	db.Create(&crown)

	variants := []models.DurationVariant{
		{ProductID: crown.ID, Label: "7 Days", DurationDays: 7, PriceCents: cents(200), SortOrder: 1},
		{ProductID: crown.ID, Label: "30 Days", DurationDays: 30, PriceCents: cents(500), SortOrder: 2},
		{ProductID: crown.ID, Label: "Forever", DurationDays: 0, PriceCents: cents(1500), SortOrder: 3},
	}
	db.Create(&variants)

	// A sample loot chest (permanent) in CHESTS.
	chest := models.Product{
		CategoryID:       categories[1].ID,
		Name:             "MYSTERY CHEST",
		Slug:             "mystery-chest",
		Description:      "## Mystery Chest\nContains random high-tier loot.",
		ImageURL:         "https://mc-heads.net/head/MHF_Chest",
		BasePriceCents:   cents(100),
		HasVariants:      false,
		PurchaseCommands: cmds("crate give {player} mystery 1"),
		ExpiryCommands:   cmds(),
		SortOrder:        1,
		Active:           true,
	}
	db.Create(&chest)

	// Sample promo code: WELCOME20 => 20% off.
	db.Create(&models.PromoCode{Code: "WELCOME20", Type: "percent", Value: 20, Active: true})

	log.Println("[seed] catalog + promo seeded")
	return nil
}
