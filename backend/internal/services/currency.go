package services

// DefaultFXRates are the fallback conversion rates relative to USD (the base currency).
// Admins can override these in the settings panel; they are persisted as JSON in the
// "exchange_rates" setting and always resolved server-side so the frontend can never
// influence authoritative pricing.
var DefaultFXRates = map[string]float64{
	"USD": 1.00,
	"EUR": 0.92,
	"UAH": 41.50,
}

// ConvertFromUSDCentsWithRates converts USD cents to the target currency's minor units
// (cents) using the provided rate table. Falls back to a 1:1 rate for unknown currencies.
func ConvertFromUSDCentsWithRates(usdCents int, currency string, rates map[string]float64) int {
	rate, ok := rates[currency]
	if !ok || rate <= 0 {
		rate = 1.0
	}
	return int(float64(usdCents)*rate + 0.5)
}

// ConvertFromUSDCents converts using the static default rates (kept for compatibility
// where a settings-backed rate table is not available).
func ConvertFromUSDCents(usdCents int, currency string) int {
	return ConvertFromUSDCentsWithRates(usdCents, currency, DefaultFXRates)
}

// SupportedCurrencyWithRates reports whether a currency code exists in the rate table.
func SupportedCurrencyWithRates(code string, rates map[string]float64) bool {
	_, ok := rates[code]
	return ok
}

// SupportedCurrency reports whether a currency code is known in the default rate table.
func SupportedCurrency(code string) bool {
	return SupportedCurrencyWithRates(code, DefaultFXRates)
}
