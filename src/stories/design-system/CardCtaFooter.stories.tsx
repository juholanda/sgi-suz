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
 *  · Cores (bg, color) devem seguir os tokens do design system:
 *    - Primary: bg=#0038A8, color=#FFFFFF
 *    - Secondary: bg=#EBF0FB, color=#0038A8
 *    - Success: bg=#16A34A, color=#FFFFFF
 *    - Danger: bg=#DC2626, color=#FFFFFF
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

**Variantes de cor (seguindo o Design System de Botoes):**
| Acao | bg | color | Quando usar |
|---|---|---|---|
| Primary | \`#0038A8\` | \`#FFFFFF\` | Acao principal (Analisar, Executar) |
| Secondary | \`#EBF0FB\` | \`#0038A8\` | Acao alternativa (Acompanhar) |
| Success | \`#16A34A\` | \`#FFFFFF\` | Confirmacao positiva (Validar, Reabilitar) |
| Danger | \`#DC2626\` | \`#FFFFFF\` | Alerta / urgencia (Ver agora) |
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
      description: 'Cor de fundo do botao (seguir tokens do DS)',
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function DemoCard({ children, borderColor = '#1D4ED8' }: { children: React.ReactNode; borderColor?: string }) {
  return (
    <ClickableCard
      href="#"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      {children}
    </ClickableCard>
  )
}

function CardBody({ tag, description }: { tag: string; description: string }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
        {tag}
      </span>
      <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
        {description}
      </p>
    </div>
  )
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Primary: Story = {
  name: 'Primary — Analisar',
  render: () => (
    <DemoCard>
      <CardBody tag="PRD-MOT-003" description="Aguardando sua aprovacao" />
      <CardCtaFooter href="#" label="Analisar" bg="#0038A8" color="#FFFFFF" />
    </DemoCard>
  ),
}

export const Success: Story = {
  name: 'Success — Validar',
  render: () => (
    <DemoCard borderColor="#0D9488">
      <CardBody tag="PRD-VLV-007" description="Reabilitacao concluida" />
      <CardCtaFooter href="#" label="Validar" bg="#16A34A" color="#FFFFFF" />
    </DemoCard>
  ),
}

export const Danger: Story = {
  name: 'Danger — Ver agora',
  render: () => (
    <DemoCard borderColor="#DC2626">
      <CardBody tag="PRD-BOM-012" description="Prazo maximo atingido" />
      <CardCtaFooter href="#" label="Ver agora" bg="#DC2626" color="#FFFFFF" />
    </DemoCard>
  ),
}

export const Secondary: Story = {
  name: 'Secondary — Acompanhar',
  render: () => (
    <DemoCard>
      <CardBody tag="PRD-MOT-009" description="Em execucao de campo" />
      <CardCtaFooter href="#" label="Acompanhar" bg="#EBF0FB" color="#0038A8" />
    </DemoCard>
  ),
}

export const TodasVariantes: Story = {
  name: 'Todas as variantes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DemoCard>
        <CardBody tag="PRD-MOT-003" description="Aguardando aprovacao N1" />
        <CardCtaFooter href="#" label="Analisar" bg="#0038A8" color="#FFFFFF" />
      </DemoCard>

      <DemoCard borderColor="#0D9488">
        <CardBody tag="PRD-VLV-007" description="Reabilitacao concluida" />
        <CardCtaFooter href="#" label="Validar" bg="#16A34A" color="#FFFFFF" />
      </DemoCard>

      <DemoCard borderColor="#DC2626">
        <CardBody tag="PRD-BOM-012" description="Prazo maximo atingido" />
        <CardCtaFooter href="#" label="Ver agora" bg="#DC2626" color="#FFFFFF" />
      </DemoCard>

      <DemoCard>
        <CardBody tag="PRD-MOT-009" description="Em execucao de campo" />
        <CardCtaFooter href="#" label="Acompanhar" bg="#EBF0FB" color="#0038A8" />
      </DemoCard>
    </div>
  ),
}
