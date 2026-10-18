import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { DollarSign, ShoppingBag, Clock, Crown, RefreshCw } from 'lucide-react'
import { api, formatMoney, errorMessage } from '../../api'
import { useStore } from '../../store'
import { useI18n } from '../../i18n'

interface Overview {
  revenue_today: number
  revenue_month: number
  revenue_all: number
  total_orders: number
  active_temp: number
  top_donor: { username: string; total_cents: number }
  recent_payments: any[]
}

const statusColors: Record<string, string> = {
  PAID: 'bg-blue-500/20 text-blue-300',
  DELIVERED: 'bg-green-500/20 text-green-300',
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  EXPIRED: 'bg-gray-500/20 text-gray-300',
  REFUNDED: 'bg-red-500/20 text-red-300',
  FAILED: 'bg-red-500/20 text-red-300',
}

export default function OverviewPage() {
  const { showToast } = useStore()
  const { t } = useI18n()
  const [data, setData] = useState<Overview | null>(null)
  const [series, setSeries] = useState<{ date: string; cents: number }[]>([])
  const [rerunning, setRerunning] = useState<string | null>(null)

  const load = () => {
    api.get('/admin/overview').then((r) => setData(r.data))
    api.get('/admin/revenue').then((r) => setSeries(r.data || []))
  }
  useEffect(load, [])

  const rerun = async (publicId: string) => {
    setRerunning(publicId)
    try {
      await api.post(`/admin/orders/${publicId}/rerun`)
      showToast(t.savedSuccessfully, 'success')
      load()
    } catch (e: any) {
      showToast(errorMessage(e, t.saveFailed), 'error')
    } finally {
      setRerunning(null)
    }
  }

  if (!data) return <div className="text-gray-500">{t.loading}</div>

  const kpis = [
    { label: t.revenueToday, value: formatMoney(data.revenue_today), icon: DollarSign },
    { label: t.revenueMonth, value: formatMoney(data.revenue_month), icon: DollarSign },
    { label: t.revenueAll, value: formatMoney(data.revenue_all), icon: DollarSign },
    { label: t.totalOrders, value: String(data.total_orders), icon: ShoppingBag },
    { label: t.activeTempRanks, value: String(data.active_temp), icon: Clock },
    {
      label: t.topDonor,
      value: data.top_donor.username || '—',
      sub: data.top_donor.username ? formatMoney(data.top_donor.total_cents) : '',
      icon: Crown,
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t.overview}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">{k.label}</span>
              <k.icon size={16} className="text-gold" />
            </div>
            <div className="text-2xl font-bold text-white">{k.value}</div>
            {k.sub && <div className="text-xs text-greenpill mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="panel p-5 mb-8">
        <h2 className="text-sm font-bold text-gray-300 uppercase mb-4">{t.revenue30d}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={series.map((s) => ({ ...s, usd: s.cents / 100 }))}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d168" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f5d168" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#262135', border: '1px solid #ffffff20', borderRadius: 8 }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="usd" stroke="#f5d168" fill="url(#g)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent payments */}
      <div className="panel p-5">
        <h2 className="text-sm font-bold text-gray-300 uppercase mb-4">{t.recentPayments}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-white/10">
                <th className="py-2 pr-4">{t.order}</th>
                <th className="py-2 pr-4">{t.player}</th>
                <th className="py-2 pr-4">{t.total}</th>
                <th className="py-2 pr-4">{t.status}</th>
                <th className="py-2 pr-4">{t.gateway}</th>
                <th className="py-2 pr-4">{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_payments.map((o) => (
                <tr key={o.id} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-mono text-xs text-gray-400">{o.public_id?.slice(0, 8)}</td>
                  <td className="py-2 pr-4 text-white">{o.minecraft_username}</td>
                  <td className="py-2 pr-4">{formatMoney(o.total_cents, o.currency)}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-pill text-[11px] font-bold ${statusColors[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-400">{o.gateway}</td>
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => rerun(o.public_id)}
                      disabled={rerunning === o.public_id}
                      className="flex items-center gap-1 text-gold hover:underline text-xs disabled:opacity-50"
                    >
                      {rerunning === o.public_id ? <span className="spinner" /> : <RefreshCw size={12} />} {t.rerun}
                    </button>
                  </td>
                </tr>
              ))}
              {data.recent_payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    {t.noPayments}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
