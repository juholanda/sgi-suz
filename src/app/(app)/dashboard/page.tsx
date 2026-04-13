import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { tokens, StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

async function getRecentSolicitacoes() {
  return prisma.solicitacao.findMany({
    where: { status: { notIn: ['ENCERRADA', 'CANCELADA', 'REJEITADA', 'RASCUNHO'] } },
    include: {
      equipamento: true,
      area: true,
      classe: true,
      solicitante: { select: { nome: true } },
      aprovacoes: {
        where: { tipo: 'DESABILITACAO' },
        orderBy: { nivel: 'asc' },
        select: {
          nivel: true,
          status: true,
          aprovador: {
            select: {
              nome: true,
              perfis: {
                where: { perfil: { in: ['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'] } },
                select: { perfil: true },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  })
}

async function getTarefasAprovador() {
  return prisma.solicitacao.findMany({
    where: { status: { in: ['EM_APROVACAO', 'EM_VALIDACAO_DA_REABILITACAO'] } },
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

async function getTarefasSolicitante() {
  const now = new Date()
  const tresDias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const [paraExecutar, paraReabilitar, paraProrrogar] = await Promise.all([
    prisma.solicitacao.findMany({
      where: { status: 'EXECUCAO_AUTORIZADA' },
      include: { equipamento: true, area: true, classe: true },
      orderBy: { dataAprovacaoFinal: 'asc' },
      take: 5,
    }),
    prisma.solicitacao.findMany({
      where: {
        status: 'DESABILITADO',
        OR: [
          { prazoMaximoAtingido: true },
          { prazoPrevitoAtingido: true },
          { periodoFim: { lte: tresDias } },
        ],
      },
      include: { equipamento: true, area: true, classe: true },
      orderBy: { periodoFim: 'asc' },
      take: 5,
    }),
    prisma.solicitacao.findMany({
      where: { status: 'DESABILITADO', prazoMaximoAtingido: true },
      include: { equipamento: true, area: true, classe: true },
      orderBy: { periodoFim: 'asc' },
      take: 5,
    }),
  ])

  return { paraExecutar, paraReabilitar, paraProrrogar }
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id as string

  // Lê o perfil ativo do cookie (definido pelo cliente ao trocar perfil)
  const cookieStore = await cookies()
  const perfilAtivo = cookieStore.get('sgi_perfil_ativo')?.value

  // Fallback: verifica todos os perfis do usuário
  const perfis = await prisma.usuarioPerfil.findMany({ where: { userId } })

  // Se há perfil ativo via cookie, usa apenas ele; senão usa todos (retrocompat)
  const isAprovador = perfilAtivo
    ? ['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(perfilAtivo)
    : perfis.some(p => ['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'].includes(p.perfil))
  const isSolicitante = perfilAtivo
    ? ['SOLICITANTE', 'EXECUTANTE', 'ADMINISTRADOR'].includes(perfilAtivo)
    : perfis.some(p => ['SOLICITANTE', 'EXECUTANTE', 'ADMINISTRADOR'].includes(p.perfil))

  const [metrics, solicitacoes] = await Promise.all([getMetrics(), getRecentSolicitacoes()])

  const tarefasAprovador = isAprovador ? await getTarefasAprovador() : []
  const tarefasSolicitante = isSolicitante ? await getTarefasSolicitante() : { paraExecutar: [], paraReabilitar: [], paraProrrogar: [] }

  const cards = [
    { label: 'Em Aprovação',      value: metrics.emAprovacao,          status: 'EM_APROVACAO' as StatusSolicitacao,                   href: '/solicitacoes?filter=andamento',  icon: 'pending_actions' },
    { label: 'Exec. Autorizada',  value: metrics.execucaoAutorizada,   status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao,            href: '/solicitacoes?filter=andamento',  icon: 'engineering' },
    { label: 'Desabilitados',     value: metrics.desabilitados,        status: 'DESABILITADO' as StatusSolicitacao,                   href: '/solicitacoes?filter=andamento',  icon: 'lock_open' },
    { label: 'Aguard. Validação', value: metrics.aguardandoValidacao,  status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao,   href: '/solicitacoes?filter=andamento',  icon: 'fact_check' },
  ]

  // Collect all pending tasks in one unified list
  const tarefas: { id: string; tag: string; protocolo: string; area: string; planta?: string; acao: string; acaoLabel: string; acaoColor: string; acaoBg: string; ctaLabel: string; ctaColor: string; urgente?: boolean }[] = [
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
      urgente: (s as any).prazoMaximoAtingido,
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
    })),
  ]

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
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
        {cards.map(card => {
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
                <div className="text-xl font-bold shrink-0" style={{ color: colors.text }}>{card.value}</div>
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
            <div className="text-xl font-bold shrink-0" style={{ color: '#10B981' }}>{metrics.encerradasMes}</div>
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
          <div className="text-xl font-bold shrink-0" style={{ color: metrics.violacoesSla > 0 ? '#DC2626' : '#10B981' }}>{metrics.violacoesSla}</div>
        </div>
      </div>

      {/* ─── MINHAS TAREFAS PENDENTES ─── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#0F172A' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#0038A8', lineHeight: 1 }} aria-hidden="true">checklist</span>
            Minhas tarefas pendentes
            {tarefas.length > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5" style={{ background: '#0038A8', color: 'white', borderRadius: '4px' }}>
                {tarefas.length}
              </span>
            )}
          </h2>
        </div>

        {tarefas.length === 0 ? (
          <div className="bg-white border rounded flex items-center gap-3 px-5 py-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#10B981' }}>check_circle</span>
            <p className="text-sm" style={{ color: '#475569' }}>Nenhuma tarefa pendente. Tudo em dia!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tarefas.map(t => (
              <div
                key={`${t.id}-${t.acao}`}
                className="bg-white border flex items-center gap-3 px-4 py-3"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', borderLeft: `3px solid ${t.acaoColor}` }}
              >
                <span
                  className="shrink-0 text-xs font-semibold px-2 py-1"
                  style={{ background: t.acaoBg, color: t.acaoColor, borderRadius: '4px', minWidth: 72, textAlign: 'center' }}
                >
                  {t.acaoLabel}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold" style={{ color: '#0F172A' }}>{t.tag}</span>
                    <span className="text-xs font-mono" style={{ color: '#94A3B8' }}>{t.protocolo}</span>
                    {t.urgente && (
                      <span className="text-xs px-1.5 py-0.5 font-medium" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
                        ⚠ Urgente
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{t.area}{t.planta ? ` · ${t.planta}` : ''}</p>
                </div>
                <Link
                  href={`/solicitacoes/${t.id}`}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ background: t.ctaColor, borderRadius: '4px' }}
                >
                  {t.ctaLabel}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── SOLICITAÇÕES ─── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#0F172A' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#475569', lineHeight: 1 }} aria-hidden="true">description</span>
            Solicitações
          </h2>
          <Link href="/solicitacoes" className="text-xs" style={{ color: '#0038A8' }}>Ver todas →</Link>
        </div>

        {solicitacoes.length === 0 ? (
          <div className="bg-white border px-5 py-8 text-center" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação ativa.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {solicitacoes.map(s => {
              const statusColors = tokens.colors.status[s.status as StatusSolicitacao]
              return (
                <Link key={s.id} href={`/solicitacoes/${s.id}`}>
                  <div
                    className="bg-white border flex items-center gap-3 px-4 py-3 hover:shadow-sm transition-shadow"
                    style={{ borderColor: '#E2E8F0', borderRadius: '4px', borderLeft: `3px solid ${statusColors?.text ?? '#94A3B8'}` }}
                  >
                    <div className="shrink-0">
                      <span className="font-mono text-xs font-semibold px-2 py-1" style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}>
                        {s.equipamento.tag}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium font-mono" style={{ color: '#0F172A' }}>{s.protocolo}</span>
                        {s.prazoMaximoAtingido && (
                          <span className="text-xs px-1.5 py-0.5 font-medium" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>⚠ Prazo máximo</span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        {s.area.nome} · {s.solicitante.nome}
                        {s.aprovacoes.length > 0 && (
                          <> · <span style={{ color: '#94A3B8' }}>
                            {s.aprovacoes.map(a => `N${a.nivel} ${a.aprovador.nome.split(' ')[0]}`).join(' · ')}
                          </span></>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                      <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
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
