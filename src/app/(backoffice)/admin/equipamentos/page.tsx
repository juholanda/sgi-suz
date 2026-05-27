'use client'
import { useEffect, useState, useMemo } from 'react'
import ImportarExcelButton from '@/app/(app)/backoffice/equipamentos/ImportarExcelButton'

interface AreaSimple { id: string; nome: string; plantaId: string; planta: { id: string; nome: string } }
interface Equipamento {
  id: string
  tag: string
  descricao: string
  funcaoProtegida: string | null
  ativo: boolean
  areaId: string
  area: { nome: string; planta: { nome: string } }
}
interface FormState { tag: string; descricao: string; funcaoProtegida: string; areaId: string; ativo: boolean }
const emptyForm = (): FormState => ({ tag: '', descricao: '', funcaoProtegida: '', areaId: '', ativo: true })
type SortDir = 'asc' | 'desc'
type SK = 'tag' | 'descricao' | 'funcao' | 'planta' | 'area' | 'status'

const thS = (active: boolean) => ({
  textAlign: 'left' as const, padding: '12px 16px', fontSize: '12px',
  fontWeight: 500, cursor: 'pointer' as const, userSelect: 'none' as const,
  whiteSpace: 'nowrap' as const, color: active ? '#0038A8' : '#6B7280',
})

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [areas, setAreas] = useState<AreaSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing: Equipamento | null }>({ open: false, editing: null })
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [sk, setSk] = useState<SK>('tag')
  const [sd, setSd] = useState<SortDir>('asc')
  const [fBusca, setFBusca] = useState('')
  const [fPlanta, setFPlanta] = useState('all')
  const [fArea, setFArea] = useState('all')
  const [fStatus, setFStatus] = useState('all')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/backoffice/equipamentos').then(r => r.json()),
      fetch('/api/backoffice/areas').then(r => r.json()),
    ]).then(([eqData, areasData]) => {
      setEquipamentos(eqData); setAreas(areasData); setLoading(false)
    }).catch(() => { setError('Erro ao carregar dados'); setLoading(false) })
  }
  useEffect(() => { loadData() }, [])

  const plantas = useMemo(() => {
    const seen = new Set<string>()
    return areas.reduce<{ id: string; nome: string }[]>((acc, a) => {
      if (!seen.has(a.planta.id)) { seen.add(a.planta.id); acc.push({ id: a.planta.id, nome: a.planta.nome }) }
      return acc
    }, []).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [areas])

  const filteredAreas = useMemo(() => fPlanta === 'all' ? areas : areas.filter(a => a.planta.id === fPlanta), [areas, fPlanta])

  const toggle = (key: SK) => { if (sk === key) setSd(d => d === 'asc' ? 'desc' : 'asc'); else { setSk(key); setSd('asc') } }
  const ico = (col: SK) => sk === col ? (sd === 'asc' ? ' ▲' : ' ▼') : ' ⇅'

  const display = useMemo(() => {
    let d = [...equipamentos]
    if (fBusca) { const q = fBusca.toLowerCase(); d = d.filter(e => e.tag.toLowerCase().includes(q) || e.descricao.toLowerCase().includes(q) || (e.funcaoProtegida ?? '').toLowerCase().includes(q)) }
    if (fPlanta !== 'all') d = d.filter(e => areas.find(a => a.id === e.areaId)?.planta.id === fPlanta)
    if (fArea !== 'all') d = d.filter(e => e.areaId === fArea)
    if (fStatus === 'ativo') d = d.filter(e => e.ativo)
    if (fStatus === 'inativo') d = d.filter(e => !e.ativo)
    return d.sort((a, b) => {
      const va = sk === 'tag' ? a.tag.toLowerCase() : sk === 'descricao' ? a.descricao.toLowerCase() : sk === 'funcao' ? (a.funcaoProtegida||'').toLowerCase() : sk === 'planta' ? a.area.planta.nome.toLowerCase() : sk === 'area' ? a.area.nome.toLowerCase() : (a.ativo ? 0 : 1)
      const vb = sk === 'tag' ? b.tag.toLowerCase() : sk === 'descricao' ? b.descricao.toLowerCase() : sk === 'funcao' ? (b.funcaoProtegida||'').toLowerCase() : sk === 'planta' ? b.area.planta.nome.toLowerCase() : sk === 'area' ? b.area.nome.toLowerCase() : (b.ativo ? 0 : 1)
      if (va < vb) return sd === 'asc' ? -1 : 1; if (va > vb) return sd === 'asc' ? 1 : -1; return 0
    })
  }, [equipamentos, areas, fBusca, fPlanta, fArea, fStatus, sk, sd])

  const openCreate = () => { setForm(emptyForm()); setFormError(''); setModal({ open: true, editing: null }) }
  const openEdit = (e: Equipamento) => { setForm({ tag: e.tag, descricao: e.descricao, funcaoProtegida: e.funcaoProtegida ?? '', areaId: e.areaId, ativo: e.ativo }); setFormError(''); setModal({ open: true, editing: e }) }
  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.tag.trim()) { setFormError('TAG é obrigatória'); return }
    if (!form.descricao.trim()) { setFormError('Nome é obrigatório'); return }
    if (!form.funcaoProtegida.trim()) { setFormError('Função do intertravamento é obrigatória'); return }
    if (!form.areaId) { setFormError('Selecione uma área'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch(modal.editing ? `/api/backoffice/equipamentos/${modal.editing.id}` : '/api/backoffice/equipamentos', {
        method: modal.editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Erro ao salvar'); return }
      closeModal(); loadData()
    } finally { setSaving(false) }
  }

  const handleToggle = async (e: Equipamento) => {
    if (!window.confirm(`${e.ativo ? 'Inativar' : 'Reativar'} o equipamento "${e.tag}"?`)) return
    await fetch(`/api/backoffice/equipamentos/${e.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag: e.tag, descricao: e.descricao, funcaoProtegida: e.funcaoProtegida, areaId: e.areaId, ativo: !e.ativo }) })
    loadData()
  }

  const hasFilter = fBusca || fPlanta !== 'all' || fArea !== 'all' || fStatus !== 'all'

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Equipamentos</h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '2px', marginBottom: 0 }}>Backoffice · TAGs e intertravamentos cadastrados</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ImportarExcelButton onImportDone={loadData} />
          <button onClick={openCreate} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#0038A8', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>+ Novo Equipamento</button>
        </div>
      </div>

      {error && <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', paddingBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Buscar</div>
          <input value={fBusca} onChange={e => setFBusca(e.target.value)} placeholder="TAG, nome ou função..." className="field-input" style={{ width: '220px' }} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Planta</div>
          <select value={fPlanta} onChange={e => { setFPlanta(e.target.value); setFArea('all') }} className="field-input" style={{ width: '180px' }}>
            <option value="all">Todas</option>
            {plantas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Área</div>
          <select value={fArea} onChange={e => setFArea(e.target.value)} className="field-input" style={{ width: '160px' }}>
            <option value="all">Todas</option>
            {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Status</div>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="field-input" style={{ width: '130px' }}>
            <option value="all">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        {hasFilter && (
          <button onClick={() => { setFBusca(''); setFPlanta('all'); setFArea('all'); setFStatus('all') }} style={{ alignSelf: 'flex-end', padding: '7px 12px', fontSize: '13px', color: '#475569', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}>Limpar</button>
        )}
      </div>

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th onClick={() => toggle('tag')} style={thS(sk==='tag')}>TAG{ico('tag')}</th>
              <th onClick={() => toggle('descricao')} style={thS(sk==='descricao')}>Nome{ico('descricao')}</th>
              <th onClick={() => toggle('funcao')} style={thS(sk==='funcao')}>Função{ico('funcao')}</th>
              <th onClick={() => toggle('planta')} style={thS(sk==='planta')}>Planta{ico('planta')}</th>
              <th onClick={() => toggle('area')} style={thS(sk==='area')}>Área{ico('area')}</th>
              <th onClick={() => toggle('status')} style={thS(sk==='status')}>Status{ico('status')}</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Carregando...</td></tr>
            ) : display.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Nenhum equipamento encontrado</td></tr>
            ) : display.map(e => (
              <tr key={e.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, padding: '2px 8px', background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}>{e.tag}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0F172A' }}>{e.descricao}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{e.funcaoProtegida ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{e.area.planta.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{e.area.nome}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', padding: '2px 8px', fontWeight: 500, borderRadius: '4px', background: e.ativo ? '#D1FAE5' : '#F1F5F9', color: e.ativo ? '#065F46' : '#64748B' }}>{e.ativo ? 'Ativo' : 'Inativo'}</span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(e)} style={{ fontSize: '12px', color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Editar</button>
                  <button onClick={() => handleToggle(e)} style={{ fontSize: '12px', color: e.ativo ? '#DC2626' : '#16A34A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{e.ativo ? 'Inativar' : 'Reativar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>{display.length} equipamento(s)</span>
        </div>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '4px', padding: '24px', width: '480px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>{modal.editing ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
            {formError && <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>{formError}</div>}
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">TAG <span className="field-required">*</span></label>
              <input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value.toUpperCase() }))} className="field-input" style={{ fontFamily: 'Inter, sans-serif' }} placeholder="Ex: FIC-1001" autoFocus />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Nome <span className="field-required">*</span></label>
              <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} className="field-input" placeholder="Ex: Sensor de nível do tanque" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Função do intertravamento <span className="field-required">*</span></label>
              <input value={form.funcaoProtegida} onChange={e => setForm(f => ({ ...f, funcaoProtegida: e.target.value }))} className="field-input" placeholder="Ex: Trip de nível alto" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Área <span className="field-required">*</span></label>
              <select value={form.areaId} onChange={e => setForm(f => ({ ...f, areaId: e.target.value }))} className="field-input">
                <option value="">Selecione uma área...</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.planta.nome} › {a.nome}</option>)}
              </select>
            </div>
            {modal.editing && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="ativo" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>Equipamento ativo</label>
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
