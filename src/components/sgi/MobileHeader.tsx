'use client'
import { useState } from 'react'
import type { Perfil, Planta } from './AppLayoutClient'

interface Props {
  user: { name?: string | null; email?: string | null }
  perfil: string
  perfisReais: Perfil[]
  planta: string
  plantas: Planta[]
  notifCount: number
  onToggleNotif: () => void
  onSwitchPerfil: (perfil: string) => void
  onSwitchPlanta: (plantaId: string) => void
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

type OpenPanel = 'planta' | null

export default function MobileHeader({
  planta,
  plantas,
  notifCount,
  onToggleNotif,
  onSwitchPlanta,
}: Props) {
  const [open, setOpen] = useState<OpenPanel>(null)

  const plantaAtual = plantas.find(p => p.id === planta)
  const hasMultiplePlantas = plantas.length > 1

  function toggle(panel: OpenPanel) {
    setOpen(prev => (prev === panel ? null : panel))
  }

  function handleSwitchPlanta(id: string) {
    setOpen(null)
    onSwitchPlanta(id)
  }

  return (
    <div className="md:hidden sticky top-0 z-40">
      {/* Top bar — duas linhas: (logo + notificações) e (unidade selecionada) */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          paddingTop: 14,
          paddingBottom: 14,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        {/* Linha 1: Logo + título à esquerda, sino à direita */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center justify-center text-white font-bold shrink-0"
              style={{ width: 40, height: 40, background: '#0038A8', borderRadius: '10px', fontSize: 18 }}
              aria-label="SGI"
            >
              S
            </div>
            <div className="min-w-0">
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', lineHeight: 1.15 }}>
                SGI
              </div>
              <div
                className="truncate"
                style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.25, marginTop: 2 }}
              >
                Sistema de Gestão de Intertravamentos
              </div>
            </div>
          </div>

          <button
            onClick={() => { setOpen(null); onToggleNotif() }}
            className="relative flex items-center justify-center"
            style={{ width: 44, height: 44, marginRight: -10, color: notifCount > 0 ? '#0038A8' : '#475569' }}
            aria-label="Notificações"
          >
            <Icon name="notifications" size={24} />
            {notifCount > 0 && (
              <span
                className="absolute flex items-center justify-center text-white font-bold"
                style={{
                  top: 6,
                  right: 6,
                  background: '#EF4444',
                  borderRadius: '999px',
                  minWidth: 18,
                  height: 18,
                  fontSize: 11,
                  lineHeight: 1,
                  padding: '0 4px',
                  border: '2px solid white',
                }}
              >
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>
        </div>

        {/* Linha 2: Unidade selecionada (abaixo, alinhada à esquerda) */}
        {plantaAtual && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => hasMultiplePlantas ? toggle('planta') : undefined}
              className="inline-flex items-center gap-1.5"
              style={{
                cursor: hasMultiplePlantas ? 'pointer' : 'default',
                color: '#475569',
              }}
            >
              <Icon name="factory" size={16} />
              <span className="truncate" style={{ fontSize: 14, fontWeight: 500, maxWidth: 240 }}>
                {plantaAtual.nome}
              </span>
              {hasMultiplePlantas && <Icon name="expand_more" size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* Dropdown panels */}
      {open === 'planta' && hasMultiplePlantas && (
        <div
          className="w-full shadow-lg"
          style={{ background: 'white', borderBottom: '1px solid #E2E8F0' }}
        >
          <div className="px-4 py-2 border-b" style={{ borderColor: '#F1F5F9' }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
              Trocar planta
            </span>
          </div>
          {plantas.map(p => (
            <button
              key={p.id}
              onClick={() => handleSwitchPlanta(p.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors"
              style={{
                background: planta === p.id ? '#EBF0FB' : 'white',
                color: planta === p.id ? '#0038A8' : '#374151',
                fontWeight: planta === p.id ? 600 : 400,
                borderBottom: '1px solid #F8FAFC',
              }}
            >
              <Icon name="factory" size={18} />
              <span className="flex-1">{p.nome}</span>
              {planta === p.id && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close panels */}
      {open !== null && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setOpen(null)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
