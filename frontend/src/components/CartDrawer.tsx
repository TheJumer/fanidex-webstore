import { useMemo, useState } from 'react'
import { X, Trash2, Tag } from 'lucide-react'
import { api, formatPrice, errorMessage } from '../api'
import { useStore } from '../store'
import { useI18n } from '../i18n'
import { PromoResult } from '../types'

// Slide-over cart drawer with promo code input and checkout.
export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, currency, rates, username, showToast, clearCart } = useStore()
  const { t, prodName } = useI18n()
  const [promoCode, setPromoCode] = useState('')
  const [promo, setPromo] = useState<PromoResult | null>(null)
  const [gateway] = useState('test')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)

  // Subtotal is display-only; the backend recomputes authoritative pricing.
  const subtotalCents = useMemo(
    () =>
      cart.reduce((sum, i) => {
        const unit = i.variant ? effective(i.variant) : effectiveP(i.product)
        return sum + unit * i.quantity
      }, 0),
    [cart]
  )

  const discountCents = promo?.valid ? promo.discount_cents : 0
  const totalCents = Math.max(0, subtotalCents - discountCents)

  const itemsPayload = () =>
    cart.map((i) => ({
      product_id: i.product.id,
      duration_variant_id: i.variant?.id ?? null,
      quantity: i.quantity,
    }))

  const applyPromo = async () => {
    setApplying(true)
    try {
      const r = await api.post('/promo/validate', { code: promoCode, items: itemsPayload() })
      setPromo(r.data)
      if (!r.data.valid) showToast(r.data.message || t.invalidCode, 'error')
      else showToast(t.promoApplied, 'success')
    } catch (e: any) {
      showToast(errorMessage(e, t.couldNotValidate), 'error')
    } finally {
      setApplying(false)
    }
  }

  const checkout = async () => {
    if (!username) {
      showToast(t.setUsernameFirst, 'error')
      return
    }
    if (cart.length === 0) return
    setLoading(true)
    try {
      const r = await api.post('/checkout', {
        minecraft_username: username,
        currency,
        promo_code: promo?.valid ? promo.code : '',
        gateway,
        items: itemsPayload(),
      })
      clearCart()
      // Redirect to the gateway (test gateway redirects back to success page).
      window.location.href = r.data.redirect_url
    } catch (e: any) {
      showToast(errorMessage(e, t.checkoutFailed), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${
          cartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setCartOpen(false)}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-card z-50 shadow-2xl transition-transform duration-300 flex flex-col ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="panel-header flex items-center justify-between">
          <span>{t.yourCart}</span>
          <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && <div className="text-center text-gray-500 py-10">{t.cartEmpty}</div>}
          {cart.map((item, idx) => {
            const unit = item.variant ? effective(item.variant) : effectiveP(item.product)
            return (
              <div key={idx} className="flex items-center gap-3 bg-bg rounded-lg p-3">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => ((e.target as HTMLImageElement).src = 'https://mc-heads.net/head/MHF_Question')}
                />
                <div className="flex-1">
                  <div className="font-bold text-white text-sm uppercase">{prodName(item.product)}</div>
                  {item.variant && <div className="text-xs text-gold">{item.variant.label}</div>}
                  <div className="text-xs text-gray-400">
                    {item.quantity} × {formatPrice(unit, currency, rates)}
                  </div>
                </div>
                <button onClick={() => removeFromCart(idx)} className="text-gray-500 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Promo + totals */}
        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-bg rounded-lg px-3">
              <Tag size={14} className="text-gold" />
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder={t.promoCode}
                className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none"
              />
            </div>
            <button onClick={applyPromo} disabled={applying} className="btn-outline-gold flex items-center gap-2 disabled:opacity-50">
              {applying && <span className="spinner" />}
              {t.apply}
            </button>
          </div>

          <div className="text-sm space-y-1">
            <div className="flex justify-between text-gray-400">
              <span>{t.subtotal}</span>
              <span>{formatPrice(subtotalCents, currency, rates)}</span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-greenpill">
                <span>{t.discount} ({promo?.code})</span>
                <span>-{formatPrice(discountCents, currency, rates)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-base pt-1">
              <span>{t.total}</span>
              <span>
                {formatPrice(totalCents, currency, rates)}
              </span>
            </div>
          </div>

          <button onClick={checkout} disabled={loading || cart.length === 0} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading && <span className="spinner" />}
            {loading ? t.processing : t.checkout}
          </button>
          <p className="text-[11px] text-gray-500 text-center">
            {t.pricesFinalized}
          </p>
        </div>
      </div>
    </>
  )
}

function effective(v: { price_cents: number; sale_price_cents: number | null }): number {
  if (v.sale_price_cents != null && v.sale_price_cents >= 0 && v.sale_price_cents < v.price_cents) return v.sale_price_cents
  return v.price_cents
}
function effectiveP(p: { base_price_cents: number; sale_price_cents: number | null }): number {
  if (p.sale_price_cents != null && p.sale_price_cents < p.base_price_cents) return p.sale_price_cents
  return p.base_price_cents
}
