import { useEffect, useState } from 'react'
import { Copy, Save } from 'lucide-react'
import { api, errorMessage } from '../../api'
import { useStore } from '../../store'
import { useI18n } from '../../i18n'

interface Gateway {
  driver: string
  enabled: boolean
  api_key: string
  secret_key: string
  webhook_key: string
}

export default function Gateways() {
  const { showToast } = useStore()
  const { t } = useI18n()
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [drafts, setDrafts] = useState<Record<string, { api_key: string; secret_key: string; webhook_key: string }>>({})
  const [togglingDriver, setTogglingDriver] = useState<string | null>(null)
  const [savingDriver, setSavingDriver] = useState<string | null>(null)

  const load = () => {
    api.get('/admin/gateways').then((r) => setGateways(r.data || []))
    api.get('/admin/gateways/webhook-urls').then((r) => setUrls(r.data || {}))
  }
  useEffect(() => { load() }, [])

  const toggle = async (g: Gateway, enabled: boolean) => {
    setTogglingDriver(g.driver)
    try {
      await api.put('/admin/gateways', { driver: g.driver, enabled, api_key: '', secret_key: '', webhook_key: '' })
      showToast(t.savedSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setTogglingDriver(null)
    }
  }

  const saveKeys = async (g: Gateway) => {
    const d = drafts[g.driver] || { api_key: '', secret_key: '', webhook_key: '' }
    setSavingDriver(g.driver)
    try {
      await api.put('/admin/gateways', { driver: g.driver, enabled: g.enabled, ...d })
      setDrafts({ ...drafts, [g.driver]: { api_key: '', secret_key: '', webhook_key: '' } })
      showToast(t.savedSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setSavingDriver(null)
    }
  }

  const setDraft = (driver: string, field: string, val: string) =>
    setDrafts({ ...drafts, [driver]: { ...(drafts[driver] || { api_key: '', secret_key: '', webhook_key: '' }), [field]: val } })

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showToast(t.copied, 'success')
    } catch {
      showToast(t.copyFailed, 'error')
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">{t.gatewaysTitle}</h1>

      {gateways.map((g) => (
        <div key={g.driver} className="panel p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-lg font-bold text-white capitalize">{g.driver}</span>
              {g.driver === 'test' && <span className="ml-2 text-xs text-yellow-400">{t.sandboxOnly}</span>}
            </div>
            <label className="flex items-center gap-2 text-sm">
              {togglingDriver === g.driver && <span className="spinner" />}
              <input type="checkbox" checked={g.enabled} disabled={togglingDriver === g.driver} onChange={(e) => toggle(g, e.target.checked)} />
              <span className={g.enabled ? 'text-greenpill' : 'text-gray-500'}>{g.enabled ? t.enabled : t.disabled}</span>
            </label>
          </div>

          {g.driver !== 'test' && (
            <div className="grid grid-cols-1 gap-3 mb-4">
              <KeyField label={t.apiKey} placeholder={g.api_key || ''} value={drafts[g.driver]?.api_key || ''} onChange={(v) => setDraft(g.driver, 'api_key', v)} />
              <KeyField label={t.secretKey} placeholder={g.secret_key || ''} value={drafts[g.driver]?.secret_key || ''} onChange={(v) => setDraft(g.driver, 'secret_key', v)} />
              <KeyField label={t.webhookSecret} placeholder={g.webhook_key || ''} value={drafts[g.driver]?.webhook_key || ''} onChange={(v) => setDraft(g.driver, 'webhook_key', v)} />
              <button onClick={() => saveKeys(g)} disabled={savingDriver === g.driver} className="btn-gold flex items-center gap-2 w-fit disabled:opacity-50">
                {savingDriver === g.driver ? <span className="spinner" /> : <Save size={15} />} {savingDriver === g.driver ? t.saving : t.saveKeys}
              </button>
            </div>
          )}

          {/* Webhook URL */}
          <div className="bg-bg rounded-lg p-3 flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">{t.webhookUrl}</span>
            <code className="text-xs text-gold flex-1 break-all">{urls[g.driver] || ''}</code>
            <button onClick={() => copyUrl(urls[g.driver] || '')} className="text-gold"><Copy size={14} /></button>
          </div>
        </div>
      ))}

      <style>{`.inp{background:#1a1625;border:1px solid #ffffff15;border-radius:8px;padding:6px 10px;color:#fff;outline:none;width:100%}.inp:focus{border-color:#f5d168}`}</style>
    </div>
  )
}

function KeyField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-400 mb-1">{label}</span>
      <input className="inp" type="password" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
