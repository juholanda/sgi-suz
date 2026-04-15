import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { tokens } from '@/lib/tokens'
import Link from 'next/link'
import { buildPlantaScope } from '@/lib/scope'
import DashboardTabs from '@/components/sgi/DashboardTabs'

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

// ─── Últimas solicitações (tabela) ──────────────────────────────────────────

const TABELA_INCLUDE = {
  equipamento: true,
  area: { include: { planta: true } },
  classe: { select: { numero: true, prazoMaximoDias: true } },
  solicitante: { select: { nome: true } },
} as const

type SolicitacaoTabela = Awaited<
  ReturnType<typeof prisma.solicitacao.findMany<{ include: typeof TABELA_INCLUDE }>>
>[number]

function serializeSolicitacao(s: SolicitacaoTabela) {
  return {
    id: s.id,
    protocolo: s.protocolo,
    status: s.status,
    tipo: s.tipo,
    tag: s.equipamento.tag,
    descricao: s.equipamento.descricao,
    area: s.area.nome,
    planta: (s.area as any).planta?.nome ?? '',
    classeNumero: s.classe?.numero ?? null,
    solicitante: s.solicitante.nome,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

async function getUltimasSolicitacoes(plantaId: string) {
  const scope = buildPlantaScope(plantaId)

  const [todas, andamento, encerradas, rascunhos] = await Promise.all([
    prisma.solicitacao.findMany({
      where: scope,
      include: TABELA_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.solicitacao.findMany({
      where: {
        status: { in: ['EM_APROVACAO', 'EXECUCAO_AUTORIZADA', 'EM_EXECUCAO', 'DESABILITADO', 'EM_REABILITACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'EXTENSAO_EM_ANALISE'] },
        ...scope,
      },
      include: TABELA_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.solicitacao.findMany({
      where: {
        status: { in: ['ENCERRADA', 'CANCELADA', 'REJEITADA'] },
        ...scope,
      },
      include: TABELA_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.solicitacao.findMany({
      where: { status: 'RASCUNHO', ...scope },
      include: TABELA_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ])

  return {
    todas: todas.map(serializeSolicitacao),
    andamento: andamento.map(serializeSolicitacao),
    encerradas: encerradas.map(serializeSolicitacao),
    rascunhos: rascunhos.map(serializeSolicitacao),
  }
}

// ─── Page component ──────────────────────────────────────────────────────────

export default async function DashboardPage() {
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

  const plantaId = plantaIdCookie ?? ''

  const [metrics, ultimasSolicitacoes] = await Promise.all([
    getMetrics(plantaId),
    getUltimasSolicitacoes(plantaId),
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
      <div className="flex items-center justify-between mb-5">
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
      <div style={{ marginBottom: 32 }}>
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

      {/* ─── Últimas solicitações ─── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h2 style={{ fontWeight: 500, fontSize: 16, color: '#0F172A', margin: 0 }}>
          Últimas solicitações
        </h2>
        <Link
          href="/solicitacoes"
          style={{ fontSize: 13, fontWeight: 500, color: '#0038A8', textDecoration: 'none' }}
        >
          Ver todas →
        </Link>
      </div>
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Tabs + Table (client component) */}
        <DashboardTabs
          todas={ultimasSolicitacoes.todas}
          andamento={ultimasSolicitacoes.andamento}
          encerradas={ultimasSolicitacoes.encerradas}
          rascunhos={ultimasSolicitacoes.rascunhos}
        />
      </div>

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
