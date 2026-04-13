'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import type { NotifItem } from '@/app/api/notificacoes/route'

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  notifCount: number
  notifItems: NotifItem[]
}

export default function NotificacaoDrawer({ open, onClose, notifCount, notifItems }: Props) {
  // Fechar com Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Travar scroll do body quando aberto em mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 220ms ease',
        }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label="Notificações"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          /* Desktop: 360px, Mobile: 100vw */
          width: 'min(100vw, 360px)',
          background: '#FFFFFF',
          borderLeft: '1px solid #E2E8F0',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              background: '#EBF0FB',
              borderRadius: 8,
              color: '#0038A8',
            }}>
              <Icon name="notifications" size={18} />
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Notificações</span>
            {notifCount > 0 && (
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#0038A8',
                background: '#EBF0FB',
                padding: '2px 7px',
                borderRadius: 20,
              }}>
                {notifCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar notificações"
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              gap: 12,
              color: '#94A3B8',
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                background: '#F8FAFC',
                borderRadius: 16,
              }}>
                <Icon name="notifications_off" size={28} />
              </span>
              <p style={{ fontSize: 14, color: '#64748B', textAlign: 'center' }}>
                Nenhuma notificação pendente
              </p>
              <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
                Você será notificado quando houver novas atividades.
              </p>
            </div>
          ) : (
            notifItems.map(item => (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '14px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  textDecoration: 'none',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Icon badge */}
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: item.urgente ? '#FEE2E2' : '#EBF0FB',
                    color: item.urgente ? '#DC2626' : '#0038A8',
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    <Icon name={item.urgente ? 'priority_high' : 'info'} size={18} />
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: item.urgente ? '#DC2626' : '#0F172A',
                      marginBottom: 3,
                      lineHeight: 1.4,
                    }}>
                      {item.titulo}
                    </p>
                    <p style={{
                      fontSize: 12,
                      color: '#64748B',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.descricao}
                    </p>
                  </div>

                  <Icon name="chevron_right" size={16} />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #E2E8F0',
          flexShrink: 0,
        }}>
          <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
            Apenas notificações do seu perfil ativo são exibidas
          </p>
        </div>
      </div>
    </>
  )
}
