import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { api, errorMessage } from '../api'
import { useStore } from '../store'
import { useI18n } from '../i18n'

// Prompts the user to enter and validate a Minecraft username before cart/checkout.
export default function UsernameModal({ onClose }: { onClose: () => void }) {
  const { username, setUsername, showToast } = useStore()
  const { t } = useI18n()
  const [value, setValue] = useState(username || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      const r = await api.post('/username/validate', { username: value })
      if (r.data.valid) {
        setUsername(r.data.username)
        showToast(`${t.playingAs} ${r.data.username}`, 'success')
        onClose()
      } else {
        setError(r.data.error || t.invalidUsername)
      }
    } catch (e: any) {
      setError(errorMessage(e, t.invalidUsername))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-1">{t.enterUsername}</h2>
        <p className="text-sm text-gray-400 mb-4">
          {t.usernameDeliverNote}
        </p>

        <div className="flex items-center gap-3 mb-4">
          {value && (
            <img
              src={`https://mc-heads.net/avatar/${value}/48`}
              alt="head"
              className="rounded"
              onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
            />
          )}
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Steve"
            className="flex-1 bg-bg border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold"
          />
        </div>

        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        <button onClick={submit} disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <span className="spinner" /> : <Check size={16} />}
          {loading ? t.checking : t.confirm}
        </button>
        <p className="text-[11px] text-gray-500 mt-3">
          {t.usernameRules}
        </p>
      </div>
    </div>
  )
}
