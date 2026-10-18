import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { Category, Product } from '../types'
import { useStore } from '../store'
import { useI18n } from '../i18n'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import ProductCard from '../components/ProductCard'
import CartDrawer from '../components/CartDrawer'
import Footer from '../components/Footer'

export default function StorePage() {
  const { settings } = useStore()
  const { t, catName, catDesc } = useI18n()
  const { slug } = useParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .get('/products', { params: { category: slug || 'home' } })
      .then((r) => setProducts(r.data || []))
      .finally(() => setLoading(false))
    api.get('/categories').then((r) => setCategories(r.data || []))
  }, [slug])

  const current = findCategory(categories, slug)
  const title = current ? catName(current) : t.allPackages
  const desc = current ? catDesc(current) : t.allPackagesDesc

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      {/* Banner header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-wide">
            {settings?.store_name || 'WEBSTORE NAME'}
          </h1>
        </div>
      </header>

      {/* Two-column layout */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6 w-full flex-1">
        <Sidebar />

        <section className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-1">{title}</h2>
          <p className="text-gray-400 mb-6">{desc}</p>

          {loading ? (
            <div className="text-gray-500 py-20 text-center">{t.loadingPackages}</div>
          ) : products.length === 0 ? (
            <div className="text-gray-500 py-20 text-center">{t.noProducts}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <CartDrawer />

      <Footer />
    </div>
  )
}

function findCategory(cats: Category[], slug?: string): Category | undefined {
  if (!slug) return undefined
  for (const c of cats) {
    if (c.slug === slug) return c
    const child = c.children?.find((s) => s.slug === slug)
    if (child) return child
  }
  return undefined
}
