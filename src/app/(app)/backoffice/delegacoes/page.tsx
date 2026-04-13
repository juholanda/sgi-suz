import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

async function getDelegacoes() {
  return prisma.delegacao.findMany({
    include: {
      delegadoPor:  { select: { nome: true, matricula: true } },
      delegadoPara: { select: { nome: true, matricula: true } },
    },
    orderBy: { dataInicio: 'desc' },
  })
}

export default async function DelegacoesPage() {
  const delegacoes = await getDelegacoes()
  const hoje = new Date()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Suplências / delegações</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Backoffice · Vigência automática de aprovações</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#0038A8', borderRadius: '4px' }}>
          + Nova Delegação
        </button>
      </div>

      <div className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Delegado por', 'Suplente', 'Início', 'Fim', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {delegacoes.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>Nenhuma delegação cadastrada</td></tr>
            ) : delegacoes.map(d => {
              const vigente = d.ativa && d.dataInicio <= hoje && d.dataFim >= hoje
              const futura  = d.ativa && d.dataInicio > hoje
              const statusLabel = vigente ? 'Vigente' : futura ? 'Futura' : 'Encerrada'
              const statusStyle = vigente
                ? { bg: '#D1FAE5', text: '#065F46' }
                : futura
                  ? { bg: '#DBEAFE', text: '#1D4ED8' }
                  : { bg: '#F1F5F9', text: '#64748B' }

              return (
                <tr key={d.id} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                  <td className="px-4 py-3 text-sm" style={{ color: '#0F172A' }}>
                    {d.delegadoPor.nome}
                    <span className="ml-1 text-xs font-mono" style={{ color: '#94A3B8' }}>{d.delegadoPor.matricula}</span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#0F172A' }}>
                    {d.delegadoPara.nome}
                    <span className="ml-1 text-xs font-mono" style={{ color: '#94A3B8' }}>{d.delegadoPara.matricula}</span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>
                    {format(d.dataInicio, 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>
                    {format(d.dataFim, 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 font-medium" style={{ borderRadius: '4px', background: statusStyle.bg, color: statusStyle.text }}>
                      {statusLabel}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
