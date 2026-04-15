/**
 * ─────────────────────────────────────────────────────────
 * ViewToggle — Design System / SGI
 * ─────────────────────────────────────────────────────────
 * Componente de alternância entre visualizações (tabela / cards).
 * Construído sobre o Button shadcn com variantes de marca.
 *
 * Regras:
 *  · Sempre posicionar à direita, alinhado com filtros
 *  · Manter estado ativo visualmente destacado (#0038A8)
 *  · Em mobile, ocultar — mobile usa cards por padrão
 *
 * Uso:
 * ```tsx
 * import { ViewToggle } from '@/components/ui/view-toggle'
 *
 * <ViewToggle value={viewMode} onChange={setViewMode} />
 * ```
 */
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ViewToggle, type ViewMode } from '@/components/ui/view-toggle'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof ViewToggle> = {
  title: 'Design System/Componentes/ViewToggle',
  component: ViewToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Toggle de visualização** — Alterna entre modo tabela e cards.

Construído com o \`Button\` shadcn (variante \`outline\`) e ícones Material Symbols.

\`\`\`tsx
import { ViewToggle } from '@/components/ui/view-toggle'

const [view, setView] = useState<ViewMode>('table')
<ViewToggle value={view} onChange={setView} />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: 'radio',
      options: ['table', 'cards'],
      table: { category: 'Estado' },
    },
    className: {
      control: 'text',
      table: { category: 'Aparência' },
    },
  },
}

export default meta
type Story = StoryObj<typeof ViewToggle>

/* ─── Helpers ──────────────────────────────────────── */
const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '28px 0 10px' }}>
    {children}
  </p>
)

/* ═══════════════════════════════════════════════════
   1. INTERATIVO — clique para alternar
══════════════════════════════════════════════════════ */
export const Interativo: Story = {
  name: '1 · Interativo',
  render: () => {
    const [view, setView] = useState<ViewMode>('table')
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 500 }}>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Clique nos botões para alternar a visualização.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ViewToggle value={view} onChange={setView} />
          <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>
            Modo: <strong style={{ color: '#0038A8' }}>{view === 'table' ? 'Tabela' : 'Cards'}</strong>
          </span>
        </div>
      </div>
    )
  },
}

/* ═══════════════════════════════════════════════════
   2. ESTADOS — tabela ativo vs cards ativo
══════════════════════════════════════════════════════ */
export const Estados: Story = {
  name: '2 · Estados',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 500 }}>
      <Label>Tabela selecionada</Label>
      <ViewToggle value="table" onChange={() => {}} />

      <Label>Cards selecionados</Label>
      <ViewToggle value="cards" onChange={() => {}} />
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   3. CONTEXTO — com filtros (como na aplicação)
══════════════════════════════════════════════════════ */
export const ComFiltros: Story = {
  name: '3 · Contexto com filtros',
  render: () => {
    const [view, setView] = useState<ViewMode>('table')
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 800 }}>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Exemplo de como o ViewToggle aparece ao lado dos filtros na aplicação.
        </p>

        {/* Simulated filter bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
        }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #E2E8F0',
            borderRadius: 4,
            background: '#FFFFFF',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#94A3B8' }}>search</span>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>Buscar por TAG, protocolo...</span>
          </div>

          {/* Filtros button */}
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: 4,
            background: '#FFFFFF',
            fontSize: 13,
            color: '#64748B',
            cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>tune</span>
            Filtros
          </button>

          {/* Spacer */}
          <div style={{ flex: '0 0 1px', height: 24, background: '#E2E8F0' }} />

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>Ordenar por</span>
            <select style={{
              padding: '6px 8px',
              border: '1px solid #E2E8F0',
              borderRadius: 4,
              fontSize: 13,
              color: '#374151',
              background: '#FFFFFF',
            }}>
              <option>Mais recentes</option>
              <option>Mais antigas</option>
              <option>Por prazo</option>
            </select>
          </div>

          {/* View Toggle */}
          <ViewToggle value={view} onChange={setView} />
        </div>

        {/* Result indicator */}
        <div style={{
          marginTop: 12,
          padding: '20px',
          background: view === 'table' ? '#F0F7FF' : '#F0FDF4',
          border: `1px solid ${view === 'table' ? '#BFDBFE' : '#BBF7D0'}`,
          borderRadius: 8,
          textAlign: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: view === 'table' ? '#2563EB' : '#16A34A', display: 'block', marginBottom: 4 }}>
            {view === 'table' ? 'table_rows' : 'view_agenda'}
          </span>
          <span style={{ fontSize: 13, color: '#374151' }}>
            Exibindo resultados em <strong>{view === 'table' ? 'tabela' : 'cards'}</strong>
          </span>
        </div>
      </div>
    )
  },
}

/* ═══════════════════════════════════════════════════
   4. BUTTON SHADCN — variantes do Button base
══════════════════════════════════════════════════════ */
export const ButtonBase: Story = {
  name: '4 · Button base (shadcn)',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700 }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        O ViewToggle é construído sobre o componente <code style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>Button</code> shadcn
        com as cores de marca do SGI.
      </p>

      <Label>Variantes do Button</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px 20px', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Default</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="default">Primário</Button>
          <Button variant="default" size="sm">Pequeno</Button>
          <Button variant="default" size="icon">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          </Button>
        </div>

        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Secondary</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary">Secundário</Button>
          <Button variant="secondary" size="sm">Pequeno</Button>
        </div>

        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Outline</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline">Outline</Button>
          <Button variant="outline" size="icon">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
          </Button>
        </div>

        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Destructive</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="destructive">Excluir</Button>
        </div>

        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Ghost</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost">Ghost</Button>
        </div>

        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Link</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <Label>Toggle agrupado (padrão shadcn)</Label>
      <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
        Botões com <code style={{ background: '#F1F5F9', padding: '1px 4px', borderRadius: 3 }}>-space-x-px</code> e
        <code style={{ background: '#F1F5F9', padding: '1px 4px', borderRadius: 3 }}>rounded-none</code> formam um grupo unificado.
      </p>
      <div className="inline-flex -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse">
        <Button
          className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
          variant="outline"
          size="icon"
          aria-label="Cards"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1 }}>view_agenda</span>
        </Button>
        <Button
          className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
          variant="outline"
          size="icon"
          aria-label="Tabela"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1 }}>reorder</span>
        </Button>
      </div>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   5. REFERÊNCIA TÉCNICA
══════════════════════════════════════════════════════ */
export const Referência: Story = {
  name: '5 · Referência técnica',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#374151', maxWidth: 720 }}>

      <Label>Props — ViewToggle</Label>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
            {['Prop', 'Tipo', 'Padrão', 'Descrição'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94A3B8', fontWeight: 600, fontSize: 11 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['value', "'table' | 'cards'", '—', 'Modo de visualização ativo'],
            ['onChange', '(mode: ViewMode) => void', '—', 'Callback ao alternar'],
            ['className', 'string', '—', 'Classes CSS adicionais'],
          ].map(([prop, type, def, desc]) => (
            <tr key={prop} style={{ borderBottom: '1px solid #F8FAFC' }}>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#0038A8' }}>{prop}</td>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748B', fontSize: 11 }}>{type}</td>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#94A3B8', fontSize: 11 }}>{def}</td>
              <td style={{ padding: '6px 10px', color: '#374151' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Label>Props — Button (shadcn)</Label>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
            {['Prop', 'Tipo', 'Padrão', 'Descrição'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94A3B8', fontWeight: 600, fontSize: 11 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['variant', "'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'", "'default'", 'Estilo visual'],
            ['size', "'default' | 'sm' | 'lg' | 'icon'", "'default'", 'Tamanho (h-9, h-8, h-10, 9x9)'],
            ['asChild', 'boolean', 'false', 'Renderiza como child (via Slot)'],
          ].map(([prop, type, def, desc]) => (
            <tr key={prop} style={{ borderBottom: '1px solid #F8FAFC' }}>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#0038A8' }}>{prop}</td>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748B', fontSize: 11 }}>{type}</td>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#94A3B8', fontSize: 11 }}>{def}</td>
              <td style={{ padding: '6px 10px', color: '#374151' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Label>Tokens de cor (marca SGI)</Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'Primary', hex: '#0038A8', bg: '#0038A8', text: '#FFFFFF' },
          { label: 'Primary hover', hex: '#002d87', bg: '#002d87', text: '#FFFFFF' },
          { label: 'Secondary bg', hex: '#EBF0FB', bg: '#EBF0FB', text: '#0038A8' },
          { label: 'Border', hex: '#E2E8F0', bg: '#E2E8F0', text: '#0F172A' },
        ].map(t => (
          <div key={t.label} style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ height: 32, background: t.bg }} />
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{t.label}</div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748B' }}>{t.hex}</div>
            </div>
          </div>
        ))}
      </div>

      <Label>Dependências</Label>
      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, lineHeight: 2 }}>
        <div>@radix-ui/react-slot</div>
        <div>class-variance-authority</div>
        <div>clsx</div>
        <div>tailwind-merge</div>
      </div>
    </div>
  ),
}
