import { useEffect, useState } from 'react'
import { Save, Zap, KeyRound, Copy } from 'lucide-react'
import { api, errorMessage } from '../../api'
import { useStore } from '../../store'
import { useI18n } from '../../i18n'

export default function Settings() {
  const { showToast } = useStore()
  const { t } = useI18n()
  const [s, setS] = useState<any>(null)
  const [rconPass, setRconPass] = useState('')
  const [rconResult, setRconResult] = useState<string | null>(null)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [queue, setQueue] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [rotating, setRotating] = useState(false)

  const load = () => api.get('/admin/settings').then((r) => setS(r.data))
  useEffect(() => {
    load()
    api.get('/admin/settings/plugin/queue').then((r) => setQueue(r.data || []))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings', {
        store_name: s.store_name,
        server_ip: s.server_ip,
        discord_url: s.discord_url,
        currencies: s.currencies,
        exchange_rates: s.exchange_rates,
        delivery_mode: s.delivery_mode,
        rcon_host: s.rcon_host,
        rcon_port: String(s.rcon_port),
        rcon_password: rconPass, // only sent if changed
        plugin_require_online: s.plugin_require_online,
      })
      setRconPass('')
      showToast(t.savedSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setSaving(false)
    }
  }

  const testRcon = async () => {
    setTesting(true)
    setRconResult(t.rconTesting)
    try {
      const r = await api.post('/admin/settings/rcon/test', {
        host: s.rcon_host,
        port: Number(s.rcon_port),
        password: rconPass,
      })
      if (r.data.ok) {
        setRconResult(`✅ ${t.rconConnected}: ${r.data.response || 'ok'}`)
        showToast(t.rconConnected, 'success')
      } else {
        setRconResult(`❌ ${r.data.error}`)
        showToast(r.data.error || t.saveFailed, 'error')
      }
    } catch (e: any) {
      const msg = errorMessage(e, 'failed')
      setRconResult(`❌ ${msg}`)
      showToast(msg, 'error')
    } finally {
      setTesting(false)
    }
  }

  const rotate = async () => {
    setRotating(true)
    try {
      const r = await api.post('/admin/settings/plugin/rotate')
      setNewSecret(r.data.plugin_secret)
      showToast(t.savedSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setRotating(false)
    }
  }

  const setRate = (code: string, val: string) => {
    const next = { ...(s.exchange_rates || {}) }
    const n = parseFloat(val)
    next[code] = isNaN(n) ? 0 : n
    setS({ ...s, exchange_rates: next })
  }

  if (!s) return <div className="text-gray-500">{t.loading}</div>

  // Rate editor rows: union of currency codes and known rate keys (USD always base).
  const rateCodes = Array.from(
    new Set([...(s.currencies ? String(s.currencies).split(',').map((c: string) => c.trim()) : []), ...Object.keys(s.exchange_rates || {})])
  ).filter(Boolean)

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">{t.serverSettingsTitle}</h1>

      {/* Store info */}
      <div className="panel p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-300 uppercase mb-4">{t.storeInformation}</h2>
        <div className="grid grid-cols-2 gap-4">
          <L label={t.storeName}><input className="inp" value={s.store_name} onChange={(e) => setS({ ...s, store_name: e.target.value })} /></L>
          <L label={t.serverIpLabel}><input className="inp" value={s.server_ip} onChange={(e) => setS({ ...s, server_ip: e.target.value })} /></L>
          <L label={t.discordUrl}><input className="inp" value={s.discord_url} onChange={(e) => setS({ ...s, discord_url: e.target.value })} /></L>
          <L label={t.currenciesLabel}><input className="inp" value={s.currencies} onChange={(e) => setS({ ...s, currencies: e.target.value })} /></L>
        </div>
      </div>

      {/* Exchange rates */}
      <div className="panel p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-300 uppercase mb-1">{t.exchangeRates}</h2>
        <p className="text-[11px] text-gray-500 mb-4">{t.exchangeRatesHint}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {rateCodes.map((code) => (
            <L key={code} label={code === 'USD' ? `${code} (base)` : code}>
              <input
                type="number"
                step="0.0001"
                className="inp disabled:opacity-60"
                disabled={code === 'USD'}
                value={code === 'USD' ? 1 : (s.exchange_rates?.[code] ?? '')}
                onChange={(e) => setRate(code, e.target.value)}
              />
            </L>
          ))}
        </div>
      </div>

      {/* Delivery mode */}
      <div className="panel p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-300 uppercase mb-4">{t.deliveryMode}</h2>
        <div className="flex gap-3 mb-4">
          {['rcon', 'plugin'].map((m) => (
            <button
              key={m}
              onClick={() => setS({ ...s, delivery_mode: m })}
              className={`rounded-pill px-5 py-2 text-sm font-bold border ${
                s.delivery_mode === m ? 'bg-gold text-[#2a2237] border-gold' : 'border-white/15 text-gray-300'
              }`}
            >
              {m === 'rcon' ? t.directRcon : t.pluginApi}
            </button>
          ))}
        </div>

        {s.delivery_mode === 'rcon' ? (
          <div className="grid grid-cols-2 gap-4">
            <L label={t.rconHost}><input className="inp" value={s.rcon_host} onChange={(e) => setS({ ...s, rcon_host: e.target.value })} /></L>
            <L label={t.rconPort}><input className="inp" value={s.rcon_port} onChange={(e) => setS({ ...s, rcon_port: e.target.value })} /></L>
            <L label={`${t.rconPassword} ${s.rcon_password_set ? t.rconPasswordSaved : ''}`}>
              <input type="password" className="inp" value={rconPass} placeholder={s.rcon_password_set ? '••••••••' : ''} onChange={(e) => setRconPass(e.target.value)} />
            </L>
            <div className="flex items-end">
              <button onClick={testRcon} disabled={testing} className="btn-outline-gold flex items-center gap-2 disabled:opacity-50">
                {testing ? <span className="spinner" /> : <Zap size={15} />} {t.testRcon}
              </button>
            </div>
            {rconResult && <div className="col-span-2 text-sm text-gray-300">{rconResult}</div>}
          </div>
        ) : (
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-4">
              <input type="checkbox" checked={s.plugin_require_online === 'true'} onChange={(e) => setS({ ...s, plugin_require_online: e.target.checked ? 'true' : 'false' })} />
              {t.requireOnline}
            </label>

            <div className="flex items-center gap-3 mb-4">
              <button onClick={rotate} disabled={rotating} className="btn-outline-gold flex items-center gap-2 disabled:opacity-50">
                {rotating ? <span className="spinner" /> : <KeyRound size={15} />} {t.rotateSecret}
              </button>
              <span className="text-xs text-gray-400">{s.plugin_secret_set ? t.secretConfigured : t.noSecretYet}</span>
            </div>
            {newSecret && (
              <div className="bg-bg rounded-lg p-3 mb-4 flex items-center gap-2">
                <code className="text-gold text-xs flex-1 break-all">{newSecret}</code>
                <button onClick={() => { navigator.clipboard.writeText(newSecret); showToast(t.copied, 'success') }} className="text-gold"><Copy size={15} /></button>
              </div>
            )}
            {newSecret && <p className="text-[11px] text-yellow-400 mb-4">{t.copySecretNow}</p>}

            <div className="panel bg-bg">
              <div className="panel-header">{t.pendingQueue} ({queue.length})</div>
              <div className="p-3 max-h-48 overflow-y-auto text-xs">
                {queue.length === 0 ? (
                  <div className="text-gray-500 py-3 text-center">{t.queueEmpty}</div>
                ) : (
                  queue.map((j) => (
                    <div key={j.id} className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-300">#{j.id} → {j.minecraft_username}</span>
                      <span className="text-gold">{j.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} className="btn-gold flex items-center gap-2 disabled:opacity-50">
        {saving ? <span className="spinner" /> : <Save size={16} />} {saving ? t.saving : t.saveSettings}
      </button>

      <style>{`.inp{background:#1a1625;border:1px solid #ffffff15;border-radius:8px;padding:6px 10px;color:#fff;outline:none;width:100%}.inp:focus{border-color:#f5d168}`}</style>
    </div>
  )
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs text-gray-400 mb-1">{label}</span>{children}</label>
}
