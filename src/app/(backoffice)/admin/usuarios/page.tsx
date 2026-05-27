'use client'
import { useEffect, useState } from 'react'

interface Cargo { id: string; nome: string }
interface Area { id: string; nome: string; plantaId: string }
interface Planta { id: string; nome: string; ativa: boolean }
interface UsuarioPerfil {
  id: string
  perfil: string
  plantaId: string | null
  areaId: string | null
  planta: { nome: string } | null
  area: { nome: string } | null
}
interface Usuario {
  id: string
  matricula: string
  nome: string
  email: string
  ativo: boolean
  cargoId: string | null
  cargo: Cargo | null
  perfis: UsuarioPerfil[]
}

const PERFIS = ['SOLICITANTE', 'EXECUTANTE', 'APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR']
const PERFIL_LABELS: Record<string, string> = {
  SOLICITANTE: 'Solicitante',
  EXECUTANTE: 'Executante',
  APROVADOR: 'Aprovador',
  GESTOR_SMS: 'Gestor SMS',
  ADMINISTRADOR: 'Administrador',
}
const PERFIL_COLORS: Record<string, { bg: string; text: string }> = {
  SOLICITANTE:   { bg: '#DBEAFE', text: '#1D4ED8' },
  EXECUTANTE:    { bg: '#DCFCE7', text: '#15803D' },
  APROVADOR:     { bg: '#FEF3C7', text: '#B45309' },
  GESTOR_SMS:    { bg: '#FEE2E2', text: '#B91C1C' },
  ADMINISTRADOR: { bg: '#F3E8FF', text: '#7E22CE' },
}

// Perfis que permitem selecionar área
const PERFIL_USA_AREA: Record<string, boolean> = {
  SOLICITANTE: true,
  EXECUTANTE: true,
  APROVADOR: false,
  GESTOR_SMS: false,
  ADMINISTRADOR: false,
}

interface FormState {
  matricula: string
  nome: string
  email: string
  senha: string
  cargoId: string
  ativo: boolean
  perfil: string
}

interface NewPerfilState {
  perfil: string
  plantaId: string
  areaId: string
}

const emptyForm = (): FormState => ({
  matricula: '', nome: '', email: '', senha: '', cargoId: '', ativo: true, perfil: '',
})

const emptyNewPerfil = (): NewPerfilState => ({ perfil: '', plantaId: '', areaId: '' })

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing: Usuario | null }>({
    open: false, editing: null,
  })
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [newPerfil, setNewPerfil] = useState<NewPerfilState>(emptyNewPerfil())
  const [perfilOp, setPerfilOp] = useState(false)
  const [perfilError, setPerfilError] = useState('')

  const loadData = (editingId?: string) => {
    setLoading(true)
    Promise.all([
      fetch('/api/backoffice/usuarios').then(r => r.json()),
      fetch('/api/backoffice/cargos').then(r => r.json()).catch(() => []),
      fetch('/api/backoffice/plantas').then(r => r.json()).catch(() => []),
      fetch('/api/backoffice/areas').then(r => r.json()).catch(() => []),
    ]).then(([usersData, cargosData, plantasData, areasData]) => {
      setUsuarios(usersData)
      setCargos(cargosData)
      setPlantas(plantasData)
      setAreas(areasData)
      if (editingId) {
        const updated = usersData.find((u: Usuario) => u.id === editingId)
        if (updated) setModal(m => ({ ...m, editing: updated }))
      }
      setLoading(false)
    }).catch(() => { setError('Erro ao carregar dados'); setLoading(false) })
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => {
    setForm(emptyForm())
    setFormError('')
    setNewPerfil(emptyNewPerfil())
    setPerfilError('')
    setModal({ open: true, editing: null })
  }

  const openEdit = (u: Usuario) => {
    setForm({
      matricula: u.matricula, nome: u.nome, email: u.email,
      senha: '', cargoId: u.cargoId || '', ativo: u.ativo, perfil: '',
    })
    setFormError('')
    setNewPerfil(emptyNewPerfil())
    setPerfilError('')
    setModal({ open: true, editing: u })
  }

  const closeModal = () => {
    setModal({ open: false, editing: null })
    setNewPerfil(emptyNewPerfil())
    setPerfilError('')
  }

  const handleSave = async () => {
    if (!form.matricula.trim()) { setFormError('Matrícula é obrigatória'); return }
    if (!form.nome.trim()) { setFormError('Nome é obrigatório'); return }
    if (!form.email.trim()) { setFormError('E-mail é obrigatório'); return }
    if (!modal.editing && !form.senha.trim()) { setFormError('Senha é obrigatória para novo usuário'); return }

    setSaving(true)
    setFormError('')
    try {
      const url = modal.editing
        ? `/api/backoffice/usuarios/${modal.editing.id}`
        : '/api/backoffice/usuarios'
      const method = modal.editing ? 'PUT' : 'POST'
      const body: Record<string, unknown> = {
        matricula: form.matricula.trim(),
        nome: form.nome.trim(),
        email: form.email.trim(),
        cargoId: form.cargoId || null,
        ativo: form.ativo,
      }
      if (form.senha.trim()) body.senha = form.senha
      if (!modal.editing && form.perfil) {
        body.perfis = [{ perfil: form.perfil }]
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const handleToggle = async (u: Usuario) => {
    const confirmed = window.confirm(
      `${u.ativo ? 'Inativar' : 'Reativar'} o usuário "${u.nome}"?`
    )
    if (!confirmed) return
    await fetch(`/api/backoffice/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matricula: u.matricula, nome: u.nome, email: u.email,
        cargoId: u.cargoId, ativo: !u.ativo,
      }),
    })
    loadData()
  }

  const handleAddPerfil = async () => {
    if (!newPerfil.perfil) { setPerfilError('Selecione um perfil'); return }
    if (!newPerfil.plantaId && newPerfil.perfil !== 'ADMINISTRADOR') {
      setPerfilError('Selecione uma planta'); return
    }
    setPerfilOp(true)
    setPerfilError('')
    try {
      const res = await fetch(`/api/backoffice/usuarios/${modal.editing!.id}/perfis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfil: newPerfil.perfil,
          plantaId: newPerfil.plantaId || null,
          areaId: newPerfil.areaId || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setPerfilError(d.error || 'Erro ao adicionar perfil')
        return
      }
      setNewPerfil(emptyNewPerfil())
      loadData(modal.editing!.id)
    } finally {
      setPerfilOp(false)
    }
  }

  const handleRemovePerfil = async (perfilId: string) => {
    setPerfilOp(true)
    try {
      const res = await fetch(`/api/backoffice/usuarios/${modal.editing!.id}/perfis`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfilId }),
      })
      if (!res.ok) {
        const d = await res.json()
        setPerfilError(d.error || 'Erro ao remover perfil')
        return
      }
      loadData(modal.editing!.id)
    } finally {
      setPerfilOp(false)
    }
  }

  const filteredAreas = areas.filter(a => a.plantaId === newPerfil.plantaId)
  const showArea = !!PERFIL_USA_AREA[newPerfil.perfil]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Usuários e Perfis</h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '2px', marginBottom: 0 }}>
            Backoffice · Associação Usuário × Perfil × Planta/Área
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#0038A8', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          + Novo Usuário
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
              {['Matrícula', 'Nome', 'E-mail', 'Cargo', 'Perfis', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Carregando...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#94A3B8' }}>Nenhum usuário cadastrado</td></tr>
            ) : usuarios.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0038A8' }}>{u.matricula}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{u.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{u.email}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{u.cargo?.nome || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {u.perfis.map(p => {
                      const colors = PERFIL_COLORS[p.perfil] ?? { bg: '#F1F5F9', text: '#475569' }
                      return (
                        <span key={p.id} style={{
                          fontSize: '12px', padding: '2px 8px', fontWeight: 500,
                          background: colors.bg, color: colors.text, borderRadius: '4px',
                        }}>
                          {PERFIL_LABELS[p.perfil]}
                          {p.planta && <span style={{ opacity: 0.7 }}> · {p.planta.nome}</span>}
                          {p.area && <span style={{ opacity: 0.7 }}> / {p.area.nome}</span>}
                        </span>
                      )
                    })}
                    {u.perfis.length === 0 && <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sem perfil</span>}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '12px', padding: '2px 8px', fontWeight: 500, borderRadius: '4px',
                    background: u.ativo ? '#D1FAE5' : '#F1F5F9',
                    color: u.ativo ? '#065F46' : '#64748B',
                  }}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEdit(u)}
                    style={{ fontSize: '12px', color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggle(u)}
                    style={{ fontSize: '12px', color: u.ativo ? '#DC2626' : '#16A34A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {u.ativo ? 'Inativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '4px', padding: '24px', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>
              {modal.editing ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>

            {formError && (
              <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="field-label">Matrícula <span className="field-required">*</span></label>
                <input
                  value={form.matricula}
                  onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))}
                  className="field-input"
                  placeholder="Ex: 12345"
                  autoFocus
                />
              </div>
              <div>
                <label className="field-label">Cargo</label>
                <select
                  value={form.cargoId}
                  onChange={e => setForm(f => ({ ...f, cargoId: e.target.value }))}
                  className="field-input"
                >
                  <option value="">Sem cargo</option>
                  {cargos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Nome completo <span className="field-required">*</span></label>
              <input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="field-input"
                placeholder="Ex: João da Silva"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">E-mail <span className="field-required">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="field-input"
                placeholder="Ex: joao.silva@empresa.com"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">
                Senha{' '}
                {modal.editing
                  ? <span className="field-hint" style={{ display: 'inline' }}>(deixe em branco para não alterar)</span>
                  : <span className="field-required">*</span>
                }
              </label>
              <input
                type="password"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                className="field-input"
                placeholder={modal.editing ? 'Nova senha (opcional)' : 'Senha inicial'}
              />
            </div>

            {!modal.editing && (
              <div style={{ marginBottom: '16px' }}>
                <label className="field-label">Perfil inicial</label>
                <select
                  value={form.perfil}
                  onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}
                  className="field-input"
                >
                  <option value="">Sem perfil</option>
                  {PERFIS.map(p => (
                    <option key={p} value={p}>{PERFIL_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            )}

            {modal.editing && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="ativo" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>Usuário ativo</label>
              </div>
            )}

            {/* Perfis e Acessos — só aparece ao editar */}
            {modal.editing && (
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: '0 0 12px 0' }}>
                  Perfis e Acessos
                </h3>

                {/* Lista de perfis atuais */}
                {modal.editing.perfis.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '14px' }}>Nenhum perfil configurado.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    {modal.editing.perfis.map(p => {
                      const colors = PERFIL_COLORS[p.perfil] ?? { bg: '#F1F5F9', text: '#475569' }
                      return (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', background: '#F8FAFC',
                          borderRadius: '4px', border: '1px solid #E2E8F0',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '12px', padding: '2px 8px', fontWeight: 600,
                              background: colors.bg, color: colors.text, borderRadius: '4px',
                            }}>
                              {PERFIL_LABELS[p.perfil]}
                            </span>
                            {p.planta
                              ? <span style={{ fontSize: '13px', color: '#475569' }}>{p.planta.nome}</span>
                              : <span style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>Todas as plantas</span>
                            }
                            {p.area && (
                              <span style={{ fontSize: '13px', color: '#6B7280' }}>/ {p.area.nome}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemovePerfil(p.id)}
                            disabled={perfilOp}
                            style={{
                              fontSize: '12px', color: '#DC2626', background: 'none',
                              border: 'none', cursor: perfilOp ? 'not-allowed' : 'pointer',
                              padding: '2px 6px', opacity: perfilOp ? 0.5 : 1,
                            }}
                          >
                            Remover
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Erro de perfil */}
                {perfilError && (
                  <div style={{
                    padding: '8px 10px', background: '#FEE2E2', color: '#B91C1C',
                    borderRadius: '4px', marginBottom: '10px', fontSize: '12px',
                  }}>
                    {perfilError}
                  </div>
                )}

                {/* Formulário para adicionar perfil */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: newPerfil.perfil === 'ADMINISTRADOR'
                      ? '1fr'
                      : showArea && newPerfil.plantaId
                        ? '1fr 1fr 1fr'
                        : '1fr 1fr',
                    gap: '8px',
                  }}>
                    <select
                      value={newPerfil.perfil}
                      onChange={e => setNewPerfil(p => ({ ...p, perfil: e.target.value, plantaId: '', areaId: '' }))}
                      className="field-input"
                      style={{ fontSize: '13px' }}
                    >
                      <option value="">Selecionar perfil...</option>
                      {PERFIS.map(p => <option key={p} value={p}>{PERFIL_LABELS[p]}</option>)}
                    </select>

                    {newPerfil.perfil && newPerfil.perfil !== 'ADMINISTRADOR' && (
                      <select
                        value={newPerfil.plantaId}
                        onChange={e => setNewPerfil(p => ({ ...p, plantaId: e.target.value, areaId: '' }))}
                        className="field-input"
                        style={{ fontSize: '13px' }}
                      >
                        <option value="">Selecionar planta...</option>
                        {plantas.filter(p => p.ativa).map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    )}

                    {showArea && newPerfil.plantaId && (
                      <select
                        value={newPerfil.areaId}
                        onChange={e => setNewPerfil(p => ({ ...p, areaId: e.target.value }))}
                        className="field-input"
                        style={{ fontSize: '13px' }}
                      >
                        <option value="">Área (opcional)</option>
                        {filteredAreas.map(a => (
                          <option key={a.id} value={a.id}>{a.nome}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <button
                    onClick={handleAddPerfil}
                    disabled={perfilOp || !newPerfil.perfil}
                    style={{
                      padding: '7px 14px', fontSize: '13px', fontWeight: 500,
                      color: 'white',
                      background: perfilOp || !newPerfil.perfil ? '#94A3B8' : '#0038A8',
                      borderRadius: '4px', border: 'none',
                      cursor: perfilOp || !newPerfil.perfil ? 'not-allowed' : 'pointer',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {perfilOp ? 'Aguarde...' : '+ Adicionar perfil'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{ padding: '8px 16px', fontSize: '14px', color: '#475569', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}
              >
                Fechar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 16px', fontSize: '14px', fontWeight: 500,
                  color: 'white',
                  background: saving ? '#94A3B8' : '#0038A8',
                  borderRadius: '4px', border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar dados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
