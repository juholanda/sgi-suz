/**
 * ─────────────────────────────────────────────────────────
 * CardCtaFooter — Design System / SGI
 * ─────────────────────────────────────────────────────────
 * Footer de acao para cards. Renderiza um link/botao tintado
 * na parte inferior do card, com stopPropagation para nao
 * disparar o onClick do ClickableCard pai.
 *
 * Regras:
 *  · Sempre usar dentro de um ClickableCard
 *  · Cores (bg, color) devem seguir os tokens do design system
 *  · Um unico CTA por card
 */
import type { Meta, StoryObj } from '@storybook/react'
import { CardCtaFooter } from '@/components/design-system/CardCtaFooter'
import { ClickableCard } from '@/components/design-system/ClickableCard'

const meta: Meta<typeof CardCtaFooter> = {
  title: 'Design System/Componentes/CardCtaFooter',
  component: CardCtaFooter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Uso basico:**
\`\`\`tsx
import { CardCtaFooter } from '@/components/design-system/CardCtaFooter'
import { ClickableCard } from '@/components/design-system/ClickableCard'

<ClickableCard href="/solicitacoes/123">
  <div style={{ padding: 16 }}>Conteudo do card</div>
  <CardCtaFooter
    href="/solicitacoes/123"
    label="Analisar"
    bg="#0038A8"
    color="#FFFFFF"
  />
</ClickableCard>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Texto do botao de acao',
      table: { category: 'Conteudo' },
    },
    bg: {
      control: 'color',
      description: 'Cor de fundo do botao',
      table: { category: 'Aparencia' },
    },
    color: {
      control: 'color',
      description: 'Cor do texto do botao',
      table: { category: 'Aparencia' },
    },
    href: {
      control: 'text',
      description: 'URL de destino',
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
type Story = StoryObj<typeof CardCtaFooter>

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Analisar: Story = {
  name: 'Analisar (primario)',
  render: () => (
    <ClickableCard
      href="#"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        borderLeft: '4px solid #1D4ED8',
      }}
    >
      <div style={{ padding: '14px 16px' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
          PRD-MOT-003
        </span>
        <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
          Aguardando sua aprovacao
        </p>
      </div>
      <CardCtaFooter href="#" label="Analisar" bg="#0038A8" color="#FFFFFF" />
    </ClickableCard>
  ),
}

export const Validar: Story = {
  name: 'Validar (verde)',
  render: () => (
    <ClickableCard
      href="#"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        borderLeft: '4px solid #0D9488',
      }}
    >
      <div style={{ padding: '14px 16px' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
          PRD-VLV-007
        </span>
        <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
          Reabilitacao concluida
        </p>
      </div>
      <CardCtaFooter href="#" label="Validar" bg="#10B981" color="#FFFFFF" />
    </ClickableCard>
  ),
}

export const Reabilitar: Story = {
  name: 'Reabilitar (roxo)',
  render: () => (
    <ClickableCard
      href="#"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        borderLeft: '4px solid #EA580C',
      }}
    >
      <div style={{ padding: '14px 16px' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
          PRD-BOM-012
        </span>
        <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
          Desabilitado ha 15 dias
        </p>
      </div>
      <CardCtaFooter href="#" label="Reabilitar" bg="#8B5CF6" color="#FFFFFF" />
    </ClickableCard>
  ),
}
