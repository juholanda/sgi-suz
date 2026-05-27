'use client'
import { useEffect, useState, useMemo } from 'react'

interface PlantaSimple { id: string; nome: string }
interface Area {
  id: string
  nome: string
  codigo: string | null
  ativa: boolean
  plantaId: string
  planta: { nome: string }
}
interface FormState { nome: string; codigo: string; plantaId: string; ativa: boolean }
const emptyForm = (): FormState => ({ nome: '', codigo: '', plantaId: '', ativa: true })
type SortDir = 'asc' | 'desc'
type SK = 'planta' | 'nome' | 'codigo' | 'status'

const thS = (active: boolean) => ({
  textAlign: 'left' as const, padding: '12px 16px', fontSize: '12px',
  fontWeight: 500, cursor: 'pointer' as const, userSelect: 'none' as const,
  whiteSpace: 'nowrap' as const, color: active ? '#0038A8' : '#6B7280',
})

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [plantas, setPlantas] = useState<PlantaSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing: Area | null }>({ open: false, editing: null })
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [sk, setSk] = useState<SK>('planta')
  const [sd, setSd] = useState<SortDir>('asc')
  const [fTexto, setFTexto] = useState('')
  const [fPlanta, setFPlanta] = useState('all')
  const [fStatus, setFStatus] = useState('all')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/backoffice/areas').then(r => r.json()),
      fetch('/api/backoffice/plantas').then(r => r.json()),
    ]).then(([areasData, plantasData]) => {
      setAreas(areasData); setPlantas(plantasData); setLoading(false)
    }).catch(() => { setError('Erro ao carregar dados'); setLoading(false) })
  }
  useEffect(() => { loadData() }, [])

  const toggle = (key: SK) => { if (sk === key) setSd(d => d === 'asc' ? 'desc' : 'asc'); else { setSk(key); setSd('asc') } }
  const ico = (col: SK) => sk === col ? (sd === 'asc' ? ' ▲' : ' ▼') : ' ⇅'

  const display = useMemo(() => {
    let d = [...areas]
    if (fTexto) { const q = fTexto.toLowerCase(); d = d.filter(a => a.nome.toLowerCase().includes(q) || (a.codigo || '').toLowerCase().includes(q)) }
    if (fPlanta !== 'all') d = d.filter(a => a.plantaId === fPlanta)
    if (fStatus === 'ativa') d = d.filter(a => a.ativa)
    if (fStatus === 'inativa') d = d.filter(a => !a.ativa)
    return d.sort((a, b) => {
      const va = sk === 'planta' ? a.planta.nome.toLowerCase() : sk === 'nome' ? a.nome.toLowerCase() : sk === 'codigo' ? (a.codigo||'').toLowerCase() : (a.ativa ? 0 : 1)
      const vb = sk === 'planta' ? b.planta.nome.toLowerCase() : sk === 'nome' ? b.nome.toLowerCase() : sk === 'codigo' ? (b.codigo||'').toLowerCase() : (b.ativa ? 0 : 1)
      if (va < vb) return sd === 'asc' ? -1 : 1; if (va > vb) return sd === 'asc' ? 1 : -1; return 0
    })
  }, [areas, fTexto, fPlanta, fStatus, sk, sd])

  const openCreate = () => { setForm(emptyForm()); setFormError(''); setModal({ open: true, editing: null }) }
  const openEdit = (a: Area) => { setForm({ nome: a.nome, codigo: a.codigo || '', plantaId: a.plantaId, ativa: a.ativa }); setFormError(''); setModal({ open: true, editing: a }) }
  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.nome.trim()) { setFormError('Nome é obrigatório'); return }
    if (!form.plantaId) { setFormError('Selecione uma planta'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch(modal.editing ? `/api/backoffice/areas/${modal.editing.id}` : '/api/backoffice/areas', {
        method: modal.editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Erro ao salvar'); return }
      closeModal(); loadData()
    } finally { setSaving(false) }
  }

  const handleToggle = async (a: Area) => {
    if (!window.confirm(`${a.ativa ? 'Inativar' : 'Reativar'} a área "${a.nome}"?`)) return
    await fetch(`/api/backoffice/areas/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: a.nome, codigo: a.codigo || '', plantaId: a.plantaId, ativa: !a.ativa }) })
    loadData()
  }

  const hasFilter = fTexto || fPlanta !== 'all' || fStatus !== 'all'

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Áreas Operacionais</h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '2px', marginBottom: 0 }}>Backoffice · Vinculadas às plantas</p>
        </div>
        <button onClick={openCreate} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#0038A8', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>+ Nova Área</button>
      </div>

      {error && <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', paddingBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Buscar</div>
          <input value={fTexto} onChange={e => setFTexto(e.target.value)} placeholder="Nome ou código..." className="field-input" style={{ width: '200px' }} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Planta</div>
          <select value={fPlanta} onChange={e => setFPlanta(e.target.value)} className="field-input" style={{ width: '200px' }}>
            <option value="all">Todas as plantas</option>
            {plantas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Status</div>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="field-input" style={{ width: '140px' }}>
            <option value="all">Todos</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </select>
        </div>
        {hasFilter && (
          <button onClick={() => { setFTexto(''); setFPlanta('all'); setFStatus('all') }} style={{ alignSelf: 'flex-end', padding: '7px 12px', fontSize: '13px', color: '#475569', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}>Limpar</button>
        )}
      </div>

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th onClick={() => toggle('planta')} style={thS(sk==='planta')}>Planta{ico('planta')}</th>
              <th onClick={() => toggle('nome')} style={thS(sk==='nome')}>Nome da Área{ico('nome')}</th>
              <th onClick={() => toggle('codigo')} style={thS(sk==='codigo')}>Código{ico('codigo')}</th>
              <th onClick={() => toggle('status')} style={thS(sk==='status')}>Status{ico('status')}</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Carregando...</td></tr>
            ) : display.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Nenhuma área encontrada</td></tr>
            ) : display.map(a => (
              <tr key={a.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{a.planta.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{a.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{a.codigo || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', padding: '2px 8px', fontWeight: 500, borderRadius: '4px', background: a.ativa ? '#D1FAE5' : '#F1F5F9', color: a.ativa ? '#065F46' : '#64748B' }}>{a.ativa ? 'Ativa' : 'Inativa'}</span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(a)} style={{ fontSize: '12px', color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Editar</button>
                  <button onClick={() => handleToggle(a)} style={{ fontSize: '12px', color: a.ativa ? '#DC2626' : '#16A34A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{a.ativa ? 'Inativar' : 'Reativar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>{display.length} área(s)</span>
        </div>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '4px', padding: '24px', width: '440px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>{modal.editing ? 'Editar Área' : 'Nova Área'}</h2>
            {formError && <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>{formError}</div>}
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Planta <span className="field-required">*</span></label>
              <select value={form.plantaId} onChange={e => setForm(f => ({ ...f, plantaId: e.target.value }))} className="field-input">
                <option value="">Selecione uma planta...</option>
                {plantas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Nome da Área <span className="field-required">*</span></label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="field-input" placeholder="Ex: Área de Produção" autoFocus />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Código</label>
              <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} className="field-input" placeholder="Ex: PROD" />
            </div>
            {modal.editing && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="ativa" checked={form.ativa} onChange={e => setForm(f => ({ ...f, ativa: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="ativa" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>Área ativa</label>
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
