import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'
import Link from 'next/link'
import { buildPlantaScope } from '@/lib/scope'

const FILTER_CHIPS: Record<string, { label: string; description: string }> = {
  todas:       { label: 'Todas',                       description: '' },
  aguardando:  { label: 'Aguardando minha aprovação',  description: 'EM_APROVACAO ou EM_VALIDACAO' },
  desabilitados: { label: 'Desabilitados',             description: 'DESABILITADO' },
  em_risco:    { label: 'Em risco',                    description: 'Prazo atingido' },
  encerradas:  { label: 'Encerradas',                  description: 'ENCERRADA' },
}

async function getSolicitacoes(filter: string, plantaId: string) {
  const where: any = { ...buildPlantaScope(plantaId) }

  if (filter === 'aguardando') {
    where.status = { in: ['EM_APROVACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'EXTENSAO_EM_ANALISE'] }
  } else if (filter === 'desabilitados') {
    where.status = 'DESABILITADO'
  } else if (filter === 'em_risco') {
    where.AND = [
      { status: 'DESABILITADO' },
      { OR: [{ prazoMaximoAtingido: true }, { prazoPrevitoAtingido: true }] },
    ]
  } else if (filter === 'encerradas') {
    where.status = { in: ['ENCERRADA', 'CANCELADA', 'REJEITADA'] }
  } else {
    where.status = { in: ['EM_APROVACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'EXTENSAO_EM_ANALISE', 'DESABILITADO', 'ENCERRADA', 'CANCELADA', 'REJEITADA'] }
  }

  return prisma.solicitacao.findMany({
    where,
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: { select: { numero: true, prazoMaximoDias: true } },
      solicitante: { select: { nome: true } },
      aprovacoes: {
        orderBy: { nivel: 'asc' },
        select: {
          nivel: true,
          status: true,
          tipo: true,
          aprovador: { select: { nome: true, id: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })
}

async function getCounts(plantaId: string) {
  const scope = buildPlantaScope(plantaId)
  const [aguardando, desabilitados, emRisco, encerradas, todas] = await Promise.all([
    prisma.solicitacao.count({ where: { status: { in: ['EM_APROVACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'EXTENSAO_EM_ANALISE'] }, ...scope } }),
    prisma.solicitacao.count({ where: { status: 'DESABILITADO', ...scope } }),
    prisma.solicitacao.count({ where: { AND: [{ status: 'DESABILITADO' }, { OR: [{ prazoMaximoAtingido: true }, { prazoPrevitoAtingido: true }] }], ...scope } }),
    prisma.solicitacao.count({ where: { status: { in: ['ENCERRADA', 'CANCELADA', 'REJEITADA'] }, ...scope } }),
    prisma.solicitacao.count({ where: { status: { in: ['EM_APROVACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'EXTENSAO_EM_ANALISE', 'DESABILITADO', 'ENCERRADA', 'CANCELADA', 'REJEITADA'] }, ...scope } }),
  ])
  return { todas, aguardando, desabilitados, em_risco: emRisco, encerradas }
}

export default async function AprovacoesPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  const cookieStore = await cookies()
  const plantaId = cookieStore.get('sgi_planta_ativa')?.value ?? ''
  const activeFilter = searchParams.filter && FILTER_CHIPS[searchParams.filter] ? searchParams.filter : 'aguardando'

  const [solicitacoes, counts] = await Promise.all([
    getSolicitacoes(activeFilter, plantaId),
    getCounts(plantaId),
  ])

  const CHIP_COUNTS: Record<string, number> = counts as any

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Aprovações</h1>
        <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Sua fila de trabalho como aprovador</p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5 overflow-x-auto pb-1">
        {Object.entries(FILTER_CHIPS).map(([key, chip]) => {
          const isActive = activeFilter === key
          const count = CHIP_COUNTS[key] ?? 0
          return (
            <Link
              key={key}
              href={key === 'aguardando' ? '/aprovacoes' : `/aprovacoes?filter=${key}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium shrink-0 transition-colors"
              style={{
                borderRadius: '20px',
                border: isActive ? '1.5px solid #0038A8' : '1.5px solid #E2E8F0',
                background: isActive ? '#EBF0FB' : 'white',
                color: isActive ? '#0038A8' : '#475569',
              }}
            >
              {chip.label}
              {count > 0 && (
                <span
                  className="px-1.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: isActive ? '#0038A8' : '#F1F5F9',
                    color: isActive ? 'white' : '#64748B',
                    borderRadius: '10px',
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Results */}
      {solicitacoes.length === 0 ? (
        <div className="text-center py-16 bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#CBD5E1', display: 'block', marginBottom: 12 }}>
            task_alt
          </span>
          <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>
            {activeFilter === 'aguardando' ? 'Nenhuma solicitação aguardando aprovação.' : 'Nenhuma solicitação encontrada.'}
          </p>
          {activeFilter === 'aguardando' && (
            <p className="text-xs mt-1" style={{ color: '#CBD5E1' }}>Você está em dia com suas aprovações.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {solicitacoes.map(s => {
            const minhaPendente = userId
              ? s.aprovacoes.some(a => a.aprovador.id === userId && a.status === 'PENDENTE')
              : false

            return (
              <div key={s.id} className="relative">
                {minhaPendente && (
                  <div
                    className="absolute top-2 right-2 z-20 px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ background: '#0038A8', borderRadius: '10px' }}
                  >
                    Sua aprovação é necessária
                  </div>
                )}
                <SolicitacaoCard
                  id={s.id}
                  protocolo={s.protocolo}
                  status={s.status}
                  tipo={s.tipo}
                  classe={s.classe ? { numero: s.classe.numero, prazoMaxDias: s.classe.prazoMaximoDias } : null}
                  equipamento={{ tag: s.equipamento.tag, descricao: s.equipamento.descricao }}
                  area={{ nome: s.area.nome }}
                  planta={{ nome: s.area.planta.nome }}
                  solicitante={{ nome: s.solicitante.nome }}
                  periodoInicio={s.periodoInicio}
                  periodoFim={s.periodoFim}
                  dataDesabilitacao={s.dataDesabilitacao}
                  prazoMaximoAtingido={s.prazoMaximoAtingido}
                  prazoPrevitoAtingido={s.prazoPrevitoAtingido}
                  aprovacoes={s.aprovacoes}
                  isAprovador={true}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
