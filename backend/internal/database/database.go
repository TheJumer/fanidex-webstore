package database

import (
	"fmt"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"webstore/internal/config"
	"webstore/internal/models"
)

var DB *gorm.DB

// Connect opens a GORM connection using the driver factory pattern driven by .env.
func Connect(cfg *config.Config) (*gorm.DB, error) {
	var dialector gorm.Dialector

	switch cfg.DBDriver {
	case "postgres":
		dialector = postgres.Open(cfg.DBDSN)
	case "mysql":
		dialector = mysql.Open(cfg.DBDSN)
	case "sqlite":
		dialector = sqlite.Open(cfg.DBDSN)
	default:
		return nil, fmt.Errorf("unsupported DB_DRIVER %q (use postgres|mysql|sqlite)", cfg.DBDriver)
	}

	logLevel := logger.Warn
	if cfg.AppEnv == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, err
	}

	DB = db
	log.Printf("[db] connected using driver=%s", cfg.DBDriver)
	return db, nil
}

// Migrate runs auto-migrations for every model.
func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.Admin{},
		&models.Category{},
		&models.Product{},
		&models.DurationVariant{},
		&models.Order{},
		&models.OrderItem{},
		&models.TempGrant{},
		&models.PromoCode{},
		&models.DeliveryJob{},
		&models.Setting{},
		&models.PaymentGatewayConfig{},
		&models.UsedNonce{},
		&models.AdminAuditLog{},
	)
}
