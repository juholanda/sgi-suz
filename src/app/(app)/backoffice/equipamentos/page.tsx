import { prisma } from '@/lib/db'
import ImportarExcelButton from './ImportarExcelButton'

async function getEquipamentos() {
  return prisma.equipamento.findMany({
    include: { area: { include: { planta: true } } },
    orderBy: { tag: 'asc' },
  })
}

export default async function EquipamentosPage() {
  const equipamentos = await getEquipamentos()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Equipamentos</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Backoffice · TAGs e intertravamentos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <ImportarExcelButton />
          <button className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#0038A8', borderRadius: '4px' }}>
            + Novo Equipamento
          </button>
        </div>
      </div>

      <div className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <div className="px-4 py-3 border-b flex gap-3" style={{ borderColor: '#E2E8F0' }}>
          <input
            placeholder="Buscar por TAG, nome ou função..."
            className="flex-1 px-3 py-1.5 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
          />
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['TAG', 'Nome', 'Função', 'Planta', 'Área', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipamentos.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>Nenhum equipamento cadastrado</td></tr>
            ) : equipamentos.map(e => (
              <tr key={e.id} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold px-2 py-1" style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}>
                    {e.tag}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#0F172A' }}>{e.descricao}</td>
                <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{e.funcaoProtegida ?? '—'}</td>
                <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{e.area.planta.nome}</td>
                <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{e.area.nome}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 font-medium" style={{ borderRadius: '4px', background: e.ativo ? '#D1FAE5' : '#F1F5F9', color: e.ativo ? '#065F46' : '#64748B' }}>
                    {e.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs" style={{ color: '#0038A8' }}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
          <span className="text-xs" style={{ color: '#6B7280' }}>{equipamentos.length} equipamento(s)</span>
          <button className="text-xs" style={{ color: '#0038A8' }}>Exportar XLSX</button>
        </div>
      </div>
    </div>
  )
}
