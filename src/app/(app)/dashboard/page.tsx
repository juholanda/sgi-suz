import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { tokens, StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import Link from 'next/link'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import SolicitanteDashboard from '@/components/sgi/SolicitanteDashboard'
import type { QuadranteItem, QuadranteConfig } from '@/components/sgi/SolicitanteDashboard'
import { buildPlantaScope } from '@/lib/scope'

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

// ─── Últimas solicitações (kept for future use) ──────────────────────────────

async function getUltimasSolicitacoes(plantaId: string) {
  return prisma.solicitacao.findMany({
    where: buildPlantaScope(plantaId),
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

// ─── Shared includes for quadrant queries ────────────────────────────────────

const quadranteIncludes = {
  equipamento: true,
  area: { include: { planta: true } },
  classe: { select: { numero: true, prazoMaximoDias: true } },
  aprovacoes: {
    where: { tipo: 'DESABILITACAO' },
    orderBy: { nivel: 'asc' as const },
    select: { nivel: true, status: true, aprovadorId: true },
  },
} as const

type SolicitacaoWithIncludes = Awaited<
  ReturnType<typeof prisma.solicitacao.findMany<{ include: typeof quadranteIncludes }>>
>[number]

function toItem(
  s: SolicitacaoWithIncludes,
  cta?: { label: string; bg: string; color: string } | null,
): QuadranteItem {
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
    executanteId: s.executanteId ?? null,
    cta: cta ?? null,
  }
}

// ─── Solicitante / Executante quadrants ──────────────────────────────────────

async function getSolicitacoesParaQuadrantes(userId: string, plantaId: string) {
  const now = new Date()
  const tresDias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const solicitacoes = await prisma.solicitacao.findMany({
    where: {
      OR: [{ solicitanteId: userId }, { executanteId: userId }],
      status: { notIn: ['ENCERRADA', 'CANCELADA', 'REJEITADA'] },
      ...buildPlantaScope(plantaId),
    },
    include: quadranteIncludes,
    orderBy: { createdAt: 'desc' },
  })

  const assigned = new Set<string>()
  const q1: QuadranteItem[] = []
  const q2: QuadranteItem[] = []
  const q3: QuadranteItem[] = []
  const q4: QuadranteItem[] = []

  // Q1 — Minhas pendências: RASCUNHO + EXECUCAO_AUTORIZADA
  for (const s of solicitacoes) {
    if (s.status === 'RASCUNHO') {
      q1.push(toItem(s, { label: 'Continuar rascunho', bg: '#0038A8', color: '#fff' }))
      assigned.add(s.id)
    } else if (s.status === 'EXECUCAO_AUTORIZADA' && !assigned.has(s.id)) {
      const cta = s.executanteId === userId
        ? { label: 'Executar Desabilitação', bg: '#0038A8', color: '#fff' }
        : null
      q1.push(toItem(s, cta))
      assigned.add(s.id)
    }
  }

  // Q2 — Em risco de prazo
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    const nearDeadline = s.periodoFim !== null && new Date(s.periodoFim) <= tresDias
    if (
      s.prazoMaximoAtingido ||
      s.prazoPrevitoAtingido ||
      (s.status === 'DESABILITADO' && nearDeadline)
    ) {
      q2.push(toItem(s, { label: 'Ver agora', bg: '#DC2626', color: '#fff' }))
      assigned.add(s.id)
    }
  }

  // Q3 — Em andamento
  const AGUARDANDO_STATUSES = ['EM_APROVACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'EXTENSAO_EM_ANALISE']
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (AGUARDANDO_STATUSES.includes(s.status)) {
      q3.push(toItem(s, { label: 'Acompanhar', bg: '#F1F5F9', color: '#374151' }))
      assigned.add(s.id)
    }
  }

  // Q4 — Desabilitadas no momento
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (s.status === 'DESABILITADO') {
      q4.push(toItem(s, { label: 'Iniciar reabilitação', bg: '#10B981', color: '#fff' }))
      assigned.add(s.id)
    }
  }

  return { q1, q2, q3, q4 }
}

// ─── Aprovador quadrants ─────────────────────────────────────────────────────

async function getSolicitacoesParaQuadrantesAprovador(userId: string, plantaId: string) {
  const now = new Date()
  const tresDias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const solicitacoes = await prisma.solicitacao.findMany({
    where: {
      status: { notIn: ['ENCERRADA', 'CANCELADA', 'REJEITADA'] },
      ...buildPlantaScope(plantaId),
    },
    include: quadranteIncludes,
    orderBy: { createdAt: 'desc' },
  })

  const assigned = new Set<string>()
  const q1: QuadranteItem[] = []
  const q2: QuadranteItem[] = []
  const q3: QuadranteItem[] = []
  const q4: QuadranteItem[] = []

  // Q1 — Aguardando minha aprovação
  for (const s of solicitacoes) {
    const hasPendingApproval =
      (s.status === 'EM_APROVACAO' &&
        s.aprovacoes.some(a => a.aprovadorId === userId && a.status === 'PENDENTE')) ||
      (s.status === 'EM_VALIDACAO_DA_REABILITACAO' &&
        s.aprovacoes.some(a => a.aprovadorId === userId))
    if (hasPendingApproval) {
      q1.push(toItem(s, { label: 'Analisar', bg: '#0038A8', color: '#fff' }))
      assigned.add(s.id)
    }
  }

  // Q2 — Em risco de prazo (not already in Q1)
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    const nearDeadline = s.periodoFim !== null && new Date(s.periodoFim) <= tresDias
    if (
      s.prazoMaximoAtingido ||
      s.prazoPrevitoAtingido ||
      (s.status === 'DESABILITADO' && nearDeadline)
    ) {
      q2.push(toItem(s, { label: 'Ver agora', bg: '#DC2626', color: '#fff' }))
      assigned.add(s.id)
    }
  }

  // Q3 — Em andamento
  const ANDAMENTO_STATUSES = [
    'EM_APROVACAO',
    'EXECUCAO_AUTORIZADA',
    'EM_REABILITACAO',
    'EM_VALIDACAO_DA_REABILITACAO',
    'EXTENSAO_EM_ANALISE',
  ]
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (ANDAMENTO_STATUSES.includes(s.status)) {
      q3.push(toItem(s, { label: 'Acompanhar', bg: '#F1F5F9', color: '#374151' }))
      assigned.add(s.id)
    }
  }

  // Q4 — Desabilitadas no momento
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (s.status === 'DESABILITADO') {
      q4.push(toItem(s, { label: 'Acompanhar', bg: '#F1F5F9', color: '#374151' }))
      assigned.add(s.id)
    }
  }

  return { q1, q2, q3, q4 }
}

// ─── Gestor SMS quadrants ────────────────────────────────────────────────────

async function getSolicitacoesParaQuadrantesGestor(userId: string, plantaId: string) {
  const solicitacoes = await prisma.solicitacao.findMany({
    where: {
      status: { notIn: ['ENCERRADA', 'CANCELADA', 'REJEITADA'] },
      ...buildPlantaScope(plantaId),
    },
    include: quadranteIncludes,
    orderBy: { createdAt: 'desc' },
  })

  const assigned = new Set<string>()
  const q1: QuadranteItem[] = []
  const q2: QuadranteItem[] = []
  const q3: QuadranteItem[] = []
  const q4: QuadranteItem[] = []

  // Q1 — Validações pendentes
  for (const s of solicitacoes) {
    const isValidacao = s.status === 'EM_VALIDACAO_DA_REABILITACAO'
    const isMyApproval =
      s.status === 'EM_APROVACAO' &&
      s.aprovacoes.some(a => a.aprovadorId === userId && a.status === 'PENDENTE')
    if (isValidacao || isMyApproval) {
      q1.push(toItem(s, { label: 'Validar', bg: '#0038A8', color: '#fff' }))
      assigned.add(s.id)
    }
  }

  // Q2 — Em risco de prazo
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (s.prazoMaximoAtingido) {
      q2.push(toItem(s, { label: 'Ver agora', bg: '#DC2626', color: '#fff' }))
      assigned.add(s.id)
    }
  }

  // Q3 — Em andamento
  const ANDAMENTO_STATUSES = [
    'EM_APROVACAO',
    'EXECUCAO_AUTORIZADA',
    'EM_REABILITACAO',
    'EM_VALIDACAO_DA_REABILITACAO',
    'EXTENSAO_EM_ANALISE',
  ]
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (ANDAMENTO_STATUSES.includes(s.status)) {
      q3.push(toItem(s, { label: 'Acompanhar', bg: '#F1F5F9', color: '#374151' }))
      assigned.add(s.id)
    }
  }

  // Q4 — Desabilitadas no momento
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (s.status === 'DESABILITADO') {
      q4.push(toItem(s, { label: 'Monitorar', bg: '#F0FDFA', color: '#0D9488' }))
      assigned.add(s.id)
    }
  }

  return { q1, q2, q3, q4 }
}

// ─── Admin quadrants ─────────────────────────────────────────────────────────

async function getSolicitacoesParaQuadrantesAdmin(userId: string, plantaId: string) {
  const now = new Date()
  const tresDias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const solicitacoes = await prisma.solicitacao.findMany({
    where: {
      status: { notIn: ['ENCERRADA', 'CANCELADA', 'REJEITADA'] },
      ...buildPlantaScope(plantaId),
    },
    include: quadranteIncludes,
    orderBy: { createdAt: 'desc' },
  })

  const assigned = new Set<string>()
  const q1: QuadranteItem[] = []
  const q2: QuadranteItem[] = []
  const q3: QuadranteItem[] = []
  const q4: QuadranteItem[] = []

  // Q1 — Ações pendentes: admin's pending approvals + EM_VALIDACAO items
  for (const s of solicitacoes) {
    const isMyPendingApproval =
      s.aprovacoes.some(a => a.aprovadorId === userId && a.status === 'PENDENTE')
    const isValidacao = s.status === 'EM_VALIDACAO_DA_REABILITACAO'
    if (isMyPendingApproval || isValidacao) {
      q1.push(toItem(s, { label: 'Analisar', bg: '#0038A8', color: '#fff' }))
      assigned.add(s.id)
    }
  }

  // Q2 — Em risco de prazo
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    const nearDeadline = s.periodoFim !== null && new Date(s.periodoFim) <= tresDias
    if (
      s.prazoMaximoAtingido ||
      s.prazoPrevitoAtingido ||
      (s.status === 'DESABILITADO' && nearDeadline)
    ) {
      q2.push(toItem(s, { label: 'Ver agora', bg: '#DC2626', color: '#fff' }))
      assigned.add(s.id)
    }
  }

  // Q3 — Em andamento
  const ANDAMENTO_STATUSES = [
    'EM_APROVACAO',
    'EXECUCAO_AUTORIZADA',
    'EM_REABILITACAO',
    'EM_VALIDACAO_DA_REABILITACAO',
    'EXTENSAO_EM_ANALISE',
  ]
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (ANDAMENTO_STATUSES.includes(s.status)) {
      q3.push(toItem(s, { label: 'Acompanhar', bg: '#F1F5F9', color: '#374151' }))
      assigned.add(s.id)
    }
  }

  // Q4 — Desabilitadas no momento
  for (const s of solicitacoes) {
    if (assigned.has(s.id)) continue
    if (s.status === 'DESABILITADO') {
      q4.push(toItem(s, { label: 'Monitorar', bg: '#F0FDFA', color: '#0D9488' }))
      assigned.add(s.id)
    }
  }

  return { q1, q2, q3, q4 }
}

// ─── Build quadrant configs per profile ──────────────────────────────────────

function buildSolicitanteQuadrants(q1: QuadranteItem[], q2: QuadranteItem[], q3: QuadranteItem[], q4: QuadranteItem[]): QuadranteConfig[] {
  return [
    {
      title: 'Minhas pendências',
      subtitle: 'Pendências que precisam da sua decisão agora.',
      icon: 'inbox',
      iconColor: '#0038A8',
      iconBg: '#EBF0FB',
      items: q1,
      tabHref: '/solicitacoes?tab=pendencias',
      emptyLabel: 'Nenhuma pendência no momento.',
    },
    {
      title: 'Em risco de prazo',
      subtitle: 'Itens com risco de prazo e atenção imediata.',
      icon: 'warning',
      iconColor: '#DC2626',
      iconBg: '#FEF2F2',
      items: q2,
      tabHref: '/solicitacoes?tab=risco',
      emptyLabel: 'Sem riscos de prazo no momento.',
      showRisk: true,
    },
    {
      title: 'Em andamento',
      subtitle: 'Solicitações em fluxo ativo na planta.',
      icon: 'sync',
      iconColor: '#0891B2',
      iconBg: '#ECFEFF',
      items: q3,
      tabHref: '/solicitacoes?tab=andamento',
      emptyLabel: 'Nenhuma solicitação em andamento.',
    },
    {
      title: 'Desabilitadas no momento',
      subtitle: 'Intertravamentos abertos operacionalmente.',
      icon: 'lock_open',
      iconColor: '#0D9488',
      iconBg: '#F0FDFA',
      items: q4,
      tabHref: '/solicitacoes?tab=desabilitadas',
      emptyLabel: 'Nenhum intertravamento ativo no momento.',
    },
  ]
}

function buildAprovadorQuadrants(q1: QuadranteItem[], q2: QuadranteItem[], q3: QuadranteItem[], q4: QuadranteItem[]): QuadranteConfig[] {
  return [
    {
      title: 'Aguardando minha aprovação',
      subtitle: 'Solicitações que precisam da sua análise e decisão.',
      icon: 'pending_actions',
      iconColor: '#0038A8',
      iconBg: '#EBF0FB',
      items: q1,
      tabHref: '/solicitacoes?tab=pendencias',
      emptyLabel: 'Nenhuma aprovação pendente.',
    },
    {
      title: 'Em risco de prazo',
      subtitle: 'Itens com risco de prazo e atenção imediata.',
      icon: 'warning',
      iconColor: '#DC2626',
      iconBg: '#FEF2F2',
      items: q2,
      tabHref: '/solicitacoes?tab=risco',
      emptyLabel: 'Sem riscos de prazo no momento.',
      showRisk: true,
    },
    {
      title: 'Em andamento',
      subtitle: 'Solicitações em fluxo ativo na planta.',
      icon: 'sync',
      iconColor: '#0891B2',
      iconBg: '#ECFEFF',
      items: q3,
      tabHref: '/solicitacoes?tab=andamento',
      emptyLabel: 'Nenhuma solicitação em andamento.',
    },
    {
      title: 'Desabilitadas no momento',
      subtitle: 'Intertravamentos desabilitados operacionalmente.',
      icon: 'lock_open',
      iconColor: '#0D9488',
      iconBg: '#F0FDFA',
      items: q4,
      tabHref: '/solicitacoes?tab=desabilitadas',
      emptyLabel: 'Nenhum intertravamento ativo no momento.',
    },
  ]
}

function buildGestorQuadrants(q1: QuadranteItem[], q2: QuadranteItem[], q3: QuadranteItem[], q4: QuadranteItem[]): QuadranteConfig[] {
  return [
    {
      title: 'Validações pendentes',
      subtitle: 'Reabilitações aguardando sua validação final.',
      icon: 'fact_check',
      iconColor: '#0038A8',
      iconBg: '#EBF0FB',
      items: q1,
      tabHref: '/solicitacoes?tab=pendencias',
      emptyLabel: 'Nenhuma validação pendente.',
    },
    {
      title: 'Em risco de prazo',
      subtitle: 'Itens com risco de prazo e atenção imediata.',
      icon: 'warning',
      iconColor: '#DC2626',
      iconBg: '#FEF2F2',
      items: q2,
      tabHref: '/solicitacoes?tab=risco',
      emptyLabel: 'Sem riscos de prazo no momento.',
      showRisk: true,
    },
    {
      title: 'Em andamento',
      subtitle: 'Solicitações em fluxo ativo na planta.',
      icon: 'sync',
      iconColor: '#0891B2',
      iconBg: '#ECFEFF',
      items: q3,
      tabHref: '/solicitacoes?tab=andamento',
      emptyLabel: 'Nenhuma solicitação em andamento.',
    },
    {
      title: 'Desabilitadas no momento',
      subtitle: 'Intertravamentos desabilitados operacionalmente.',
      icon: 'lock_open',
      iconColor: '#0D9488',
      iconBg: '#F0FDFA',
      items: q4,
      tabHref: '/solicitacoes?tab=desabilitadas',
      emptyLabel: 'Nenhum intertravamento ativo no momento.',
    },
  ]
}

function buildAdminQuadrants(q1: QuadranteItem[], q2: QuadranteItem[], q3: QuadranteItem[], q4: QuadranteItem[]): QuadranteConfig[] {
  return [
    {
      title: 'Ações pendentes',
      subtitle: 'Solicitações que precisam da sua análise e decisão.',
      icon: 'pending_actions',
      iconColor: '#0038A8',
      iconBg: '#EBF0FB',
      items: q1,
      tabHref: '/solicitacoes?tab=pendencias',
      emptyLabel: 'Nenhuma aprovação pendente.',
    },
    {
      title: 'Em risco de prazo',
      subtitle: 'Itens com risco de prazo e atenção imediata.',
      icon: 'warning',
      iconColor: '#DC2626',
      iconBg: '#FEF2F2',
      items: q2,
      tabHref: '/solicitacoes?tab=risco',
      emptyLabel: 'Sem riscos de prazo no momento.',
      showRisk: true,
    },
    {
      title: 'Em andamento',
      subtitle: 'Solicitações em fluxo ativo na planta.',
      icon: 'sync',
      iconColor: '#0891B2',
      iconBg: '#ECFEFF',
      items: q3,
      tabHref: '/solicitacoes?tab=andamento',
      emptyLabel: 'Nenhuma solicitação em andamento.',
    },
    {
      title: 'Desabilitadas no momento',
      subtitle: 'Intertravamentos desabilitados operacionalmente.',
      icon: 'lock_open',
      iconColor: '#0D9488',
      iconBg: '#F0FDFA',
      items: q4,
      tabHref: '/solicitacoes?tab=desabilitadas',
      emptyLabel: 'Nenhum intertravamento ativo no momento.',
    },
  ]
}

// ─── Page component ──────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  const userId = ((session?.user as any)?.id ?? (session?.user as any)?.sub) as string

  const cookieStore = await cookies()
  const perfilAtivo = cookieStore.get('sgi_perfil_ativo')?.value

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

  const metrics = await getMetrics(plantaId)

  // ── Determine quadrant data + config based on active profile ──
  let quadrantsConfig: QuadranteConfig[]

  if (perfilAtivo === 'ADMINISTRADOR') {
    const { q1, q2, q3, q4 } = await getSolicitacoesParaQuadrantesAdmin(userId, plantaId)
    quadrantsConfig = buildAdminQuadrants(q1, q2, q3, q4)
  } else if (perfilAtivo === 'GESTOR_SMS') {
    const { q1, q2, q3, q4 } = await getSolicitacoesParaQuadrantesGestor(userId, plantaId)
    quadrantsConfig = buildGestorQuadrants(q1, q2, q3, q4)
  } else if (perfilAtivo === 'APROVADOR') {
    const { q1, q2, q3, q4 } = await getSolicitacoesParaQuadrantesAprovador(userId, plantaId)
    quadrantsConfig = buildAprovadorQuadrants(q1, q2, q3, q4)
  } else if (perfilAtivo === 'SOLICITANTE' || perfilAtivo === 'EXECUTANTE') {
    const { q1, q2, q3, q4 } = await getSolicitacoesParaQuadrantes(userId, plantaId)
    quadrantsConfig = buildSolicitanteQuadrants(q1, q2, q3, q4)
  } else {
    // No active profile cookie — fallback by checking user's profiles
    if (perfis.some(p => p.perfil === 'ADMINISTRADOR')) {
      const { q1, q2, q3, q4 } = await getSolicitacoesParaQuadrantesAdmin(userId, plantaId)
      quadrantsConfig = buildAdminQuadrants(q1, q2, q3, q4)
    } else if (perfis.some(p => p.perfil === 'GESTOR_SMS')) {
      const { q1, q2, q3, q4 } = await getSolicitacoesParaQuadrantesGestor(userId, plantaId)
      quadrantsConfig = buildGestorQuadrants(q1, q2, q3, q4)
    } else if (perfis.some(p => p.perfil === 'APROVADOR')) {
      const { q1, q2, q3, q4 } = await getSolicitacoesParaQuadrantesAprovador(userId, plantaId)
      quadrantsConfig = buildAprovadorQuadrants(q1, q2, q3, q4)
    } else {
      const { q1, q2, q3, q4 } = await getSolicitacoesParaQuadrantes(userId, plantaId)
      quadrantsConfig = buildSolicitanteQuadrants(q1, q2, q3, q4)
    }
  }

  const metricCards = [
    { label: 'Em Aprovação', value: metrics.emAprovacao, status: 'EM_APROVACAO' as StatusSolicitacao, href: '/solicitacoes?filter=andamento', icon: 'pending_actions' },
    { label: 'Exec. Autorizada', value: metrics.execucaoAutorizada, status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao, href: '/solicitacoes?filter=andamento', icon: 'engineering' },
    { label: 'Desabilitados', value: metrics.desabilitados, status: 'DESABILITADO' as StatusSolicitacao, href: '/solicitacoes?filter=andamento', icon: 'lock_open' },
    { label: 'Aguard. Validação', value: metrics.aguardandoValidacao, status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao, href: '/solicitacoes?filter=andamento', icon: 'fact_check' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* Header */}
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

      {/* ─── MÉTRICAS — contadores ─── */}
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
            <div className="text-xs leading-tight" style={{ color: metrics.violacoesSla > 0 ? '#DC2626' : '#64748B' }}>Prazos vencidos</div>
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

      {/* ─── 4 blocos 2x2 ─── */}
      <SolicitanteDashboard quadrants={quadrantsConfig} userId={userId} />

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
