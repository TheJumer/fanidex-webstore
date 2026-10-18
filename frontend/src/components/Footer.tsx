import { useState } from 'react'
import { X, MessageCircle, ShieldCheck } from 'lucide-react'
import { useStore } from '../store'
import { useI18n } from '../i18n'
import { getLegalDoc, LegalDocKey } from '../legal/content'
import { PaymentBadges } from './PaymentBadges'

// Comprehensive, legally-compliant footer required by the Minecraft EULA and payment
// processors: Mojang/Microsoft disclaimer, copyright, legal modals, payment badges.
export default function Footer() {
  const { settings } = useStore()
  const { t, lang } = useI18n()
  const [doc, setDoc] = useState<LegalDocKey | null>(null)

  const storeName = settings?.store_name || 'Webstore'
  const year = new Date().getFullYear()

  const legalLinks: { key: LegalDocKey; label: string }[] = [
    { key: 'terms', label: t.termsOfService },
    { key: 'privacy', label: t.privacyPolicy },
    { key: 'refund', label: t.refundPolicy },
  ]

  return (
    <footer className="border-t border-white/10 mt-10 bg-[#161222]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Store / disclaimer column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={18} className="text-gold" />
              <span className="font-extrabold text-white tracking-wide">{storeName}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-md">{t.footerDisclaimer}</p>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">{t.legal}</h4>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.key}>
                  <button
                    onClick={() => setDoc(l.key)}
                    className="text-sm text-gray-400 hover:text-gold transition-colors"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links + payments column */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">{t.quickLinks}</h4>
            <ul className="space-y-2 mb-5">
              {settings?.discord_url && (
                <li>
                  <a
                    href={settings.discord_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5"
                  >
                    <MessageCircle size={14} className="text-[#5865F2]" /> {t.discord}
                  </a>
                </li>
              )}
            </ul>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">{t.acceptedPayments}</h4>
            <PaymentBadges />
          </div>
        </div>

        {/* Copyright line */}
        <div className="border-t border-white/5 mt-8 pt-5 text-center text-xs text-gray-600">
          © {year} {storeName}. {t.allRightsReserved}
        </div>
      </div>

      {doc && <LegalModal docKey={doc} storeName={storeName} onClose={() => setDoc(null)} />}
    </footer>
  )
}

function LegalModal({
  docKey,
  storeName,
  onClose,
}: {
  docKey: LegalDocKey
  storeName: string
  onClose: () => void
}) {
  const { t, lang } = useI18n()
  const doc = getLegalDoc(docKey, lang, storeName)

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">{doc.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label={t.close}>
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-3">
          {doc.body.map((para, i) => {
            // Lines that look like numbered headings get bold styling.
            const isHeading = /^\d+\./.test(para) && para.length < 80
            return isHeading ? (
              <h3 key={i} className="text-sm font-bold text-gold mt-4 first:mt-0">
                {para}
              </h3>
            ) : (
              <p key={i} className="text-sm text-gray-300 leading-relaxed">
                {para}
              </p>
            )
          })}
        </div>
        <div className="px-6 py-4 border-t border-white/10 text-right">
          <button onClick={onClose} className="btn-outline-gold">
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
}
