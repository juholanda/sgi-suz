import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import Link from 'next/link'

async function getSolicitacoesParaAprovar() {
  return prisma.solicitacao.findMany({
    where: { status: { in: ['EM_APROVACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'EXTENSAO_EM_ANALISE'] } },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
      aprovacoes: { include: { aprovador: { select: { nome: true } } } },
    },
    orderBy: { dataEnvio: 'asc' },
  })
}

export default async function AprovacoesPage() {
  const solicitacoes = await getSolicitacoesParaAprovar()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Aprovações</h1>
        <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Solicitações aguardando sua análise</p>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="bg-white border text-center py-12" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação aguardando aprovação.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitacoes.map(s => (
            <div key={s.id} className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-semibold" style={{ color: '#0038A8' }}>{s.protocolo}</span>
                    <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                    {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#6B7280' }}>
                    <span className="font-mono font-medium" style={{ color: '#0F172A' }}>{s.equipamento.tag}</span>
                    <span>·</span>
                    <span>{s.area.planta.nome} · {s.area.nome}</span>
                    <span>·</span>
                    <span>Solicitante: {s.solicitante.nome}</span>
                  </div>
                  {s.motivoDesabilitacao && (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: '#475569' }}>{s.motivoDesabilitacao}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="px-3 py-1.5 text-xs font-medium text-white text-center" style={{ background: '#0038A8', borderRadius: '4px' }}>
                    Sua aprovação é necessária
                  </div>
                  <Link
                    href={`/solicitacoes/${s.id}`}
                    className="px-3 py-1.5 text-xs text-center border"
                    style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
