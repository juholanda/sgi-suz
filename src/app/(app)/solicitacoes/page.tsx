import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'
import Link from 'next/link'
import { SolicitacoesFilters } from './SolicitacoesFilters'
import { DeleteRascunhoButton } from './DeleteRascunhoButton'
import SolicitacoesTable from './SolicitacoesTable'
import { buildPlantaScope, getAreasForPlanta } from '@/lib/scope'

// ─── Universal tabs (same as dashboard) ──────────────────────────────────────

const TABS = [
  { key: 'todas',      label: 'Todas',         icon: 'list' },
  { key: 'andamento',  label: 'Em andamento',  icon: 'sync' },
  { key: 'encerradas', label: 'Encerradas',    icon: 'check_circle' },
  { key: 'rascunhos',  label: 'Rascunhos',     icon: 'draft' },
] as const

type TabKey = typeof TABS[number]['key']

const ANDAMENTO_STATUSES = [
  'EM_APROVACAO',
  'EXECUCAO_AUTORIZADA',
  'EM_EXECUCAO',
  'DESABILITADO',
  'EM_REABILITACAO',
  'EM_VALIDACAO_DA_REABILITACAO',
  'EXTENSAO_EM_ANALISE',
]

const ENCERRADAS_STATUSES = ['ENCERRADA', 'CANCELADA', 'REJEITADA']

// ─── Data fetching ────────────────────────────────────────────────────────────

const PRISMA_INCLUDE = {
  equipamento: true,
  area: { include: { planta: true } },
  classe: { select: { numero: true, prazoMaximoDias: true } },
  solicitante: { select: { nome: true } },
  executante: { select: { nome: true } },
  aprovacoes: {
    where: { tipo: 'DESABILITACAO' as const },
    orderBy: { nivel: 'asc' as const },
    select: { nivel: true, status: true, aprovador: { select: { nome: true } } },
  },
}

function applyCommonFilters(where: any, opts: { search?: string; classes?: number[]; areaId?: string; tipo?: string; statusFiltro?: string }) {
  if (opts.statusFiltro) where = { AND: [where, { status: opts.statusFiltro }] }
  if (opts.tipo) where = { AND: [where, { tipo: opts.tipo }] }
  if (opts.areaId) where = { AND: [where, { areaId: opts.areaId }] }
  if (opts.classes && opts.classes.length > 0) {
    where = { AND: [where, { classe: { numero: { in: opts.classes } } }] }
  }
  if (opts.search) {
    const s = opts.search
    where = {
      AND: [where, {
        OR: [
          { equipamento: { tag: { contains: s, mode: 'insensitive' } } },
          { protocolo: { contains: s, mode: 'insensitive' } },
          { solicitante: { nome: { contains: s, mode: 'insensitive' } } },
        ],
      }],
    }
  }
  return where
}

function buildOrderBy(sort?: string) {
  if (sort === 'antigas') return { createdAt: 'asc' as const }
  if (sort === 'prazo') return { periodoFim: 'asc' as const }
  return { updatedAt: 'desc' as const }
}

function getTabWhere(tab: TabKey): any {
  switch (tab) {
    case 'andamento':
      return { status: { in: ANDAMENTO_STATUSES } }
    case 'encerradas':
      return { status: { in: ENCERRADAS_STATUSES } }
    case 'rascunhos':
      return { status: 'RASCUNHO' }
    case 'todas':
    default:
      return {}
  }
}

function getBaseWhere(perfilAtivo: string | undefined, userId: string, plantaId: string): any {
  // Solicitante/Executante only see their own
  if (!perfilAtivo || perfilAtivo === 'SOLICITANTE' || perfilAtivo === 'EXECUTANTE') {
    return {
      OR: [{ solicitanteId: userId }, { executanteId: userId }],
      ...buildPlantaScope(plantaId),
    }
  }
  // Aprovador, Gestor, Admin see all in planta
  return { ...buildPlantaScope(plantaId) }
}

async function getSolicitacoes(opts: {
  tab: TabKey
  userId: string
  plantaId: string
  perfilAtivo?: string
  search?: string
  classes?: number[]
  areaId?: string
  sort?: string
  tipo?: string
  statusFiltro?: string
}) {
  const baseWhere = getBaseWhere(opts.perfilAtivo, opts.userId, opts.plantaId)
  const tabWhere = getTabWhere(opts.tab)

  let finalWhere: any = { AND: [baseWhere, tabWhere] }
  finalWhere = applyCommonFilters(finalWhere, opts)

  return prisma.solicitacao.findMany({
    where: finalWhere,
    include: PRISMA_INCLUDE,
    orderBy: buildOrderBy(opts.sort),
    take: 100,
  })
}

// ─── Tab counts ──────────────────────────────────────────────────────────────

async function getTabCounts(baseWhere: any) {
  const [todas, andamento, encerradas, rascunhos] = await Promise.all([
    prisma.solicitacao.count({ where: baseWhere }),
    prisma.solicitacao.count({ where: { AND: [baseWhere, { status: { in: ANDAMENTO_STATUSES } }] } }),
    prisma.solicitacao.count({ where: { AND: [baseWhere, { status: { in: ENCERRADAS_STATUSES } }] } }),
    prisma.solicitacao.count({ where: { AND: [baseWhere, { status: 'RASCUNHO' }] } }),
  ])
  return { todas, andamento, encerradas, rascunhos }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: {
    filter?: string
    tab?: string
    search?: string
    classe?: string
    areaId?: string
    sort?: string
    view?: string
    tipo?: string
    statusFiltro?: string
    sortCol?: string
    sortDir?: string
  }
}) {
  const session = await auth()
  const userId = ((session?.user as any)?.id ?? (session?.user as any)?.sub) as string
  const cookieStore = await cookies()
  const perfilAtivo = cookieStore.get('sgi_perfil_ativo')?.value

  const isSolicitante = ['SOLICITANTE', 'EXECUTANTE'].includes(perfilAtivo ?? '')
  const isExecutante = ['EXECUTANTE', 'ADMINISTRADOR'].includes(perfilAtivo ?? '')
  const isAprovador = ['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(perfilAtivo ?? '')

  const search = searchParams.search?.trim() || undefined
  const classes = (searchParams.classe ?? '').split(',').map(Number).filter(n => n >= 1 && n <= 4)
  const areaId = searchParams.areaId || undefined
  const sort = searchParams.sort || 'recentes'
  const view = searchParams.view || 'table'
  const tipo = searchParams.tipo || undefined
  const statusFiltro = searchParams.statusFiltro || undefined

  // ── Planta scope ──
  const plantaId = cookieStore.get('sgi_planta_ativa')?.value ?? ''

  // ── Active tab ──
  const validTabs = TABS.map(t => t.key)
  const activeTab: TabKey = validTabs.includes(searchParams.tab as TabKey) ? (searchParams.tab as TabKey) : 'todas'

  // ── Base where for counts ──
  const baseWhere = getBaseWhere(perfilAtivo, userId, plantaId)

  // ── Data fetching ──
  const [areas, solicitacoes, tabCounts] = await Promise.all([
    getAreasForPlanta(plantaId),
    getSolicitacoes({
      tab: activeTab,
      userId,
      plantaId,
      perfilAtivo,
      search,
      classes,
      areaId,
      sort,
      tipo,
      statusFiltro,
    }),
    getTabCounts(baseWhere),
  ])

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Solicitações</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            {tabCounts.todas} {tabCounts.todas === 1 ? 'solicitação' : 'solicitações'} no total
          </p>
        </div>
        {isSolicitante && (
          <Link
            href="/solicitacoes/nova"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#0038A8', borderRadius: '4px' }}
          >
            + Nova Solicitação
          </Link>
        )}
      </div>

      {/* Tabs + filtros (bloco branco) */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '0 20px 16px',
          marginBottom: 16,
        }}
      >
        {/* Tabs */}
        <div
          className="flex gap-0 overflow-x-auto"
          style={{ borderBottom: '1px solid #E2E8F0', scrollbarWidth: 'none' }}
        >
          {TABS.map(t => {
            const isActive = activeTab === t.key
            const count = tabCounts[t.key]
            const params = new URLSearchParams(searchParams as any)
            if (t.key === 'todas') params.delete('tab')
            else params.set('tab', t.key)
            return (
              <Link
                key={t.key}
                href={`/solicitacoes?${params.toString()}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#0038A8' : '#64748B',
                  background: 'none',
                  borderBottom: isActive ? '2px solid #0038A8' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15, lineHeight: 1 }}>
                  {t.icon}
                </span>
                {t.label}
                {count > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: isActive ? '#EBF0FB' : '#F1F5F9',
                      color: isActive ? '#0038A8' : '#94A3B8',
                      lineHeight: '16px',
                    }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Search + filters + view toggle */}
        <div style={{ paddingTop: 16 }}>
          <SolicitacoesFilters areas={areas.map(a => ({ id: a.id, nome: a.nome, planta: { nome: a.planta.nome } }))} showViewToggle />
        </div>
      </div>

      {/* Results */}
      {solicitacoes.length === 0 ? (
        <div className="text-center py-16 bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#CBD5E1', display: 'block', marginBottom: 12 }}>
            {activeTab === 'rascunhos' ? 'draft' : activeTab === 'encerradas' ? 'check_circle' : 'description'}
          </span>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            {activeTab === 'rascunhos'
              ? 'Nenhum rascunho encontrado.'
              : activeTab === 'encerradas'
              ? 'Nenhuma solicitação encerrada.'
              : activeTab === 'andamento'
              ? 'Nenhuma solicitação em andamento.'
              : 'Nenhuma solicitação encontrada.'}
          </p>
          {activeTab === 'todas' && isSolicitante && (
            <Link href="/solicitacoes/nova" className="inline-block mt-3 text-sm" style={{ color: '#0038A8' }}>
              Criar nova solicitação →
            </Link>
          )}
        </div>
      ) : view === 'table' ? (
        <>
          <SolicitacoesTable solicitacoes={solicitacoes} />
          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-2">
            {solicitacoes.map(s => (
              <div key={s.id} style={{ position: 'relative' }}>
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
                  isAprovador={isAprovador}
                  isSolicitante={isSolicitante}
                  isExecutante={isExecutante}
                />
                {isSolicitante && s.status === 'RASCUNHO' && (
                  <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                    <DeleteRascunhoButton id={s.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Card view */
        <div className="flex flex-col gap-2">
          {solicitacoes.map(s => (
            <div key={s.id} style={{ position: 'relative' }}>
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
                isAprovador={isAprovador}
                isSolicitante={isSolicitante}
                isExecutante={isExecutante}
              />
              {isSolicitante && s.status === 'RASCUNHO' && (
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                  <DeleteRascunhoButton id={s.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      {isSolicitante && (
        <Link
          href="/solicitacoes/nova"
          className="sm:hidden fixed bottom-20 right-4 w-12 h-12 flex items-center justify-center text-white text-xl shadow-lg"
          style={{ background: '#0038A8', borderRadius: '50%', zIndex: 40 }}
        >
          +
        </Link>
      )}
    </div>
  )
}
