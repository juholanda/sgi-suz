import type { Meta, StoryObj } from '@storybook/react'
import tokens from '../../design-system/tokens'

const meta: Meta = {
  title: 'Components/SidebarNav',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'white' },
  },
}
export default meta

type Story = StoryObj

// ─── Helper ──────────────────────────────────────────────────────────────────

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

interface NavItemDemoProps {
  label: string
  icon: string
  state: 'default' | 'hover' | 'focus' | 'pressed' | 'active' | 'disabled'
}

function NavItemDemo({ label, icon, state }: NavItemDemoProps) {
  // Map story state to CSS vars manually so we can show each state frozen
  const styleMap: Record<string, React.CSSProperties> = {
    default: {
      color: tokens.sidebar.navText,
      background: tokens.sidebar.navBg,
      fontWeight: tokens.typography.weights.normal,
    },
    hover: {
      color: tokens.sidebar.navHoverText,
      background: tokens.sidebar.navHoverBg,
      fontWeight: tokens.typography.weights.normal,
    },
    focus: {
      color: tokens.sidebar.navHoverText,
      background: tokens.sidebar.navHoverBg,
      fontWeight: tokens.typography.weights.normal,
      outline: `2px solid ${tokens.sidebar.navFocusRing}`,
      outlineOffset: '1px',
    },
    pressed: {
      color: tokens.sidebar.navPressedText,
      background: tokens.sidebar.navPressedBg,
      fontWeight: tokens.typography.weights.normal,
    },
    active: {
      color: tokens.sidebar.navActiveText,
      background: tokens.sidebar.navActiveBg,
      fontWeight: tokens.typography.weights.semibold,
    },
    disabled: {
      color: tokens.sidebar.navDisabledText,
      background: 'transparent',
      opacity: parseFloat(tokens.sidebar.navDisabledOpacity),
      cursor: 'not-allowed',
    },
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 6,
        fontSize: 14,
        textDecoration: 'none',
        transition: 'background 120ms ease, color 120ms ease',
        ...styleMap[state],
      }}
    >
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </div>
  )
}

// ─── All states in one panel ──────────────────────────────────────────────────

function SidebarNavAllStates() {
  const states: NavItemDemoProps['state'][] = [
    'default', 'hover', 'focus', 'pressed', 'active', 'disabled',
  ]

  const stateLabels: Record<string, string> = {
    default:  'Default',
    hover:    'Hover',
    focus:    'Focus (keyboard)',
    pressed:  'Pressed',
    active:   'Active (selecionado)',
    disabled: 'Disabled',
  }

  const stateDescriptions: Record<string, string> = {
    default:  'Estado padrão — item navegável não selecionado.',
    hover:    ':hover — mouse sobre o item.',
    focus:    ':focus-visible — navegação por teclado (Tab).',
    pressed:  ':active — mousedown pressionado.',
    active:   'Página atual — classe .active aplicada.',
    disabled: '.disabled / aria-disabled — não interativo.',
  }

  return (
    <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
      {/* Demo panel */}
      <div
        style={{
          width: 240,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, padding: '0 4px' }}>
          Nav Items
        </div>
        {states.map(s => (
          <NavItemDemo key={s} label={stateLabels[s]} icon="home" state={s} />
        ))}
      </div>

      {/* Token table */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
          Tokens por estado
        </div>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', maxWidth: 520 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ textAlign: 'left', padding: '6px 12px', color: '#64748B', fontWeight: 600 }}>Estado</th>
              <th style={{ textAlign: 'left', padding: '6px 12px', color: '#64748B', fontWeight: 600 }}>Text</th>
              <th style={{ textAlign: 'left', padding: '6px 12px', color: '#64748B', fontWeight: 600 }}>Background</th>
              <th style={{ textAlign: 'left', padding: '6px 12px', color: '#64748B', fontWeight: 600 }}>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {[
              { state: 'default',  text: tokens.sidebar.navText,        bg: tokens.sidebar.navBg },
              { state: 'hover',    text: tokens.sidebar.navHoverText,    bg: tokens.sidebar.navHoverBg },
              { state: 'focus',    text: tokens.sidebar.navHoverText,    bg: tokens.sidebar.navHoverBg },
              { state: 'pressed',  text: tokens.sidebar.navPressedText,  bg: tokens.sidebar.navPressedBg },
              { state: 'active',   text: tokens.sidebar.navActiveText,   bg: tokens.sidebar.navActiveBg },
              { state: 'disabled', text: tokens.sidebar.navDisabledText, bg: 'transparent' },
            ].map((row, i) => (
              <tr key={row.state} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FAFBFC' : 'white' }}>
                <td style={{ padding: '8px 12px', fontWeight: 500, color: '#0F172A' }}>
                  {stateLabels[row.state]}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {row.text !== 'transparent' && (
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: row.text, flexShrink: 0, border: '1px solid #E2E8F0' }} />
                    )}
                    <code style={{ fontSize: 11, color: '#475569' }}>{row.text}</code>
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {row.bg !== 'transparent' && (
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: row.bg, flexShrink: 0, border: '1px solid #E2E8F0' }} />
                    )}
                    <code style={{ fontSize: 11, color: '#475569' }}>{row.bg}</code>
                  </span>
                </td>
                <td style={{ padding: '8px 12px', color: '#64748B', fontSize: 12 }}>
                  {stateDescriptions[row.state]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 24, padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>CSS Variables geradas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
            {[
              '--sidebar-nav-text',
              '--sidebar-nav-bg',
              '--sidebar-nav-hover-text',
              '--sidebar-nav-hover-bg',
              '--sidebar-nav-focus-ring',
              '--sidebar-nav-pressed-text',
              '--sidebar-nav-pressed-bg',
              '--sidebar-nav-active-text',
              '--sidebar-nav-active-bg',
              '--sidebar-nav-active-font-weight',
              '--sidebar-nav-disabled-text',
              '--sidebar-nav-disabled-opacity',
            ].map(v => (
              <code key={v} style={{ fontSize: 11, color: '#0038A8' }}>{v}</code>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const AllStates: Story = {
  name: 'Todos os estados',
  render: () => <SidebarNavAllStates />,
}

// ─── Individual states for reference ─────────────────────────────────────────

const EXAMPLE_ITEMS = [
  { label: 'Início',       icon: 'home' },
  { label: 'Solicitações', icon: 'description' },
  { label: 'Aprovações',   icon: 'task_alt' },
  { label: 'Relatórios',   icon: 'bar_chart' },
]

function SidebarPanel({ activeIndex = 0, disabledIndex = -1 }: { activeIndex?: number; disabledIndex?: number }) {
  return (
    <div
      style={{
        width: 240,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '8px',
      }}
    >
      {EXAMPLE_ITEMS.map((item, i) => (
        <NavItemDemo
          key={item.label}
          label={item.label}
          icon={item.icon}
          state={i === disabledIndex ? 'disabled' : i === activeIndex ? 'active' : 'default'}
        />
      ))}
    </div>
  )
}

export const PainelCompleto: Story = {
  name: 'Painel completo (página Início ativa)',
  render: () => <SidebarPanel activeIndex={0} />,
}

export const PainelComDesabilitado: Story = {
  name: 'Painel com item desabilitado',
  render: () => <SidebarPanel activeIndex={1} disabledIndex={2} />,
}
