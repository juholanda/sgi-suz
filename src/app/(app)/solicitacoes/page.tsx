import { prisma } from '@/lib/db'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'
import { StatusSolicitacao, ClasseNum, tokens } from '@/lib/tokens'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SolicitacoesFilters } from './SolicitacoesFilters'

const FILTER_GROUPS: Record<string, { label: string; statuses: string[] }> = {
  todas:      { label: 'Todas',        statuses: [] },
  andamento:  { label: 'Em andamento', statuses: ['EM_APROVACAO', 'EXECUCAO_AUTORIZADA', 'EM_EXECUCAO', 'DESABILITADO', 'EM_REABILITACAO', 'EM_VALIDACAO_DA_REABILITACAO'] },
  encerradas: { label: 'Encerradas',   statuses: ['ENCERRADA', 'CANCELADA', 'REJEITADA'] },
  rascunho:   { label: 'Rascunho',     statuses: ['RASCUNHO'] },
}

async function getSolicitacoes(opts: {
  filter: string
  search?: string
  classes?: number[]
  areaId?: string
  sort?: string
}) {
  const group = FILTER_GROUPS[opts.filter] ?? FILTER_GROUPS.todas
  const statuses = group.statuses

  const orderBy: any =
    opts.sort === 'antigas' ? { createdAt: 'asc' } :
    opts.sort === 'prazo' ? { periodoFim: 'asc' } :
    { updatedAt: 'desc' }

  const where: any = {}
  if (statuses.length > 0) where.status = { in: statuses }
  if (opts.areaId) where.areaId = opts.areaId
  if (opts.classes && opts.classes.length > 0) {
    where.classe = { numero: { in: opts.classes } }
  }
  if (opts.search) {
    const s = opts.search
    where.OR = [
      { equipamento: { tag: { contains: s, mode: 'insensitive' } } },
      { protocolo: { contains: s, mode: 'insensitive' } },
      { solicitante: { nome: { contains: s, mode: 'insensitive' } } },
    ]
  }

  return prisma.solicitacao.findMany({
    where,
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: { select: { numero: true, prazoMaximoDias: true } },
      solicitante: { select: { nome: true } },
      executante: { select: { nome: true } },
      aprovacoes: {
        where: { tipo: 'DESABILITACAO' },
        orderBy: { nivel: 'asc' },
        select: {
          nivel: true,
          status: true,
          aprovador: { select: { nome: true } },
        },
      },
    },
    orderBy,
    take: 100,
  })
}

async function getAreas() {
  return prisma.area.findMany({
    include: { planta: { select: { nome: true } } },
    orderBy: { nome: 'asc' },
  })
}

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: {
    filter?: string
    search?: string
    classe?: string
    areaId?: string
    sort?: string
    view?: string
  }
}) {
  const activeFilter = searchParams.filter && FILTER_GROUPS[searchParams.filter] ? searchParams.filter : 'todas'
  const search = searchParams.search?.trim() || undefined
  const classes = (searchParams.classe ?? '').split(',').map(Number).filter(n => n >= 1 && n <= 4)
  const areaId = searchParams.areaId || undefined
  const sort = searchParams.sort || 'recentes'
  const view = searchParams.view || 'cards'

  const [solicitacoes, areas] = await Promise.all([
    getSolicitacoes({ filter: activeFilter, search, classes, areaId, sort }),
    getAreas(),
  ])

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Solicitações</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            {solicitacoes.length} {solicitacoes.length === 1 ? 'solicitação' : 'solicitações'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="hidden sm:flex items-center border"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}
          >
            {(['cards', 'table'] as const).map(v => (
              <Link
                key={v}
                href={`/solicitacoes?${new URLSearchParams({ ...searchParams, view: v }).toString()}`}
                className="flex items-center justify-center w-8 h-8"
                style={{
                  background: view === v ? '#EBF0FB' : 'white',
                  color: view === v ? '#0038A8' : '#94A3B8',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>
                  {v === 'cards' ? 'view_agenda' : 'table_rows'}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/solicitacoes/nova"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#0038A8', borderRadius: '4px' }}
          >
            + Nova
          </Link>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(FILTER_GROUPS).map(([key, group]) => {
          const isActive = activeFilter === key
          const params = new URLSearchParams(searchParams as any)
          if (key === 'todas') params.delete('filter')
          else params.set('filter', key)
          return (
            <Link
              key={key}
              href={`/solicitacoes?${params.toString()}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                borderRadius: '20px',
                border: isActive ? '1.5px solid #0038A8' : '1.5px solid #E2E8F0',
                background: isActive ? '#EBF0FB' : 'white',
                color: isActive ? '#0038A8' : '#475569',
              }}
            >
              {group.label}
            </Link>
          )
        })}
      </div>

      {/* Filters UI (client component) */}
      <SolicitacoesFilters areas={areas.map(a => ({ id: a.id, nome: a.nome, planta: { nome: a.planta.nome } }))} />

      {/* Results */}
      {solicitacoes.length === 0 ? (
        <div className="text-center py-16 bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#CBD5E1', display: 'block', marginBottom: 12 }}>
            description
          </span>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação encontrada.</p>
          <Link href="/solicitacoes/nova" className="inline-block mt-3 text-sm" style={{ color: '#0038A8' }}>
            Criar primeira solicitação →
          </Link>
        </div>
      ) : view === 'table' ? (
        /* Table view */
        <div className="hidden sm:block overflow-x-auto bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Protocolo', 'TAG', 'Área', 'Classe', 'Status', 'Período', 'Solicitante', 'Ações'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#64748B' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map(s => (
                <tr key={s.id} className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: '#F1F5F9' }}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: '#0038A8' }}>
                    #{s.protocolo}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold" style={{ color: '#0F172A' }}>{s.equipamento.tag}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>
                    {s.area.planta.nome} · {s.area.nome}
                  </td>
                  <td className="px-4 py-3">
                    {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>
                    {s.periodoInicio
                      ? `${format(s.periodoInicio, 'dd/MM/yy', { locale: ptBR })} → ${s.periodoFim ? format(s.periodoFim, 'dd/MM/yy', { locale: ptBR }) : '—'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>
                    {s.solicitante.nome}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/solicitacoes/${s.id}`}
                      className="text-xs font-medium"
                      style={{ color: '#0038A8' }}
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Mobile fallback: show cards */}
        </div>
      ) : null}

      {/* Card view (default on mobile, optional on desktop) */}
      {(view === 'cards' || view === 'table') && (
        <div className={view === 'table' ? 'sm:hidden flex flex-col gap-2' : 'flex flex-col gap-2'}>
          {view === 'table' && solicitacoes.length > 0 && (
            /* Only show cards on mobile when table view is selected */
            solicitacoes.map(s => (
              <SolicitacaoCard
                key={s.id}
                id={s.id}
                protocolo={s.protocolo}
                status={s.status}
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
              />
            ))
          )}
          {view === 'cards' && solicitacoes.length > 0 && solicitacoes.map(s => (
            <SolicitacaoCard
              key={s.id}
              id={s.id}
              protocolo={s.protocolo}
              status={s.status}
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
            />
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/solicitacoes/nova"
        className="sm:hidden fixed bottom-20 right-4 w-12 h-12 flex items-center justify-center text-white text-xl shadow-lg"
        style={{ background: '#0038A8', borderRadius: '50%', zIndex: 40 }}
      >
        +
      </Link>
    </div>
  )
}
