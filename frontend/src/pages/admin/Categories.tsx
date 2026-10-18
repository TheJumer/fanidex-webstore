import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api, errorMessage } from '../../api'
import { useStore } from '../../store'
import { useI18n } from '../../i18n'
import { Category } from '../../types'

export default function Categories() {
  const { showToast } = useStore()
  const { t } = useI18n()
  const [cats, setCats] = useState<Category[]>([])
  const [form, setForm] = useState({ name: '', slug: '', description: '', name_uk: '', description_uk: '', parent_id: '', sort_order: 0 })
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = () => api.get('/admin/categories').then((r) => setCats(r.data || []))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.name || !form.slug) {
      showToast(t.saveFailed, 'error')
      return
    }
    setCreating(true)
    try {
      await api.post('/admin/categories', {
        name: form.name,
        slug: form.slug,
        description: form.description,
        name_uk: form.name_uk,
        description_uk: form.description_uk,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        sort_order: Number(form.sort_order),
      })
      setForm({ name: '', slug: '', description: '', name_uk: '', description_uk: '', parent_id: '', sort_order: 0 })
      showToast(t.createdSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setCreating(false)
    }
  }

  const update = async (c: Category) => {
    try {
      await api.put(`/admin/categories/${c.id}`, c)
      showToast(t.updatedSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    }
  }

  const del = async (id: number) => {
    if (!confirm(t.confirmDelete)) return
    setDeletingId(id)
    try {
      await api.delete(`/admin/categories/${id}`)
      showToast(t.deletedSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const flat: Category[] = []
  cats.forEach((c) => {
    flat.push(c)
    c.children?.forEach((s) => flat.push({ ...s, name: '— ' + s.name }))
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t.categoriesTitle}</h1>

      <div className="panel p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-300 uppercase mb-4">{t.newCategory}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <input placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp" />
          <input placeholder={t.slug} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="inp" />
          <input placeholder={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="inp" />
          <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="inp">
            <option value="">{t.parentTopLevel}</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={create} disabled={creating} className="btn-gold flex items-center justify-center gap-1 disabled:opacity-50">
            {creating ? <span className="spinner" /> : <Plus size={15} />} {creating ? t.adding : t.add}
          </button>
        </div>
        {/* Optional Ukrainian localization */}
        <div className="mt-3">
          <p className="text-[11px] text-gray-500 mb-2">{t.localizationOptional}</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder={t.nameUk} value={form.name_uk} onChange={(e) => setForm({ ...form, name_uk: e.target.value })} className="inp" />
            <input placeholder={t.descriptionUk} value={form.description_uk} onChange={(e) => setForm({ ...form, description_uk: e.target.value })} className="inp" />
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-white/10">
              <th className="py-2 pr-4">{t.name}</th>
              <th className="py-2 pr-4">{t.slug}</th>
              <th className="py-2 pr-4">{t.sortOrderLabel}</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {flat.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="py-2 pr-4">
                  <input defaultValue={c.name.replace('— ', '')} onBlur={(e) => update({ ...c, name: e.target.value })} className="inp w-full" />
                </td>
                <td className="py-2 pr-4 text-gray-400">{c.slug}</td>
                <td className="py-2 pr-4 w-20">
                  <input type="number" defaultValue={c.sort_order} onBlur={(e) => update({ ...c, sort_order: Number(e.target.value) })} className="inp w-16" />
                </td>
                <td className="py-2 pr-4 text-right">
                  <button onClick={() => del(c.id)} disabled={deletingId === c.id} className="text-red-400 hover:text-red-300 disabled:opacity-50">
                    {deletingId === c.id ? <span className="spinner" /> : <Trash2 size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`.inp{background:#1a1625;border:1px solid #ffffff15;border-radius:8px;padding:6px 10px;color:#fff;outline:none}.inp:focus{border-color:#f5d168}`}</style>
    </div>
  )
}
