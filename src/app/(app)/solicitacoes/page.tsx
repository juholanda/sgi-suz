import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PERFIL_LABELS: Record<string, string> = {
  APROVADOR: 'Aprovador',
  GESTOR_SMS: 'Gestor SMS',
  ADMINISTRADOR: 'Administrador',
  SOLICITANTE: 'Solicitante',
  EXECUTANTE: 'Executante',
}

async function getSolicitacoes() {
  return prisma.solicitacao.findMany({
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
      executante: { select: { nome: true } },
      aprovacoes: {
        where: { tipo: 'DESABILITACAO' },
        orderBy: { nivel: 'asc' },
        select: {
          nivel: true,
          status: true,
          aprovador: {
            select: {
              nome: true,
              matricula: true,
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
    take: 50,
  })
}

const STATUS_GROUPS = [
  { status: 'EM_APROVACAO', label: 'Em Aprovação' },
  { status: 'EXECUCAO_AUTORIZADA', label: 'Execução Autorizada' },
  { status: 'EM_EXECUCAO', label: 'Em Execução (Campo)' },
  { status: 'DESABILITADO', label: 'Desabilitados' },
  { status: 'EM_REABILITACAO', label: 'Em Reabilitação' },
  { status: 'EM_VALIDACAO_DA_REABILITACAO', label: 'Aguardando Validação' },
  { status: 'RASCUNHO', label: 'Rascunhos' },
]

export default async function SolicitacoesPage() {
  const solicitacoes = await getSolicitacoes()

  const grouped = STATUS_GROUPS.map(g => ({
    ...g,
    items: solicitacoes.filter(s => s.status === g.status),
  })).filter(g => g.items.length > 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Solicitações</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Worklist de intertravamentos</p>
        </div>
        <Link
          href="/solicitacoes/nova"
          className="px-4 py-2 text-sm font-medium text-white"
          style={{ background: '#0038A8', borderRadius: '4px' }}
        >
          + Nova Solicitação
        </Link>
      </div>

      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.status}>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={group.status as StatusSolicitacao} />
              <span className="text-sm" style={{ color: '#6B7280' }}>({group.items.length})</span>
            </div>
            <div className="grid gap-3">
              {group.items.map(s => (
                <Link key={s.id} href={`/solicitacoes/${s.id}`}>
                  <div
                    className="bg-white border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer"
                    style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
                  >
                    {/* TAG */}
                    <div className="flex-shrink-0">
                      <div
                        className="px-3 py-1.5 font-mono text-sm font-semibold"
                        style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}
                      >
                        {s.equipamento.tag}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-medium font-mono" style={{ color: '#0F172A' }}>
                          {s.protocolo}
                        </span>
                        {s.prazoMaximoAtingido && (
                          <span className="text-xs px-1.5 py-0.5 font-medium" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
                            ⚠ Prazo máximo
                          </span>
                        )}
                        {s.prazoPrevitoAtingido && !s.prazoMaximoAtingido && (
                          <span className="text-xs px-1.5 py-0.5 font-medium" style={{ background: '#FEF3C7', color: '#B45309', borderRadius: '4px' }}>
                            ⏱ Prazo previsto
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs" style={{ color: '#6B7280' }}>
                        <span>{s.area.planta.nome} · {s.area.nome}</span>
                        <span>·</span>
                        <span>Solicitante: {s.solicitante.nome}</span>
                        {s.dataDesabilitacao && (
                          <>
                            <span>·</span>
                            <span>Desabilitado {formatDistanceToNow(s.dataDesabilitacao, { locale: ptBR, addSuffix: true })}</span>
                          </>
                        )}
                      </div>

                      {/* Aprovadores — visíveis sempre */}
                      {s.aprovacoes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>Aprovadores:</span>
                          {s.aprovacoes.map(a => {
                            const statusColor =
                              a.status === 'APROVADO' ? '#16A34A' :
                              a.status === 'REJEITADO' ? '#DC2626' :
                              a.status === 'PENDENTE' ? '#2563EB' : '#94A3B8'
                            const statusBg =
                              a.status === 'APROVADO' ? '#DCFCE7' :
                              a.status === 'REJEITADO' ? '#FEE2E2' :
                              a.status === 'PENDENTE' ? '#DBEAFE' : '#F1F5F9'
                            const perfil = a.aprovador.perfis[0]?.perfil
                            const primeiroNome = a.aprovador.nome.split(' ')[0]
                            return (
                              <span
                                key={a.nivel}
                                className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium"
                                style={{ background: statusBg, color: statusColor, borderRadius: '4px' }}
                                title={`${a.aprovador.nome}${perfil ? ` · ${PERFIL_LABELS[perfil] ?? perfil}` : ''} · ${a.status}`}
                              >
                                <span style={{ opacity: 0.6 }}>N{a.nivel}</span>
                                {primeiroNome}
                                {perfil && <span style={{ opacity: 0.7 }}>· {PERFIL_LABELS[perfil] ?? perfil}</span>}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Classe */}
                    {s.classe && (
                      <ClasseBadge classe={s.classe.numero as ClasseNum} showPrazo size="sm" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {grouped.length === 0 && (
          <div className="text-center py-16 bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação encontrada.</p>
            <Link href="/solicitacoes/nova" className="inline-block mt-3 text-sm" style={{ color: '#0038A8' }}>
              Criar primeira solicitação →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
