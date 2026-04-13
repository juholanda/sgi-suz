import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'

const meta: Meta = {
  title: 'Design System/Sidebar',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'app' },
  },
  tags: ['autodocs'],
}

export default meta

// ─── Icon helper ─────────────────────────────────────────────────────────────

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

// ─── Nav item data ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Início',        icon: 'home',               active: true },
  { label: 'Solicitações',  icon: 'description',         active: false },
  { label: 'Aprovações',    icon: 'task_alt',            active: false },
  { label: 'Execução',      icon: 'engineering',         active: false },
  { label: 'Relatórios',    icon: 'bar_chart',           active: false },
  { label: 'Perfil',        icon: 'manage_accounts',     active: false },
]

const USERS = [
  { name: 'João Silva', email: 'joao.silva@suzano.com.br', initials: 'JS' },
  { name: 'Ana Costa',  email: 'ana.costa@suzano.com.br',  initials: 'AC' },
]

const PERFIS = [
  { perfil: 'SOLICITANTE', label: 'Solicitante',   icon: 'person' },
  { perfil: 'APROVADOR',   label: 'Aprovador',     icon: 'task_alt' },
  { perfil: 'EXECUTANTE',  label: 'Executante',    icon: 'engineering' },
]

const PLANTAS = [
  { id: 'ara', nome: 'Unidade Aracruz' },
  { id: 'lim', nome: 'Unidade Limeira' },
]

// ─── Sidebar display component ────────────────────────────────────────────────

interface SidebarDemoProps {
  collapsed?: boolean
  user?: typeof USERS[0]
  activePerfil?: string
  notifCount?: number
  showBackoffice?: boolean
}

function SidebarDemo({
  collapsed = false,
  user = USERS[0],
  activePerfil = 'SOLICITANTE',
  notifCount = 3,
  showBackoffice = true,
}: SidebarDemoProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [showPerfilDropdown, setShowPerfilDropdown] = useState(false)
  const [showPlantaDropdown, setShowPlantaDropdown] = useState(false)
  const [selectedPerfil, setSelectedPerfil] = useState(activePerfil)
  const [selectedPlanta, setSelectedPlanta] = useState('ara')

  const W = isCollapsed ? '56px' : '240px'
  const plantaAtual = PLANTAS.find(p => p.id === selectedPlanta)
  const perfilAtual = PERFIS.find(p => p.perfil === selectedPerfil)

  return (
    <aside
      style={{
        width: W,
        minWidth: W,
        height: '100vh',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease, min-width 200ms ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── TOP ────────────────────────────────────────── */}
      {isCollapsed ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 0',
          gap: 8,
        }}>
          <div style={{
            width: 28, height: 28,
            background: '#0038A8',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
          }}>S</div>
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expandir menu"
            style={{
              width: 28, height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
            }}
          >
            <Icon name="chevron_right" size={18} />
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          minHeight: 52,
          borderBottom: '1px solid #E2E8F0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28,
              background: '#0038A8',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}>S</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
              SGI Suzano
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            title="Recolher menu"
            style={{
              width: 28, height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Icon name="chevron_left" size={18} />
          </button>
        </div>
      )}

      {/* ── SWITCHERS ──────────────────────────────────── */}
      {!isCollapsed && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          {/* Plant selector */}
          <div style={{ marginBottom: 6, position: 'relative' }}>
            <button
              onClick={() => { setShowPlantaDropdown(s => !s); setShowPerfilDropdown(false) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${showPlantaDropdown ? '#0038A8' : '#E2E8F0'}`,
                background: showPlantaDropdown ? '#EBF0FB' : '#F1F5F9',
                color: showPlantaDropdown ? '#0038A8' : '#374151',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500,
              }}
            >
              <Icon name="factory" size={14} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {plantaAtual?.nome ?? 'Selecionar planta'}
              </span>
              <Icon name={showPlantaDropdown ? 'expand_less' : 'unfold_more'} size={16} />
            </button>
            {showPlantaDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50,
                marginTop: 4,
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,.08)',
                overflow: 'hidden',
              }}>
                {PLANTAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPlanta(p.id); setShowPlantaDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                      textAlign: 'left',
                      background: selectedPlanta === p.id ? '#EBF0FB' : 'white',
                      color: selectedPlanta === p.id ? '#0038A8' : '#374151',
                      fontWeight: selectedPlanta === p.id ? 600 : 400,
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F8FAFC',
                    }}
                  >
                    <Icon name="factory" size={14} />
                    <span style={{ flex: 1 }}>{p.nome}</span>
                    {selectedPlanta === p.id && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowPerfilDropdown(s => !s); setShowPlantaDropdown(false) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${showPerfilDropdown ? '#0038A8' : '#E2E8F0'}`,
                background: showPerfilDropdown ? '#EBF0FB' : '#F1F5F9',
                color: showPerfilDropdown ? '#0038A8' : '#374151',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500,
              }}
            >
              <Icon name={perfilAtual?.icon ?? 'person'} size={14} />
              <span style={{ flex: 1 }}>{perfilAtual?.label ?? selectedPerfil}</span>
              <Icon name={showPerfilDropdown ? 'expand_less' : 'unfold_more'} size={16} />
            </button>
            {showPerfilDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50,
                marginTop: 4,
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,.08)',
                overflow: 'hidden',
              }}>
                {PERFIS.map(p => (
                  <button
                    key={p.perfil}
                    onClick={() => { setSelectedPerfil(p.perfil); setShowPerfilDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                      textAlign: 'left',
                      background: selectedPerfil === p.perfil ? '#EBF0FB' : 'white',
                      color: selectedPerfil === p.perfil ? '#0038A8' : '#374151',
                      fontWeight: selectedPerfil === p.perfil ? 600 : 400,
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F8FAFC',
                    }}
                  >
                    <Icon name={p.icon} size={14} />
                    <span style={{ flex: 1 }}>{p.label}</span>
                    {selectedPerfil === p.perfil && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NAV ────────────────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isCollapsed ? '12px 0' : '12px 8px',
        }}
      >
        {NAV_ITEMS.map(item => (
          <a
            key={item.label}
            href="#"
            onClick={e => e.preventDefault()}
            className={`sidebar-nav-item${item.active ? ' active' : ''}`}
            style={isCollapsed ? {
              justifyContent: 'center',
              padding: '10px 0',
              margin: '2px 6px',
              borderRadius: 8,
            } : undefined}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon name={item.icon} size={20} />
            {!isCollapsed && item.label}
          </a>
        ))}

        {showBackoffice && (
          <div style={{
            borderTop: '1px solid #E2E8F0',
            marginTop: 8,
            paddingTop: 8,
          }}>
            <a
              href="#"
              onClick={e => e.preventDefault()}
              className="sidebar-nav-item"
              style={{
                color: 'var(--sidebar-text-muted)',
                ...(isCollapsed ? {
                  justifyContent: 'center',
                  padding: '10px 0',
                  margin: '2px 6px',
                  borderRadius: 8,
                } : {}),
              }}
              title={isCollapsed ? 'Backoffice' : undefined}
            >
              <Icon name="admin_panel_settings" size={20} />
              {!isCollapsed && 'Backoffice'}
            </a>
          </div>
        )}
      </nav>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid #E2E8F0',
        padding: isCollapsed ? '10px 0' : '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: isCollapsed ? 0 : 10,
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        flexShrink: 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: '#EBF0FB',
          color: '#0038A8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          flexShrink: 0,
        }}
          title={isCollapsed ? user.name : undefined}
        >
          {user.initials}
        </div>

        {!isCollapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              {/* Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  style={{
                    width: 32, height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: notifCount > 0 ? '#0038A8' : '#94A3B8',
                    cursor: 'pointer',
                  }}
                  title="Notificações"
                >
                  <Icon name="notifications" size={20} />
                </button>
                {notifCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    background: '#EF4444',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 999,
                    minWidth: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                  }}>
                    {notifCount}
                  </span>
                )}
              </div>

              {/* Logout */}
              <button
                style={{
                  width: 32, height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
                title="Sair"
              >
                <Icon name="logout" size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Expandido: StoryObj = {
  name: 'Expandido (240px)',
  render: () => (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarDemo collapsed={false} notifCount={3} />
      <div style={{ flex: 1, padding: 32, background: '#F0F4F8' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#64748B', fontSize: 14 }}>
          Conteúdo da página
        </p>
      </div>
    </div>
  ),
}

export const Recolhido: StoryObj = {
  name: 'Recolhido (56px)',
  render: () => (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarDemo collapsed={true} notifCount={3} />
      <div style={{ flex: 1, padding: 32, background: '#F0F4F8' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#64748B', fontSize: 14 }}>
          Conteúdo da página
        </p>
      </div>
    </div>
  ),
}

export const Interativo: StoryObj = {
  name: 'Interativo — toggle expandir/recolher',
  render: () => (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarDemo collapsed={false} notifCount={5} />
      <div style={{ flex: 1, padding: 32, background: '#F0F4F8' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#64748B', fontSize: 14 }}>
          Clique no botão ‹ / › para alternar entre expandido e recolhido.
        </p>
      </div>
    </div>
  ),
}

export const SemNotificacoes: StoryObj = {
  name: 'Sem notificações',
  render: () => (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarDemo collapsed={false} notifCount={0} />
      <div style={{ flex: 1, padding: 32, background: '#F0F4F8' }} />
    </div>
  ),
}

export const EstadosNavItem: StoryObj = {
  name: 'Estados do nav item — referência',
  parameters: { layout: 'padded', backgrounds: { default: 'white' } },
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 640, padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
        Nav Item — Todos os estados
      </h1>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
        Classe base: <code style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>.sidebar-nav-item</code>.
        Estados adicionais: <code>.active</code>, <code>.disabled</code>, <code>[aria-disabled]</code>.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
        {([
          { label: 'Default',  cls: '',         desc: 'Estado inicial' },
          { label: 'Active',   cls: 'active',   desc: 'Página atual — adicione .active' },
          { label: 'Disabled', cls: 'disabled', desc: 'Não interativo — adicione .disabled' },
        ] as const).map(item => (
          <div key={item.label}>
            <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
              <strong style={{ color: '#475569' }}>{item.label}</strong> — {item.desc}
            </p>
            <a
              href="#"
              onClick={e => e.preventDefault()}
              className={`sidebar-nav-item ${item.cls}`.trim()}
            >
              <Icon name="home" size={20} />
              Início
            </a>
          </div>
        ))}

        <div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
            <strong style={{ color: '#475569' }}>Hover</strong> — passe o mouse para ver
          </p>
          <a href="#" onClick={e => e.preventDefault()} className="sidebar-nav-item">
            <Icon name="description" size={20} />
            Solicitações
          </a>
        </div>

        <div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
            <strong style={{ color: '#475569' }}>Focus</strong> — pressione Tab para ver o anel
          </p>
          <a href="#" className="sidebar-nav-item">
            <Icon name="task_alt" size={20} />
            Aprovações
          </a>
        </div>

        <div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
            <strong style={{ color: '#475569' }}>Pressed</strong> — segure o clique para ver
          </p>
          <a href="#" onClick={e => e.preventDefault()} className="sidebar-nav-item">
            <Icon name="bar_chart" size={20} />
            Relatórios
          </a>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 16 }}>CSS Vars</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#475569', borderBottom: '1px solid #E2E8F0' }}>Variável</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#475569', borderBottom: '1px solid #E2E8F0' }}>Valor</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#475569', borderBottom: '1px solid #E2E8F0' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {[
              { var: '--sidebar-nav-text',              val: '#374151',     state: 'Default' },
              { var: '--sidebar-nav-hover-text',        val: '#0038A8',     state: 'Hover' },
              { var: '--sidebar-nav-hover-bg',          val: '#F5F8FF',     state: 'Hover' },
              { var: '--sidebar-nav-focus-ring',        val: '#0038A8',     state: 'Focus' },
              { var: '--sidebar-nav-pressed-text',      val: '#002D8A',     state: 'Pressed' },
              { var: '--sidebar-nav-pressed-bg',        val: '#D8E4F8',     state: 'Pressed' },
              { var: '--sidebar-nav-active-text',       val: '#0038A8',     state: 'Active' },
              { var: '--sidebar-nav-active-bg',         val: '#EBF0FB',     state: 'Active' },
              { var: '--sidebar-nav-active-font-weight',val: '600',         state: 'Active' },
              { var: '--sidebar-nav-disabled-text',     val: '#94A3B8',     state: 'Disabled' },
              { var: '--sidebar-nav-disabled-opacity',  val: '0.5',         state: 'Disabled' },
            ].map(row => (
              <tr key={row.var} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#0038A8', background: '#F8FAFC' }}>
                  {row.var}
                </td>
                <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: row.val === '600' || row.val === '0.5' ? '#E2E8F0' : row.val,
                    border: '1px solid #E2E8F0',
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  <code>{row.val}</code>
                </td>
                <td style={{ padding: '8px 12px', color: '#64748B' }}>{row.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
}
