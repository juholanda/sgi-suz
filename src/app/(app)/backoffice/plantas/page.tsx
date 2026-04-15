import { prisma } from '@/lib/db'
import Link from 'next/link'

async function getPlantas() {
  return prisma.planta.findMany({ include: { _count: { select: { areas: true } } }, orderBy: { nome: 'asc' } })
}

export default async function PlantasPage() {
  const plantas = await getPlantas()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Gestão de plantas</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Backoffice · Estrutura organizacional</p>
        </div>
        <button
          className="px-4 py-2 text-sm font-medium text-white"
          style={{ background: '#0038A8', borderRadius: '4px' }}
        >
          + Nova Planta
        </button>
      </div>

      <div className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Nome', 'Código', 'Áreas', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plantas.map(p => (
              <tr key={p.id} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#0F172A' }}>{p.nome}</td>
                <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{p.codigo || '—'}</td>
                <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{p._count.areas}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-1 font-medium"
                    style={{
                      borderRadius: '4px',
                      background: p.ativa ? '#D1FAE5' : '#F1F5F9',
                      color: p.ativa ? '#065F46' : '#64748B',
                    }}
                  >
                    {p.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs" style={{ color: '#0038A8' }}>Editar</button>
                </td>
              </tr>
            ))}
            {plantas.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>
                  Nenhuma planta cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
