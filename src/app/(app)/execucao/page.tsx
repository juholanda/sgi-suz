import { prisma } from '@/lib/db'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import Link from 'next/link'
import { PageBreadcrumb } from '@/components/sgi/PageBreadcrumb'

async function getSolicitacoesExecucao() {
  return prisma.solicitacao.findMany({
    where: { status: { in: ['EXECUCAO_AUTORIZADA', 'EM_EXECUCAO', 'DESABILITADO', 'EM_REABILITACAO'] } },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
      executante: { select: { nome: true } },
    },
    orderBy: { dataAprovacaoFinal: 'asc' },
  })
}

export default async function ExecucaoPage() {
  const solicitacoes = await getSolicitacoesExecucao()

  return (
    <div className="p-6">
      <PageBreadcrumb
        items={[
          { label: 'Início', href: '/dashboard' },
          { label: 'Execução' },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Execução em Campo</h1>
        <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Desabilitações autorizadas e em andamento</p>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="bg-white border text-center py-12 flex flex-col items-center gap-2" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <span style={{ fontSize: '20px' }}>🧭</span>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação pendente de execução.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {solicitacoes.map(s => (
            <Link key={s.id} href={`/solicitacoes/${s.id}`}>
              <div className="bg-white border p-4 hover:shadow-sm transition-shadow" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold" style={{ color: '#0F172A' }}>{s.equipamento.tag}</span>
                    <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                    {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                    {s.prazoMaximoAtingido && (
                      <span className="text-xs px-2 py-0.5 font-medium" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
                        ⚠ Prazo máximo atingido
                      </span>
                    )}
                    {s.prazoPrevitoAtingido && !s.prazoMaximoAtingido && (
                      <span className="text-xs px-2 py-0.5 font-medium" style={{ background: '#FEF3C7', color: '#B45309', borderRadius: '4px' }}>
                        ⏱ Prazo previsto atingido
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{s.protocolo}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: '#6B7280' }}>
                  <span>{s.area.planta.nome} · {s.area.nome}</span>
                  {s.executante && <><span>·</span><span>Executor: {s.executante.nome}</span></>}
                  {s.dataDesabilitacao && (
                    <><span>·</span><span>Desde {new Date(s.dataDesabilitacao).toLocaleDateString('pt-BR')}</span></>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
