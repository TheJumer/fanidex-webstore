package services

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/pquerna/otp/totp"
	"gorm.io/gorm"

	"webstore/internal/config"
	"webstore/internal/crypto"
	"webstore/internal/models"
)

// AuthService handles admin login, JWTs, lockout and TOTP.
type AuthService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthService(db *gorm.DB, cfg *config.Config) *AuthService {
	return &AuthService{db: db, cfg: cfg}
}

const (
	maxFailedLogins = 5
	lockoutWindow   = 15 * time.Minute
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountLocked      = errors.New("account temporarily locked due to failed attempts")
	ErrTOTPRequired       = errors.New("totp code required")
	ErrTOTPInvalid        = errors.New("invalid totp code")
)

// Claims is the JWT payload for an admin.
type Claims struct {
	AdminID uint   `json:"admin_id"`
	Email   string `json:"email"`
	Type    string `json:"type"` // "access" | "refresh"
	jwt.RegisteredClaims
}

// Login verifies credentials + optional TOTP, applying brute-force lockout.
func (s *AuthService) Login(email, password, totpCode string) (*models.Admin, error) {
	var admin models.Admin
	if err := s.db.First(&admin, "email = ?", email).Error; err != nil {
		return nil, ErrInvalidCredentials
	}

	// Lockout check.
	if admin.LockedUntil != nil && admin.LockedUntil.After(time.Now()) {
		return nil, ErrAccountLocked
	}

	ok, err := crypto.VerifyPassword(password, admin.PasswordHash)
	if err != nil || !ok {
		s.registerFailure(&admin)
		return nil, ErrInvalidCredentials
	}

	// TOTP enforcement.
	if admin.TOTPEnabled {
		if totpCode == "" {
			return nil, ErrTOTPRequired
		}
		secret, derr := crypto.Decrypt(admin.TOTPSecret)
		if derr != nil {
			return nil, ErrTOTPInvalid
		}
		if !totp.Validate(totpCode, secret) {
			s.registerFailure(&admin)
			return nil, ErrTOTPInvalid
		}
	}

	// Success: reset failure counters.
	admin.FailedLogins = 0
	admin.LockedUntil = nil
	s.db.Save(&admin)
	return &admin, nil
}

// registerFailure increments the counter and applies exponential lockout.
func (s *AuthService) registerFailure(admin *models.Admin) {
	admin.FailedLogins++
	if admin.FailedLogins >= maxFailedLogins {
		// Exponential backoff: window grows with the overflow count.
		over := admin.FailedLogins - maxFailedLogins + 1
		backoff := lockoutWindow * time.Duration(over)
		until := time.Now().Add(backoff)
		admin.LockedUntil = &until
	}
	s.db.Save(admin)
}

// IssueTokens creates signed access + refresh JWTs.
func (s *AuthService) IssueTokens(admin *models.Admin) (access string, refresh string, err error) {
	now := time.Now()
	accessClaims := Claims{
		AdminID: admin.ID,
		Email:   admin.Email,
		Type:    "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(s.cfg.JWTAccessTTLMin) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}
	refreshClaims := Claims{
		AdminID: admin.ID,
		Email:   admin.Email,
		Type:    "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(s.cfg.JWTRefreshTTLHrs) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	access, err = jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(s.cfg.JWTAccessSecret))
	if err != nil {
		return
	}
	refresh, err = jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString([]byte(s.cfg.JWTRefreshSecret))
	return
}

// ParseAccess validates an access token.
func (s *AuthService) ParseAccess(tokenStr string) (*Claims, error) {
	return s.parse(tokenStr, s.cfg.JWTAccessSecret, "access")
}

// ParseRefresh validates a refresh token.
func (s *AuthService) ParseRefresh(tokenStr string) (*Claims, error) {
	return s.parse(tokenStr, s.cfg.JWTRefreshSecret, "refresh")
}

func (s *AuthService) parse(tokenStr, secret, want string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	if claims.Type != want {
		return nil, errors.New("wrong token type")
	}
	return claims, nil
}

// SetupTOTP generates a new secret + otpauth URL for an admin (not yet enabled).
func (s *AuthService) SetupTOTP(admin *models.Admin, issuer string) (secret string, url string, err error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: admin.Email,
	})
	if err != nil {
		return "", "", err
	}
	enc, err := crypto.Encrypt(key.Secret())
	if err != nil {
		return "", "", err
	}
	admin.TOTPSecret = enc
	if err := s.db.Save(admin).Error; err != nil {
		return "", "", err
	}
	return key.Secret(), key.URL(), nil
}

// EnableTOTP verifies a code and flips the enabled flag on.
func (s *AuthService) EnableTOTP(admin *models.Admin, code string) error {
	secret, err := crypto.Decrypt(admin.TOTPSecret)
	if err != nil {
		return err
	}
	if !totp.Validate(code, secret) {
		return ErrTOTPInvalid
	}
	admin.TOTPEnabled = true
	return s.db.Save(admin).Error
}
