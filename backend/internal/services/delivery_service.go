package services

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"

	"webstore/internal/models"
	"webstore/internal/rcon"
	"webstore/internal/security"
)

// DeliveryService executes purchase/expiry commands via RCON or the plugin queue.
type DeliveryService struct {
	db       *gorm.DB
	settings *SettingsService
}

func NewDeliveryService(db *gorm.DB, s *SettingsService) *DeliveryService {
	return &DeliveryService{db: db, settings: s}
}

// DeliverOrder resolves placeholders, sanitizes commands, and dispatches them.
func (d *DeliveryService) DeliverOrder(order *models.Order) error {
	// Build the sanitized command list from each item's product definition.
	cmds, err := d.buildCommands(order)
	if err != nil {
		return err
	}
	if len(cmds) == 0 {
		return nil
	}

	mode := d.settings.GetDefault(KeyDeliveryMode, "plugin")
	switch mode {
	case "rcon":
		return d.deliverRCON(order, cmds)
	default:
		return d.queuePlugin(order, cmds)
	}
}

// buildCommands expands each order item's purchase commands with safe placeholders.
func (d *DeliveryService) buildCommands(order *models.Order) ([]string, error) {
	var out []string
	for _, item := range order.Items {
		var product models.Product
		if err := d.db.First(&product, item.ProductID).Error; err != nil {
			continue
		}
		var templates []string
		_ = json.Unmarshal([]byte(product.PurchaseCommands), &templates)

		duration := "permanent"
		if item.DurationDays > 0 {
			duration = fmt.Sprintf("%dd", item.DurationDays)
		}
		ctx := security.CommandContext{
			Player:        order.MinecraftUsername,
			TransactionID: order.PublicID,
			PackageName:   product.Name,
			Duration:      duration,
		}
		for _, t := range templates {
			rendered := security.RenderCommand(t, ctx)
			if rendered != "" {
				out = append(out, rendered)
			}
		}

		// If temporary, schedule the expiry grant.
		if item.DurationDays > 0 {
			if err := d.scheduleExpiry(order, &product, item, ctx); err != nil {
				return nil, err
			}
		}
	}
	return out, nil
}

func (d *DeliveryService) scheduleExpiry(order *models.Order, product *models.Product, item models.OrderItem, ctx security.CommandContext) error {
	var expiryTemplates []string
	_ = json.Unmarshal([]byte(product.ExpiryCommands), &expiryTemplates)
	resolved := make([]string, 0, len(expiryTemplates))
	for _, t := range expiryTemplates {
		if r := security.RenderCommand(t, ctx); r != "" {
			resolved = append(resolved, r)
		}
	}
	encoded, _ := json.Marshal(resolved)
	grant := models.TempGrant{
		OrderID:           order.ID,
		ProductID:         product.ID,
		MinecraftUsername: order.MinecraftUsername,
		ExpiryCommands:    string(encoded),
		ExpiresAt:         time.Now().Add(time.Duration(item.DurationDays) * 24 * time.Hour),
	}
	return d.db.Create(&grant).Error
}

// deliverRCON connects directly and executes each command immediately.
func (d *DeliveryService) deliverRCON(order *models.Order, cmds []string) error {
	host := d.settings.GetDefault(KeyRconHost, "")
	port := d.settings.GetInt(KeyRconPort, 25575)
	pass, _ := d.settings.Get(KeyRconPassword)
	if host == "" {
		return fmt.Errorf("rcon host not configured")
	}

	client, err := rcon.Dial(host, port, pass, 5*time.Second)
	if err != nil {
		// Record a failed delivery job for audit / retry.
		d.recordJob(order, cmds, models.StatusFailed)
		return err
	}
	defer client.Close()

	for _, cmd := range cmds {
		if _, err := client.Execute(cmd); err != nil {
			d.recordJob(order, cmds, models.StatusFailed)
			return err
		}
	}
	d.recordJob(order, cmds, "CONFIRMED")
	return nil
}

// queuePlugin enqueues commands for the Minecraft plugin to poll.
func (d *DeliveryService) queuePlugin(order *models.Order, cmds []string) error {
	requireOnline := d.settings.GetDefault(KeyPluginRequire, "false") == "true"
	return d.recordJobOnline(order, cmds, models.StatusPending, requireOnline)
}

func (d *DeliveryService) recordJob(order *models.Order, cmds []string, status string) {
	_ = d.recordJobOnline(order, cmds, status, false)
}

func (d *DeliveryService) recordJobOnline(order *models.Order, cmds []string, status string, requireOnline bool) error {
	encoded, _ := json.Marshal(cmds)
	job := models.DeliveryJob{
		OrderID:           order.ID,
		MinecraftUsername: order.MinecraftUsername,
		Commands:          string(encoded),
		RequireOnline:     requireOnline,
		Status:            status,
	}
	return d.db.Create(&job).Error
}

// TestRCON verifies connectivity and returns the server's response to "list".
func (d *DeliveryService) TestRCON(host string, port int, password string) (string, error) {
	client, err := rcon.Dial(host, port, password, 5*time.Second)
	if err != nil {
		return "", err
	}
	defer client.Close()
	return client.Execute("list")
}
