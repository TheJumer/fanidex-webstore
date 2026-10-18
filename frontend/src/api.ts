import axios from 'axios'

// Axios instance. withCredentials ensures HttpOnly auth cookies are sent for admin routes.
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

// CSRF double-submit: read the non-HttpOnly csrf cookie and attach it to mutating requests.
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase()
  if (['post', 'put', 'delete', 'patch'].includes(method)) {
    const csrf = readCookie('ws_csrf')
    if (csrf) {
      config.headers = config.headers || {}
      config.headers['X-CSRF-Token'] = csrf
    }
  }
  return config
})

// Auto-refresh access token once on 401 for admin API calls.
let refreshing = false
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/admin/login') &&
      !original.url?.includes('/admin/refresh')
    ) {
      original._retry = true
      if (!refreshing) {
        refreshing = true
        try {
          await api.post('/admin/refresh')
        } catch {
          // fallthrough
        } finally {
          refreshing = false
        }
      }
      return api(original)
    }
    return Promise.reject(error)
  }
)

// Currency symbols by code.
const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', UAH: '₴' }

// Money formatting helper (cents -> localized string). Does NOT convert; the input
// is assumed to already be in the target currency's minor units.
export function formatMoney(cents: number, currency = 'USD'): string {
  const value = (cents / 100).toFixed(2)
  const sym = CURRENCY_SYMBOLS[currency] || ''
  if (currency === 'UAH') return `${sym}${value}`
  return `${sym}${value}`
}

// Global price formatter: converts a USD-cents amount into the selected currency
// using the provided exchange-rate table, then formats it with the right symbol.
// Base currency is USD (rate 1.0). Example: formatPrice(200, 'UAH', {UAH:41.5}) => "₴83.00".
export function formatPrice(
  amountInUSDCents: number,
  selectedCurrency: string,
  rates?: Record<string, number> | null
): string {
  const rate = rates && rates[selectedCurrency] && rates[selectedCurrency] > 0 ? rates[selectedCurrency] : 1
  const converted = Math.round(amountInUSDCents * rate)
  return formatMoney(converted, selectedCurrency)
}

// Extracts a human-readable error message from an axios error for toast display.
export function errorMessage(e: any, fallback = 'Something went wrong'): string {
  return e?.response?.data?.error || e?.message || fallback
}
