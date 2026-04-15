import type { Meta, StoryObj } from '@storybook/react'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { StatusSolicitacao } from '@/lib/tokens'

const meta: Meta<typeof StatusBadge> = {
  title: 'Design System/Status Badge',
  component: StatusBadge,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof StatusBadge>

const ALL_STATUSES: StatusSolicitacao[] = [
  'RASCUNHO',
  'EM_APROVACAO',
  'EXECUCAO_AUTORIZADA',
  'DESABILITADO',
  'EM_VALIDACAO_DA_REABILITACAO',
  'ENCERRADA',
  'REJEITADA',
  'CANCELADA',
  'EXTENSAO_EM_ANALISE',
]

export const TodosOsStatus: Story = {
  name: 'Todos os status',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
        Badges em formato pill — border-radius 100px, height 24px, padding 0px 8px, Inter Medium 12px.
        <br />A cor da borda esquerda do card sempre usa a cor mais escura do status.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {ALL_STATUSES.map(s => (
          <StatusBadge key={s} status={s} />
        ))}
      </div>
    </div>
  ),
}

export const Rascunho: Story = { args: { status: 'RASCUNHO' } }
export const EmAprovacao: Story = { name: 'Em aprovação', args: { status: 'EM_APROVACAO' } }
export const ExecucaoAutorizada: Story = { name: 'Execução autorizada', args: { status: 'EXECUCAO_AUTORIZADA' } }
export const Desabilitado: Story = { args: { status: 'DESABILITADO' } }
export const EmValidacao: Story = { name: 'Em validação da reabilitação', args: { status: 'EM_VALIDACAO_DA_REABILITACAO' } }
export const Encerrada: Story = { args: { status: 'ENCERRADA' } }
export const Rejeitada: Story = { args: { status: 'REJEITADA' } }
export const Cancelada: Story = { args: { status: 'CANCELADA' } }
