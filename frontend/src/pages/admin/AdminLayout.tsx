import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Ticket,
  Settings as SettingsIcon,
  CreditCard,
  ScrollText,
  LogOut,
} from 'lucide-react'
import { api } from '../../api'
import { useI18n } from '../../i18n'
import { Lang } from '../../i18n/dictionary'
import Dropdown from '../../components/Dropdown'
import { LangFlag } from '../../components/Flags'

export default function AdminLayout() {
  const navigate = useNavigate()
  const { t, lang, setLang } = useI18n()
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')

  const nav = [
    { to: '/admin', label: t.overview, icon: LayoutDashboard, end: true },
    { to: '/admin/categories', label: t.categories, icon: FolderTree },
    { to: '/admin/products', label: t.products, icon: Package },
    { to: '/admin/promos', label: t.promoCodes, icon: Ticket },
    { to: '/admin/settings', label: t.serverDelivery, icon: SettingsIcon },
    { to: '/admin/gateways', label: t.paymentGateways, icon: CreditCard },
    { to: '/admin/audit', label: t.auditLogs, icon: ScrollText },
  ]

  useEffect(() => {
    api
      .get('/admin/me')
      .then((r) => {
        setEmail(r.data.email || '')
        setReady(true)
      })
      .catch(() => navigate('/admin/login'))
  }, [])

  const logout = async () => {
    await api.post('/admin/logout').catch(() => {})
    navigate('/admin/login')
  }

  const langOptions = (['en', 'ua'] as Lang[]).map((l) => ({
    value: l,
    label: (
      <span className="flex items-center gap-2">
        <LangFlag lang={l} /> <span className="font-semibold">{l.toUpperCase()}</span>
      </span>
    ),
  }))

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-gray-500">{t.loading}</div>

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-card shrink-0 flex flex-col">
        <div className="px-5 py-5 border-b border-white/5">
          <div className="text-gold font-extrabold text-lg">{t.adminPanel}</div>
          <div className="text-xs text-gray-500 truncate">{email}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold ${
                  isActive ? 'bg-bar text-gold' : 'text-gray-300 hover:bg-bar/60'
                }`
              }
            >
              <n.icon size={17} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-2">
          <Dropdown
            value={lang}
            options={langOptions}
            onChange={(v) => setLang(v as Lang)}
            className="w-full justify-between"
            ariaLabel="Select language"
          />
        </div>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-bar/60"
        >
          <LogOut size={17} /> {t.logout}
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto h-screen p-8">
        <Outlet />
      </main>
    </div>
  )
}
