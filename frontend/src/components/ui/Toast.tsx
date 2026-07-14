import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Info, Circle as XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-accent-500" />,
  error: <XCircle className="w-5 h-5 text-error-500" />,
  info: <Info className="w-5 h-5 text-primary-500" />,
  warning: <AlertCircle className="w-5 h-5 text-warning-500" />,
}

const bgColors = {
  success: 'border-accent-100',
  error: 'border-error-100',
  info: 'border-primary-100',
  warning: 'border-warning-100',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 bg-white border ${bgColors[t.type]} shadow-soft-lg rounded-xl p-3.5 animate-slide-up pointer-events-auto`}
          >
            <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
            <p className="flex-1 text-sm text-neutral-700 font-medium">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
