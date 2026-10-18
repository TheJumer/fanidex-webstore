import { useState } from 'react'
import { Info } from 'lucide-react'
import { Product } from '../types'
import { useStore } from '../store'
import { useI18n } from '../i18n'
import { formatPrice } from '../api'
import ProductModal from './ProductModal'

// Product card matching the dark/gold spec: centered image, left title, green price pill,
// BUY/VIEW + INFO pill buttons.
export default function ProductCard({ product }: { product: Product }) {
  const { currency, rates, addToCart, username, setCartOpen } = useStore()
  const { t, prodName } = useI18n()
  const [showModal, setShowModal] = useState(false)

  // Determine displayed price (base or cheapest variant).
  let priceCents = product.base_price_cents
  let oldPrice: number | null = null
  if (product.has_variants && product.variants && product.variants.length > 0) {
    const cheapest = [...product.variants].sort((a, b) => effective(a) - effective(b))[0]
    priceCents = effective(cheapest)
  } else if (product.sale_price_cents != null && product.sale_price_cents < product.base_price_cents) {
    priceCents = product.sale_price_cents
    oldPrice = product.base_price_cents
  }

  const hasOptions = product.has_variants

  const handlePrimary = () => {
    if (hasOptions) {
      setShowModal(true)
      return
    }
    if (!username) {
      setShowModal(true)
      return
    }
    addToCart(product)
    setCartOpen(true)
  }

  return (
    <div className="panel p-4 flex flex-col group">
      {/* Image */}
      <div className="flex items-center justify-center h-40 mb-4 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="max-h-40 object-contain transition-transform duration-300 group-hover:scale-110"
          onError={(e) => ((e.target as HTMLImageElement).src = 'https://mc-heads.net/head/MHF_Question')}
        />
      </div>

      {/* Title */}
      <h3 className="text-left font-bold text-white uppercase tracking-wide mb-2">{prodName(product)}</h3>

      {/* Price pill */}
      <div className="mb-4">
        <span className="price-pill">
          {oldPrice != null && (
            <span className="line-through text-gray-500 text-xs">{formatPrice(oldPrice, currency, rates)}</span>
          )}
          {formatPrice(priceCents, currency, rates)}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2">
        <button onClick={handlePrimary} className="btn-gold flex-1">
          {hasOptions ? t.view : t.buy}
        </button>
        <button onClick={() => setShowModal(true)} className="btn-outline-gold flex items-center gap-1">
          <Info size={14} /> {t.info}
        </button>
      </div>

      {showModal && <ProductModal product={product} onClose={() => setShowModal(false)} />}
    </div>
  )
}

function effective(v: { price_cents: number; sale_price_cents: number | null }): number {
  if (v.sale_price_cents != null && v.sale_price_cents >= 0 && v.sale_price_cents < v.price_cents) {
    return v.sale_price_cents
  }
  return v.price_cents
}
