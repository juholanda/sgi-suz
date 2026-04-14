import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'

const baseData = {
  id: 'sol-1',
  protocolo: '2026-0143',
  status: 'EM_APROVACAO' as const,
  equipamento: {
    tag: 'PSH-2204',
    descricao: 'Chave de alta pressão — Evaporador 2',
  },
  area: {
    nome: 'Operação - Linha 1',
    planta: { nome: 'Planta 1' },
  },
  classe: { numero: 2 },
  periodoInicio: new Date('2026-03-02T08:00:00Z'),
  periodoFim: new Date('2026-03-02T20:00:00Z'),
  dataEnvio: new Date('2026-03-01T07:30:00Z'),
  aprovacoesCount: { aprovadas: 1, total: 3 },
}

const meta: Meta<typeof SolicitacaoCard> = {
  title: 'SGI/Cards/SolicitacaoCard',
  component: SolicitacaoCard,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta
type Story = StoryObj<typeof SolicitacaoCard>

export const EmAprovacao: Story = {
  args: {
    data: { ...baseData, status: 'EM_APROVACAO' },
    href: '/solicitacoes/sol-1',
    actionLabel: 'Analisar',
    actionHref: '/solicitacoes/sol-1',
    primaryColor: '#1D4ED8',
  },
}

export const ExecucaoAutorizada: Story = {
  args: {
    data: { ...baseData, status: 'EXECUCAO_AUTORIZADA', aprovacoesCount: undefined },
    href: '/solicitacoes/sol-1',
    actionLabel: 'Executar desabilitação →',
    actionHref: '/solicitacoes/sol-1/executar',
    primaryColor: '#1D4ED8',
  },
}

export const DesabilitadoComAcoes: Story = {
  args: {
    data: {
      ...baseData,
      status: 'DESABILITADO',
      dataDesabilitacao: new Date(Date.now() - 9 * 60 * 60 * 1000),
      aprovacoesCount: undefined,
    },
    href: '/solicitacoes/sol-1',
    actionLabel: 'Reabilitar',
    actionHref: '/solicitacoes/sol-1/reabilitar',
    secondaryActionLabel: 'Prolongar',
    secondaryActionHref: '/solicitacoes/sol-1/extensao',
    primaryColor: '#2563EB',
  },
}

export const AguardandoValidacao: Story = {
  args: {
    data: {
      ...baseData,
      status: 'EM_VALIDACAO_DA_REABILITACAO',
      dataReabilitacao: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      aprovacoesCount: undefined,
    },
    href: '/solicitacoes/sol-1',
    actionLabel: 'Validar',
    actionHref: '/solicitacoes/sol-1',
    primaryColor: '#16A34A',
  },
}
