import type { Meta, StoryObj } from '@storybook/react'
import { ActionFooter } from '@/components/design-system/ActionFooter'
import { Button } from '@/components/design-system/Button'

const meta: Meta<typeof ActionFooter> = {
  title: 'Design System/ActionFooter',
  component: ActionFooter,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sticky bottom bar for page-level CTA buttons. Uses `position: sticky; bottom: 0` inside the nearest scroll container (`<main>`). On mobile it clears the MobileNav (`bottom-20`); on desktop `bottom-0`. White background with an upward drop shadow.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ActionFooter>

/** Page wrapper helper for stories so sticky positioning is visible */
function PageDemo({ children, content }: { children: React.ReactNode; content?: string }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '24px', maxWidth: 896, margin: '0 auto', width: '100%' }}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E2E8F0', padding: 24, marginBottom: 16 }}>
          <div style={{ height: 12, background: '#E2E8F0', borderRadius: 4, marginBottom: 8, width: '60%' }} />
          <div style={{ height: 12, background: '#E2E8F0', borderRadius: 4, width: '40%' }} />
        </div>
        {content === 'tall' && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 8, border: '1px solid #E2E8F0', padding: 24, marginBottom: 16 }}>
            <div style={{ height: 80, background: '#F8FAFC', borderRadius: 4 }} />
          </div>
        ))}
      </div>
      {children}
    </div>
  )
}

export const Executor: Story = {
  name: 'Executor — Iniciar Execução',
  render: () => (
    <PageDemo>
      <ActionFooter>
        <Button variant="primary" size="md" leadingIcon="engineering">
          Iniciar Execução em Campo
        </Button>
        <Button variant="outline" size="md" style={{ color: '#DC2626', borderColor: '#E2E8F0' }}>
          Cancelar solicitação
        </Button>
      </ActionFooter>
    </PageDemo>
  ),
}

export const Aprovador: Story = {
  name: 'Aprovador — Aprovar / Rejeitar',
  render: () => (
    <PageDemo>
      <ActionFooter>
        <Button variant="primary" size="md" leadingIcon="check_circle" style={{ background: '#16A34A' }}>
          ✓ Aprovar
        </Button>
        <Button variant="primary" size="md" leadingIcon="cancel" style={{ background: '#DC2626' }}>
          ✕ Rejeitar
        </Button>
      </ActionFooter>
    </PageDemo>
  ),
}

export const ValidarReabilitacao: Story = {
  name: 'Aprovador — Validar Reabilitação',
  render: () => (
    <PageDemo>
      <ActionFooter>
        <Button variant="primary" size="md" style={{ background: '#10B981' }}>
          ✓ Validar e Encerrar
        </Button>
        <Button variant="outline" size="md" style={{ color: '#DC2626', borderColor: '#DC2626' }}>
          Devolver — Corrigir
        </Button>
      </ActionFooter>
    </PageDemo>
  ),
}

export const Reabilitar: Story = {
  name: 'Solicitante — Reabilitar',
  render: () => (
    <PageDemo>
      <ActionFooter>
        <Button variant="primary" size="md" style={{ background: '#8B5CF6' }}>
          Iniciar Reabilitação
        </Button>
      </ActionFooter>
    </PageDemo>
  ),
}

export const ComPaginaLonga: Story = {
  name: 'Com página longa (scroll)',
  parameters: {
    docs: {
      description: { story: 'Footer fica visível enquanto o usuário rola o conteúdo.' },
    },
  },
  render: () => (
    <PageDemo content="tall">
      <ActionFooter>
        <Button variant="primary" size="md">
          Ação principal
        </Button>
        <Button variant="outline" size="md">
          Ação secundária
        </Button>
      </ActionFooter>
    </PageDemo>
  ),
}
