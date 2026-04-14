import { prisma } from '@/lib/db'
import { PageBreadcrumb } from '@/components/sgi/PageBreadcrumb'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'
import { StatusSolicitacao } from '@/lib/tokens'
import Link from 'next/link'

const WORKLIST_STATUSES: StatusSolicitacao[] = [
  'EM_APROVACAO',
  'EXECUCAO_AUTORIZADA',
  'DESABILITADO',
  'EM_VALIDACAO_DA_REABILITACAO',
]

const WORKLIST_SECTIONS = [
  { status: 'EM_APROVACAO' as StatusSolicitacao, label: 'Desabilitação em Aprovação' },
  { status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao, label: 'Desabilitação Autorizada' },
  { status: 'DESABILITADO' as StatusSolicitacao, label: 'Desabilitado (para Reabilitar)' },
  {
    status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao,
    label: 'Reabilitação Aguardando Validação',
  },
]

async function getWorklistData() {
  const solicitacoes = await prisma.solicitacao.findMany({
    where: { status: { in: WORKLIST_STATUSES } },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
      executante: { select: { nome: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  const counters = await Promise.all(
    WORKLIST_STATUSES.map(status =>
      prisma.solicitacao.count({
        where: { status },
      }),
    ),
  )

  return {
    solicitacoes,
    counters: {
      EM_APROVACAO: counters[0],
      EXECUCAO_AUTORIZADA: counters[1],
      DESABILITADO: counters[2],
      EM_VALIDACAO_DA_REABILITACAO: counters[3],
    },
  }
}

export default async function SolicitacoesPage() {
  const { solicitacoes, counters } = await getWorklistData()

  const grouped = WORKLIST_SECTIONS.map(g => ({
    ...g,
    items: solicitacoes.filter(s => s.status === g.status),
  }))

  const metricCards = [
    {
      key: 'EM_APROVACAO',
      label: 'Em Autorização para Execução',
      value: counters.EM_APROVACAO,
      status: 'EM_APROVACAO' as StatusSolicitacao,
    },
    {
      key: 'EXECUCAO_AUTORIZADA',
      label: 'Execução Autorizada',
      value: counters.EXECUCAO_AUTORIZADA,
      status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao,
    },
    {
      key: 'DESABILITADO',
      label: 'Desabilitado',
      value: counters.DESABILITADO,
      status: 'DESABILITADO' as StatusSolicitacao,
    },
    {
      key: 'EM_VALIDACAO_DA_REABILITACAO',
      label: 'Reabilitação aguardando validação',
      value: counters.EM_VALIDACAO_DA_REABILITACAO,
      status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao,
    },
  ]

  return (
    <div className="p-6">
        <PageBreadcrumb
          backHref="/dashboard"
          items={[
            { label: 'Início', href: '/dashboard' },
            { label: 'Solicitações' },
          ]}
        />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Solicitações</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Worklist de intertravamentos</p>
        </div>
        <Link
          href="/solicitacoes/nova"
          className="px-4 py-2 text-sm font-medium text-white"
          style={{ background: '#0038A8', borderRadius: '4px' }}
        >
          + Nova Solicitação
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map(card => (
          <div
            key={card.key}
            className="bg-white p-4 border"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#475569' }}>
                {card.label}
              </span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#0F172A' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.status}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold" style={{ color: '#334155' }}>{group.label}</span>
              <span className="text-sm" style={{ color: '#6B7280' }}>({group.items.length})</span>
            </div>
            {group.items.length === 0 ? (
              <div
                className="bg-white border px-4 py-10 text-sm flex flex-col items-center gap-2"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#94A3B8' }}
              >
                <span style={{ fontSize: '20px' }}>🗂️</span>
                <span>Nenhuma solicitação encontrada</span>
                <Link href="/solicitacoes/nova" className="text-xs font-medium" style={{ color: '#0038A8' }}>
                  Criar nova solicitação
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {group.items.map(s => (
                  <SolicitacaoCard
                    key={s.id}
                    data={{
                      id: s.id,
                      protocolo: s.protocolo,
                      status: s.status as StatusSolicitacao,
                      equipamento: { tag: s.equipamento.tag, descricao: s.equipamento.descricao },
                      area: { nome: s.area.nome, planta: { nome: s.area.planta.nome } },
                      classe: s.classe ? { numero: s.classe.numero } : null,
                      periodoInicio: s.periodoInicio,
                      periodoFim: s.periodoFim,
                      dataEnvio: s.dataEnvio,
                      dataAprovacaoFinal: s.dataAprovacaoFinal,
                      dataDesabilitacao: s.dataDesabilitacao,
                      dataReabilitacao: s.dataReabilitacao,
                      prazoPrevitoAtingido: s.prazoPrevitoAtingido,
                      prazoMaximoAtingido: s.prazoMaximoAtingido,
                    }}
                    actionHref={`/solicitacoes/${s.id}`}
                    actionLabel={
                      s.status === 'EXECUCAO_AUTORIZADA'
                        ? 'Executar desabilitação →'
                        : s.status === 'EM_APROVACAO'
                        ? 'Analisar'
                        : s.status === 'DESABILITADO'
                        ? 'Reabilitar'
                        : s.status === 'EM_VALIDACAO_DA_REABILITACAO'
                        ? 'Validar'
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
