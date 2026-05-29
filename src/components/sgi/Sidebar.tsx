'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import type { Perfil, Planta } from './AppLayoutClient'

interface NavItem {
  href: string
  label: string
  icon: string
}

const commonItems: NavItem[] = [
  { href: '/dashboard',    label: 'Início',       icon: 'home' },
  { href: '/metricas',     label: 'Métricas',     icon: 'insights' },
]
const bottomItems: NavItem[] = [
  { href: '/perfil',       label: 'Perfil',       icon: 'manage_accounts' },
]

const PERFIL_LABELS: Record<string, string> = {
  SOLICITANTE:   'Solicitante',
  EXECUTANTE:    'Executante',
  APROVADOR:     'Aprovador',
  GESTOR_SMS:    'Gestor SMS',
  ADMINISTRADOR: 'Administrador',
}

/** Mescla SOLICITANTE+EXECUTANTE num único entry quando o user tem os dois perfis */
function buildDisplayPerfis(perfisReais: { perfil: string }[]): { perfil: string; label: string }[] {
  const hasSol  = perfisReais.some(p => p.perfil === 'SOLICITANTE')
  const hasExec = perfisReais.some(p => p.perfil === 'EXECUTANTE')
  return perfisReais
    .filter(p => !(hasSol && hasExec && p.perfil === 'SOLICITANTE')) // remove SOLICITANTE quando ambos existem
    .map(p => ({
      perfil: p.perfil,
      label: hasSol && hasExec && p.perfil === 'EXECUTANTE'
        ? 'Solicitante / Executante'
        : (PERFIL_LABELS[p.perfil] ?? p.perfil),
    }))
}

// Miniaturas por ID de planta (mesmo mapa de SelecionarPlantaClient)
const PLANTA_IMAGES: Record<string, string> = {
  'planta-aracruz':            'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=56&q=80&fit=crop&auto=format',
  'planta-limeira':            'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=56&q=80&fit=crop&auto=format',
  'planta-ribas':              'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=56&q=80&fit=crop&auto=format',
  'cmpodpc8x0000kz04no53j24d': 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=56&q=80&fit=crop&auto=format',
}

function getPlantaImg(id: string, nome: string): string | null {
  if (PLANTA_IMAGES[id]) return PLANTA_IMAGES[id]
  const l = nome.toLowerCase()
  if (l.includes('aracruz'))  return PLANTA_IMAGES['planta-aracruz']
  if (l.includes('limeira'))  return PLANTA_IMAGES['planta-limeira']
  if (l.includes('ribas'))    return PLANTA_IMAGES['planta-ribas']
  if (l.includes('fábrica b') || l.includes('fabrica b')) return PLANTA_IMAGES['cmpodpc8x0000kz04no53j24d']
  return null
}

const PERFIL_ICONS: Record<string, string> = {
  SOLICITANTE:   'person',
  EXECUTANTE:    'engineering',
  APROVADOR:     'task_alt',
  GESTOR_SMS:    'security',
  ADMINISTRADOR: 'admin_panel_settings',
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
  onToggleNotif: () => void
  onSwitchPerfil: (perfil: string) => void
  onSwitchPlanta: (plantaId: string) => void
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
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
  onToggleNotif,
  onSwitchPerfil,
  onSwitchPlanta,
}: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [showPlantaDropdown, setShowPlantaDropdown] = useState(false)

  // Persist collapse state
  useEffect(() => {
    const stored = localStorage.getItem('sgi_sidebar_collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sgi_sidebar_collapsed', String(next))
    // Close any open dropdowns
    setShowPlantaDropdown(false)
  }

  // Itens dinâmicos por perfil
  const hasPerfil = (p: string) => perfisReais.some(r => r.perfil === p)
  const roleItems: NavItem[] = []
  if (hasPerfil('SOLICITANTE') || hasPerfil('EXECUTANTE')) {
    roleItems.push({ href: '/solicitacoes', label: 'Solicitações', icon: 'description' })
  }
  if (hasPerfil('APROVADOR') || hasPerfil('GESTOR_SMS') || hasPerfil('ADMINISTRADOR')) {
    roleItems.push({ href: '/aprovacoes', label: 'Aprovações', icon: 'task_alt' })
  }
  if (hasPerfil('EXECUTANTE') || hasPerfil('GESTOR_SMS') || hasPerfil('ADMINISTRADOR')) {
    roleItems.push({ href: '/execucao', label: 'Execução', icon: 'build' })
  }

  const navItems: NavItem[] = [
    ...commonItems,
    ...roleItems,
    ...bottomItems,
  ]

  const plantaAtual = plantas.find(p => p.id === planta)
  const hasMultiplePlantas = plantas.length > 1

  // Monta o label de perfil(s) para exibir como subtítulo (read-only)
  const perfilDisplay = buildDisplayPerfis(perfisReais).map(p => p.label).join(' · ')

  const W = collapsed ? '68px' : '240px'

  // Publica largura do sidebar como CSS var global — usada por footers fixos
  // (ex: AcoesFooter) para respeitar o espaço ocupado em desktop.
  useEffect(() => {
    document.documentElement.style.setProperty('--sgi-sidebar-w', W)
  }, [W])

  return (
    <aside
      className="flex flex-col shrink-0 h-full relative"
      style={{
        width: W,
        minWidth: W,
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        transition: 'width 200ms ease, min-width 200ms ease',
        overflow: 'hidden',
      }}
    >
      {/* ── TOP: Logo + collapse button ─────────────────────────── */}
      {collapsed ? (
        /* Collapsed: logo and toggle stacked vertically, centered */
        <div className="flex flex-col items-center border-b shrink-0 py-3 gap-2" style={{ borderColor: '#E2E8F0' }}>
          <div
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#0038A8', borderRadius: '6px' }}
          >
            S
          </div>
          <button
            onClick={toggleCollapse}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#94A3B8' }}
            title="Expandir menu"
            aria-label="Expandir menu"
          >
            <Icon name="chevron_right" size={18} />
          </button>
        </div>
      ) : (
        /* Expanded: logo + text on left, toggle on right — single row */
        <div
          className="flex items-center justify-between border-b shrink-0"
          style={{ borderColor: '#E2E8F0', padding: '10px 12px', minHeight: '52px' }}
        >
          <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <div
              className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: '#0038A8', borderRadius: '6px' }}
            >
              S
            </div>
            <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#0F172A' }}>
              SGI Suzano
            </span>
          </div>
          <button
            onClick={toggleCollapse}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors shrink-0 ml-1"
            style={{ color: '#94A3B8' }}
            title="Recolher menu"
            aria-label="Recolher menu"
          >
            <Icon name="chevron_left" size={18} />
          </button>
        </div>
      )}

      {/* ── SWITCHER: Plant + perfil como subtítulo (hidden when collapsed) ─── */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b shrink-0" style={{ borderColor: '#E2E8F0' }}>
          <div className="relative">
            <button
              onClick={() => { setShowPlantaDropdown(s => !s) }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors text-left"
              style={{
                background: showPlantaDropdown ? '#EBF0FB' : '#F1F5F9',
                color: showPlantaDropdown ? '#0038A8' : '#374151',
                border: '1px solid',
                borderColor: showPlantaDropdown ? '#0038A8' : '#E2E8F0',
              }}
            >
              {/* Thumbnail da planta ou ícone fallback */}
              {plantaAtual && getPlantaImg(plantaAtual.id, plantaAtual.nome) ? (
                <img
                  src={getPlantaImg(plantaAtual.id, plantaAtual.nome)!}
                  alt={plantaAtual.nome}
                  style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <Icon name="factory" size={15} />
              )}

              {/* Planta + perfil empilhados */}
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold" style={{ fontSize: 12, lineHeight: '16px' }}>
                  {plantaAtual?.nome ?? 'Selecionar planta'}
                </div>
                {perfilDisplay && (
                  <div
                    className="truncate"
                    style={{
                      fontSize: 10,
                      lineHeight: '14px',
                      marginTop: 1,
                      fontWeight: 400,
                      color: showPlantaDropdown ? '#6B9ADB' : '#94A3B8',
                    }}
                  >
                    {perfilDisplay}
                  </div>
                )}
              </div>

              {hasMultiplePlantas && (
                <Icon name={showPlantaDropdown ? 'expand_less' : 'unfold_more'} size={16} />
              )}
            </button>

            {showPlantaDropdown && hasMultiplePlantas && (
              <div
                className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg overflow-hidden"
                style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px' }}
              >
                {plantas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setShowPlantaDropdown(false); onSwitchPlanta(p.id) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left"
                    style={{
                      background: planta === p.id ? '#EBF0FB' : 'white',
                      color: planta === p.id ? '#0038A8' : '#374151',
                      fontWeight: planta === p.id ? 600 : 400,
                      borderBottom: '1px solid #F8FAFC',
                    }}
                  >
                    {getPlantaImg(p.id, p.nome) ? (
                      <img
                        src={getPlantaImg(p.id, p.nome)!}
                        alt={p.nome}
                        style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <Icon name="factory" size={15} />
                    )}
                    <span className="flex-1 truncate">{p.nome}</span>
                    {planta === p.id && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NAV ITEMS ────────────────────────────────────────────── */}
      <nav className="flex-1 py-3 overflow-y-auto" style={{ padding: collapsed ? '12px 0' : '12px 8px' }}>
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          if (collapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`sidebar-nav-item${active ? ' active' : ''}`}
                style={{ justifyContent: 'center', padding: '10px 0', margin: '2px 8px', borderRadius: 8 }}
              >
                <Icon name={item.icon} size={20} />
              </Link>
            )
          }
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

        {/* Backoffice — visível apenas para ADMINISTRADOR e GESTOR_SMS */}
        {(hasPerfil('ADMINISTRADOR') || hasPerfil('GESTOR_SMS')) && <div
          className="border-t"
          style={{ borderColor: '#E2E8F0', marginTop: 8, paddingTop: 8, padding: collapsed ? '8px 0 0 0' : '8px 0 0 0' }}
        >
          {collapsed ? (
            <Link
              href="/admin"
              title="Backoffice"
              className={`sidebar-nav-item${pathname.startsWith('/admin') ? ' active' : ''}`}
              style={{ justifyContent: 'center', padding: '10px 0', margin: '2px 8px', borderRadius: 8, color: pathname.startsWith('/admin') ? undefined : 'var(--sidebar-text-muted)' }}
            >
              <Icon name="admin_panel_settings" size={20} />
            </Link>
          ) : (
            <Link
              href="/admin"
              className={`sidebar-nav-item${pathname.startsWith('/admin') ? ' active' : ''}`}
              style={{ color: pathname.startsWith('/admin') ? undefined : 'var(--sidebar-text-muted)' }}
            >
              <Icon name="admin_panel_settings" size={20} />
              Backoffice
            </Link>
          )}
        </div>}
      </nav>

      {/* ── FOOTER: avatar + name | notif + logout ──────────────── */}
      <div
        className="border-t shrink-0 flex items-center"
        style={{
          borderColor: '#E2E8F0',
          padding: collapsed ? '10px 0' : '10px 12px',
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '50%' }}
          title={collapsed ? (user.name ?? '') : undefined}
        >
          {user.name?.[0]?.toUpperCase() ?? 'U'}
        </div>

        {/* Name + email (hidden when collapsed) */}
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate leading-tight" style={{ color: '#0F172A' }}>
              {user.name}
            </div>
            <div className="text-xs truncate leading-tight" style={{ color: '#94A3B8' }}>
              {user.email}
            </div>
          </div>
        )}

        {/* Notification bell + Logout (always visible as icons) */}
        {!collapsed && (
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Bell — abre o drawer global */}
            <div className="relative">
              <button
                onClick={onToggleNotif}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: notifCount > 0 ? '#0038A8' : '#94A3B8' }}
                aria-label="Notificações"
                title="Notificações"
              >
                <Icon name="notifications" size={20} />
                {notifCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-white font-bold"
                    style={{ background: '#EF4444', borderRadius: '999px', minWidth: '16px', height: '16px', fontSize: '10px', lineHeight: 1, padding: '0 3px' }}
                  >
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: '#94A3B8' }}
              aria-label="Sair"
              title="Sair"
            >
              <Icon name="logout" size={20} />
            </button>
          </div>
        )}
      </div>

    </aside>
  )
}
