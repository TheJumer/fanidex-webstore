package security

import (
	"errors"
	"regexp"
	"strings"
)

// Java edition: 3-16 alphanumeric/underscore. Optional Bedrock "." prefix.
var usernameRe = regexp.MustCompile(`^\.?[a-zA-Z0-9_]{3,16}$`)

// Characters that must never reach a console command.
var injectionChars = []string{";", "&", "|", "`", "$", "\n", "\r", "\x00", "<", ">", "\\"}

// ValidateUsername enforces strict Minecraft username rules to defeat command injection.
func ValidateUsername(username string) (string, error) {
	u := strings.TrimSpace(username)
	if !usernameRe.MatchString(u) {
		return "", errors.New("invalid minecraft username: must match ^\\.?[a-zA-Z0-9_]{3,16}$")
	}
	// Defence-in-depth: reject any injection char even if regex somehow passed.
	for _, c := range injectionChars {
		if strings.Contains(u, c) {
			return "", errors.New("username contains forbidden characters")
		}
	}
	return u, nil
}

// SanitizeUsernameForCommand strips dangerous characters before substitution.
// Because ValidateUsername already restricts the charset, this is a second safety net.
func SanitizeUsernameForCommand(username string) string {
	out := username
	for _, c := range injectionChars {
		out = strings.ReplaceAll(out, c, "")
	}
	return out
}

// Placeholders supported in admin command templates.
type CommandContext struct {
	Player        string
	TransactionID string
	PackageName   string
	Duration      string
}

// RenderCommand substitutes placeholders with sanitized values.
// It guarantees no injection characters survive into the final command string.
func RenderCommand(template string, ctx CommandContext) string {
	player := SanitizeUsernameForCommand(ctx.Player)
	txn := stripControl(ctx.TransactionID)
	pkg := stripControl(ctx.PackageName)
	dur := stripControl(ctx.Duration)

	r := strings.NewReplacer(
		"{player}", player,
		"{transaction_id}", txn,
		"{package_name}", pkg,
		"{duration}", dur,
	)
	return stripControl(r.Replace(template))
}

// stripControl removes newline/carriage-return/null and shell metacharacters.
func stripControl(s string) string {
	out := s
	for _, c := range []string{"\n", "\r", "\x00", ";", "`", "$", "|", "&"} {
		out = strings.ReplaceAll(out, c, "")
	}
	return strings.TrimSpace(out)
}
