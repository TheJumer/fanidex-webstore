import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { api } from '../../api'

export default function AdminLogin() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [needTotp, setNeedTotp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/admin/login', { email, password, totp_code: totp })
      nav('/admin')
    } catch (err: any) {
      const msg = err.response?.data?.error
      if (msg === 'totp_required') {
        setNeedTotp(true)
        setError('Enter your 2FA code to continue.')
      } else {
        setError(msg || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="panel p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-gold" />
          <h1 className="text-xl font-bold text-white">Admin Login</h1>
        </div>

        <label className="block text-xs text-gray-400 mb-1">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="w-full bg-bg border border-white/10 rounded-lg px-3 py-2 mb-4 text-white outline-none focus:border-gold"
        />

        <label className="block text-xs text-gray-400 mb-1">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="w-full bg-bg border border-white/10 rounded-lg px-3 py-2 mb-4 text-white outline-none focus:border-gold"
        />

        {needTotp && (
          <>
            <label className="block text-xs text-gray-400 mb-1">2FA Code</label>
            <input
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              inputMode="numeric"
              placeholder="000000"
              className="w-full bg-bg border border-white/10 rounded-lg px-3 py-2 mb-4 text-white outline-none focus:border-gold tracking-widest"
            />
          </>
        )}

        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        <button disabled={loading} className="btn-gold w-full">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
