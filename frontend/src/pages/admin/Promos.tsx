import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api, errorMessage } from '../../api'
import { useStore } from '../../store'
import { useI18n } from '../../i18n'

interface Promo {
  id: number
  code: string
  type: string
  value: number
  max_uses: number
  uses: number
  expires_at: string | null
  active: boolean
}

export default function Promos() {
  const { showToast } = useStore()
  const { t } = useI18n()
  const [promos, setPromos] = useState<Promo[]>([])
  const [form, setForm] = useState({ code: '', type: 'percent', value: 10, max_uses: 0, expires_at: '' })
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = () => api.get('/admin/promos').then((r) => setPromos(r.data || []))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.code) {
      showToast(t.saveFailed, 'error')
      return
    }
    setCreating(true)
    try {
      await api.post('/admin/promos', {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        max_uses: Number(form.max_uses),
        active: true,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      })
      setForm({ code: '', type: 'percent', value: 10, max_uses: 0, expires_at: '' })
      showToast(t.createdSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setCreating(false)
    }
  }

  const del = async (id: number) => {
    if (!confirm(t.confirmDelete)) return
    setDeletingId(id)
    try {
      await api.delete(`/admin/promos/${id}`)
      showToast(t.deletedSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t.promosTitle}</h1>

      <div className="panel p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-300 uppercase mb-4">{t.newPromo}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <input placeholder={t.code} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="inp" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="inp">
            <option value="percent">{t.percentType}</option>
            <option value="fixed">{t.fixedType}</option>
          </select>
          <input type="number" placeholder={t.value} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="inp" />
          <input type="number" placeholder={t.maxUses} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} className="inp" />
          <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="inp" />
          <button onClick={create} disabled={creating} className="btn-gold flex items-center justify-center gap-1 disabled:opacity-50">
            {creating ? <span className="spinner" /> : <Plus size={15} />} {creating ? t.creating : t.add}
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          {t.promoHint}
        </p>
      </div>

      <div className="panel p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-white/10">
              <th className="py-2 pr-4">{t.code}</th>
              <th className="py-2 pr-4">{t.discount}</th>
              <th className="py-2 pr-4">{t.uses}</th>
              <th className="py-2 pr-4">{t.expires}</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-gold">{p.code}</td>
                <td className="py-2 pr-4">{p.type === 'percent' ? `${p.value}%` : `$${(p.value / 100).toFixed(2)}`}</td>
                <td className="py-2 pr-4 text-gray-400">{p.uses}{p.max_uses ? ` / ${p.max_uses}` : ''}</td>
                <td className="py-2 pr-4 text-gray-400">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}</td>
                <td className="py-2 pr-4 text-right">
                  <button onClick={() => del(p.id)} disabled={deletingId === p.id} className="text-red-400 disabled:opacity-50">
                    {deletingId === p.id ? <span className="spinner" /> : <Trash2 size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {promos.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-500">{t.noPromos}</td></tr>}
          </tbody>
        </table>
      </div>

      <style>{`.inp{background:#1a1625;border:1px solid #ffffff15;border-radius:8px;padding:6px 10px;color:#fff;outline:none}.inp:focus{border-color:#f5d168}`}</style>
    </div>
  )
}
