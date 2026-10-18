import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useI18n } from '../../i18n'

interface Log {
  id: number
  email: string
  action: string
  detail: string
  ip: string
  success: boolean
  created_at: string
}

export default function AuditLogs() {
  const { t } = useI18n()
  const [logs, setLogs] = useState<Log[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.get('/admin/audit-logs').then((r) => setLogs(r.data || []))
  }, [])

  const filtered = logs.filter(
    (l) =>
      !filter ||
      l.action.includes(filter) ||
      l.email.toLowerCase().includes(filter.toLowerCase()) ||
      l.ip.includes(filter)
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t.auditTitle}</h1>

      <input
        placeholder={t.filterPlaceholder}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="inp mb-4 max-w-sm"
      />

      <div className="panel p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-white/10">
              <th className="py-2 pr-4">{t.time}</th>
              <th className="py-2 pr-4">{t.action}</th>
              <th className="py-2 pr-4">{t.actor}</th>
              <th className="py-2 pr-4">{t.ip}</th>
              <th className="py-2 pr-4">{t.result}</th>
              <th className="py-2 pr-4">{t.detail}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-white/5">
                <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                <td className="py-2 pr-4 font-mono text-xs text-gold">{l.action}</td>
                <td className="py-2 pr-4 text-gray-300">{l.email || '—'}</td>
                <td className="py-2 pr-4 text-gray-400 font-mono text-xs">{l.ip}</td>
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded-pill text-[11px] font-bold ${l.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {l.success ? t.ok : t.fail}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-400 max-w-xs truncate">{l.detail}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-500">{t.noLogs}</td></tr>}
          </tbody>
        </table>
      </div>

      <style>{`.inp{background:#1a1625;border:1px solid #ffffff15;border-radius:8px;padding:6px 10px;color:#fff;outline:none}.inp:focus{border-color:#f5d168}`}</style>
    </div>
  )
}
