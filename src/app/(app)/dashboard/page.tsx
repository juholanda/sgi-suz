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
    { label: 'Em Aprovação',      value: metrics.emAprovacao,          status: 'EM_APROVACAO' as StatusSolicitacao,                   href: '/solicitacoes?status=EM_APROVACAO',                   icon: 'pending_actions' },
    { label: 'Exec. Autorizada',  value: metrics.execucaoAutorizada,   status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao,            href: '/solicitacoes?status=EXECUCAO_AUTORIZADA',            icon: 'engineering' },
    { label: 'Desabilitados',     value: metrics.desabilitados,        status: 'DESABILITADO' as StatusSolicitacao,                   href: '/solicitacoes?status=DESABILITADO',                   icon: 'lock' },
    { label: 'Aguard. Validação', value: metrics.aguardandoValidacao,  status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao,   href: '/solicitacoes?status=EM_VALIDACAO_DA_REABILITACAO',   icon: 'fact_check' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            Bom dia, {session?.user?.name?.split(' ')[0]}. Visão geral dos intertravamentos.
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
                    className="material-symbols-outlined shrink-0 flex items-center justify-center"
                    style={{
                      fontSize: 15,
                      color: colors.text,
                      lineHeight: 1,
                      background: `${colors.text}14`,
                      borderRadius: '6px',
                      width: 28,
                      height: 28,
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
        <Link href="/solicitacoes?status=ENCERRADA" className="h-full">
          <div className="bg-white border cursor-pointer transition-shadow hover:shadow-sm h-full flex items-center justify-between px-3 py-2.5 gap-2" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined shrink-0 flex items-center justify-center" style={{ fontSize: 15, color: '#10B981', lineHeight: 1, background: '#10B98114', borderRadius: '6px', width: 28, height: 28 }} aria-hidden="true">check_circle</span>
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
            <span className="material-symbols-outlined shrink-0 flex items-center justify-center" style={{ fontSize: 15, color: metrics.violacoesSla > 0 ? '#DC2626' : '#10B981', lineHeight: 1, background: metrics.violacoesSla > 0 ? '#DC262614' : '#10B98114', borderRadius: '6px', width: 28, height: 28 }} aria-hidden="true">warning</span>
            <div className="text-xs leading-tight" style={{ color: metrics.violacoesSla > 0 ? '#DC2626' : '#64748B' }}>Violações SLA</div>
          </div>
          <div className="text-xl font-bold shrink-0" style={{ color: metrics.violacoesSla > 0 ? '#DC2626' : '#10B981' }}>{metrics.violacoesSla}</div>
        </div>
      </div>

      {/* ─── TAREFAS PENDENTES ─── */}
      {isAprovador && tarefasAprovador.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#0F172A' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#1D4ED8', lineHeight: 1 }} aria-hidden="true">task_alt</span>
              Aprovações pendentes
              <span className="text-xs font-medium px-1.5 py-0.5" style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: '4px' }}>
                {tarefasAprovador.length}
              </span>
            </h2>
            <Link href="/aprovacoes" className="text-xs" style={{ color: '#0038A8' }}>Ver todas →</Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tarefasAprovador.map(s => {
              const statusColors = tokens.colors.status[s.status as StatusSolicitacao]
              const tempo = s.dataEnvio
                ? formatDistanceToNow(s.dataEnvio, { locale: ptBR, addSuffix: true })
                : '—'
              return (
                <div
                  key={s.id}
                  className="bg-white border p-4 flex flex-col gap-3"
                  style={{ borderColor: '#BFDBFE', borderRadius: '4px', borderLeft: '4px solid #2563EB' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold" style={{ color: '#0038A8' }}>
                          {s.equipamento.tag}
                        </span>
                        {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                      </div>
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        {s.area.nome} · {s.solicitante.nome}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Aguardando {tempo}</p>
                    </div>
                    <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                  </div>
                  <Link
                    href={`/solicitacoes/${s.id}`}
                    className="w-full text-center py-2 text-sm font-medium text-white"
                    style={{ background: '#0038A8', borderRadius: '4px' }}
                  >
                    Analisar
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {isSolicitante && (
        <>
          {/* Executar desabilitação */}
          {tarefasSolicitante.paraExecutar.length > 0 && (
            <section className="mb-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#0F172A' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#0E7490', lineHeight: 1 }} aria-hidden="true">engineering</span>
                Executar Desabilitação
                <span className="text-xs font-medium px-1.5 py-0.5" style={{ background: '#CFFAFE', color: '#0E7490', borderRadius: '4px' }}>
                  {tarefasSolicitante.paraExecutar.length}
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {tarefasSolicitante.paraExecutar.map(s => (
                  <div
                    key={s.id}
                    className="bg-white border p-4 flex items-center justify-between gap-3"
                    style={{ borderColor: '#A5F3FC', borderRadius: '4px', borderLeft: '4px solid #0891B2' }}
                  >
                    <div>
                      <span className="font-mono text-sm font-bold" style={{ color: '#0F172A' }}>{s.equipamento.tag}</span>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{s.area.nome}</p>
                    </div>
                    <Link
                      href={`/solicitacoes/${s.id}`}
                      className="shrink-0 px-3 py-2 text-sm font-medium text-white"
                      style={{ background: '#0891B2', borderRadius: '4px' }}
                    >
                      Executar
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reabilitar */}
          {tarefasSolicitante.paraReabilitar.length > 0 && (
            <section className="mb-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#0F172A' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#B91C1C', lineHeight: 1 }} aria-hidden="true">restart_alt</span>
                Reabilitar
                <span className="text-xs font-medium px-1.5 py-0.5" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
                  {tarefasSolicitante.paraReabilitar.length}
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {tarefasSolicitante.paraReabilitar.map(s => (
                  <div
                    key={s.id}
                    className="bg-white border p-4 flex items-center justify-between gap-3"
                    style={{ borderColor: '#FECACA', borderRadius: '4px', borderLeft: '4px solid #EF4444' }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold" style={{ color: '#0F172A' }}>{s.equipamento.tag}</span>
                        {s.prazoMaximoAtingido && (
                          <span className="text-xs px-1.5 py-0.5 font-medium flex items-center gap-0.5" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12, lineHeight: 1 }}>warning</span>
                            Prazo máximo
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{s.area.nome}</p>
                    </div>
                    <Link
                      href={`/solicitacoes/${s.id}`}
                      className="shrink-0 px-3 py-2 text-sm font-medium text-white"
                      style={{ background: '#8B5CF6', borderRadius: '4px' }}
                    >
                      Reabilitar
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Prorrogar prazo */}
          {tarefasSolicitante.paraProrrogar.length > 0 && (
            <section className="mb-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#0F172A' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#B45309', lineHeight: 1 }} aria-hidden="true">schedule</span>
                Prorrogar Prazo
                <span className="text-xs font-medium px-1.5 py-0.5" style={{ background: '#FEF3C7', color: '#B45309', borderRadius: '4px' }}>
                  {tarefasSolicitante.paraProrrogar.length}
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {tarefasSolicitante.paraProrrogar.map(s => (
                  <div
                    key={s.id}
                    className="bg-white border p-4 flex items-center justify-between gap-3"
                    style={{ borderColor: '#FDE68A', borderRadius: '4px', borderLeft: '4px solid #F59E0B' }}
                  >
                    <div>
                      <span className="font-mono text-sm font-bold" style={{ color: '#0F172A' }}>{s.equipamento.tag}</span>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{s.area.nome}</p>
                    </div>
                    <Link
                      href={`/solicitacoes/${s.id}`}
                      className="shrink-0 px-3 py-2 text-sm font-medium"
                      style={{ background: '#FEF3C7', color: '#B45309', borderRadius: '4px' }}
                    >
                      Prorrogar
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Recent Solicitacoes Table */}
      <div className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>Solicitações ativas</h2>
          <Link href="/solicitacoes" className="text-xs" style={{ color: '#0038A8' }}>Ver todas →</Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Protocolo', 'TAG', 'Área', 'Classe', 'Status', 'Solicitante'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: '#6B7280' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {solicitacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>
                    Nenhuma solicitação ativa
                  </td>
                </tr>
              ) : (
                solicitacoes.map(s => (
                  <tr key={s.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#F1F5F9' }}>
                    <td className="px-4 py-3">
                      <Link href={`/solicitacoes/${s.id}`} className="text-sm font-mono font-medium" style={{ color: '#0038A8' }}>
                        {s.protocolo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: '#0F172A' }}>
                      {s.equipamento.tag}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>
                      {s.area.nome}
                    </td>
                    <td className="px-4 py-3">
                      {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>
                      {s.solicitante.nome}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: '#F1F5F9' }}>
          {solicitacoes.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação ativa</p>
          ) : (
            solicitacoes.map(s => (
              <Link key={s.id} href={`/solicitacoes/${s.id}`} className="block p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold" style={{ color: '#0038A8' }}>{s.equipamento.tag}</span>
                    {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                  </div>
                  <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                </div>
                <p className="text-xs" style={{ color: '#6B7280' }}>{s.protocolo} · {s.area.nome}</p>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{s.solicitante.nome}</p>
              </Link>
            ))
          )}
        </div>
      </div>

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
