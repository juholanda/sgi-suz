import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Components/SidebarPlantaWidget',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'light' },
  },
}
export default meta
type Story = StoryObj

// ─── Helper ──────────────────────────────────────────────────────────────────
function Icon({ name, size = 14 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}
      aria-hidden
    >
      {name}
    </span>
  )
}

/** Widget de planta + perfil como subtítulo */
function PlantaWidget({
  plantaNome,
  perfilLabel,
  hasMultiple = false,
  open = false,
}: {
  plantaNome: string
  perfilLabel: string
  hasMultiple?: boolean
  open?: boolean
}) {
  return (
    <div style={{ width: 216, fontFamily: 'Inter, sans-serif' }}>
      <button
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 8,
          border: `1px solid ${open ? '#0038A8' : '#E2E8F0'}`,
          background: open ? '#EBF0FB' : '#F1F5F9',
          color: open ? '#0038A8' : '#374151',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <Icon name="factory" size={15} />

        {/* Text: planta + perfil */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            lineHeight: '16px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            color: open ? '#0038A8' : '#374151',
          }}>
            {plantaNome}
          </div>
          <div style={{
            fontSize: 10,
            fontWeight: 400,
            lineHeight: '14px',
            marginTop: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            color: open ? '#6B9ADB' : '#94A3B8',
          }}>
            {perfilLabel}
          </div>
        </div>

        {hasMultiple && <Icon name={open ? 'expand_less' : 'unfold_more'} size={16} />}
      </button>

      {/* Dropdown (open state) */}
      {open && hasMultiple && (
        <div style={{
          marginTop: 4,
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>
          {[
            { id: '1', nome: 'Unidade Suzano - Fábrica B', active: true },
            { id: '2', nome: 'Unidade Três Lagoas', active: false },
          ].map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: p.active ? 600 : 400,
                color: p.active ? '#0038A8' : '#374151',
                background: p.active ? '#EBF0FB' : 'white',
                borderBottom: '1px solid #F8FAFC',
                cursor: 'pointer',
              }}
            >
              <Icon name="factory" size={15} />
              <span style={{ flex: 1 }}>{p.nome}</span>
              {p.active && <Icon name="check" size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Planta única + perfil único */
export const PlantaUnicaPerfilUnico: Story = {
  render: () => (
    <PlantaWidget
      plantaNome="Unidade Suzano - Fábrica B"
      perfilLabel="Solicitante"
    />
  ),
}

/** Planta única + múltiplos perfis (ex: Sol/Exec + Aprovador) */
export const PlantaUnicaMultiplosPerfis: Story = {
  render: () => (
    <PlantaWidget
      plantaNome="Unidade Suzano - Fábrica B"
      perfilLabel="Solicitante / Executante · Aprovador"
    />
  ),
}

/** Múltiplas plantas disponíveis — estado fechado */
export const MultiplasPlantasFechado: Story = {
  render: () => (
    <PlantaWidget
      plantaNome="Unidade Suzano - Fábrica B"
      perfilLabel="Solicitante"
      hasMultiple
    />
  ),
}

/** Múltiplas plantas disponíveis — dropdown aberto */
export const MultiplasPlantasAberto: Story = {
  render: () => (
    <PlantaWidget
      plantaNome="Unidade Suzano - Fábrica B"
      perfilLabel="Solicitante"
      hasMultiple
      open
    />
  ),
}

/** Nome de planta longo — truncamento */
export const NomeLongo: Story = {
  render: () => (
    <PlantaWidget
      plantaNome="Unidade Ribas do Rio Pardo - Fábrica Principal"
      perfilLabel="Gestor SMS"
      hasMultiple
    />
  ),
}

/** Comparação: antes e depois */
export const ComparacaoAnteDepois: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', fontFamily: 'Inter, sans-serif' }}>
      {/* ANTES */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Antes</div>
        <div style={{ width: 216, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Plant button */}
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F1F5F9', color: '#374151', textAlign: 'left', fontSize: 12, fontWeight: 500 }}>
            <Icon name="factory" size={14} />
            <span style={{ flex: 1 }}>Unidade Suzano - Fábri...</span>
            <Icon name="unfold_more" size={16} />
          </button>
          {/* Perfil button separado */}
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F1F5F9', color: '#374151', textAlign: 'left', fontSize: 12, fontWeight: 500 }}>
            <Icon name="person" size={14} />
            <span style={{ flex: 1 }}>Solicitante</span>
            <Icon name="unfold_more" size={16} />
          </button>
        </div>
      </div>

      {/* DEPOIS */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#0038A8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Depois</div>
        <PlantaWidget
          plantaNome="Unidade Suzano - Fábrica B"
          perfilLabel="Solicitante"
          hasMultiple
        />
      </div>
    </div>
  ),
}
