'use client'
import { useEffect, useState, useMemo } from 'react'

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
interface FormState { delegadoPorId: string; delegadoParaId: string; dataInicio: string; dataFim: string; ativa: boolean }
const emptyForm = (): FormState => ({ delegadoPorId: '', delegadoParaId: '', dataInicio: '', dataFim: '', ativa: true })

function formatDate(dateStr: string) { return new Date(dateStr).toLocaleDateString('pt-BR') }
function toInputDate(dateStr: string) { return new Date(dateStr).toISOString().split('T')[0] }

type SortDir = 'asc' | 'desc'
type SK = 'delegadoPor' | 'suplente' | 'inicio' | 'fim' | 'status'

const thS = (active: boolean) => ({
  textAlign: 'left' as const, padding: '12px 16px', fontSize: '12px',
  fontWeight: 500, cursor: 'pointer' as const, userSelect: 'none' as const,
  whiteSpace: 'nowrap' as const, color: active ? '#0038A8' : '#6B7280',
})

function getStatus(d: Delegacao, hoje: Date) {
  const inicio = new Date(d.dataInicio); const fim = new Date(d.dataFim)
  if (d.ativa && inicio <= hoje && fim >= hoje) return 'vigente'
  if (d.ativa && inicio > hoje) return 'futura'
  return 'encerrada'
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
  const [sk, setSk] = useState<SK>('inicio')
  const [sd, setSd] = useState<SortDir>('desc')
  const [fNome, setFNome] = useState('')
  const [fStatus, setFStatus] = useState('all')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/backoffice/delegacoes').then(r => r.json()),
      fetch('/api/backoffice/usuarios').then(r => r.json()),
    ]).then(([delData, usersData]) => {
      setDelegacoes(delData); setUsuarios(usersData); setLoading(false)
    }).catch(() => { setError('Erro ao carregar dados'); setLoading(false) })
  }
  useEffect(() => { loadData() }, [])

  const toggle = (key: SK) => { if (sk === key) setSd(d => d === 'asc' ? 'desc' : 'asc'); else { setSk(key); setSd('asc') } }
  const ico = (col: SK) => (
    <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginLeft: 4, opacity: sk === col ? 1 : 0.35 }}>
      {sk === col ? (sd === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
    </span>
  )

  const hoje = useMemo(() => new Date(), [])

  const display = useMemo(() => {
    let d = [...delegacoes]
    if (fNome) { const q = fNome.toLowerCase(); d = d.filter(x => x.delegadoPor.nome.toLowerCase().includes(q) || x.delegadoPara.nome.toLowerCase().includes(q) || x.delegadoPor.matricula.includes(q) || x.delegadoPara.matricula.includes(q)) }
    if (fStatus !== 'all') d = d.filter(x => getStatus(x, hoje) === fStatus)
    return d.sort((a, b) => {
      const va = sk === 'delegadoPor' ? a.delegadoPor.nome.toLowerCase() : sk === 'suplente' ? a.delegadoPara.nome.toLowerCase() : sk === 'inicio' ? a.dataInicio : sk === 'fim' ? a.dataFim : getStatus(a, hoje)
      const vb = sk === 'delegadoPor' ? b.delegadoPor.nome.toLowerCase() : sk === 'suplente' ? b.delegadoPara.nome.toLowerCase() : sk === 'inicio' ? b.dataInicio : sk === 'fim' ? b.dataFim : getStatus(b, hoje)
      if (va < vb) return sd === 'asc' ? -1 : 1; if (va > vb) return sd === 'asc' ? 1 : -1; return 0
    })
  }, [delegacoes, fNome, fStatus, sk, sd, hoje])

  const openCreate = () => { setForm(emptyForm()); setFormError(''); setModal({ open: true, editing: null }) }
  const openEdit = (d: Delegacao) => { setForm({ delegadoPorId: d.delegadoPorId, delegadoParaId: d.delegadoParaId, dataInicio: toInputDate(d.dataInicio), dataFim: toInputDate(d.dataFim), ativa: d.ativa }); setFormError(''); setModal({ open: true, editing: d }) }
  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.delegadoPorId) { setFormError('Selecione quem delega'); return }
    if (!form.delegadoParaId) { setFormError('Selecione o suplente'); return }
    if (form.delegadoPorId === form.delegadoParaId) { setFormError('Delegante e suplente devem ser diferentes'); return }
    if (!form.dataInicio) { setFormError('Data de início é obrigatória'); return }
    if (!form.dataFim) { setFormError('Data de fim é obrigatória'); return }
    if (form.dataFim < form.dataInicio) { setFormError('Data de fim deve ser após a data de início'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch(modal.editing ? `/api/backoffice/delegacoes/${modal.editing.id}` : '/api/backoffice/delegacoes', {
        method: modal.editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Erro ao salvar'); return }
      closeModal(); loadData()
    } finally { setSaving(false) }
  }

  const handleDelete = async (d: Delegacao) => {
    if (!window.confirm(`Excluir delegação de "${d.delegadoPor.nome}" para "${d.delegadoPara.nome}"?`)) return
    await fetch(`/api/backoffice/delegacoes/${d.id}`, { method: 'DELETE' }); loadData()
  }

  const handleToggleAtiva = async (d: Delegacao) => {
    if (!window.confirm(`${d.ativa ? 'Encerrar' : 'Reativar'} esta delegação?`)) return
    await fetch(`/api/backoffice/delegacoes/${d.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativa: !d.ativa }) }); loadData()
  }

  const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
    vigente:   { bg: '#D1FAE5', text: '#065F46', label: 'Vigente' },
    futura:    { bg: '#DBEAFE', text: '#1D4ED8', label: 'Futura' },
    encerrada: { bg: '#F1F5F9', text: '#64748B', label: 'Encerrada' },
  }

  const hasFilter = fNome || fStatus !== 'all'

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Suplências / Delegações</h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '2px', marginBottom: 0 }}>Backoffice · Vigência automática de aprovações</p>
        </div>
        <button onClick={openCreate} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#0038A8', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>+ Nova Delegação</button>
      </div>

      {error && <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', paddingBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Buscar</div>
          <input value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Nome ou matrícula..." className="field-input" style={{ width: '220px' }} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Status</div>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="field-input" style={{ width: '150px' }}>
            <option value="all">Todos</option>
            <option value="vigente">Vigente</option>
            <option value="futura">Futura</option>
            <option value="encerrada">Encerrada</option>
          </select>
        </div>
        {hasFilter && (
          <button onClick={() => { setFNome(''); setFStatus('all') }} style={{ alignSelf: 'flex-end', padding: '7px 12px', fontSize: '13px', color: '#475569', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}>Limpar</button>
        )}
      </div>

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th onClick={() => toggle('delegadoPor')} style={thS(sk==='delegadoPor')}>Delegado por{ico('delegadoPor')}</th>
              <th onClick={() => toggle('suplente')} style={thS(sk==='suplente')}>Suplente{ico('suplente')}</th>
              <th onClick={() => toggle('inicio')} style={thS(sk==='inicio')}>Início{ico('inicio')}</th>
              <th onClick={() => toggle('fim')} style={thS(sk==='fim')}>Fim{ico('fim')}</th>
              <th onClick={() => toggle('status')} style={thS(sk==='status')}>Status{ico('status')}</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Carregando...</td></tr>
            ) : display.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Nenhuma delegação encontrada</td></tr>
            ) : display.map(d => {
              const st = STATUS_STYLE[getStatus(d, hoje)]
              return (
                <tr key={d.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0F172A' }}>
                    {d.delegadoPor.nome}
                    <span style={{ marginLeft: '6px', fontSize: '12px', color: '#94A3B8' }}>{d.delegadoPor.matricula}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0F172A' }}>
                    {d.delegadoPara.nome}
                    <span style={{ marginLeft: '6px', fontSize: '12px', color: '#94A3B8' }}>{d.delegadoPara.matricula}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{formatDate(d.dataInicio)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{formatDate(d.dataFim)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', padding: '2px 8px', fontWeight: 500, borderRadius: '4px', background: st.bg, color: st.text }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(d)} style={{ fontSize: '12px', color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Editar</button>
                    <button onClick={() => handleToggleAtiva(d)} style={{ fontSize: '12px', color: d.ativa ? '#DC2626' : '#16A34A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{d.ativa ? 'Encerrar' : 'Reativar'}</button>
                    <button onClick={() => handleDelete(d)} style={{ fontSize: '12px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Excluir</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>{display.length} delegação(ões)</span>
        </div>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '4px', padding: '24px', width: '480px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>{modal.editing ? 'Editar Delegação' : 'Nova Delegação'}</h2>
            {formError && <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>{formError}</div>}
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Delegado por (quem estará ausente) <span className="field-required">*</span></label>
              <select value={form.delegadoPorId} onChange={e => setForm(f => ({ ...f, delegadoPorId: e.target.value }))} className="field-input">
                <option value="">Selecione...</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.matricula})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Suplente (quem assumirá as aprovações) <span className="field-required">*</span></label>
              <select value={form.delegadoParaId} onChange={e => setForm(f => ({ ...f, delegadoParaId: e.target.value }))} className="field-input">
                <option value="">Selecione...</option>
                {usuarios.filter(u => u.id !== form.delegadoPorId).map(u => <option key={u.id} value={u.id}>{u.nome} ({u.matricula})</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="field-label">Data de início <span className="field-required">*</span></label>
                <input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} className="field-input" />
              </div>
              <div>
                <label className="field-label">Data de fim <span className="field-required">*</span></label>
                <input type="date" value={form.dataFim} onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))} className="field-input" />
              </div>
            </div>
            {modal.editing && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="ativa" checked={form.ativa} onChange={e => setForm(f => ({ ...f, ativa: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="ativa" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>Delegação ativa</label>
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
