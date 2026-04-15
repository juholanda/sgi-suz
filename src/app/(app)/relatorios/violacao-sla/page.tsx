import { prisma } from '@/lib/db'
import { buildPlantaScope } from '@/lib/scope'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { ClasseNum } from '@/lib/tokens'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cookies } from 'next/headers'

async function getViolacoes() {
  const cookieStore = await cookies()
  const plantaId = cookieStore.get('sgi_planta_ativa')?.value ?? ''
  return prisma.solicitacao.findMany({
    where: { prazoMaximoAtingido: true, ...buildPlantaScope(plantaId) },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
    },
    orderBy: { dataDesabilitacao: 'desc' },
  })
}

function fmt(d: Date | null | undefined) {
  if (!d) return '—'
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

function diasExcedidos(dataDesab: Date | null, prazoMaxDias: number | null): string {
  if (!dataDesab || !prazoMaxDias) return '—'
  const prazoMs = prazoMaxDias * 24 * 60 * 60 * 1000
  const decorrido = Date.now() - dataDesab.getTime()
  const excesso = decorrido - prazoMs
  if (excesso <= 0) return '—'
  return `+${Math.ceil(excesso / 86400000)} dia(s)`
}

export default async function ViolacaoSlaPage() {
  const violacoes = await getViolacoes()

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/relatorios" className="text-xs" style={{ color: '#6B7280' }}>← Relatórios</Link>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Relatório de violação de SLA</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Uso: Compliance, Segurança do Processo, Auditoria</p>
        </div>
        <button className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
          Exportar XLSX
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border p-4" style={{ borderColor: '#FECACA', background: '#FEF2F2', borderRadius: '4px' }}>
          <p className="text-xs font-medium" style={{ color: '#B91C1C' }}>Total de violações</p>
          <p className="text-3xl font-bold mt-1" style={{ color: '#DC2626' }}>{violacoes.length}</p>
        </div>
        <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <p className="text-xs font-medium" style={{ color: '#475569' }}>Ainda desabilitados</p>
          <p className="text-3xl font-bold mt-1" style={{ color: '#EA580C' }}>
            {violacoes.filter(v => v.status === 'DESABILITADO').length}
          </p>
        </div>
        <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <p className="text-xs font-medium" style={{ color: '#475569' }}>Encerrados</p>
          <p className="text-3xl font-bold mt-1" style={{ color: '#10B981' }}>
            {violacoes.filter(v => v.status === 'ENCERRADA').length}
          </p>
        </div>
      </div>

      <div className="bg-white border overflow-hidden" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        {/* Mobile: cards */}
        <div className="md:hidden divide-y" style={{ borderColor: '#F1F5F9' }}>
          {violacoes.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>Nenhuma violação registrada.</p>
          ) : violacoes.map(v => (
            <Link key={v.id} href={`/solicitacoes/${v.id}`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: '#0038A8' }}>{v.equipamento.tag}</span>
                  {v.classe && <ClasseBadge classe={v.classe.numero as ClasseNum} size="sm" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{v.area.nome} · {fmt(v.dataDesabilitacao)}</span>
                  <span className="text-xs font-semibold" style={{ color: '#DC2626' }}>
                    {diasExcedidos(v.dataDesabilitacao, v.classe?.prazoMaximoDias ?? null)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop: table */}
        <table className="w-full hidden md:table">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Protocolo', 'TAG', 'Área', 'Classe', 'Desabilitado em', 'Excesso', 'Solicitante'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {violacoes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>Nenhuma violação registrada.</td></tr>
            ) : violacoes.map(v => (
              <tr key={v.id} className="border-t hover:bg-gray-50" style={{ borderColor: '#F1F5F9' }}>
                <td className="px-4 py-3">
                  <Link href={`/solicitacoes/${v.id}`} className="text-sm font-medium" style={{ color: '#0038A8' }}>
                    {v.protocolo}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#0F172A' }}>{v.equipamento.tag}</td>
                <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{v.area.planta.nome} · {v.area.nome}</td>
                <td className="px-4 py-3">{v.classe && <ClasseBadge classe={v.classe.numero as ClasseNum} size="sm" />}</td>
                <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{fmt(v.dataDesabilitacao)}</td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#DC2626' }}>
                  {diasExcedidos(v.dataDesabilitacao, v.classe?.prazoMaximoDias ?? null)}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{v.solicitante.nome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
