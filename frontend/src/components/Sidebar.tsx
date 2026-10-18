import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Plus, Minus } from 'lucide-react'
import { api, formatPrice } from '../api'
import { Category, TopCustomer } from '../types'
import { useStore } from '../store'
import { useI18n } from '../i18n'

// Left sidebar: NAVIGATION (category tree) + TOP CUSTOMER box.
export default function Sidebar() {
  const { currency, rates } = useStore()
  const { t, catName } = useI18n()
  const { slug } = useParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [top, setTop] = useState<TopCustomer | null>(null)

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data || [])).catch(() => {})
    api.get('/top-customer').then((r) => setTop(r.data)).catch(() => {})
  }, [])

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      {/* NAVIGATION */}
      <div className="panel">
        <div className="panel-header">{t.navigation}</div>
        <nav className="p-2">
          <Link
            to="/"
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              !slug ? 'bg-bar text-gold' : 'text-gray-300 hover:bg-bar/60'
            }`}
          >
            {t.home}
          </Link>
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center">
                <Link
                  to={`/category/${cat.slug}`}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
                    slug === cat.slug ? 'bg-bar text-gold' : 'text-gray-300 hover:bg-bar/60'
                  }`}
                >
                  {catName(cat)}
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <button
                    onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                    className="p-2 text-gold"
                  >
                    {expanded === cat.id ? <Minus size={14} /> : <Plus size={14} />}
                  </button>
                )}
              </div>
              {/* Smooth expand for subcategories */}
              <div
                className="overflow-hidden transition-all duration-300 ml-3"
                style={{ maxHeight: expanded === cat.id ? (cat.children?.length || 0) * 40 : 0 }}
              >
                {cat.children?.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/category/${sub.slug}`}
                    className="block px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gold"
                  >
                    {catName(sub)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* TOP CUSTOMER */}
      <div className="panel">
        <div className="panel-header">{t.topCustomer}</div>
        <div className="p-4 flex flex-col items-center text-center">
          {top && top.username ? (
            <>
              <img
                src={top.avatar_url || `https://mc-heads.net/body/${top.username}`}
                alt={top.username}
                className="h-40 object-contain mb-3"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
              <div className="font-bold text-white">{top.username}</div>
              <div className="price-pill mt-2">{formatPrice(top.total_cents, currency, rates)}</div>
            </>
          ) : (
            <div className="text-sm text-gray-500 py-6">{t.noDonations}</div>
          )}
        </div>
      </div>
    </aside>
  )
}
