import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'
import { tokens, StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import { PageBreadcrumb } from '@/components/sgi/PageBreadcrumb'
import Link from 'next/link'

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
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
      executante: { select: { nome: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  })
}

export default async function DashboardPage() {
  const session = await auth()
  const [metrics, solicitacoes] = await Promise.all([getMetrics(), getRecentSolicitacoes()])

  const cards = [
    { label: 'Em Aprovação', value: metrics.emAprovacao, status: 'EM_APROVACAO' as StatusSolicitacao, href: '/solicitacoes?status=EM_APROVACAO' },
    { label: 'Execução Autorizada', value: metrics.execucaoAutorizada, status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao, href: '/solicitacoes?status=EXECUCAO_AUTORIZADA' },
    { label: 'Desabilitados', value: metrics.desabilitados, status: 'DESABILITADO' as StatusSolicitacao, href: '/solicitacoes?status=DESABILITADO' },
    { label: 'Aguard. Validação', value: metrics.aguardandoValidacao, status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao, href: '/solicitacoes?status=EM_VALIDACAO_DA_REABILITACAO' },
  ]

  return (
    <div className="p-4 md:p-6">
      <PageBreadcrumb
        items={[{ label: 'Início' }, { label: 'Worklist' }]}
        backHref="/solicitacoes"
      />
      {/* Header */}
      <div className="mb-5 flex items-center justify-between md:mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em] md:text-xl md:font-bold" style={{ color: '#0F172A' }}>Dashboard</h1>
          <p className="mt-1 text-[13px] leading-[1.4] md:mt-0.5 md:text-sm" style={{ color: '#5B6B80' }}>
            Bom dia, {session?.user?.name?.split(' ')[0]}. Visão geral dos intertravamentos.
          </p>
        </div>
        <Link
          href="/solicitacoes/nova"
          className="inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[13px] font-semibold text-white md:h-auto md:rounded-md md:px-4 md:py-2 md:text-sm md:font-medium"
          style={{ background: '#0038A8' }}
        >
          + Nova Solicitação
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-4">
        {cards.map(card => {
          const colors = tokens.colors.status[card.status]
          return (
            <Link key={card.status} href={card.href}>
              <div
                className="cursor-pointer border bg-white p-3.5 transition-shadow hover:shadow-md md:p-4"
                style={{ borderColor: '#E6ECF5', borderRadius: '12px' }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.02em] md:text-xs md:normal-case md:tracking-normal" style={{ color: '#5F7088' }}>{card.label}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: colors.dot }}
                  />
                </div>
                <div className="text-[30px] font-semibold leading-8 tracking-[-0.02em] md:text-3xl md:font-bold" style={{ color: colors.text }}>{card.value}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Alert Cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:mb-6 md:gap-4">
        <div className="border bg-white p-3.5 md:p-4" style={{ borderColor: '#E6ECF5', borderRadius: '12px' }}>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.02em] md:text-xs md:normal-case md:tracking-normal" style={{ color: '#5F7088' }}>Encerradas este mês</p>
          <p className="text-[26px] font-semibold leading-7 md:text-2xl md:font-bold" style={{ color: '#10B981' }}>{metrics.encerradasMes}</p>
        </div>
        <div
          className="border p-3.5 md:p-4"
          style={{
            background: metrics.violacoesSla > 0 ? '#FEE2E2' : 'white',
            borderColor: metrics.violacoesSla > 0 ? '#FECACA' : '#E6ECF5',
            borderRadius: '12px',
          }}
        >
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.02em] md:text-xs md:normal-case md:tracking-normal" style={{ color: metrics.violacoesSla > 0 ? '#B91C1C' : '#5F7088' }}>
            Violações de SLA
          </p>
          <p className="text-[26px] font-semibold leading-7 md:text-2xl md:font-bold" style={{ color: metrics.violacoesSla > 0 ? '#B91C1C' : '#10B981' }}>
            {metrics.violacoesSla}
          </p>
        </div>
      </div>

      {/* Recent Solicitacoes */}
      <div className="border bg-white" style={{ borderColor: '#E6ECF5', borderRadius: '12px' }}>
        <div className="flex items-center justify-between border-b px-4 py-3.5 md:px-5 md:py-4" style={{ borderColor: '#E6ECF5' }}>
          <h2 className="text-[13px] font-semibold md:text-sm" style={{ color: '#0F172A' }}>Solicitações Ativas</h2>
          <Link href="/solicitacoes" className="text-[12px] font-medium" style={{ color: '#1E40AF' }}>Ver todas →</Link>
        </div>

        <div className="space-y-2.5 p-3.5 md:hidden">
          {solicitacoes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-sm" style={{ color: '#94A3B8' }}>
              <span style={{ fontSize: '20px' }}>📭</span>
              <span>Nenhuma solicitação encontrada</span>
              <Link href="/solicitacoes/nova" className="text-xs font-medium" style={{ color: '#0038A8' }}>
                Criar nova solicitação
              </Link>
            </div>
          ) : (
            solicitacoes.map(s => (
              <SolicitacaoCard
                key={s.id}
                data={{
                  id: s.id,
                  protocolo: s.protocolo,
                  status: s.status as StatusSolicitacao,
                  equipamento: { tag: s.equipamento.tag, descricao: s.equipamento.descricao },
                  area: { nome: s.area.nome, planta: { nome: s.area.planta.nome } },
                  classe: s.classe ? { numero: s.classe.numero } : null,
                  periodoInicio: s.periodoInicio,
                  periodoFim: s.periodoFim,
                  dataEnvio: s.dataEnvio,
                  dataAprovacaoFinal: s.dataAprovacaoFinal,
                  dataDesabilitacao: s.dataDesabilitacao,
                  dataReabilitacao: s.dataReabilitacao,
                  prazoPrevitoAtingido: s.prazoPrevitoAtingido,
                  prazoMaximoAtingido: s.prazoMaximoAtingido,
                }}
                actionHref={`/solicitacoes/${s.id}`}
                actionLabel={
                  s.status === 'EXECUCAO_AUTORIZADA'
                    ? 'Executar desabilitação →'
                    : s.status === 'EM_APROVACAO'
                    ? 'Analisar'
                    : s.status === 'DESABILITADO'
                    ? 'Reabilitar'
                    : s.status === 'EM_VALIDACAO_DA_REABILITACAO'
                    ? 'Validar'
                    : undefined
                }
              />
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
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
                  <td colSpan={6} className="text-center py-8 text-sm">
                    <div className="flex flex-col items-center gap-2" style={{ color: '#94A3B8' }}>
                      <span style={{ fontSize: '20px' }}>📭</span>
                      <span>Nenhuma solicitação encontrada</span>
                      <Link href="/solicitacoes/nova" className="text-xs font-medium" style={{ color: '#0038A8' }}>
                        Criar nova solicitação
                      </Link>
                    </div>
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
      </div>
    </div>
  )
}
