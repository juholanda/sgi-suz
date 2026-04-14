import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { PageBreadcrumb } from '@/components/sgi/PageBreadcrumb'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'
import { StatusSolicitacao } from '@/lib/tokens'
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
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id as string
  const solicitacoes = await getSolicitacoesParaAprovar()
  const comAcaoDisponivel = solicitacoes.filter(s => {
    if (['EM_APROVACAO', 'EXTENSAO_EM_ANALISE'].includes(s.status)) {
      const pendentes = s.aprovacoes.filter(a => a.status === 'PENDENTE' && a.tipo !== 'REABILITACAO')
      if (pendentes.length === 0) return false
      const nextNivel = Math.min(...pendentes.map(a => a.nivel))
      return pendentes.some(a => a.nivel === nextNivel && a.aprovadorId === userId)
    }
    if (s.status === 'EM_VALIDACAO_DA_REABILITACAO') {
      return s.aprovacoes.some(a => a.tipo === 'REABILITACAO' && a.status === 'PENDENTE' && a.aprovadorId === userId)
    }
    return false
  })

  return (
    <div className="p-6">
      <PageBreadcrumb
        items={[
          { label: 'Início', href: '/dashboard' },
          { label: 'Solicitações', href: '/solicitacoes' },
          { label: 'Aprovações' },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Aprovações</h1>
        <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Solicitações aguardando sua análise</p>
      </div>

      {comAcaoDisponivel.length === 0 ? (
        <div className="bg-white border text-center py-12 flex flex-col items-center gap-2" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação encontrada</p>
          <Link href="/solicitacoes/nova" className="text-sm font-medium" style={{ color: '#0038A8' }}>
            Criar nova solicitação
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {comAcaoDisponivel.map(s => (
            <SolicitacaoCard
              key={s.id}
              data={{
                id: s.id,
                protocolo: s.protocolo,
                status: s.status as StatusSolicitacao,
                equipamento: { tag: s.equipamento.tag, descricao: s.motivoDesabilitacao || s.equipamento.descricao },
                area: { nome: s.area.nome, planta: { nome: s.area.planta.nome } },
                classe: s.classe ? { numero: s.classe.numero } : null,
                periodoInicio: s.periodoInicio,
                periodoFim: s.periodoFim,
                dataDesabilitacao: s.dataDesabilitacao,
                dataReabilitacao: s.dataReabilitacao,
                prazoPrevitoAtingido: s.prazoPrevitoAtingido,
                prazoMaximoAtingido: s.prazoMaximoAtingido,
              }}
              actionHref={`/solicitacoes/${s.id}`}
              actionLabel="Analisar"
            />
          ))}
        </div>
      )}
    </div>
  )
}
