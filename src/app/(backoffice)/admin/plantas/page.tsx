'use client'
import { useEffect, useState } from 'react'

interface Planta {
  id: string
  nome: string
  codigo: string | null
  ativa: boolean
  _count: { areas: number }
}

interface FormState {
  nome: string
  codigo: string
  ativa: boolean
}

const emptyForm = (): FormState => ({ nome: '', codigo: '', ativa: true })

export default function PlantasPage() {
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing: Planta | null }>({ open: false, editing: null })
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadPlantas = () => {
    setLoading(true)
    fetch('/api/backoffice/plantas')
      .then(r => r.json())
      .then(data => { setPlantas(data); setLoading(false) })
      .catch(() => { setError('Erro ao carregar plantas'); setLoading(false) })
  }

  useEffect(() => { loadPlantas() }, [])

  const openCreate = () => {
    setForm(emptyForm())
    setFormError('')
    setModal({ open: true, editing: null })
  }

  const openEdit = (p: Planta) => {
    setForm({ nome: p.nome, codigo: p.codigo || '', ativa: p.ativa })
    setFormError('')
    setModal({ open: true, editing: p })
  }

  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.nome.trim()) { setFormError('Nome é obrigatório'); return }
    setSaving(true)
    setFormError('')
    try {
      const url = modal.editing ? `/api/backoffice/plantas/${modal.editing.id}` : '/api/backoffice/plantas'
      const method = modal.editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setFormError(d.error || 'Erro ao salvar')
        return
      }
      closeModal()
      loadPlantas()
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (p: Planta) => {
    const confirmed = window.confirm(`${p.ativa ? 'Inativar' : 'Reativar'} a planta "${p.nome}"?`)
    if (!confirmed) return
    await fetch(`/api/backoffice/plantas/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: p.nome, codigo: p.codigo || '', ativa: !p.ativa }),
    })
    loadPlantas()
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Gestão de Plantas</h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '2px', marginBottom: 0 }}>Backoffice · Estrutura organizacional</p>
        </div>
        <button
          onClick={openCreate}
          style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#0038A8', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          + Nova Planta
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Nome', 'Código', 'Áreas', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Carregando...</td></tr>
            ) : plantas.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Nenhuma planta cadastrada</td></tr>
            ) : plantas.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{p.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace', color: '#475569' }}>{p.codigo || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{p._count.areas}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', padding: '2px 8px', fontWeight: 500, borderRadius: '4px', background: p.ativa ? '#D1FAE5' : '#F1F5F9', color: p.ativa ? '#065F46' : '#64748B' }}>
                    {p.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(p)} style={{ fontSize: '12px', color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Editar</button>
                  <button onClick={() => handleToggle(p)} style={{ fontSize: '12px', color: p.ativa ? '#DC2626' : '#16A34A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {p.ativa ? 'Inativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '4px', padding: '24px', width: '440px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>
              {modal.editing ? 'Editar Planta' : 'Nova Planta'}
            </h2>

            {formError && (
              <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Nome *</label>
              <input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Ex: Planta Limeira"
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Código</label>
              <input
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Ex: LIM"
              />
            </div>

            {modal.editing && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="ativa"
                  checked={form.ativa}
                  onChange={e => setForm(f => ({ ...f, ativa: e.target.checked }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="ativa" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>Planta ativa</label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '8px 16px', fontSize: '14px', color: '#475569', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: saving ? '#94A3B8' : '#0038A8', borderRadius: '4px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
