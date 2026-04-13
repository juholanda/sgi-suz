'use client'
import { useEffect, useState } from 'react'

interface Area { id: string; nome: string; codigo: string | null; ativa: boolean; planta: { nome: string } }

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/backoffice/areas').then(r => r.json()).then(data => { setAreas(data); setLoading(false) })
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Áreas operacionais</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Backoffice · Vinculadas às plantas</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#0038A8', borderRadius: '4px' }}>
          + Nova Área
        </button>
      </div>

      <div className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Planta', 'Nome da Área', 'Código', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>Carregando...</td></tr>
            ) : areas.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>Nenhuma área cadastrada</td></tr>
            ) : areas.map(a => (
              <tr key={a.id} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                <td className="px-4 py-3 text-sm" style={{ color: '#475569' }}>{a.planta.nome}</td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#0F172A' }}>{a.nome}</td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: '#475569' }}>{a.codigo || '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 font-medium" style={{ borderRadius: '4px', background: a.ativa ? '#D1FAE5' : '#F1F5F9', color: a.ativa ? '#065F46' : '#64748B' }}>
                    {a.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs" style={{ color: '#0038A8' }}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
