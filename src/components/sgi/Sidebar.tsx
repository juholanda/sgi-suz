'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import type { Perfil, Planta } from './AppLayoutClient'
import type { NotifItem } from '@/app/api/notificacoes/route'

interface NavItem {
  href: string
  label: string
  icon: string
}

const commonItems: NavItem[] = [
  { href: '/dashboard',    label: 'Início',       icon: 'home' },
  { href: '/solicitacoes', label: 'Solicitações', icon: 'description' },
]

const aprovadorItems: NavItem[] = [
  { href: '/aprovacoes',   label: 'Aprovações',   icon: 'task_alt' },
]

const solicitanteItems: NavItem[] = [
  { href: '/execucao',     label: 'Execução',     icon: 'engineering' },
]

const bottomItems: NavItem[] = [
  { href: '/relatorios',   label: 'Relatórios',   icon: 'bar_chart' },
  { href: '/perfil',       label: 'Perfil',       icon: 'manage_accounts' },
]

const PERFIL_LABELS: Record<string, string> = {
  SOLICITANTE:  'Solicitante',
  EXECUTANTE:   'Executante',
  APROVADOR:    'Aprovador',
  GESTOR_SMS:   'Gestor SMS',
  ADMINISTRADOR:'Administrador',
}

const PERFIL_ICONS: Record<string, string> = {
  SOLICITANTE:  'person',
  EXECUTANTE:   'engineering',
  APROVADOR:    'task_alt',
  GESTOR_SMS:   'security',
  ADMINISTRADOR:'admin_panel_settings',
}

interface Props {
  user: { name?: string | null; email?: string | null }
  perfil: string
  perfisReais: Perfil[]
  planta: string
  plantas: Planta[]
  isAprovador?: boolean
  isSolicitante?: boolean
  notifCount: number
  notifItems: NotifItem[]
  showNotif: boolean
  onToggleNotif: () => void
  onSwitchPerfil: (perfil: string) => void
  onSwitchPlanta: (plantaId: string) => void
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, width: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

export default function Sidebar({
  user,
  perfil,
  perfisReais,
  planta,
  plantas,
  isAprovador = false,
  isSolicitante = false,
  notifCount,
  notifItems,
  showNotif,
  onToggleNotif,
  onSwitchPerfil,
  onSwitchPlanta,
}: Props) {
  const pathname = usePathname()
  const [showPerfilDropdown, setShowPerfilDropdown] = useState(false)
  const [showPlantaDropdown, setShowPlantaDropdown] = useState(false)

  const navItems: NavItem[] = [
    ...commonItems,
    ...(isAprovador ? aprovadorItems : []),
    ...(isSolicitante ? solicitanteItems : []),
    ...bottomItems,
  ]

  const plantaAtual = plantas.find(p => p.id === planta)
  const hasMultiplePerfis = perfisReais.length > 1
  const hasMultiplePlantas = plantas.length > 1

  function handleSwitchPerfil(p: string) {
    setShowPerfilDropdown(false)
    onSwitchPerfil(p)
  }

  function handleSwitchPlanta(id: string) {
    setShowPlantaDropdown(false)
    onSwitchPlanta(id)
  }

  return (
    <aside
      className="w-60 flex flex-col shrink-0 h-full relative"
      style={{ background: '#FFFFFF', borderRight: '1px solid #E2E8F0' }}
    >
      {/* 1. Logo section + notification bell */}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: '#0038A8', borderRadius: '6px' }}
          >
            S
          </div>
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: '#0F172A' }}>SGI</div>
            <div className="text-xs leading-tight" style={{ color: '#64748B' }}>Suzano</div>
          </div>
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={onToggleNotif}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
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

          {/* Notification dropdown panel */}
          {showNotif && (
            <div
              className="absolute left-0 top-10 z-50 w-80 shadow-xl overflow-hidden"
              style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                maxHeight: '400px',
                overflowY: 'auto',
                left: 'auto',
                right: 0,
              }}
            >
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: '#E2E8F0' }}
              >
                <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                  Notificações
                </span>
                {notifCount > 0 && (
                  <span
                    className="text-xs font-medium px-1.5 py-0.5"
                    style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}
                  >
                    {notifCount}
                  </span>
                )}
              </div>

              {notifItems.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Icon name="notifications_off" size={24} />
                  <p className="mt-2 text-sm" style={{ color: '#64748B' }}>Nenhuma notificação</p>
                </div>
              ) : (
                notifItems.map(item => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onToggleNotif}
                    className="block px-4 py-3 border-b transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <div className="flex items-start gap-2">
                      {item.urgente && (
                        <span className="shrink-0 mt-0.5">
                          <Icon name="priority_high" size={16} />
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: item.urgente ? '#DC2626' : '#0F172A' }}
                        >
                          {item.titulo}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#64748B' }}>
                          {item.descricao}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. User card */}
      <div className="px-4 py-3 border-b" style={{ borderColor: '#E2E8F0' }}>
        {/* Avatar + name + perfil badge */}
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '50%' }}
          >
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#0F172A' }}>
              {user.name}
            </div>
            {/* Perfil badge / switcher */}
            {hasMultiplePerfis ? (
              <button
                onClick={() => { setShowPerfilDropdown(s => !s); setShowPlantaDropdown(false) }}
                className="flex items-center gap-1 mt-0.5"
                style={{ color: '#0038A8' }}
              >
                <span
                  className="text-xs font-medium px-1.5 py-0.5"
                  style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}
                >
                  {PERFIL_LABELS[perfil] ?? perfil}
                </span>
                <Icon name={showPerfilDropdown ? 'expand_less' : 'expand_more'} size={14} />
              </button>
            ) : (
              <span
                className="inline-block text-xs font-medium mt-0.5 px-1.5 py-0.5"
                style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}
              >
                {PERFIL_LABELS[perfil] ?? perfil}
              </span>
            )}
          </div>
        </div>

        {/* Perfil dropdown */}
        {showPerfilDropdown && hasMultiplePerfis && (
          <div
            className="mb-2 overflow-hidden"
            style={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}
          >
            {perfisReais.map(p => (
              <button
                key={p.perfil}
                onClick={() => handleSwitchPerfil(p.perfil)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                style={{
                  background: perfil === p.perfil ? '#EBF0FB' : 'white',
                  color: perfil === p.perfil ? '#0038A8' : '#374151',
                  fontWeight: perfil === p.perfil ? 600 : 400,
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                <Icon name={PERFIL_ICONS[p.perfil] ?? 'person'} size={16} />
                <span className="flex-1 truncate">{PERFIL_LABELS[p.perfil] ?? p.perfil}</span>
                {perfil === p.perfil && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
        )}

        {/* Plant selector — show only if more than 1 plant */}
        {hasMultiplePlantas ? (
          <div>
            <button
              onClick={() => { setShowPlantaDropdown(s => !s); setShowPerfilDropdown(false) }}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: '#64748B' }}
            >
              <Icon name="factory" size={14} />
              <span className="font-medium truncate max-w-[140px]">{plantaAtual?.nome ?? 'Selecionar planta'}</span>
              <Icon name={showPlantaDropdown ? 'expand_less' : 'expand_more'} size={13} />
            </button>

            {showPlantaDropdown && (
              <div
                className="mt-1.5 overflow-hidden"
                style={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}
              >
                {plantas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSwitchPlanta(p.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                    style={{
                      background: planta === p.id ? '#EBF0FB' : 'white',
                      color: planta === p.id ? '#0038A8' : '#374151',
                      fontWeight: planta === p.id ? 600 : 400,
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <Icon name="factory" size={15} />
                    <span className="flex-1 truncate">{p.nome}</span>
                    {planta === p.id && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : plantaAtual ? (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
            <Icon name="factory" size={14} />
            <span className="truncate max-w-[160px]">{plantaAtual.nome}</span>
          </div>
        ) : null}
      </div>

      {/* 3. Nav items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item${active ? ' active' : ''}`}
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* 4. Backoffice link */}
      <div className="px-3 pb-2 border-t pt-2" style={{ borderColor: '#E2E8F0' }}>
        <Link
          href="/admin"
          className={`sidebar-nav-item${pathname.startsWith('/admin') ? ' active' : ''}`}
          style={{ color: pathname.startsWith('/admin') ? undefined : 'var(--sidebar-text-muted)' }}
        >
          <Icon name="admin_panel_settings" size={20} />
          Backoffice
        </Link>
      </div>

      {/* 5. Logout button */}
      <div className="px-3 pb-4">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="sidebar-nav-item w-full text-left"
          style={{ color: '#64748B' }}
        >
          <Icon name="logout" size={20} />
          Sair
        </button>
      </div>
    </aside>
  )
}
