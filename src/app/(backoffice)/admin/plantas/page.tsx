'use client'
import { useEffect, useState, useMemo } from 'react'

interface Planta {
  id: string
  nome: string
  codigo: string | null
  ativa: boolean
  _count: { areas: number }
}
interface FormState { nome: string; codigo: string; ativa: boolean }
const emptyForm = (): FormState => ({ nome: '', codigo: '', ativa: true })
type SortDir = 'asc' | 'desc'
type SK = 'nome' | 'codigo' | 'areas' | 'status'

const thS = (active: boolean) => ({
  textAlign: 'left' as const, padding: '12px 16px', fontSize: '12px',
  fontWeight: 500, cursor: 'pointer' as const, userSelect: 'none' as const,
  whiteSpace: 'nowrap' as const, color: active ? '#0038A8' : '#6B7280',
})

export default function PlantasPage() {
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing: Planta | null }>({ open: false, editing: null })
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [sk, setSk] = useState<SK>('nome')
  const [sd, setSd] = useState<SortDir>('asc')
  const [fNome, setFNome] = useState('')
  const [fStatus, setFStatus] = useState('all')

  const loadPlantas = () => {
    setLoading(true)
    fetch('/api/backoffice/plantas')
      .then(r => r.json())
      .then(data => { setPlantas(data); setLoading(false) })
      .catch(() => { setError('Erro ao carregar plantas'); setLoading(false) })
  }
  useEffect(() => { loadPlantas() }, [])

  const toggle = (key: SK) => { if (sk === key) setSd(d => d === 'asc' ? 'desc' : 'asc'); else { setSk(key); setSd('asc') } }
  const ico = (col: SK) => (
    <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginLeft: 4, opacity: sk === col ? 1 : 0.35 }}>
      {sk === col ? (sd === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
    </span>
  )

  const display = useMemo(() => {
    let d = [...plantas]
    if (fNome) { const q = fNome.toLowerCase(); d = d.filter(p => p.nome.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q)) }
    if (fStatus === 'ativa') d = d.filter(p => p.ativa)
    if (fStatus === 'inativa') d = d.filter(p => !p.ativa)
    return d.sort((a, b) => {
      const va = sk === 'nome' ? a.nome.toLowerCase() : sk === 'codigo' ? (a.codigo||'').toLowerCase() : sk === 'areas' ? a._count.areas : (a.ativa ? 0 : 1)
      const vb = sk === 'nome' ? b.nome.toLowerCase() : sk === 'codigo' ? (b.codigo||'').toLowerCase() : sk === 'areas' ? b._count.areas : (b.ativa ? 0 : 1)
      if (va < vb) return sd === 'asc' ? -1 : 1; if (va > vb) return sd === 'asc' ? 1 : -1; return 0
    })
  }, [plantas, fNome, fStatus, sk, sd])

  const openCreate = () => { setForm(emptyForm()); setFormError(''); setModal({ open: true, editing: null }) }
  const openEdit = (p: Planta) => { setForm({ nome: p.nome, codigo: p.codigo || '', ativa: p.ativa }); setFormError(''); setModal({ open: true, editing: p }) }
  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.nome.trim()) { setFormError('Nome é obrigatório'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch(modal.editing ? `/api/backoffice/plantas/${modal.editing.id}` : '/api/backoffice/plantas', {
        method: modal.editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Erro ao salvar'); return }
      closeModal(); loadPlantas()
    } finally { setSaving(false) }
  }

  const handleToggle = async (p: Planta) => {
    if (!window.confirm(`${p.ativa ? 'Inativar' : 'Reativar'} a planta "${p.nome}"?`)) return
    await fetch(`/api/backoffice/plantas/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: p.nome, codigo: p.codigo || '', ativa: !p.ativa }) })
    loadPlantas()
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Gestão de Plantas</h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '2px', marginBottom: 0 }}>Backoffice · Estrutura organizacional</p>
        </div>
        <button onClick={openCreate} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#0038A8', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>+ Nova Planta</button>
      </div>

      {error && <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', paddingBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Buscar</div>
          <input value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Nome ou código..." className="field-input" style={{ width: '220px' }} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Status</div>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="field-input" style={{ width: '140px' }}>
            <option value="all">Todos</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </select>
        </div>
        {(fNome || fStatus !== 'all') && (
          <button onClick={() => { setFNome(''); setFStatus('all') }} style={{ alignSelf: 'flex-end', padding: '7px 12px', fontSize: '13px', color: '#475569', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}>Limpar</button>
        )}
      </div>

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th onClick={() => toggle('nome')} style={thS(sk==='nome')}>Nome{ico('nome')}</th>
              <th onClick={() => toggle('codigo')} style={thS(sk==='codigo')}>Código{ico('codigo')}</th>
              <th onClick={() => toggle('areas')} style={thS(sk==='areas')}>Áreas{ico('areas')}</th>
              <th onClick={() => toggle('status')} style={thS(sk==='status')}>Status{ico('status')}</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Carregando...</td></tr>
            ) : display.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Nenhuma planta encontrada</td></tr>
            ) : display.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{p.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{p.codigo || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{p._count.areas}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', padding: '2px 8px', fontWeight: 500, borderRadius: '4px', background: p.ativa ? '#D1FAE5' : '#F1F5F9', color: p.ativa ? '#065F46' : '#64748B' }}>{p.ativa ? 'Ativa' : 'Inativa'}</span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(p)} style={{ fontSize: '12px', color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Editar</button>
                  <button onClick={() => handleToggle(p)} style={{ fontSize: '12px', color: p.ativa ? '#DC2626' : '#16A34A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{p.ativa ? 'Inativar' : 'Reativar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>{display.length} planta(s)</span>
        </div>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '4px', padding: '24px', width: '440px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>{modal.editing ? 'Editar Planta' : 'Nova Planta'}</h2>
            {formError && <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>{formError}</div>}
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Nome <span className="field-required">*</span></label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="field-input" placeholder="Ex: Planta Limeira" autoFocus />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Código</label>
              <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} className="field-input" placeholder="Ex: LIM" />
            </div>
            {modal.editing && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="ativa" checked={form.ativa} onChange={e => setForm(f => ({ ...f, ativa: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="ativa" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>Planta ativa</label>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '8px 16px', fontSize: '14px', color: '#475569', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: saving ? '#94A3B8' : '#0038A8', borderRadius: '4px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
