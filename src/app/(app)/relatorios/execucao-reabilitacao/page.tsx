import { prisma } from '@/lib/db'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { ClasseNum } from '@/lib/tokens'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

async function getRelatorio() {
  return prisma.solicitacao.findMany({
    where: {
      status: { in: ['ENCERRADA', 'EM_REABILITACAO', 'EM_VALIDACAO_DA_REABILITACAO'] },
      dataDesabilitacao: { not: null },
    },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
      executante: { select: { nome: true } },
      checklists: true,
    },
    orderBy: { dataDesabilitacao: 'desc' },
  })
}

function fmt(d: Date | null | undefined) {
  if (!d) return '—'
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

function diff(a: Date | null, b: Date | null): string {
  if (!a || !b) return '—'
  const ms = Math.abs(b.getTime() - a.getTime())
  const h = Math.floor(ms / 3600000)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

export default async function ExecucaoReabilitacaoPage() {
  const solicitacoes = await getRelatorio()

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/relatorios" className="text-xs" style={{ color: '#6B7280' }}>← Relatórios</Link>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Relatório de execução e reabilitação</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Uso: Manutenção e SMS — disciplina operacional</p>
        </div>
        <button className="px-4 py-2 text-sm border hidden md:block" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
          Exportar XLSX
        </button>
      </div>

      <div className="bg-white border overflow-auto" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <table className="w-full min-w-[700px]">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Protocolo', 'TAG', 'Classe', 'Aprovação→Execução', 'Execução→Reabilitação', 'Duração total', 'Checklist', 'Executante'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {solicitacoes.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>Nenhum dado disponível.</td></tr>
            ) : solicitacoes.map(s => {
              const checkDesab = s.checklists.filter(c => c.tipo === 'DESABILITACAO')
              const checkReab  = s.checklists.filter(c => c.tipo === 'REABILITACAO')
              const cumpridos = [...checkDesab, ...checkReab].filter(c => c.resposta === 'SIM' || c.resposta === 'NA').length
              const total = checkDesab.length + checkReab.length

              return (
                <tr key={s.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#F1F5F9' }}>
                  <td className="px-4 py-3">
                    <Link href={`/solicitacoes/${s.id}`} className="text-xs font-mono font-medium" style={{ color: '#0038A8' }}>
                      {s.protocolo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: '#0F172A' }}>{s.equipamento.tag}</td>
                  <td className="px-4 py-3">{s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{diff(s.dataAprovacaoFinal, s.dataDesabilitacao)}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{diff(s.dataDesabilitacao, s.dataReabilitacao)}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#0F172A' }}>{diff(s.dataDesabilitacao, s.dataEncerramento)}</td>
                  <td className="px-4 py-3">
                    {total > 0 ? (
                      <span
                        className="text-xs px-2 py-0.5 font-medium"
                        style={{
                          borderRadius: '4px',
                          background: cumpridos === total ? '#D1FAE5' : '#FEF3C7',
                          color: cumpridos === total ? '#065F46' : '#B45309',
                        }}
                      >
                        {cumpridos}/{total} ✓
                      </span>
                    ) : <span style={{ color: '#94A3B8' }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{s.executante?.nome ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
