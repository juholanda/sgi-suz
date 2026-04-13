import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Espaçamentos',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Grade de espaçamento baseada em **8px** com refinamentos de 2px e 4px para casos de uso densos (ícones, badges, chips).

**Uso em CSS:** \`var(--space-5)\` → 16px
**Uso em Tailwind:** \`p-4\` → 16px, \`gap-3\` → 12px

Regra: prefira sempre os tokens da escala. Não use valores arbitrários.
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj

const SCALE = [
  { token: '--space-0',  value: '0px',  alias: 'none',  use: 'Sem espaçamento' },
  { token: '--space-1',  value: '2px',  alias: '2xs',   use: 'Espaços micro: ícones internos, underline offset' },
  { token: '--space-2',  value: '4px',  alias: 'xs',    use: 'Gap entre ícone e badge, separador fino' },
  { token: '--space-3',  value: '8px',  alias: 'sm',    use: 'Padding de badge/chip, gap entre itens inline' },
  { token: '--space-4',  value: '12px', alias: 'sm+',   use: 'Padding de botão sm, gap de nav item' },
  { token: '--space-5',  value: '16px', alias: 'md',    use: 'Padding base de card, gap de formulário, margem de label' },
  { token: '--space-6',  value: '24px', alias: 'lg',    use: 'Padding de seção, gap entre cards' },
  { token: '--space-7',  value: '32px', alias: 'xl',    use: 'Margem entre seções, padding de modal' },
  { token: '--space-8',  value: '40px', alias: '2xl',   use: 'Espaço vertical grande, separação de blocos' },
  { token: '--space-9',  value: '48px', alias: '3xl',   use: 'Padding de página, espaço hero' },
  { token: '--space-10', value: '64px', alias: '4xl',   use: 'Layout: separação de colunas grandes' },
  { token: '--space-11', value: '80px', alias: '5xl',   use: 'Seções de landing / onboarding' },
  { token: '--space-12', value: '96px', alias: '6xl',   use: 'Espaçamento máximo de layout' },
]

/* ── Scale visual ─────────────────────────────────── */
export const Escala: Story = {
  name: 'Escala de espaçamento',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 760 }}>
      <p style={{ fontSize: 12, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
        Grade baseada em 8px. Valores 2px e 4px são refinamentos para densidade — use com moderação.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 44px 54px 1fr 180px',
          gap: '0 16px',
          padding: '6px 0',
          borderBottom: '1px solid #E2E8F0',
        }}>
          {['Token CSS', 'px', 'Alias', 'Visual', 'Uso principal'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
          ))}
        </div>

        {SCALE.map(s => (
          <div key={s.token} style={{
            display: 'grid',
            gridTemplateColumns: '110px 44px 54px 1fr 180px',
            gap: '0 16px',
            padding: '8px 0',
            alignItems: 'center',
            borderBottom: '1px solid #F8FAFC',
          }}>
            <code style={{ fontSize: 11, color: '#0038A8', fontFamily: 'monospace' }}>{s.token}</code>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{s.value}</span>
            <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{s.alias}</span>
            <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
              {s.value !== '0px' ? (
                <div style={{
                  width: s.value,
                  height: 20,
                  background: '#0038A8',
                  borderRadius: 3,
                  opacity: 0.85,
                  minWidth: 2,
                }} />
              ) : (
                <span style={{ fontSize: 11, color: '#CBD5E1' }}>—</span>
              )}
            </div>
            <span style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{s.use}</span>
          </div>
        ))}
      </div>
    </div>
  ),
}

/* ── Aplicação em componentes ─────────────────────── */
export const AplicaçãoEmComponentes: Story = {
  name: 'Aplicação em componentes',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700 }}>

      {/* Botões */}
      <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Botões — padding por tamanho
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {[
          { size: 'sm', h: 30, px: 12, gap: 4,  label: 'h: 30px · px: var(--space-4) · gap: var(--space-2)' },
          { size: 'md', h: 36, px: 16, gap: 6,  label: 'h: 36px · px: var(--space-5) · gap: var(--space-2)' },
          { size: 'lg', h: 44, px: 20, gap: 8,  label: 'h: 44px · px: var(--space-4)+var(--space-5) · gap: var(--space-3)' },
        ].map(b => (
          <div key={b.size} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{
              height: b.h, padding: `0 ${b.px}px`, gap: b.gap,
              display: 'inline-flex', alignItems: 'center',
              background: '#0038A8', color: 'white', border: 'none',
              borderRadius: 8, fontSize: b.size === 'sm' ? 12 : b.size === 'md' ? 14 : 16,
              fontWeight: 500, cursor: 'pointer',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: b.size === 'sm' ? 14 : b.size === 'md' ? 16 : 18 }}>add</span>
              Botão {b.size}
            </button>
            <code style={{ fontSize: 11, color: '#64748B' }}>{b.label}</code>
          </div>
        ))}
      </div>

      {/* Cards */}
      <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Cards — padding e gaps
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EBF0FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#0038A8' }}>description</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Card padrão</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>padding: var(--space-5) = 16px<br/>gap interno: var(--space-3) = 8px</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EBF0FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#0038A8' }}>analytics</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Card confortável</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>padding: var(--space-6) = 24px<br/>gap interno: var(--space-4) = 12px</p>
        </div>
      </div>

      {/* Formulário */}
      <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Formulário — espaçamentos entre campos
      </p>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {['Área de instalação', 'TAG do equipamento'].map((label, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</label>
            <div style={{
              height: 36, border: '1.5px solid #E2E8F0', borderRadius: 6,
              padding: '0 12px', display: 'flex', alignItems: 'center',
              fontSize: 14, color: '#94A3B8',
            }}>Selecionar...</div>
            {i === 0 && <span style={{ fontSize: 11, color: '#94A3B8' }}>gap label→input: var(--space-2) = 6px | gap entre campos: var(--space-5) = 16px</span>}
          </div>
        ))}
      </div>
    </div>
  ),
}

/* ── Grid de referência ───────────────────────────── */
export const GradeDeReferência: Story = {
  name: 'Grade de referência',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700 }}>
      <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>
        Representação visual da grade — cada célula é 8px.
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        {SCALE.filter(s => s.value !== '0px').map(s => (
          <div key={s.token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28,
              height: parseInt(s.value),
              background: 'linear-gradient(180deg, #0038A8, #4A80DE)',
              borderRadius: 3,
              minHeight: 2,
            }} />
            <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  ),
}
