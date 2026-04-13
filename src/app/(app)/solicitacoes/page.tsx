import { prisma } from '@/lib/db'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusSolicitacao, ClasseNum, tokens } from '@/lib/tokens'
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

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'EM_APROVACAO', label: 'Em Aprovação' },
  { value: 'EXECUCAO_AUTORIZADA', label: 'Exec. Autorizada' },
  { value: 'EM_EXECUCAO', label: 'Em Execução' },
  { value: 'DESABILITADO', label: 'Desabilitados' },
  { value: 'EM_REABILITACAO', label: 'Em Reabilitação' },
  { value: 'EM_VALIDACAO_DA_REABILITACAO', label: 'Aguard. Validação' },
  { value: 'ENCERRADA', label: 'Encerradas' },
  { value: 'RASCUNHO', label: 'Rascunhos' },
]

async function getSolicitacoes(status?: string) {
  return prisma.solicitacao.findMany({
    where: status ? { status } : { status: { notIn: ['CANCELADA', 'REJEITADA'] } },
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
    take: 100,
  })
}

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const activeStatus = searchParams.status ?? ''
  const solicitacoes = await getSolicitacoes(activeStatus || undefined)

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Solicitações</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            {solicitacoes.length} {solicitacoes.length === 1 ? 'solicitação' : 'solicitações'}
            {activeStatus && ` · filtrando por status`}
          </p>
        </div>
        <Link
          href="/solicitacoes/nova"
          className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
          style={{ background: '#0038A8', borderRadius: '4px' }}
        >
          + Nova
        </Link>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTERS.map(f => {
          const isActive = activeStatus === f.value
          const count = f.value
            ? solicitacoes.filter(s => s.status === f.value).length
            : solicitacoes.length
          return (
            <Link
              key={f.value}
              href={f.value ? `/solicitacoes?status=${f.value}` : '/solicitacoes'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                borderRadius: '20px',
                border: isActive ? '1.5px solid #0038A8' : '1.5px solid #E2E8F0',
                background: isActive ? '#EBF0FB' : 'white',
                color: isActive ? '#0038A8' : '#475569',
              }}
            >
              {f.label}
              {f.value && (
                <span
                  className="text-xs font-bold px-1 rounded-full"
                  style={{
                    background: isActive ? '#0038A8' : '#F1F5F9',
                    color: isActive ? 'white' : '#6B7280',
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {f.value ? solicitacoes.filter(s => s.status === f.value).length : count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Flat list */}
      {solicitacoes.length === 0 ? (
        <div className="text-center py-16 bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#CBD5E1', display: 'block', marginBottom: 12 }}>
            description
          </span>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação encontrada.</p>
          <Link href="/solicitacoes/nova" className="inline-block mt-3 text-sm" style={{ color: '#0038A8' }}>
            Criar primeira solicitação →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {solicitacoes.map(s => {
            const statusColors = tokens.colors.status[s.status as StatusSolicitacao]
            return (
              <Link key={s.id} href={`/solicitacoes/${s.id}`}>
                <div
                  className="bg-white border flex items-center gap-4 px-4 py-3 hover:shadow-sm transition-shadow cursor-pointer"
                  style={{
                    borderColor: '#E2E8F0',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${statusColors?.text ?? '#94A3B8'}`,
                  }}
                >
                  {/* TAG */}
                  <div className="shrink-0">
                    <div
                      className="px-2 py-1 font-mono text-xs font-semibold"
                      style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}
                    >
                      {s.equipamento.tag}
                    </div>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
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
                      <span>{s.solicitante.nome}</span>
                      {s.dataDesabilitacao && (
                        <>
                          <span>·</span>
                          <span>Desabilitado {formatDistanceToNow(s.dataDesabilitacao, { locale: ptBR, addSuffix: true })}</span>
                        </>
                      )}
                    </div>
                    {/* Aprovadores */}
                    {s.aprovacoes.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-xs" style={{ color: '#94A3B8' }}>Aprovadores:</span>
                        {s.aprovacoes.map(a => {
                          const dotColor =
                            a.status === 'APROVADO' ? '#16A34A' :
                            a.status === 'REJEITADO' ? '#DC2626' :
                            a.status === 'PENDENTE' ? '#2563EB' : '#94A3B8'
                          const bg =
                            a.status === 'APROVADO' ? '#DCFCE7' :
                            a.status === 'REJEITADO' ? '#FEE2E2' :
                            a.status === 'PENDENTE' ? '#DBEAFE' : '#F1F5F9'
                          const perfil = a.aprovador.perfis[0]?.perfil
                          return (
                            <span
                              key={a.nivel}
                              className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5"
                              style={{ background: bg, color: dotColor, borderRadius: '4px' }}
                              title={`${a.aprovador.nome}${perfil ? ` · ${PERFIL_LABELS[perfil] ?? perfil}` : ''} · ${a.status}`}
                            >
                              N{a.nivel} {a.aprovador.nome.split(' ')[0]}
                              {perfil && <span style={{ opacity: 0.7 }}>· {PERFIL_LABELS[perfil] ?? perfil}</span>}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                    {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

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
