import React, { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastState {
  toasts: ToastItem[]
  pushToast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  dismiss: (id: number) => void
}

const ToastCtx = createContext<ToastState | null>(null)

let counter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++counter
      setToasts((prev) => [...prev, { id, message, type }])
      const ttl = type === 'error' ? 5000 : 3000
      setTimeout(() => dismiss(id), ttl)
    },
    [dismiss]
  )

  const success = useCallback((m: string) => pushToast(m, 'success'), [pushToast])
  const error = useCallback((m: string) => pushToast(m, 'error'), [pushToast])
  const info = useCallback((m: string) => pushToast(m, 'info'), [pushToast])

  return (
    <ToastCtx.Provider value={{ toasts, pushToast, success, error, info, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const accent: Record<ToastType, { bar: string; icon: JSX.Element }> = {
  success: { bar: '#2ecc71', icon: <CheckCircle2 size={18} className="text-[#2ecc71]" /> },
  error: { bar: '#ef4444', icon: <XCircle size={18} className="text-[#ef4444]" /> },
  info: { bar: '#f5d168', icon: <Info size={18} className="text-[#f5d168]" /> },
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-[min(92vw,360px)]">
      {toasts.map((t) => {
        const a = accent[t.type]
        return (
          <div
            key={t.id}
            className="toast-item flex items-start gap-3 bg-[#262135] border border-white/10 rounded-xl shadow-2xl pl-0 pr-3 py-3 overflow-hidden"
            style={{ borderLeft: `4px solid ${a.bar}` }}
            role="alert"
          >
            <div className="pl-3 pt-0.5">{a.icon}</div>
            <div className="flex-1 text-sm text-gray-100 leading-snug pt-0.5 break-words">{t.message}</div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-gray-500 hover:text-white shrink-0"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
      <style>{`
        .toast-item {
          animation: toastIn 0.28s cubic-bezier(0.21, 1.02, 0.73, 1);
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
