import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { buildPlantaScope, getAreasForPlanta } from '@/lib/scope'
import { SolicitacoesFilters } from '@/app/(app)/solicitacoes/SolicitacoesFilters'
import SolicitacoesTable from '@/app/(app)/solicitacoes/SolicitacoesTable'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'

// ─── Metrics ─────────────────────────────────────────────────────────────────

async function getMetrics(plantaId: string) {
  const scope = buildPlantaScope(plantaId)
  const ANDAMENTO = [
    'EM_APROVACAO', 'EXECUCAO_AUTORIZADA', 'EM_EXECUCAO',
    'DESABILITADO', 'EM_REABILITACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'EXTENSAO_EM_ANALISE',
  ]
  const [
    desabilitadosAgora,
    emAprovacao,
    execucaoAutorizada,
    aguardandoValidacao,
    prazosExcedidos,
  ] = await Promise.all([
    prisma.solicitacao.count({ where: { status: 'DESABILITADO', ...scope } }),
    prisma.solicitacao.count({ where: { status: 'EM_APROVACAO', ...scope } }),
    prisma.solicitacao.count({ where: { status: 'EXECUCAO_AUTORIZADA', ...scope } }),
    prisma.solicitacao.count({ where: { status: 'EM_VALIDACAO_DA_REABILITACAO', ...scope } }),
    prisma.solicitacao.count({
      where: { prazoMaximoAtingido: true, status: { in: ANDAMENTO }, ...scope },
    }),
  ])

  return { desabilitadosAgora, emAprovacao, execucaoAutorizada, aguardandoValidacao, prazosExcedidos }
}

// ─── Solicitações (tabela completa com tabs e filtros) ───────────────────────

const TABS = [
  { key: 'todas',      label: 'Todas',         icon: 'list' },
  { key: 'andamento',  label: 'Em andamento',  icon: 'sync' },
  { key: 'encerradas', label: 'Encerradas',    icon: 'check_circle' },
  { key: 'rascunhos',  label: 'Rascunhos',     icon: 'draft' },
] as const

type TabKey = typeof TABS[number]['key']

const ANDAMENTO_STATUSES = [
  'EM_APROVACAO', 'EXECUCAO_AUTORIZADA', 'EM_EXECUCAO',
  'DESABILITADO', 'EM_REABILITACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'EXTENSAO_EM_ANALISE',
]
const ENCERRADAS_STATUSES = ['ENCERRADA', 'CANCELADA', 'REJEITADA']

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

function applyFilters(where: any, opts: { search?: string; classes?: number[]; areaId?: string; tipo?: string; statusFiltro?: string }) {
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
    case 'andamento':  return { status: { in: ANDAMENTO_STATUSES } }
    case 'encerradas': return { status: { in: ENCERRADAS_STATUSES } }
    case 'rascunhos':  return { status: 'RASCUNHO' }
    default:           return {}
  }
}

function getBaseWhere(perfilAtivo: string | undefined, userId: string, plantaId: string): any {
  if (!perfilAtivo || perfilAtivo === 'SOLICITANTE' || perfilAtivo === 'EXECUTANTE') {
    return { OR: [{ solicitanteId: userId }, { executanteId: userId }], ...buildPlantaScope(plantaId) }
  }
  return { ...buildPlantaScope(plantaId) }
}

async function getSolicitacoes(opts: {
  tab: TabKey; userId: string; plantaId: string; perfilAtivo?: string
  search?: string; classes?: number[]; areaId?: string; sort?: string; tipo?: string; statusFiltro?: string
}) {
  const baseWhere = getBaseWhere(opts.perfilAtivo, opts.userId, opts.plantaId)
  let finalWhere: any = { AND: [baseWhere, getTabWhere(opts.tab)] }
  finalWhere = applyFilters(finalWhere, opts)
  return prisma.solicitacao.findMany({
    where: finalWhere,
    include: PRISMA_INCLUDE,
    orderBy: buildOrderBy(opts.sort),
    take: 100,
  })
}

async function getTabCounts(baseWhere: any) {
  const [todas, andamento, encerradas, rascunhos] = await Promise.all([
    prisma.solicitacao.count({ where: baseWhere }),
    prisma.solicitacao.count({ where: { AND: [baseWhere, { status: { in: ANDAMENTO_STATUSES } }] } }),
    prisma.solicitacao.count({ where: { AND: [baseWhere, { status: { in: ENCERRADAS_STATUSES } }] } }),
    prisma.solicitacao.count({ where: { AND: [baseWhere, { status: 'RASCUNHO' }] } }),
  ])
  return { todas, andamento, encerradas, rascunhos }
}

// ─── Page component ──────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: {
    tab?: string
    search?: string
    classe?: string
    areaId?: string
    sort?: string
    tipo?: string
    statusFiltro?: string
    sortCol?: string
    sortDir?: string
    view?: string
  }
}) {
  const session = await auth()
  const userId = ((session?.user as any)?.id ?? (session?.user as any)?.sub) as string

  const cookieStore = await cookies()
  const perfilAtivo = cookieStore.get('sgi_perfil_ativo')?.value ?? ''

  const plantaIdCookie = cookieStore.get('sgi_planta_ativa')?.value
  const plantaAtiva = plantaIdCookie
    ? await prisma.planta.findUnique({ where: { id: plantaIdCookie }, select: { nome: true } })
    : null
  const plantaNome = plantaAtiva?.nome ?? 'SGI'

  const perfis = await prisma.usuarioPerfil.findMany({ where: { userId } })

  const isSolicitante = perfilAtivo
    ? ['SOLICITANTE', 'EXECUTANTE'].includes(perfilAtivo)
    : perfis.some(p => ['SOLICITANTE', 'EXECUTANTE'].includes(p.perfil))

  const isAprovador = ['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(perfilAtivo)
  const isExecutante = ['EXECUTANTE', 'ADMINISTRADOR'].includes(perfilAtivo)

  const plantaId = plantaIdCookie ?? ''

  // ── Parse search params ──
  const search = searchParams.search?.trim() || undefined
  const classes = (searchParams.classe ?? '').split(',').map(Number).filter(n => n >= 1 && n <= 4)
  const areaId = searchParams.areaId || undefined
  const sort = searchParams.sort || 'recentes'
  const tipo = searchParams.tipo || undefined
  const statusFiltro = searchParams.statusFiltro || undefined

  const validTabs = TABS.map(t => t.key)
  const activeTab: TabKey = validTabs.includes(searchParams.tab as TabKey)
    ? (searchParams.tab as TabKey) : 'todas'
  const viewMode = (searchParams as any).view === 'cards' ? 'cards' : 'table'

  const baseWhere = getBaseWhere(perfilAtivo || undefined, userId, plantaId)

  const [metrics, areas, solicitacoes, tabCounts] = await Promise.all([
    getMetrics(plantaId),
    getAreasForPlanta(plantaId),
    getSolicitacoes({
      tab: activeTab, userId, plantaId, perfilAtivo: perfilAtivo || undefined,
      search, classes, areaId, sort, tipo, statusFiltro,
    }),
    getTabCounts(baseWhere),
  ])

  const kpiCards = [
    { label: 'Desabilitados agora', value: metrics.desabilitadosAgora, icon: 'warning', color: '#EA580C', bgColor: '#FFF7ED' },
    { label: 'Em aprovação', value: metrics.emAprovacao, icon: 'hourglass_top', color: '#AC6F00', bgColor: '#FEF5E5' },
    { label: 'Execução autorizada', value: metrics.execucaoAutorizada, icon: 'engineering', color: '#1E40AF', bgColor: '#EFF6FF' },
    { label: 'Aguardando validação', value: metrics.aguardandoValidacao, icon: 'verified', color: '#0D9488', bgColor: '#F0FDFA' },
    { label: 'Prazos excedidos', value: metrics.prazosExcedidos, icon: 'alarm', color: '#DC2626', bgColor: '#FEF2F2' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-full">

      {/* ─── Bloco 1: Bem-vindo ─── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Bem-vindo(a) a {plantaNome}</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            Olá, {session?.user?.name?.split(' ')[0]}. Veja o que precisa da sua atenção.
          </p>
        </div>
        {isSolicitante && (
          <Link
            href="/solicitacoes/nova"
            className="px-4 py-2 text-sm font-medium text-white hidden sm:flex items-center gap-2"
            style={{ background: '#0038A8', borderRadius: '4px' }}
          >
            + Nova Solicitação
          </Link>
        )}
      </div>

      {/* ─── Bloco 2: Situação atual da planta ─── */}
      <div style={{ marginBottom: 40 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>Situação atual da planta</h2>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>— tempo real</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpiCards.map(card => (
            <div
              key={card.label}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: card.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">
                  {card.icon}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bloco 3: Tabs + filtros + tabela ─── */}

      {/* Tabs */}
      <div
        className="flex gap-0 overflow-x-auto mb-4"
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
              href={`/dashboard?${params.toString()}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '10px 16px',
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

      {/* Search + filters */}
      <SolicitacoesFilters areas={areas.map(a => ({ id: a.id, nome: a.nome, planta: { nome: a.planta.nome } }))} />

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
        </div>
      ) : (
        <>
          {viewMode === 'table' && <SolicitacoesTable solicitacoes={solicitacoes} />}
          {/* Cards view (mobile always, desktop when toggled) */}
          <div className={viewMode === 'cards' ? 'flex flex-col gap-2' : 'sm:hidden flex flex-col gap-2'}>
            {solicitacoes.map(s => (
              <SolicitacaoCard
                key={s.id}
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
            ))}
          </div>
        </>
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
