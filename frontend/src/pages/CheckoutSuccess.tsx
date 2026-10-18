import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useI18n } from '../i18n'

export default function CheckoutSuccess() {
  const [params] = useSearchParams()
  const order = params.get('order')
  const { t } = useI18n()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="panel p-10 max-w-md text-center">
        <CheckCircle size={56} className="text-greenpill mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">{t.paymentSuccess}</h1>
        <p className="text-gray-400 mb-4">
          {t.paymentSuccessDesc}
        </p>
        {order && (
          <div className="text-xs text-gray-500 mb-6">
            {t.orderReference} <span className="text-gold font-mono">{order}</span>
          </div>
        )}
        <Link to="/" className="btn-gold inline-block">
          {t.backToStore}
        </Link>
      </div>
    </div>
  )
}
