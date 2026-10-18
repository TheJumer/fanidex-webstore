package crypto

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
)

// SignHMAC returns the hex-encoded HMAC-SHA256 of message using secret.
func SignHMAC(secret string, message []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(message)
	return hex.EncodeToString(mac.Sum(nil))
}

// VerifyHMAC compares a provided hex signature against the computed HMAC in constant time.
func VerifyHMAC(secret string, message []byte, providedHex string) bool {
	expected := SignHMAC(secret, message)
	return subtle.ConstantTimeCompare([]byte(expected), []byte(providedHex)) == 1
}

// RandomHex returns n random bytes hex-encoded (2n chars).
func RandomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
