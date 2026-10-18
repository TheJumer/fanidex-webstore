import { useState } from 'react'
import { X } from 'lucide-react'
import { Product, DurationVariant } from '../types'
import { useStore } from '../store'
import { useI18n } from '../i18n'
import { formatPrice } from '../api'
import UsernameModal from './UsernameModal'

// INFO/VIEW modal: full description + duration selector for temporary products.
export default function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { currency, rates, addToCart, username, setCartOpen } = useStore()
  const { t, prodName, prodDesc } = useI18n()
  const variants = product.variants || []
  const [selected, setSelected] = useState<DurationVariant | undefined>(
    product.has_variants ? variants[0] : undefined
  )
  const [showUser, setShowUser] = useState(false)

  const price = selected ? effective(selected) : effective2(product)

  const buy = () => {
    if (!username) {
      setShowUser(true)
      return
    }
    addToCart(product, selected)
    onClose()
    setCartOpen(true)
  }

  // Render description: treat as HTML (backend stores markdown/html, rendered simply here).
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex items-center justify-center sm:w-48 shrink-0">
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-48 object-contain"
              onError={(e) => ((e.target as HTMLImageElement).src = 'https://mc-heads.net/head/MHF_Question')}
            />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white uppercase mb-2">{prodName(product)}</h2>

            <div
              className="prose prose-invert text-sm text-gray-300 mb-4 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: renderDesc(prodDesc(product)) }}
            />

            {/* Duration selector */}
            {product.has_variants && (
              <div className="mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">{t.selectDuration}</div>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelected(v)}
                      className={`rounded-pill px-4 py-1.5 text-sm font-semibold border ${
                        selected?.id === v.id
                          ? 'bg-gold text-[#2a2237] border-gold'
                          : 'border-white/15 text-gray-300 hover:border-gold'
                      }`}
                    >
                      {v.label} — {formatPrice(effective(v), currency, rates)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <span className="price-pill text-base">
                {formatPrice(price, currency, rates)}
              </span>
              <button onClick={buy} className="btn-gold flex-1">
                {t.buyNow}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showUser && <UsernameModal onClose={() => setShowUser(false)} />}
    </div>
  )
}

function effective(v: DurationVariant): number {
  if (v.sale_price_cents != null && v.sale_price_cents >= 0 && v.sale_price_cents < v.price_cents) {
    return v.sale_price_cents
  }
  return v.price_cents
}
function effective2(p: Product): number {
  if (p.sale_price_cents != null && p.sale_price_cents < p.base_price_cents) return p.sale_price_cents
  return p.base_price_cents
}

// Minimal markdown-ish rendering (headers + bold + lists) with HTML escaping.
function renderDesc(src: string): string {
  const esc = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc
    .replace(/^## (.*)$/gm, '<h3 style="font-weight:700;color:#fff;margin:6px 0">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)$/gm, '• $1')
}
