import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { tokens, StatusSolicitacao } from '@/lib/tokens'
import Link from 'next/link'
import { TarefasCarrossel } from '@/components/sgi/TarefasCarrossel'
import { buildPlantaScope } from '@/lib/scope'
import DashboardTabs from '@/components/sgi/DashboardTabs'

// ─── Metrics ─────────────────────────────────────────────────────────────────

async function getMetrics(plantaId: string) {
  const scope = buildPlantaScope(plantaId)
  const [
    emAprovacao,
    execucaoAutorizada,
    desabilitados,
    aguardandoValidacao,
    encerradasMes,
    violacoesSla,
  ] = await Promise.all([
    prisma.solicitacao.count({ where: { status: 'EM_APROVACAO', ...scope } }),
    prisma.solicitacao.count({ where: { status: 'EXECUCAO_AUTORIZADA', ...scope } }),
    prisma.solicitacao.count({ where: { status: 'DESABILITADO', ...scope } }),
    prisma.solicitacao.count({ where: { status: 'EM_VALIDACAO_DA_REABILITACAO', ...scope } }),
    prisma.solicitacao.count({
      where: {
        status: 'ENCERRADA',
        dataEncerramento: { gte: new Date(new Date().setDate(1)) },
        ...scope,
      },
    }),
    prisma.solicitacao.count({ where: { prazoMaximoAtingido: true, ...scope } }),
  ])

  return { emAprovacao, execucaoAutorizada, desabilitados, aguardandoValidacao, encerradasMes, violacoesSla }
}

// ─── Tarefas pendentes (carrossel) ──────────────────────────────────────────

import type { PendenciaItem } from '@/components/sgi/TarefasCarrossel'

const PENDENCIA_INCLUDE = {
  equipamento: true,
  area: { include: { planta: true } },
  classe: { select: { numero: true, prazoMaximoDias: true } },
  aprovacoes: {
    where: { tipo: 'DESABILITACAO' as const },
    orderBy: { nivel: 'asc' as const },
    select: { nivel: true, status: true },
  },
} as const

type SolicitacaoPendencia = Awaited<
  ReturnType<typeof prisma.solicitacao.findMany<{ include: typeof PENDENCIA_INCLUDE }>>
>[number]

function getCta(status: string): PendenciaItem['cta'] {
  switch (status) {
    case 'RASCUNHO':
      return { label: 'Continuar', bg: '#0038A8', color: '#FFFFFF' }
    case 'EXECUCAO_AUTORIZADA':
      return { label: 'Executar', bg: '#0038A8', color: '#FFFFFF' }
    case 'EM_APROVACAO':
      return { label: 'Analisar', bg: '#0038A8', color: '#FFFFFF' }
    case 'EM_VALIDACAO_DA_REABILITACAO':
      return { label: 'Analisar', bg: '#0038A8', color: '#FFFFFF' }
    case 'DESABILITADO':
      return { label: 'Ver agora', bg: '#DC2626', color: '#FFFFFF' }
    default:
      return null
  }
}

function serializePendencia(s: SolicitacaoPendencia): PendenciaItem {
  return {
    id: s.id,
    protocolo: s.protocolo,
    status: s.status,
    tipo: s.tipo,
    classe: s.classe ? { numero: s.classe.numero, prazoMaximoDias: s.classe.prazoMaximoDias } : null,
    equipamento: { tag: s.equipamento.tag, descricao: s.equipamento.descricao },
    area: { nome: s.area.nome },
    aprovacoes: s.aprovacoes.map(a => ({ nivel: a.nivel, status: a.status })),
    periodoInicio: s.periodoInicio?.toISOString() ?? null,
    periodoFim: s.periodoFim?.toISOString() ?? null,
    dataDesabilitacao: s.dataDesabilitacao?.toISOString() ?? null,
    prazoMaximoAtingido: s.prazoMaximoAtingido,
    prazoPrevitoAtingido: s.prazoPrevitoAtingido,
    cta: getCta(s.status),
  }
}

async function getTarefasPendentes(userId: string, perfil: string, plantaId: string): Promise<PendenciaItem[]> {
  const scope = buildPlantaScope(plantaId)
  const items: PendenciaItem[] = []
  const seenIds = new Set<string>()

  function addItems(solicitacoes: SolicitacaoPendencia[]) {
    for (const s of solicitacoes) {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id)
        items.push(serializePendencia(s))
      }
    }
  }

  // Rascunhos do solicitante
  if (['SOLICITANTE', 'EXECUTANTE', 'ADMINISTRADOR'].includes(perfil)) {
    addItems(await prisma.solicitacao.findMany({
      where: { solicitanteId: userId, status: 'RASCUNHO', ...scope },
      include: PENDENCIA_INCLUDE,
      take: 10,
    }))
  }

  // Execução autorizada (executante)
  if (['EXECUTANTE', 'SOLICITANTE', 'ADMINISTRADOR'].includes(perfil)) {
    addItems(await prisma.solicitacao.findMany({
      where: {
        OR: [{ executanteId: userId }, { solicitanteId: userId }],
        status: 'EXECUCAO_AUTORIZADA',
        ...scope,
      },
      include: PENDENCIA_INCLUDE,
      take: 10,
    }))
  }

  // Aprovações pendentes (aprovador / gestor / admin)
  if (['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(perfil)) {
    addItems(await prisma.solicitacao.findMany({
      where: {
        status: 'EM_APROVACAO',
        aprovacoes: { some: { aprovadorId: userId, status: 'PENDENTE' } },
        ...scope,
      },
      include: PENDENCIA_INCLUDE,
      take: 10,
    }))
  }

  // Validação de reabilitação (aprovador / gestor / admin)
  if (['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(perfil)) {
    addItems(await prisma.solicitacao.findMany({
      where: {
        status: 'EM_VALIDACAO_DA_REABILITACAO',
        aprovacoes: { some: { aprovadorId: userId } },
        ...scope,
      },
      include: PENDENCIA_INCLUDE,
      take: 10,
    }))
  }

  // Desabilitados com prazo atingido (urgente para todos)
  addItems(await prisma.solicitacao.findMany({
    where: {
      status: 'DESABILITADO',
      prazoMaximoAtingido: true,
      ...scope,
    },
    include: PENDENCIA_INCLUDE,
    take: 5,
  }))

  return items
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

  // Determine effective profile for carrossel
  const effectivePerfil = perfilAtivo || perfis[0]?.perfil || 'SOLICITANTE'

  const [metrics, pendencias, ultimasSolicitacoes] = await Promise.all([
    getMetrics(plantaId),
    getTarefasPendentes(userId, effectivePerfil, plantaId),
    getUltimasSolicitacoes(plantaId),
  ])

  const metricCards = [
    { label: 'Em Aprovação', value: metrics.emAprovacao, status: 'EM_APROVACAO' as StatusSolicitacao, href: '/solicitacoes?tab=andamento', icon: 'pending_actions' },
    { label: 'Exec. Autorizada', value: metrics.execucaoAutorizada, status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao, href: '/solicitacoes?tab=andamento', icon: 'engineering' },
    { label: 'Desabilitados', value: metrics.desabilitados, status: 'DESABILITADO' as StatusSolicitacao, href: '/solicitacoes?tab=andamento', icon: 'lock_open' },
    { label: 'Aguard. Validação', value: metrics.aguardandoValidacao, status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao, href: '/solicitacoes?tab=andamento', icon: 'fact_check' },
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

      {/* ─── Bloco 2: Contadores ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" style={{ marginBottom: 32 }}>
        {metricCards.map(card => {
          const colors = tokens.colors.status[card.status]
          return (
            <Link key={card.status} href={card.href} className="h-full">
              <div
                className="bg-white border cursor-pointer transition-shadow hover:shadow-sm h-full flex items-center justify-between px-3 py-2.5 gap-2"
                style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="material-symbols-outlined shrink-0"
                    style={{
                      fontSize: 15,
                      color: colors.text,
                      lineHeight: 1,
                      background: `${colors.text}14`,
                      borderRadius: '6px',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-hidden="true"
                  >
                    {card.icon}
                  </span>
                  <div className="text-xs leading-tight" style={{ color: '#64748B' }}>{card.label}</div>
                </div>
                <div className="font-bold shrink-0" style={{ fontSize: 14, color: colors.text }}>{card.value}</div>
              </div>
            </Link>
          )
        })}
        <Link href="/solicitacoes?tab=encerradas" className="h-full">
          <div className="bg-white border cursor-pointer transition-shadow hover:shadow-sm h-full flex items-center justify-between px-3 py-2.5 gap-2" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: 15, color: '#10B981', lineHeight: 1, background: '#10B98114', borderRadius: '6px', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">check_circle</span>
              <div className="text-xs leading-tight" style={{ color: '#64748B' }}>Encerradas/mês</div>
            </div>
            <div className="font-bold shrink-0" style={{ fontSize: 14, color: '#10B981' }}>{metrics.encerradasMes}</div>
          </div>
        </Link>
        <div
          className="border h-full flex items-center justify-between px-3 py-2.5 gap-2"
          style={{
            background: metrics.violacoesSla > 0 ? '#FEF2F2' : 'white',
            borderColor: metrics.violacoesSla > 0 ? '#FECACA' : '#E2E8F0',
            borderRadius: '8px',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 15, color: metrics.violacoesSla > 0 ? '#DC2626' : '#10B981', lineHeight: 1, background: metrics.violacoesSla > 0 ? '#DC262614' : '#10B98114', borderRadius: '6px', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">warning</span>
            <div className="text-xs leading-tight" style={{ color: metrics.violacoesSla > 0 ? '#DC2626' : '#64748B' }}>Prazos vencidos</div>
          </div>
          <div className="font-bold shrink-0" style={{ fontSize: 14, color: metrics.violacoesSla > 0 ? '#DC2626' : '#10B981' }}>{metrics.violacoesSla}</div>
        </div>
      </div>

      {/* ─── Minhas pendências ─── */}
      <div style={{ marginBottom: 32 }}>
        <h2 className="flex items-center gap-2" style={{ fontWeight: 500, fontSize: 18, color: '#0F172A', margin: '0 0 12px 0' }}>
          Minhas pendências
          {pendencias.length > 0 && (
            <span style={{ fontWeight: 400, fontSize: 13, color: '#64748B' }}>
              ({pendencias.length})
            </span>
          )}
        </h2>
        <TarefasCarrossel items={pendencias} />
      </div>

      {/* ─── Últimas solicitações ─── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h2 style={{ fontWeight: 500, fontSize: 18, color: '#0F172A', margin: 0 }}>
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
