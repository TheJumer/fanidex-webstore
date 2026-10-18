import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'
import { CartItem, Product, DurationVariant, PublicSettings } from './types'
import { useToast } from './components/Toast'
import { useI18n } from './i18n'

interface StoreState {
  settings: PublicSettings | null
  currency: string
  setCurrency: (c: string) => void
  rates: Record<string, number>
  username: string | null
  setUsername: (u: string | null) => void
  cart: CartItem[]
  addToCart: (p: Product, v?: DurationVariant) => void
  removeFromCart: (index: number) => void
  clearCart: () => void
  cartOpen: boolean
  setCartOpen: (b: boolean) => void
  // Toast passthrough (kept for backwards compatibility). Defaults to info.
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

const Ctx = createContext<StoreState | null>(null)

const DEFAULT_RATES: Record<string, number> = { USD: 1.0, EUR: 0.92, UAH: 41.5 }

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  const { prodName, t } = useI18n()
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [currency, setCurrency] = useState<string>(localStorage.getItem('currency') || 'USD')
  const [username, setUsernameState] = useState<string | null>(localStorage.getItem('mc_username'))
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem('currency', currency)
  }, [currency])

  const rates = settings?.rates && Object.keys(settings.rates).length > 0 ? settings.rates : DEFAULT_RATES

  const setUsername = (u: string | null) => {
    setUsernameState(u)
    if (u) localStorage.setItem('mc_username', u)
    else localStorage.removeItem('mc_username')
  }

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') =>
    toast.pushToast(msg, type)

  const addToCart = (p: Product, v?: DurationVariant) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === p.id && i.variant?.id === v?.id
      )
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 }
        return copy
      }
      return [...prev, { product: p, variant: v, quantity: 1 }]
    })
    toast.success(`${prodName(p)} — ${t.addedToCart}`)
  }

  const removeFromCart = (index: number) =>
    setCart((prev) => prev.filter((_, i) => i !== index))

  const clearCart = () => setCart([])

  return (
    <Ctx.Provider
      value={{
        settings,
        currency,
        setCurrency,
        rates,
        username,
        setUsername,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartOpen,
        setCartOpen,
        showToast,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
