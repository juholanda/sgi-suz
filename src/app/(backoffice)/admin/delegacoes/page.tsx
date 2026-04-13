'use client'
import { useEffect, useState } from 'react'

interface UserSimple { id: string; nome: string; matricula: string }
interface Delegacao {
  id: string
  delegadoPorId: string
  delegadoParaId: string
  dataInicio: string
  dataFim: string
  ativa: boolean
  delegadoPor: UserSimple
  delegadoPara: UserSimple
}

interface FormState {
  delegadoPorId: string
  delegadoParaId: string
  dataInicio: string
  dataFim: string
  ativa: boolean
}

const emptyForm = (): FormState => ({
  delegadoPorId: '',
  delegadoParaId: '',
  dataInicio: '',
  dataFim: '',
  ativa: true,
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR')
}

function toInputDate(dateStr: string) {
  return new Date(dateStr).toISOString().split('T')[0]
}

export default function DelegacoesPage() {
  const [delegacoes, setDelegacoes] = useState<Delegacao[]>([])
  const [usuarios, setUsuarios] = useState<UserSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing: Delegacao | null }>({ open: false, editing: null })
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/backoffice/delegacoes').then(r => r.json()),
      fetch('/api/backoffice/usuarios').then(r => r.json()),
    ]).then(([delegacoesData, usuariosData]) => {
      setDelegacoes(delegacoesData)
      setUsuarios(usuariosData)
      setLoading(false)
    }).catch(() => { setError('Erro ao carregar dados'); setLoading(false) })
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => {
    setForm(emptyForm())
    setFormError('')
    setModal({ open: true, editing: null })
  }

  const openEdit = (d: Delegacao) => {
    setForm({
      delegadoPorId: d.delegadoPorId,
      delegadoParaId: d.delegadoParaId,
      dataInicio: toInputDate(d.dataInicio),
      dataFim: toInputDate(d.dataFim),
      ativa: d.ativa,
    })
    setFormError('')
    setModal({ open: true, editing: d })
  }

  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.delegadoPorId) { setFormError('Selecione quem delega'); return }
    if (!form.delegadoParaId) { setFormError('Selecione o suplente'); return }
    if (form.delegadoPorId === form.delegadoParaId) { setFormError('Delegante e suplente devem ser usuários diferentes'); return }
    if (!form.dataInicio) { setFormError('Data de início é obrigatória'); return }
    if (!form.dataFim) { setFormError('Data de fim é obrigatória'); return }
    if (form.dataFim < form.dataInicio) { setFormError('Data de fim deve ser após a data de início'); return }

    setSaving(true)
    setFormError('')
    try {
      const url = modal.editing ? `/api/backoffice/delegacoes/${modal.editing.id}` : '/api/backoffice/delegacoes'
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

  const handleDelete = async (d: Delegacao) => {
    const confirmed = window.confirm(`Excluir delegação de "${d.delegadoPor.nome}" para "${d.delegadoPara.nome}"?`)
    if (!confirmed) return
    await fetch(`/api/backoffice/delegacoes/${d.id}`, { method: 'DELETE' })
    loadData()
  }

  const handleToggleAtiva = async (d: Delegacao) => {
    const confirmed = window.confirm(`${d.ativa ? 'Encerrar' : 'Reativar'} esta delegação?`)
    if (!confirmed) return
    await fetch(`/api/backoffice/delegacoes/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativa: !d.ativa }),
    })
    loadData()
  }

  const hoje = new Date()

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Suplências / Delegações</h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '2px', marginBottom: 0 }}>Backoffice · Vigência automática de aprovações</p>
        </div>
        <button
          onClick={openCreate}
          style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#0038A8', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          + Nova Delegação
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
              {['Delegado por', 'Suplente', 'Início', 'Fim', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Carregando...</td></tr>
            ) : delegacoes.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Nenhuma delegação cadastrada</td></tr>
            ) : delegacoes.map(d => {
              const inicio = new Date(d.dataInicio)
              const fim = new Date(d.dataFim)
              const vigente = d.ativa && inicio <= hoje && fim >= hoje
              const futura = d.ativa && inicio > hoje
              const statusLabel = vigente ? 'Vigente' : futura ? 'Futura' : 'Encerrada'
              const statusStyle = vigente
                ? { bg: '#D1FAE5', text: '#065F46' }
                : futura
                  ? { bg: '#DBEAFE', text: '#1D4ED8' }
                  : { bg: '#F1F5F9', text: '#64748B' }

              return (
                <tr key={d.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0F172A' }}>
                    {d.delegadoPor.nome}
                    <span style={{ marginLeft: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#94A3B8' }}>{d.delegadoPor.matricula}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0F172A' }}>
                    {d.delegadoPara.nome}
                    <span style={{ marginLeft: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#94A3B8' }}>{d.delegadoPara.matricula}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{formatDate(d.dataInicio)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{formatDate(d.dataFim)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', padding: '2px 8px', fontWeight: 500, borderRadius: '4px', background: statusStyle.bg, color: statusStyle.text }}>
                      {statusLabel}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(d)} style={{ fontSize: '12px', color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Editar</button>
                    <button onClick={() => handleToggleAtiva(d)} style={{ fontSize: '12px', color: d.ativa ? '#DC2626' : '#16A34A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {d.ativa ? 'Encerrar' : 'Reativar'}
                    </button>
                    <button onClick={() => handleDelete(d)} style={{ fontSize: '12px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Excluir</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '4px', padding: '24px', width: '480px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>
              {modal.editing ? 'Editar Delegação' : 'Nova Delegação'}
            </h2>

            {formError && (
              <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Delegado por (quem estará ausente) *</label>
              <select
                value={form.delegadoPorId}
                onChange={e => setForm(f => ({ ...f, delegadoPorId: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
              >
                <option value="">Selecione...</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.matricula})</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Suplente (quem assumirá as aprovações) *</label>
              <select
                value={form.delegadoParaId}
                onChange={e => setForm(f => ({ ...f, delegadoParaId: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
              >
                <option value="">Selecione...</option>
                {usuarios.filter(u => u.id !== form.delegadoPorId).map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.matricula})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Data de início *</label>
                <input
                  type="date"
                  value={form.dataInicio}
                  onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Data de fim *</label>
                <input
                  type="date"
                  value={form.dataFim}
                  onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
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
                <label htmlFor="ativa" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>Delegação ativa</label>
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
