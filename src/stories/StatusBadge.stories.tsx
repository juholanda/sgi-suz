import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import type { StatusSolicitacao } from '@/lib/tokens'

const allStatuses: StatusSolicitacao[] = [
  'RASCUNHO',
  'EM_APROVACAO',
  'EXECUCAO_AUTORIZADA',
  'EM_EXECUCAO',
  'DESABILITADO',
  'EM_REABILITACAO',
  'EM_VALIDACAO_DA_REABILITACAO',
  'ENCERRADA',
  'REJEITADA',
  'CANCELADA',
  'EXTENSAO_EM_ANALISE',
]

const meta: Meta<typeof StatusBadge> = {
  title: 'SGI/Badges/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
  },
  args: {
    status: 'EM_APROVACAO',
    size: 'md',
  },
  argTypes: {
    status: { control: 'select', options: allStatuses },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
}

export default meta
type Story = StoryObj<typeof StatusBadge>

export const Playground: Story = {}

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 680 }}>
      {allStatuses.map(status => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  ),
}
