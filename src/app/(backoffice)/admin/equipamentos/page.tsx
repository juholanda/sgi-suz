'use client'
import { useEffect, useState } from 'react'
import ImportarExcelButton from '@/app/(app)/backoffice/equipamentos/ImportarExcelButton'

interface AreaSimple { id: string; nome: string; planta: { nome: string } }
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

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [areas, setAreas] = useState<AreaSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing: Equipamento | null }>({ open: false, editing: null })
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/backoffice/equipamentos').then(r => r.json()),
      fetch('/api/backoffice/areas').then(r => r.json()),
    ]).then(([eqData, areasData]) => {
      setEquipamentos(eqData)
      setAreas(areasData)
      setLoading(false)
    }).catch(() => { setError('Erro ao carregar dados'); setLoading(false) })
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => {
    setForm(emptyForm())
    setFormError('')
    setModal({ open: true, editing: null })
  }

  const openEdit = (e: Equipamento) => {
    setForm({ tag: e.tag, descricao: e.descricao, funcaoProtegida: e.funcaoProtegida ?? '', areaId: e.areaId, ativo: e.ativo })
    setFormError('')
    setModal({ open: true, editing: e })
  }

  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.tag.trim()) { setFormError('TAG é obrigatória'); return }
    if (!form.descricao.trim()) { setFormError('Nome é obrigatório'); return }
    if (!form.funcaoProtegida.trim()) { setFormError('Função do intertravamento é obrigatória'); return }
    if (!form.areaId) { setFormError('Selecione uma área'); return }
    setSaving(true)
    setFormError('')
    try {
      const url = modal.editing ? `/api/backoffice/equipamentos/${modal.editing.id}` : '/api/backoffice/equipamentos'
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
      loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (e: Equipamento) => {
    const confirmed = window.confirm(`${e.ativo ? 'Inativar' : 'Reativar'} o equipamento "${e.tag}"?`)
    if (!confirmed) return
    await fetch(`/api/backoffice/equipamentos/${e.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: e.tag, descricao: e.descricao, funcaoProtegida: e.funcaoProtegida, areaId: e.areaId, ativo: !e.ativo }),
    })
    loadData()
  }

  const filtered = busca
    ? equipamentos.filter(e =>
        e.tag.toLowerCase().includes(busca.toLowerCase()) ||
        e.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        (e.funcaoProtegida ?? '').toLowerCase().includes(busca.toLowerCase())
      )
    : equipamentos

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Equipamentos</h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '2px', marginBottom: 0 }}>Backoffice · TAGs e intertravamentos cadastrados</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ImportarExcelButton onImportDone={loadData} />
          <button
            onClick={openCreate}
            style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#0038A8', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            + Novo Equipamento
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por TAG, nome ou função..."
            className="field-input"
          />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['TAG', 'Nome', 'Função', 'Planta', 'Área', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Nenhum equipamento encontrado</td></tr>
            ) : filtered.map(e => (
              <tr key={e.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, padding: '2px 8px', background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}>
                    {e.tag}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0F172A' }}>{e.descricao}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{e.funcaoProtegida ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{e.area.planta.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{e.area.nome}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', padding: '2px 8px', fontWeight: 500, borderRadius: '4px', background: e.ativo ? '#D1FAE5' : '#F1F5F9', color: e.ativo ? '#065F46' : '#64748B' }}>
                    {e.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(e)} style={{ fontSize: '12px', color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Editar</button>
                  <button onClick={() => handleToggle(e)} style={{ fontSize: '12px', color: e.ativo ? '#DC2626' : '#16A34A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {e.ativo ? 'Inativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>{filtered.length} equipamento(s)</span>
        </div>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '4px', padding: '24px', width: '480px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>
              {modal.editing ? 'Editar Equipamento' : 'Novo Equipamento'}
            </h2>

            {formError && (
              <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">TAG <span className="field-required">*</span></label>
              <input
                value={form.tag}
                onChange={e => setForm(f => ({ ...f, tag: e.target.value.toUpperCase() }))}
                className="field-input"
                style={{ fontFamily: 'Inter, sans-serif' }}
                placeholder="Ex: FIC-1001"
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Nome <span className="field-required">*</span></label>
              <input
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="field-input"
                placeholder="Ex: Sensor de nível do tanque de licor"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Função do intertravamento <span className="field-required">*</span></label>
              <input
                value={form.funcaoProtegida}
                onChange={e => setForm(f => ({ ...f, funcaoProtegida: e.target.value }))}
                className="field-input"
                placeholder="Ex: Trip de nível alto do tanque de licor"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Área <span className="field-required">*</span></label>
              <select
                value={form.areaId}
                onChange={e => setForm(f => ({ ...f, areaId: e.target.value }))}
                className="field-input"
              >
                <option value="">Selecione uma área...</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.planta.nome} › {a.nome}</option>
                ))}
              </select>
            </div>

            {modal.editing && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="ativo" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>Equipamento ativo</label>
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
