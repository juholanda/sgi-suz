'use client'
import { useState, useEffect, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

// Global toast state
let addToastFn: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  if (addToastFn) addToastFn({ type, message })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const add = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...msg, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  useEffect(() => {
    addToastFn = add
    return () => { addToastFn = null }
  }, [add])

  const icons: Record<ToastType, string> = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  }
  const colors: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', icon: '#16A34A' },
    error:   { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', icon: '#DC2626' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon: '#D97706' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', icon: '#2563EB' },
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2" style={{ maxWidth: 360 }}>
      {toasts.map(t => {
        const c = colors[t.type]
        return (
          <div
            key={t.id}
            className="flex items-start gap-3 px-4 py-3 shadow-lg"
            style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', color: c.text }}
          >
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18, lineHeight: 1, color: c.icon, marginTop: 1 }}>
              {icons[t.type]}
            </span>
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
