import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import { api, errorMessage } from '../../api'
import { useStore } from '../../store'
import { useI18n } from '../../i18n'
import { Category, Product, DurationVariant } from '../../types'

type Draft = Partial<Product> & {
  purchase_cmds?: string[]
  expiry_cmds?: string[]
}

export default function Products() {
  const { showToast } = useStore()
  const { t } = useI18n()
  const [products, setProducts] = useState<Product[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [editing, setEditing] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = () => api.get('/admin/products').then((r) => setProducts(r.data || []))
  useEffect(() => {
    load()
    api.get('/admin/categories').then((r) => {
      const flat: Category[] = []
      ;(r.data || []).forEach((c: Category) => {
        flat.push(c)
        c.children?.forEach((s) => flat.push(s))
      })
      setCats(flat)
    })
  }, [])

  const openNew = () =>
    setEditing({
      name: '',
      slug: '',
      description: '',
      name_uk: '',
      description_uk: '',
      image_url: '',
      base_price_cents: 100,
      has_variants: false,
      active: true,
      category_id: cats[0]?.id,
      purchase_cmds: [''],
      expiry_cmds: [''],
      variants: [],
    })

  const openEdit = async (p: Product) => {
    const r = await api.get(`/admin/products/${p.id}`)
    const full: Product = r.data
    setEditing({
      ...full,
      purchase_cmds: parseCmds((full as any).purchase_commands),
      expiry_cmds: parseCmds((full as any).expiry_commands),
      variants: full.variants || [],
    })
  }

  const del = async (id: number) => {
    if (!confirm(t.confirmDelete)) return
    setDeletingId(id)
    try {
      await api.delete(`/admin/products/${id}`)
      showToast(t.deletedSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const payload: any = {
      ...editing,
      purchase_commands: JSON.stringify((editing.purchase_cmds || []).filter((c) => c.trim())),
      expiry_commands: JSON.stringify((editing.expiry_cmds || []).filter((c) => c.trim())),
      base_price_cents: Number(editing.base_price_cents) || 0,
    }
    delete payload.purchase_cmds
    delete payload.expiry_cmds
    try {
      if (editing.id) {
        await api.put(`/admin/products/${editing.id}`, payload)
        showToast(t.updatedSuccessfully, 'success')
      } else {
        await api.post('/admin/products', payload)
        showToast(t.createdSuccessfully, 'success')
      }
      setEditing(null)
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t.productsTitle}</h1>
        <button onClick={openNew} className="btn-gold flex items-center gap-1"><Plus size={16} /> {t.newProduct}</button>
      </div>

      <div className="panel p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-white/10">
              <th className="py-2 pr-4">{t.name}</th>
              <th className="py-2 pr-4">{t.type}</th>
              <th className="py-2 pr-4">{t.price}</th>
              <th className="py-2 pr-4">{t.active}</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="py-2 pr-4 text-white font-semibold">{p.name}</td>
                <td className="py-2 pr-4 text-gray-400">{p.has_variants ? t.temporary : t.permanent}</td>
                <td className="py-2 pr-4">{p.has_variants ? t.seeVariants : `$${(p.base_price_cents / 100).toFixed(2)}`}</td>
                <td className="py-2 pr-4">{p.active ? '✅' : '—'}</td>
                <td className="py-2 pr-4 text-right space-x-3">
                  <button onClick={() => openEdit(p)} className="text-gold"><Pencil size={15} /></button>
                  <button onClick={() => del(p.id)} disabled={deletingId === p.id} className="text-red-400 disabled:opacity-50">
                    {deletingId === p.id ? <span className="spinner" /> : <Trash2 size={15} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductEditor
          draft={editing}
          cats={cats}
          saving={saving}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      <style>{`.inp{background:#1a1625;border:1px solid #ffffff15;border-radius:8px;padding:6px 10px;color:#fff;outline:none;width:100%}.inp:focus{border-color:#f5d168}`}</style>
    </div>
  )
}

function parseCmds(s?: string): string[] {
  try {
    const arr = JSON.parse(s || '[]')
    return Array.isArray(arr) && arr.length ? arr : ['']
  } catch {
    return ['']
  }
}

function ProductEditor({
  draft,
  cats,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  draft: Draft
  cats: Category[]
  saving: boolean
  onChange: (d: Draft) => void
  onClose: () => void
  onSave: () => void
}) {
  const { t } = useI18n()
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch })

  const setCmd = (field: 'purchase_cmds' | 'expiry_cmds', i: number, val: string) => {
    const arr = [...(draft[field] || [])]
    arr[i] = val
    set({ [field]: arr } as any)
  }
  const addCmd = (field: 'purchase_cmds' | 'expiry_cmds') =>
    set({ [field]: [...(draft[field] || []), ''] } as any)
  const removeCmd = (field: 'purchase_cmds' | 'expiry_cmds', i: number) =>
    set({ [field]: (draft[field] || []).filter((_, idx) => idx !== i) } as any)

  const setVariant = (i: number, patch: Partial<DurationVariant>) => {
    const arr = [...(draft.variants || [])]
    arr[i] = { ...arr[i], ...patch }
    set({ variants: arr })
  }
  const addVariant = () =>
    set({
      variants: [
        ...(draft.variants || []),
        { id: 0, product_id: draft.id || 0, label: '', duration_days: 0, price_cents: 100, sale_price_cents: null, sort_order: (draft.variants?.length || 0) + 1 },
      ],
    })
  const removeVariant = (i: number) => set({ variants: (draft.variants || []).filter((_, idx) => idx !== i) })

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-xl font-bold text-white mb-4">{draft.id ? t.edit : t.create} {t.editProduct}</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label={t.name}><input className="inp" value={draft.name || ''} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label={t.slug}><input className="inp" value={draft.slug || ''} onChange={(e) => set({ slug: e.target.value })} /></Field>
          <Field label={t.category}>
            <select className="inp" value={draft.category_id} onChange={(e) => set({ category_id: Number(e.target.value) })}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label={t.imageUrl}><input className="inp" value={draft.image_url || ''} onChange={(e) => set({ image_url: e.target.value })} /></Field>
        </div>

        <Field label={t.descriptionMd}>
          <textarea className="inp h-24" value={draft.description || ''} onChange={(e) => set({ description: e.target.value })} />
        </Field>

        {/* Ukrainian localization */}
        <div className="mt-3 mb-4">
          <p className="text-[11px] text-gray-500 mb-2">{t.localizationOptional}</p>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <Field label={t.nameUk}><input className="inp" value={draft.name_uk || ''} onChange={(e) => set({ name_uk: e.target.value })} /></Field>
          </div>
          <Field label={t.descriptionUk}>
            <textarea className="inp h-20" value={draft.description_uk || ''} onChange={(e) => set({ description_uk: e.target.value })} />
          </Field>
        </div>

        <label className="flex items-center gap-2 my-4 text-sm text-gray-300">
          <input type="checkbox" checked={!!draft.has_variants} onChange={(e) => set({ has_variants: e.target.checked })} />
          {t.tempWithVariants}
        </label>

        {!draft.has_variants ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label={t.basePriceCents}><input type="number" className="inp" value={draft.base_price_cents || 0} onChange={(e) => set({ base_price_cents: Number(e.target.value) })} /></Field>
            <Field label={t.salePriceCents}><input type="number" className="inp" value={draft.sale_price_cents ?? ''} onChange={(e) => set({ sale_price_cents: e.target.value ? Number(e.target.value) : null })} /></Field>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">{t.durationVariants}</span>
              <button onClick={addVariant} className="text-gold text-xs flex items-center gap-1"><Plus size={13} /> {t.addVariant}</button>
            </div>
            {(draft.variants || []).map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <input placeholder={t.label} className="inp col-span-4" value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} />
                <input type="number" placeholder={t.daysForever} className="inp col-span-3" value={v.duration_days} onChange={(e) => setVariant(i, { duration_days: Number(e.target.value) })} />
                <input type="number" placeholder={t.priceCents} className="inp col-span-4" value={v.price_cents} onChange={(e) => setVariant(i, { price_cents: Number(e.target.value) })} />
                <button onClick={() => removeVariant(i)} className="text-red-400 col-span-1"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Command builder */}
        <CommandBuilder label={t.cmdsOnPurchase} cmds={draft.purchase_cmds || []} onSet={(i, v) => setCmd('purchase_cmds', i, v)} onAdd={() => addCmd('purchase_cmds')} onRemove={(i) => removeCmd('purchase_cmds', i)} />
        {draft.has_variants && (
          <CommandBuilder label={t.cmdsOnExpiry} cmds={draft.expiry_cmds || []} onSet={(i, v) => setCmd('expiry_cmds', i, v)} onAdd={() => addCmd('expiry_cmds')} onRemove={(i) => removeCmd('expiry_cmds', i)} />
        )}

        <p className="text-[11px] text-gray-500 my-3">
          {t.placeholders} <code className="text-gold">{'{player}'}</code> <code className="text-gold">{'{transaction_id}'}</code>{' '}
          <code className="text-gold">{'{package_name}'}</code> <code className="text-gold">{'{duration}'}</code>
        </p>

        <div className="flex gap-3 mt-4">
          <button onClick={onSave} disabled={saving} className="btn-gold flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving && <span className="spinner" />} {saving ? t.saving : t.saveProduct}
          </button>
          <button onClick={onClose} className="btn-outline-gold">{t.cancel}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-400 mb-1">{label}</span>
      {children}
    </label>
  )
}

function CommandBuilder({
  label,
  cmds,
  onSet,
  onAdd,
  onRemove,
}: {
  label: string
  cmds: string[]
  onSet: (i: number, v: string) => void
  onAdd: () => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase">{label}</span>
        <button onClick={onAdd} className="text-gold text-xs flex items-center gap-1"><Plus size={13} /> Add command</button>
      </div>
      {cmds.map((c, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input className="inp font-mono text-xs" value={c} onChange={(e) => onSet(i, e.target.value)} placeholder="lp user {player} parent add vip" />
          <button onClick={() => onRemove(i)} className="text-red-400"><Trash2 size={15} /></button>
        </div>
      ))}
    </div>
  )
}
