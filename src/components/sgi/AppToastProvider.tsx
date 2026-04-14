'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info'

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastState = ToastInput & { id: number }

type ToastContextType = {
  showToast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const showToast = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    const toast: ToastState = {
      id,
      variant: input.variant ?? 'success',
      title: input.title,
      description: input.description,
    }
    setToasts(prev => [toast, ...prev].slice(0, 3))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map(toast => {
          const colors =
            toast.variant === 'success'
              ? { bg: '#DCFCE7', border: '#86EFAC', title: '#166534', body: '#166534' }
              : toast.variant === 'error'
              ? { bg: '#FEE2E2', border: '#FCA5A5', title: '#991B1B', body: '#991B1B' }
              : { bg: '#DBEAFE', border: '#93C5FD', title: '#1D4ED8', body: '#1E40AF' }
          return (
            <div
              key={toast.id}
              className="w-full max-w-md border px-4 py-3 shadow-sm"
              style={{
                borderRadius: '8px',
                background: colors.bg,
                borderColor: colors.border,
              }}
            >
              <p className="text-sm font-semibold" style={{ color: colors.title }}>
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-0.5 text-xs" style={{ color: colors.body }}>
                  {toast.description}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useAppToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useAppToast must be used within AppToastProvider')
  }
  return context
}
