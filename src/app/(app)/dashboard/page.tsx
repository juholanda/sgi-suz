import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { tokens, StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import Link from 'next/link'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'
import { TarefasCarrossel } from '@/components/sgi/TarefasCarrossel'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import SolicitanteDashboard from '@/components/sgi/SolicitanteDashboard'
import type { QuadranteItem } from '@/components/sgi/SolicitanteDashboard'

async function getMetrics() {
  const [
    emAprovacao,
    execucaoAutorizada,
    desabilitados,
    aguardandoValidacao,
    encerradasMes,
    violacoesSla,
  ] = await Promise.all([
    prisma.solicitacao.count({ where: { status: 'EM_APROVACAO' } }),
    prisma.solicitacao.count({ where: { status: 'EXECUCAO_AUTORIZADA' } }),
    prisma.solicitacao.count({ where: { status: 'DESABILITADO' } }),
    prisma.solicitacao.count({ where: { status: 'EM_VALIDACAO_DA_REABILITACAO' } }),
    prisma.solicitacao.count({
      where: {
        status: 'ENCERRADA',
        dataEncerramento: { gte: new Date(new Date().setDate(1)) },
      },
    }),
    prisma.solicitacao.count({ where: { prazoMaximoAtingido: true } }),
  ])

  return { emAprovacao, execucaoAutorizada, desabilitados, aguardandoValidacao, encerradasMes, violacoesSla }
}

async function getUltimasSolicitacoes() {
  return prisma.solicitacao.findMany({
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: { select: { numero: true } },
      solicitante: { select: { nome: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
}

async function getSolicitacoesByStatus(status: string) {
  return prisma.solicitacao.findMany({
    where: { status },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
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
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })
}

async function getTarefasAprovador(userId: string) {
  // Solicitações onde este userId tem aprovação PENDENTE (EM_APROVACAO)
  // ou é o aprovador de maior nível e está em EM_VALIDACAO_DA_REABILITACAO
  return prisma.solicitacao.findMany({
    where: {
      OR: [
        // Aprovação de desabilitação pendente para este usuário
        {
          status: 'EM_APROVACAO',
          aprovacoes: {
            some: {
              aprovadorId: userId,
              status: 'PENDENTE',
              tipo: 'DESABILITACAO',
            },
          },
        },
        // Validação de reabilitação: este usuário foi aprovador e solicitação aguarda validação
        {
          status: 'EM_VALIDACAO_DA_REABILITACAO',
          aprovacoes: {
            some: {
              aprovadorId: userId,
              tipo: 'DESABILITACAO',
            },
          },
        },
      ],
    },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
    },
    orderBy: { dataEnvio: 'asc' },
    take: 10,
  })
}

async function getTarefasSolicitante(userId: string) {
  const now = new Date()
  const tresDias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const [paraExecutar, paraReabilitar, paraProrrogar] = await Promise.all([
    // Para executar: autorizadas onde o usuário é solicitante ou executante
    prisma.solicitacao.findMany({
      where: {
        status: 'EXECUCAO_AUTORIZADA',
        OR: [{ solicitanteId: userId }, { executanteId: userId }],
      },
      include: { equipamento: true, area: true, classe: true },
      orderBy: { dataAprovacaoFinal: 'asc' },
      take: 5,
    }),
    // Para reabilitar: desabilitadas com prazo atingido ou próximo do fim
    prisma.solicitacao.findMany({
      where: {
        AND: [
          { status: 'DESABILITADO' },
          { OR: [{ solicitanteId: userId }, { executanteId: userId }] },
          { OR: [
            { prazoMaximoAtingido: true },
            { prazoPrevitoAtingido: true },
            { periodoFim: { lte: tresDias } },
          ]},
        ],
      },
      include: { equipamento: true, area: true, classe: true },
      orderBy: { periodoFim: 'asc' },
      take: 5,
    }),
    // Para prorrogar: desabilitadas com prazo máximo atingido
    prisma.solicitacao.findMany({
      where: {
        status: 'DESABILITADO',
        prazoMaximoAtingido: true,
        OR: [{ solicitanteId: userId }, { executanteId: userId }],
      },
      include: { equipamento: true, area: true, classe: true },
      orderBy: { periodoFim: 'asc' },
      take: 5,
    }),
  ])

  return { paraExecutar, paraReabilitar, paraProrrogar }
}

async function getSolicitacoesParaQuadrantes(userId: string, isExecutante: boolean) {
  const now = new Date()
  const tresDias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const solicitacoes = await prisma.solicitacao.findMany({
    where: {
      OR: [{ solicitanteId: userId }, { executanteId: userId }],
      status: { notIn: ['ENCERRADA', 'CANCELADA', 'REJEITADA'] },
    },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: { select: { numero: true, prazoMaximoDias: true } },
      aprovacoes: {
        where: { tipo: 'DESABILITACAO' },
        orderBy: { nivel: 'asc' },
        select: { nivel: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const assigned = new Set<string>()
  const q1: QuadranteItem[] = []
  const q2: QuadranteItem[] = []
  const q3: QuadranteItem[] = []
  const q4: QuadranteItem[] = []

  function toItem(s: (typeof solicitacoes)[number]): QuadranteItem {
    return {
      id: s.id,
      protocolo: s.protocolo,
      status: s.status,
      tipo: s.tipo ?? null,
      periodoInicio: s.periodoInicio,
      periodoFim: s.periodoFim,
      dataDesabilitacao: s.dataDesabilitacao,
      prazoMaximoAtingido: s.prazoMaximoAtingido,
      prazoPrevitoAtingido: s.prazoPrevitoAtingido,
      createdAt: s.createdAt,
      equipamento: { tag: s.equipamento.tag, descricao: s.equipamento.descricao },
      area: { nome: s.area.nome, planta: { nome: (s.area as any).planta.nome } },
      classe: s.classe ? { numero: s.classe.numero, prazoMaximoDias: s.classe.prazoMaximoDias } : null,
      aprovacoes: s.aprovacoes.map(a => ({ nivel: a.nivel, status: a.status })),
    }
  }

  // Q1 — Minhas pendências: RASCUNHO + EXECUCAO_AUTORIZADA (sempre, independente do perfil)
  for (const s of solicitacoes) {
    if (s.status === 'RASCUNHO') {
      q1.push(toItem(s)); assigned.add(s.id)
    } else if (s.status === 'EXECUCAO_AUTORIZADA' && !assigned.has(s.id)) {
      q1.push(toItem(s)); assigned.add(s.id)
    }
  }

  // Q2 — Em risco de prazo
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    const nearDeadline =
      s.periodoFim !== null && new Date(s.periodoFim) <= tresDias
    if (
      s.prazoMaximoAtingido ||
      s.prazoPrevitoAtingido ||
      (s.status === 'DESABILITADO' && nearDeadline)
    ) {
      q2.push(toItem(s)); assigned.add(s.id)
    }
  }

  // Q3 — Aguardando terceiros (remove EM_EXECUCAO e EM_REABILITACAO — estados intermediários eliminados)
  const AGUARDANDO_STATUSES = [
    'EM_APROVACAO',
    'EM_VALIDACAO_DA_REABILITACAO',
    'EXTENSAO_EM_ANALISE',
  ]
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (AGUARDANDO_STATUSES.includes(s.status)) {
      q3.push(toItem(s)); assigned.add(s.id)
    }
  }

  // Q4 — Desabilitadas no momento
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (s.status === 'DESABILITADO') {
      q4.push(toItem(s)); assigned.add(s.id)
    }
  }

  return { q1, q2, q3, q4 }
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = ((session?.user as any)?.id ?? (session?.user as any)?.sub) as string

  // Lê o perfil ativo do cookie (definido pelo cliente ao trocar perfil)
  const cookieStore = await cookies()
  const perfilAtivo = cookieStore.get('sgi_perfil_ativo')?.value

  // Fallback: verifica todos os perfis do usuário
  const perfis = await prisma.usuarioPerfil.findMany({ where: { userId } })

  const isAprovador = perfilAtivo
    ? ['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(perfilAtivo)
    : perfis.some(p => ['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(p.perfil))
  const isSolicitante = perfilAtivo
    ? ['SOLICITANTE', 'EXECUTANTE', 'ADMINISTRADOR'].includes(perfilAtivo)
    : perfis.some(p => ['SOLICITANTE', 'EXECUTANTE', 'ADMINISTRADOR'].includes(p.perfil))
  const isExecutante = perfilAtivo
    ? ['EXECUTANTE', 'ADMINISTRADOR'].includes(perfilAtivo)
    : perfis.some(p => ['EXECUTANTE', 'ADMINISTRADOR'].includes(p.perfil))

  const [
    metrics,
    solEmAprovacao,
    solExecucaoAutorizada,
    solDesabilitado,
    solEmValidacao,
    ultimasSolicitacoes,
  ] = await Promise.all([
    getMetrics(),
    getSolicitacoesByStatus('EM_APROVACAO'),
    getSolicitacoesByStatus('EXECUCAO_AUTORIZADA'),
    getSolicitacoesByStatus('DESABILITADO'),
    getSolicitacoesByStatus('EM_VALIDACAO_DA_REABILITACAO'),
    getUltimasSolicitacoes(),
  ])

  const tarefasAprovador = isAprovador ? await getTarefasAprovador(userId) : []
  const tarefasSolicitante = isSolicitante ? await getTarefasSolicitante(userId) : { paraExecutar: [], paraReabilitar: [], paraProrrogar: [] }

  // Perfil puro de solicitante/executante (não admin/aprovador) usa view de quadrantes
  const showSolicitanteView = perfilAtivo
    ? ['SOLICITANTE', 'EXECUTANTE'].includes(perfilAtivo)
    : perfis.some(p => ['SOLICITANTE', 'EXECUTANTE'].includes(p.perfil))

  const quadrantes = showSolicitanteView
    ? await getSolicitacoesParaQuadrantes(userId, isExecutante)
    : null

  const metricCards = [
    { label: 'Em Aprovação',      value: metrics.emAprovacao,          status: 'EM_APROVACAO' as StatusSolicitacao,                   href: '/solicitacoes?filter=andamento',  icon: 'pending_actions' },
    { label: 'Exec. Autorizada',  value: metrics.execucaoAutorizada,   status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao,            href: '/solicitacoes?filter=andamento',  icon: 'engineering' },
    { label: 'Desabilitados',     value: metrics.desabilitados,        status: 'DESABILITADO' as StatusSolicitacao,                   href: '/solicitacoes?filter=andamento',  icon: 'lock_open' },
    { label: 'Aguard. Validação', value: metrics.aguardandoValidacao,  status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao,   href: '/solicitacoes?filter=andamento',  icon: 'fact_check' },
  ]

  // Collect all pending tasks in one unified list (with sortKey for urgency ordering)
  const tarefas: {
    id: string; tag: string; protocolo: string; area: string; planta?: string
    acao: string; acaoLabel: string; acaoColor: string; acaoBg: string
    ctaLabel: string; ctaColor: string; urgente?: boolean
    sortKey: Date
  }[] = [
    ...tarefasAprovador.map(s => ({
      id: s.id,
      tag: s.equipamento.tag,
      protocolo: s.protocolo,
      area: s.area.nome,
      planta: (s.area as any).planta?.nome,
      acao: s.status === 'EM_APROVACAO' ? 'APROVAR' : 'VALIDAR_REAB',
      acaoLabel: s.status === 'EM_APROVACAO' ? 'Aprovar' : 'Validar Reab.',
      acaoColor: '#1D4ED8',
      acaoBg: '#DBEAFE',
      ctaLabel: s.status === 'EM_APROVACAO' ? 'Analisar' : 'Validar',
      ctaColor: '#0038A8',
      urgente: false,
      // Ordenar pelo tempo que está esperando aprovação
      sortKey: s.dataEnvio ?? s.createdAt,
    })),
    ...tarefasSolicitante.paraExecutar.map(s => ({
      id: s.id,
      tag: s.equipamento.tag,
      protocolo: s.protocolo,
      area: s.area.nome,
      acao: 'EXECUTAR',
      acaoLabel: 'Executar',
      acaoColor: '#0E7490',
      acaoBg: '#CFFAFE',
      ctaLabel: 'Executar',
      ctaColor: '#0891B2',
      urgente: false,
      sortKey: s.dataAprovacaoFinal ?? s.createdAt,
    })),
    ...tarefasSolicitante.paraReabilitar.map(s => ({
      id: s.id,
      tag: s.equipamento.tag,
      protocolo: s.protocolo,
      area: s.area.nome,
      acao: 'REABILITAR',
      acaoLabel: 'Reabilitar',
      acaoColor: '#B91C1C',
      acaoBg: '#FEE2E2',
      ctaLabel: 'Reabilitar',
      ctaColor: '#8B5CF6',
      urgente: (s as any).prazoMaximoAtingido as boolean,
      sortKey: s.periodoFim ?? s.createdAt,
    })),
    ...tarefasSolicitante.paraProrrogar.map(s => ({
      id: s.id,
      tag: s.equipamento.tag,
      protocolo: s.protocolo,
      area: s.area.nome,
      acao: 'PRORROGAR',
      acaoLabel: 'Prorrogar',
      acaoColor: '#B45309',
      acaoBg: '#FEF3C7',
      ctaLabel: 'Prorrogar',
      ctaColor: '#F59E0B',
      urgente: true, // prazoMaximoAtingido é obrigatório para aparecer aqui
      sortKey: s.periodoFim ?? s.createdAt,
    })),
  ]

  // Deduplica por id+acao e ordena por urgência:
  // 1. Urgentes primeiro (prazo máximo atingido)
  // 2. Depois por sortKey ASC (mais antigo = esperando há mais tempo = mais urgente)
  const uniqueTarefas = tarefas
    .reduce((acc, t) => {
      if (!acc.find(x => x.id === t.id && x.acao === t.acao)) acc.push(t)
      return acc
    }, [] as typeof tarefas)
    .sort((a, b) => {
      if (a.urgente && !b.urgente) return -1
      if (!a.urgente && b.urgente) return 1
      return new Date(a.sortKey).getTime() - new Date(b.sortKey).getTime()
    })

  const worklist = [
    {
      label: 'Desabilitação em Aprovação',
      status: 'EM_APROVACAO',
      items: solEmAprovacao,
    },
    {
      label: 'Execução Autorizada',
      status: 'EXECUCAO_AUTORIZADA',
      items: solExecucaoAutorizada,
    },
    {
      label: 'Desabilitado (Reabilitar)',
      status: 'DESABILITADO',
      items: solDesabilitado,
    },
    {
      label: 'Reabilitação Aguardando Validação',
      status: 'EM_VALIDACAO_DA_REABILITACAO',
      items: solEmValidacao,
    },
  ]

  // ─── Solicitante view (quadrantes) ──────────────────────────────────────────
  if (showSolicitanteView && quadrantes) {
    return (
      <div className="p-4 md:p-6 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Início</h1>
            <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
              Olá, {session?.user?.name?.split(' ')[0]}. Veja o que precisa da sua atenção.
            </p>
          </div>
          <Link
            href="/solicitacoes/nova"
            className="px-4 py-2 text-sm font-medium text-white hidden sm:flex items-center gap-2"
            style={{ background: '#0038A8', borderRadius: '4px' }}
          >
            + Nova Solicitação
          </Link>
        </div>

        {/* ─── MÉTRICAS — contadores (igual ao view geral) ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" style={{ marginBottom: 40 }}>
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
          <Link href="/solicitacoes?filter=encerradas" className="h-full">
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
              <div className="text-xs leading-tight" style={{ color: metrics.violacoesSla > 0 ? '#DC2626' : '#64748B' }}>Violações SLA</div>
            </div>
            <div className="font-bold shrink-0" style={{ fontSize: 14, color: metrics.violacoesSla > 0 ? '#DC2626' : '#10B981' }}>{metrics.violacoesSla}</div>
          </div>
        </div>

        {/* ─── Painel operacional — heading ─── */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontWeight: 500,
              fontSize: 18,
              color: '#0F172A',
              lineHeight: '27px',
              margin: 0,
            }}
          >
            Painel operacional
          </h2>
          <p
            style={{
              fontWeight: 400,
              fontSize: 14,
              color: '#6A7178',
              lineHeight: '21px',
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            Monitore prioridades, prazos e solicitações que exigem atenção
          </p>
        </div>

        {/* ─── 4 blocos 2×2 ─── */}
        <SolicitanteDashboard
          q1={quadrantes.q1}
          q2={quadrantes.q2}
          q3={quadrantes.q3}
          q4={quadrantes.q4}
          isExecutante={isExecutante}
        />

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

  // ─── Aprovador / Admin / Gestor view ─────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Início</h1>
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

      {/* ─── MÉTRICAS — linha compacta ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
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
        {/* Encerradas este mês */}
        <Link href="/solicitacoes?filter=encerradas" className="h-full">
          <div className="bg-white border cursor-pointer transition-shadow hover:shadow-sm h-full flex items-center justify-between px-3 py-2.5 gap-2" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: 15, color: '#10B981', lineHeight: 1, background: '#10B98114', borderRadius: '6px', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">check_circle</span>
              <div className="text-xs leading-tight" style={{ color: '#64748B' }}>Encerradas/mês</div>
            </div>
            <div className="font-bold shrink-0" style={{ fontSize: 14, color: '#10B981' }}>{metrics.encerradasMes}</div>
          </div>
        </Link>
        {/* Violações SLA */}
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
            <div className="text-xs leading-tight" style={{ color: metrics.violacoesSla > 0 ? '#DC2626' : '#64748B' }}>Violações SLA</div>
          </div>
          <div className="font-bold shrink-0" style={{ fontSize: 14, color: metrics.violacoesSla > 0 ? '#DC2626' : '#10B981' }}>{metrics.violacoesSla}</div>
        </div>
      </div>

      {/* ─── MINHAS TAREFAS PENDENTES — carrossel ─── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#0F172A' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#0038A8', lineHeight: 1 }} aria-hidden="true">checklist</span>
            Minhas tarefas pendentes
            {uniqueTarefas.length > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5" style={{ background: '#0038A8', color: 'white', borderRadius: '4px' }}>
                {uniqueTarefas.length}
              </span>
            )}
          </h2>
        </div>
        <TarefasCarrossel tarefas={uniqueTarefas} />
      </section>

      {/* ─── SOLICITAÇÕES — tabela desktop / cards mobile ─── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#0F172A' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#475569', lineHeight: 1 }} aria-hidden="true">description</span>
            Solicitações recentes
          </h2>
          <Link href="/solicitacoes" className="text-xs" style={{ color: '#0038A8' }}>
            Ver todas →
          </Link>
        </div>

        {ultimasSolicitacoes.length === 0 ? (
          <div className="bg-white border px-5 py-8 text-center" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#CBD5E1', display: 'block', marginBottom: 8 }}>description</span>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação ainda.</p>
          </div>
        ) : (
          <>
            {/* DESKTOP: tabela */}
            <div className="hidden md:block overflow-x-auto bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    {['Protocolo', 'TAG', 'Área', 'Classe', 'Status', 'Período', 'Solicitante'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: '#64748B' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ultimasSolicitacoes.map((s, i) => (
                    <tr
                      key={s.id}
                      style={{ borderBottom: i < ultimasSolicitacoes.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/solicitacoes/${s.id}`} className="font-mono text-xs font-semibold" style={{ color: '#0038A8' }}>
                          {s.protocolo}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5" style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}>
                          {s.equipamento.tag}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>
                        <div>{s.area.nome}</div>
                        <div style={{ color: '#94A3B8' }}>{(s.area as any).planta?.nome}</div>
                      </td>
                      <td className="px-4 py-3">
                        {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#6B7280' }}>
                        {s.periodoInicio ? format(new Date(s.periodoInicio), 'dd/MM/yy', { locale: ptBR }) : '—'}
                        {s.periodoFim ? ` → ${format(new Date(s.periodoFim), 'dd/MM/yy', { locale: ptBR })}` : ''}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>
                        {s.solicitante.nome.split(' ').slice(0, 2).join(' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t flex justify-end" style={{ borderColor: '#E2E8F0' }}>
                <Link href="/solicitacoes" className="text-xs font-medium" style={{ color: '#0038A8' }}>
                  Ver todas as solicitações →
                </Link>
              </div>
            </div>

            {/* MOBILE: cards */}
            <div className="md:hidden flex flex-col gap-2">
              {ultimasSolicitacoes.slice(0, 5).map(s => (
                <SolicitacaoCard
                  key={s.id}
                  id={s.id}
                  protocolo={s.protocolo}
                  status={s.status}
                  classe={s.classe ? { numero: s.classe.numero, prazoMaxDias: null } : null}
                  equipamento={{ tag: s.equipamento.tag, descricao: s.equipamento.descricao }}
                  area={{ nome: s.area.nome }}
                  planta={(s.area as any).planta ? { nome: (s.area as any).planta.nome } : undefined}
                  solicitante={{ nome: s.solicitante.nome }}
                  periodoInicio={(s as any).periodoInicio}
                  periodoFim={(s as any).periodoFim}
                  dataDesabilitacao={(s as any).dataDesabilitacao}
                  prazoMaximoAtingido={(s as any).prazoMaximoAtingido}
                  prazoPrevitoAtingido={(s as any).prazoPrevitoAtingido}
                  aprovacoes={[]}
                  isAprovador={isAprovador}
                  isSolicitante={isSolicitante}
                  isExecutante={isExecutante}
                />
              ))}
              <Link href="/solicitacoes" className="text-xs text-center py-3" style={{ color: '#0038A8' }}>
                Ver todas as solicitações →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Mobile FAB for new solicitacao */}
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
