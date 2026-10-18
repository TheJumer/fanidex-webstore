export interface PublicSettings {
  store_name: string
  server_ip: string
  discord_url: string
  currencies: string[]
  rates: Record<string, number>
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  name_uk?: string
  description_uk?: string
  parent_id: number | null
  sort_order: number
  children?: Category[]
}

export interface DurationVariant {
  id: number
  product_id: number
  label: string
  duration_days: number
  price_cents: number
  sale_price_cents: number | null
  sort_order: number
}

export interface Product {
  id: number
  category_id: number
  name: string
  slug: string
  description: string
  name_uk?: string
  description_uk?: string
  image_url: string
  base_price_cents: number
  sale_price_cents: number | null
  has_variants: boolean
  sort_order: number
  active: boolean
  variants?: DurationVariant[]
}

export interface TopCustomer {
  username: string
  total_cents: number
  avatar_url?: string
}

export interface CartItem {
  product: Product
  variant?: DurationVariant
  quantity: number
}

export interface PromoResult {
  code: string
  discount_cents: number
  valid: boolean
  message: string
}

export interface OrderSummary {
  order_id: string
  redirect_url: string
  total_cents: number
  currency: string
}
