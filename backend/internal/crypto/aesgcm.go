package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"io"
)

var masterKey []byte

// InitMasterKey decodes the APP_MASTER_KEY (hex of 64 chars or base64) into a 32-byte key.
func InitMasterKey(raw string) error {
	if raw == "" {
		return errors.New("APP_MASTER_KEY is empty")
	}
	// Try hex first (64 hex chars = 32 bytes)
	if len(raw) == 64 {
		if b, err := hex.DecodeString(raw); err == nil && len(b) == 32 {
			masterKey = b
			return nil
		}
	}
	// Try base64
	if b, err := base64.StdEncoding.DecodeString(raw); err == nil && len(b) == 32 {
		masterKey = b
		return nil
	}
	// Fallback: raw bytes must be exactly 32
	if len(raw) == 32 {
		masterKey = []byte(raw)
		return nil
	}
	return errors.New("APP_MASTER_KEY must decode to exactly 32 bytes (hex64 / base64 / raw32)")
}

// Encrypt encrypts plaintext with AES-256-GCM and returns base64(nonce||ciphertext).
func Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	ct := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ct), nil
}

// Decrypt reverses Encrypt.
func Decrypt(encoded string) (string, error) {
	if encoded == "" {
		return "", nil
	}
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	ns := gcm.NonceSize()
	if len(data) < ns {
		return "", errors.New("ciphertext too short")
	}
	nonce, ct := data[:ns], data[ns:]
	pt, err := gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", err
	}
	return string(pt), nil
}

// Mask returns a masked representation for API responses so secrets are never leaked.
func Mask(encoded string) string {
	if encoded == "" {
		return ""
	}
	return "••••••••"
}
