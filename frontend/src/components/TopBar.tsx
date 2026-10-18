import { Globe, Copy, MessageCircle, ShoppingCart, User, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { useI18n } from '../i18n'
import { Lang } from '../i18n/dictionary'
import UsernameModal from './UsernameModal'
import Dropdown from './Dropdown'
import { LangFlag } from './Flags'

// Top utility bar: server IP + copy, Discord, currency, language, cart, player login.
export default function TopBar() {
  const { settings, currency, setCurrency, username, setUsername, cart, setCartOpen, showToast } = useStore()
  const { t, lang, setLang } = useI18n()
  const [showUserModal, setShowUserModal] = useState(false)

  const ip = settings?.server_ip || 'PLAY.WEBSTORE.COM'
  const currencies = settings?.currencies || ['USD', 'EUR', 'UAH']
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0)

  const copyIP = async () => {
    try {
      await navigator.clipboard.writeText(ip)
      showToast(t.serverIpCopied, 'success')
    } catch {
      showToast(t.copyFailed, 'error')
    }
  }

  const langOptions = (['en', 'ua'] as Lang[]).map((l) => ({
    value: l,
    label: (
      <span className="flex items-center gap-2">
        <LangFlag lang={l} /> <span className="font-semibold">{l.toUpperCase()}</span>
      </span>
    ),
  }))

  const currencyOptions = currencies.map((c) => ({
    value: c,
    label: <span className="font-semibold">{c}</span>,
  }))

  return (
    <div className="bg-[#161222] border-b border-white/5 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-4 flex-wrap">
        {/* Left: Server IP */}
        <div className="flex items-center gap-2 text-gray-300">
          <Globe size={15} className="text-gold" />
          <span className="font-semibold tracking-wide">{ip}</span>
          <button
            onClick={copyIP}
            className="ml-1 text-gold hover:underline font-bold"
          >
            {t.copy}
          </button>
        </div>

        {/* Discord */}
        <a
          href={settings?.discord_url || '#'}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-gray-300 hover:text-white"
        >
          <MessageCircle size={15} className="text-[#5865F2]" />
          <span className="font-semibold">{t.discord}</span>
        </a>

        <div className="flex-1" />

        {/* Currency selector (custom dark dropdown) */}
        <Dropdown
          value={currency}
          options={currencyOptions}
          onChange={setCurrency}
          ariaLabel="Select currency"
        />

        {/* Language switcher (SVG flags + EN/UA) */}
        <Dropdown
          value={lang}
          options={langOptions}
          onChange={(v) => setLang(v as Lang)}
          ariaLabel="Select language"
        />

        {/* Cart */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative bg-bar rounded-pill p-2 hover:bg-bar/70"
          aria-label="Open cart"
        >
          <ShoppingCart size={16} className="text-gold" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gold text-[#2a2237] rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        {/* Player login */}
        <button
          onClick={() => setShowUserModal(true)}
          className="bg-bar rounded-pill px-3 py-1 flex items-center gap-2 hover:bg-bar/70"
        >
          {username ? (
            <img src={`https://mc-heads.net/avatar/${username}/20`} alt={username} className="rounded" />
          ) : (
            <User size={15} className="text-gold" />
          )}
          <span className="text-gray-200 font-semibold">{username || t.login}</span>
          <ChevronDown size={13} className="text-gray-400" />
        </button>

        {username && (
          <button onClick={() => setUsername(null)} className="text-gray-400 hover:text-white">
            {t.logout}
          </button>
        )}
      </div>

      {showUserModal && <UsernameModal onClose={() => setShowUserModal(false)} />}
    </div>
  )
}
