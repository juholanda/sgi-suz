'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteRascunhoButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Excluir este rascunho? Esta ação não pode ser desfeita.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/solicitacoes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Erro ao excluir')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete() }}
      disabled={loading}
      title="Excluir rascunho"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 500,
        color: '#DC2626',
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 4,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>delete</span>
      {loading ? 'Excluindo...' : 'Excluir'}
    </button>
  )
}
