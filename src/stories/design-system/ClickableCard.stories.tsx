/**
 * ─────────────────────────────────────────────────────────
 * ClickableCard — Design System / SGI
 * ─────────────────────────────────────────────────────────
 * Card container inteiramente clicavel (como um link), mas
 * que permite elementos interativos internos (botoes, links)
 * funcionarem de forma independente.
 *
 * Regras:
 *  · Usar no lugar de <a> wrapping para evitar HTML invalido
 *  · Filhos interativos devem chamar e.stopPropagation()
 *  · Suporta middle-click (nova aba) e navegacao por teclado
 */
import type { Meta, StoryObj } from '@storybook/react'
import { ClickableCard } from '@/components/design-system/ClickableCard'

const meta: Meta<typeof ClickableCard> = {
  title: 'Design System/Componentes/ClickableCard',
  component: ClickableCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Uso basico:**
\`\`\`tsx
import { ClickableCard } from '@/components/design-system/ClickableCard'

<ClickableCard href="/detalhes/123">
  <div style={{ padding: 16 }}>
    <h3>Titulo do card</h3>
    <p>Conteudo clicavel</p>
  </div>
</ClickableCard>
\`\`\`

**Por que nao usar \`<a>\` wrapper?**
Aninhar \`<Link>\` ou \`<button>\` dentro de \`<a>\` gera HTML invalido e
bugs de z-index/click em diferentes browsers. O ClickableCard usa
\`onClick\` + \`useRouter\` para evitar isso.
        `,
      },
    },
  },
  argTypes: {
    href: {
      control: 'text',
      description: 'URL de destino ao clicar no card',
      table: { category: 'Navegacao' },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ClickableCard>

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Card simples',
  args: {
    href: '#',
  },
  render: (args) => (
    <ClickableCard
      {...args}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        borderLeft: '4px solid #1D4ED8',
      }}
    >
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            style={{
              background: '#1D4ED8',
              color: '#FFFFFF',
              borderRadius: 2,
              padding: '2px 6px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            CL 1
          </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
            PRD-MOT-003
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
          Intertravamento PRD-MOT-003
        </p>
      </div>
    </ClickableCard>
  ),
}

export const ComBordaColorida: Story = {
  name: 'Classe 4 (vermelho)',
  args: {
    href: '#',
  },
  render: (args) => (
    <ClickableCard
      {...args}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        borderLeft: '4px solid #DC2626',
      }}
    >
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            style={{
              background: '#DC2626',
              color: '#FFFFFF',
              borderRadius: 2,
              padding: '2px 6px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            CL 4
          </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
            PRD-VLV-010
          </span>
          <span
            style={{
              marginLeft: 'auto',
              background: '#FEF2F2',
              color: '#DC2626',
              borderRadius: 100,
              padding: '3px 8px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Desabilitado
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
          Valvula de seguranca critica
        </p>
      </div>
    </ClickableCard>
  ),
}

export const ComBotaoInterno: Story = {
  name: 'Com botao interno (stopPropagation)',
  args: {
    href: '#',
  },
  render: (args) => (
    <ClickableCard
      {...args}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
      }}
    >
      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: 14, color: '#0F172A', margin: '0 0 12px' }}>
          Card com acao interna
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            alert('Botao clicado! (card nao navegou)')
          }}
          style={{
            background: '#0038A8',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 4,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Acao interna
        </button>
      </div>
    </ClickableCard>
  ),
}
