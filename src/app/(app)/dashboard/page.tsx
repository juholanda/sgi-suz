import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { tokens, StatusSolicitacao } from '@/lib/tokens'
import Link from 'next/link'
import { TarefasCarrossel } from '@/components/sgi/TarefasCarrossel'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { buildPlantaScope } from '@/lib/scope'
import DashboardTabs from '@/components/sgi/DashboardTabs'
import type { ClasseNum } from '@/lib/tokens'

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

interface Tarefa {
  id: string
  tag: string
  protocolo: string
  area: string
  planta?: string
  acao: string
  acaoLabel: string
  acaoColor: string
  acaoBg: string
  ctaLabel: string
  ctaColor: string
  urgente?: boolean
}

async function getTarefasPendentes(userId: string, perfil: string, plantaId: string): Promise<Tarefa[]> {
  const scope = buildPlantaScope(plantaId)
  const tarefas: Tarefa[] = []

  // Rascunhos do solicitante
  if (['SOLICITANTE', 'EXECUTANTE', 'ADMINISTRADOR'].includes(perfil)) {
    const rascunhos = await prisma.solicitacao.findMany({
      where: { solicitanteId: userId, status: 'RASCUNHO', ...scope },
      include: { equipamento: true, area: { include: { planta: true } } },
      take: 10,
    })
    for (const s of rascunhos) {
      tarefas.push({
        id: s.id,
        tag: s.equipamento.tag,
        protocolo: s.protocolo,
        area: s.area.nome,
        planta: s.area.planta.nome,
        acao: 'RASCUNHO',
        acaoLabel: 'Rascunho',
        acaoColor: '#475569',
        acaoBg: '#F1F5F9',
        ctaLabel: 'Continuar',
        ctaColor: '#0038A8',
      })
    }
  }

  // Execucao autorizada (executante)
  if (['EXECUTANTE', 'SOLICITANTE', 'ADMINISTRADOR'].includes(perfil)) {
    const execAutorizada = await prisma.solicitacao.findMany({
      where: {
        OR: [{ executanteId: userId }, { solicitanteId: userId }],
        status: 'EXECUCAO_AUTORIZADA',
        ...scope,
      },
      include: { equipamento: true, area: { include: { planta: true } } },
      take: 10,
    })
    for (const s of execAutorizada) {
      tarefas.push({
        id: s.id,
        tag: s.equipamento.tag,
        protocolo: s.protocolo,
        area: s.area.nome,
        planta: s.area.planta.nome,
        acao: 'EXECUTAR',
        acaoLabel: 'Executar',
        acaoColor: '#0038A8',
        acaoBg: '#EBF0FB',
        ctaLabel: 'Executar',
        ctaColor: '#0038A8',
      })
    }
  }

  // Aprovacoes pendentes (aprovador / gestor / admin)
  if (['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(perfil)) {
    const pendentes = await prisma.solicitacao.findMany({
      where: {
        status: 'EM_APROVACAO',
        aprovacoes: { some: { aprovadorId: userId, status: 'PENDENTE' } },
        ...scope,
      },
      include: { equipamento: true, area: { include: { planta: true } } },
      take: 10,
    })
    for (const s of pendentes) {
      tarefas.push({
        id: s.id,
        tag: s.equipamento.tag,
        protocolo: s.protocolo,
        area: s.area.nome,
        planta: s.area.planta.nome,
        acao: 'APROVAR',
        acaoLabel: 'Aprovar',
        acaoColor: '#16A34A',
        acaoBg: '#F0FDF4',
        ctaLabel: 'Analisar',
        ctaColor: '#0038A8',
      })
    }
  }

  // Validacao de reabilitacao (aprovador / gestor / admin)
  if (['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(perfil)) {
    const validacoes = await prisma.solicitacao.findMany({
      where: {
        status: 'EM_VALIDACAO_DA_REABILITACAO',
        aprovacoes: { some: { aprovadorId: userId } },
        ...scope,
      },
      include: { equipamento: true, area: { include: { planta: true } } },
      take: 10,
    })
    for (const s of validacoes) {
      tarefas.push({
        id: s.id,
        tag: s.equipamento.tag,
        protocolo: s.protocolo,
        area: s.area.nome,
        planta: s.area.planta.nome,
        acao: 'VALIDAR',
        acaoLabel: 'Validar',
        acaoColor: '#16A34A',
        acaoBg: '#F0FDF4',
        ctaLabel: 'Validar',
        ctaColor: '#16A34A',
        urgente: s.prazoMaximoAtingido,
      })
    }
  }

  // Desabilitados com prazo atingido (urgente para todos)
  const urgentes = await prisma.solicitacao.findMany({
    where: {
      status: 'DESABILITADO',
      prazoMaximoAtingido: true,
      ...scope,
    },
    include: { equipamento: true, area: { include: { planta: true } } },
    take: 5,
  })
  for (const s of urgentes) {
    if (!tarefas.some(t => t.id === s.id)) {
      tarefas.push({
        id: s.id,
        tag: s.equipamento.tag,
        protocolo: s.protocolo,
        area: s.area.nome,
        planta: s.area.planta.nome,
        acao: 'URGENTE',
        acaoLabel: 'Prazo vencido',
        acaoColor: '#DC2626',
        acaoBg: '#FEF2F2',
        ctaLabel: 'Ver agora',
        ctaColor: '#DC2626',
        urgente: true,
      })
    }
  }

  return tarefas
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

  const [metrics, tarefas, ultimasSolicitacoes] = await Promise.all([
    getMetrics(plantaId),
    getTarefasPendentes(userId, effectivePerfil, plantaId),
    getUltimasSolicitacoes(plantaId),
  ])

  const metricCards = [
    { label: 'Em Aprovacao', value: metrics.emAprovacao, status: 'EM_APROVACAO' as StatusSolicitacao, href: '/solicitacoes?tab=andamento', icon: 'pending_actions' },
    { label: 'Exec. Autorizada', value: metrics.execucaoAutorizada, status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao, href: '/solicitacoes?tab=andamento', icon: 'engineering' },
    { label: 'Desabilitados', value: metrics.desabilitados, status: 'DESABILITADO' as StatusSolicitacao, href: '/solicitacoes?tab=andamento', icon: 'lock_open' },
    { label: 'Aguard. Validacao', value: metrics.aguardandoValidacao, status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao, href: '/solicitacoes?tab=andamento', icon: 'fact_check' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-full">

      {/* ─── Bloco 1: Bem-vindo ─── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Bem-vindo(a) a {plantaNome}</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            Ola, {session?.user?.name?.split(' ')[0]}. Veja o que precisa da sua atencao.
          </p>
        </div>
        {isSolicitante && (
          <Link
            href="/solicitacoes/nova"
            className="px-4 py-2 text-sm font-medium text-white hidden sm:flex items-center gap-2"
            style={{ background: '#0038A8', borderRadius: '4px' }}
          >
            + Nova Solicitacao
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
              <div className="text-xs leading-tight" style={{ color: '#64748B' }}>Encerradas/mes</div>
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
        <h2 className="flex items-center gap-2" style={{ fontWeight: 600, fontSize: 16, color: '#0F172A', margin: '0 0 12px 0' }}>
          Minhas pendencias
          {tarefas.length > 0 && (
            <span style={{ fontWeight: 400, fontSize: 13, color: '#64748B' }}>
              ({tarefas.length})
            </span>
          )}
        </h2>
        <TarefasCarrossel tarefas={tarefas} />
      </div>

      {/* ─── Últimas solicitações ─── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h2 style={{ fontWeight: 600, fontSize: 16, color: '#0F172A', margin: 0 }}>
          Ultimas solicitacoes
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
