'use client'
import { useState } from 'react'
import type { Perfil, Planta } from './AppLayoutClient'
import type { NotifItem } from '@/app/api/notificacoes/route'
import Link from 'next/link'

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

const PERFIL_LABELS: Record<string, string> = {
  SOLICITANTE:  'Solicitante',
  EXECUTANTE:   'Executante',
  APROVADOR:    'Aprovador',
  GESTOR_SMS:   'Gestor SMS',
  ADMINISTRADOR:'Admin',
}

const PERFIL_ICONS: Record<string, string> = {
  SOLICITANTE:  'person',
  EXECUTANTE:   'engineering',
  APROVADOR:    'task_alt',
  GESTOR_SMS:   'security',
  ADMINISTRADOR:'admin_panel_settings',
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

type OpenPanel = 'perfil' | 'planta' | null

export default function MobileHeader({
  perfil,
  perfisReais,
  planta,
  plantas,
  notifCount,
  onToggleNotif,
  onSwitchPerfil,
  onSwitchPlanta,
}: Props) {
  const [open, setOpen] = useState<OpenPanel>(null)

  const plantaAtual = plantas.find(p => p.id === planta)
  const hasMultiplePerfis = perfisReais.length > 1
  const hasMultiplePlantas = plantas.length > 1

  function toggle(panel: OpenPanel) {
    setOpen(prev => (prev === panel ? null : panel))
  }

  function handleSwitchPerfil(p: string) {
    setOpen(null)
    onSwitchPerfil(p)
  }

  function handleSwitchPlanta(id: string) {
    setOpen(null)
    onSwitchPlanta(id)
  }

  return (
    <div className="md:hidden sticky top-0 z-40">
      {/* Top bar */}
      <div
        className="flex items-center gap-2 px-3"
        style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          height: '52px',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-1">
          <div
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: '#0038A8', borderRadius: '5px' }}
          >
            S
          </div>
          <span className="text-sm font-bold" style={{ color: '#0F172A' }}>SGI</span>
        </div>

        <div className="flex-1" />

        {/* Perfil chip */}
        <button
          onClick={() => toggle('perfil')}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors"
          style={{
            background: open === 'perfil' ? '#EBF0FB' : '#F1F5F9',
            color: open === 'perfil' ? '#0038A8' : '#374151',
            border: '1px solid',
            borderColor: open === 'perfil' ? '#0038A8' : '#E2E8F0',
          }}
        >
          <Icon name={PERFIL_ICONS[perfil] ?? 'person'} size={14} />
          <span>{PERFIL_LABELS[perfil] ?? perfil}</span>
          {hasMultiplePerfis && <Icon name="expand_more" size={13} />}
        </button>

        {/* Planta chip */}
        {plantaAtual && (
          <button
            onClick={() => hasMultiplePlantas ? toggle('planta') : undefined}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors"
            style={{
              background: open === 'planta' ? '#EBF0FB' : '#F1F5F9',
              color: open === 'planta' ? '#0038A8' : '#374151',
              border: '1px solid',
              borderColor: open === 'planta' ? '#0038A8' : '#E2E8F0',
              cursor: hasMultiplePlantas ? 'pointer' : 'default',
            }}
          >
            <Icon name="factory" size={14} />
            <span className="max-w-[70px] truncate">{plantaAtual.nome}</span>
            {hasMultiplePlantas && <Icon name="expand_more" size={13} />}
          </button>
        )}

        {/* Notification bell — abre o drawer global */}
        <button
          onClick={() => { setOpen(null); onToggleNotif() }}
          className="relative w-8 h-8 flex items-center justify-center"
          style={{ color: notifCount > 0 ? '#0038A8' : '#64748B' }}
          aria-label="Notificações"
        >
          <Icon name="notifications" size={20} />
          {notifCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-white font-bold"
              style={{
                background: '#EF4444',
                borderRadius: '999px',
                minWidth: '16px',
                height: '16px',
                fontSize: '10px',
                lineHeight: 1,
                padding: '0 3px',
              }}
            >
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown panels */}
      {open === 'perfil' && hasMultiplePerfis && (
        <div
          className="w-full shadow-lg"
          style={{ background: 'white', borderBottom: '1px solid #E2E8F0' }}
        >
          <div className="px-4 py-2 border-b" style={{ borderColor: '#F1F5F9' }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
              Trocar perfil
            </span>
          </div>
          {perfisReais.map(p => (
            <button
              key={p.perfil}
              onClick={() => handleSwitchPerfil(p.perfil)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors"
              style={{
                background: perfil === p.perfil ? '#EBF0FB' : 'white',
                color: perfil === p.perfil ? '#0038A8' : '#374151',
                fontWeight: perfil === p.perfil ? 600 : 400,
                borderBottom: '1px solid #F8FAFC',
              }}
            >
              <Icon name={PERFIL_ICONS[p.perfil] ?? 'person'} size={18} />
              <span className="flex-1">{PERFIL_LABELS[p.perfil] ?? p.perfil}</span>
              {perfil === p.perfil && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
      )}

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
