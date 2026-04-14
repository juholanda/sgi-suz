import { prisma } from '@/lib/db'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

const TIME_BASED_LABELS: Record<StatusSolicitacao, string> = {
  EM_APROVACAO: 'Em aprovação há',
  EXECUCAO_AUTORIZADA: 'Aguardando execução há',
  DESABILITADO: 'Desabilitado há',
  EM_VALIDACAO_DA_REABILITACAO: 'Aguardando validação há',
  RASCUNHO: 'Criado há',
  EM_EXECUCAO: 'Em execução há',
  EM_REABILITACAO: 'Em reabilitação há',
  ENCERRADA: 'Encerrada há',
  REJEITADA: 'Rejeitada há',
  CANCELADA: 'Cancelada há',
  EXTENSAO_EM_ANALISE: 'Extensão em análise há',
}

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

  function getTimeReferenceLabel(status: StatusSolicitacao, date: Date | null | undefined) {
    if (!date) return null
    return `${TIME_BASED_LABELS[status]} ${formatDistanceToNow(date, { locale: ptBR, addSuffix: false })}`
  }

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
              <StatusBadge status={card.status} size="sm" />
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
              <StatusBadge status={group.status as StatusSolicitacao} />
              <span className="text-sm font-medium" style={{ color: '#374151' }}>{group.label}</span>
              <span className="text-sm" style={{ color: '#6B7280' }}>({group.items.length})</span>
            </div>
            {group.items.length === 0 ? (
              <div
                className="bg-white border px-4 py-6 text-sm"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#94A3B8' }}
              >
                Nenhuma solicitação neste status.
              </div>
            ) : (
              <div className="grid gap-3">
                {group.items.map(s => (
                  <Link key={s.id} href={`/solicitacoes/${s.id}`}>
                    <div
                      className="bg-white border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer"
                      style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
                    >
                      {/* TAG */}
                      <div className="flex-shrink-0">
                        <div
                          className="px-3 py-1.5 font-mono text-sm font-semibold"
                          style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}
                        >
                          {s.equipamento.tag}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate" style={{ color: '#0F172A' }}>
                            {s.protocolo}
                          </span>
                          {s.prazoMaximoAtingido && (
                            <span className="text-xs px-1.5 py-0.5 font-medium" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
                              ⚠ Prazo máximo atingido
                            </span>
                          )}
                          {s.prazoPrevitoAtingido && !s.prazoMaximoAtingido && (
                            <span className="text-xs px-1.5 py-0.5 font-medium" style={{ background: '#FEF3C7', color: '#B45309', borderRadius: '4px' }}>
                              ⏱ Prazo previsto atingido
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: '#6B7280' }}>
                          <span>{s.area.planta.nome} · {s.area.nome}</span>
                          <span>·</span>
                          <span>Solicitante: {s.solicitante.nome}</span>
                          {getTimeReferenceLabel(s.status as StatusSolicitacao, s.status === 'DESABILITADO'
                            ? s.dataDesabilitacao
                            : s.status === 'EM_APROVACAO'
                            ? s.dataEnvio
                            : s.status === 'EXECUCAO_AUTORIZADA'
                            ? s.dataAprovacaoFinal
                            : s.status === 'EM_VALIDACAO_DA_REABILITACAO'
                            ? s.dataReabilitacao
                            : s.updatedAt,
                          ) && (
                            <>
                              <span>·</span>
                              <span>
                                {getTimeReferenceLabel(
                                  s.status as StatusSolicitacao,
                                  s.status === 'DESABILITADO'
                                    ? s.dataDesabilitacao
                                    : s.status === 'EM_APROVACAO'
                                    ? s.dataEnvio
                                    : s.status === 'EXECUCAO_AUTORIZADA'
                                    ? s.dataAprovacaoFinal
                                    : s.status === 'EM_VALIDACAO_DA_REABILITACAO'
                                    ? s.dataReabilitacao
                                    : s.updatedAt,
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Classe */}
                      {s.classe && (
                        <ClasseBadge classe={s.classe.numero as ClasseNum} showPrazo size="sm" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
