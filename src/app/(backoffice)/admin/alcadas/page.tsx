'use client'
import { useEffect, useState } from 'react'

interface Planta { id: string; nome: string }
interface Classe { id: string; numero: number; descricao: string; cor: string }
interface UserSimple { id: string; nome: string; matricula: string }
interface Alcada {
  id: string
  plantaId: string
  classeId: string
  nivel: number
  userId: string
  planta: { nome: string }
  classe: { numero: number; descricao: string; cor: string }
  user: { nome: string; matricula: string }
}

interface FormState { plantaId: string; classeId: string; nivel: string; userId: string }

const emptyForm = (): FormState => ({ plantaId: '', classeId: '', nivel: '1', userId: '' })

const CLASSE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
  2: { bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' },
  3: { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D' },
  4: { bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' },
  5: { bg: '#FFF1F2', text: '#BE123C', border: '#FDA4AF' },
}

export default function AlcadasPage() {
  const [alcadas, setAlcadas] = useState<Alcada[]>([])
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [usuarios, setUsuarios] = useState<UserSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing: Alcada | null }>({ open: false, editing: null })
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/backoffice/alcadas').then(r => r.json()),
      fetch('/api/backoffice/plantas').then(r => r.json()),
      fetch('/api/backoffice/classes').then(r => r.json()).catch(() => []),
      fetch('/api/backoffice/usuarios').then(r => r.json()),
    ]).then(([alcadasData, plantasData, classesData, usuariosData]) => {
      setAlcadas(alcadasData)
      setPlantas(plantasData)
      setClasses(classesData)
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

  const openEdit = (a: Alcada) => {
    setForm({ plantaId: a.plantaId, classeId: a.classeId, nivel: String(a.nivel), userId: a.userId })
    setFormError('')
    setModal({ open: true, editing: a })
  }

  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.plantaId) { setFormError('Selecione uma planta'); return }
    if (!form.classeId) { setFormError('Selecione uma classe'); return }
    if (!form.nivel) { setFormError('Nível é obrigatório'); return }
    if (!form.userId) { setFormError('Selecione um usuário aprovador'); return }

    setSaving(true)
    setFormError('')
    try {
      const url = modal.editing ? `/api/backoffice/alcadas/${modal.editing.id}` : '/api/backoffice/alcadas'
      const method = modal.editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, nivel: Number(form.nivel) }),
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

  const handleDelete = async (a: Alcada) => {
    const confirmed = window.confirm(`Remover alçada: ${a.user.nome} como nível ${a.nivel} em ${a.planta.nome} / Classe ${a.classe.numero}?`)
    if (!confirmed) return
    await fetch(`/api/backoffice/alcadas/${a.id}`, { method: 'DELETE' })
    loadData()
  }

  // Group alcadas by planta+classe
  const grouped: Record<string, { planta: string; classe: Alcada['classe']; niveis: Alcada[] }> = {}
  for (const a of alcadas) {
    const key = `${a.plantaId}__${a.classeId}`
    if (!grouped[key]) {
      grouped[key] = { planta: a.planta.nome, classe: a.classe, niveis: [] }
    }
    grouped[key].niveis.push(a)
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Alçadas de Aprovação</h1>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '2px', marginBottom: 0 }}>Backoffice · Configuração por Planta × Classe</p>
        </div>
        <button
          onClick={openCreate}
          style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#0038A8', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          + Configurar Alçada
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8', fontSize: '14px' }}>Carregando...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 8px 0' }}>Nenhuma alçada configurada.</p>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Configure as alçadas para que as aprovações funcionem corretamente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.values(grouped).map((g, i) => {
            const colors = CLASSE_COLORS[g.classe.numero] ?? CLASSE_COLORS[1]
            return (
              <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, background: colors.bg, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: '4px' }}>
                    {g.classe.numero}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Classe {g.classe.numero} — {g.classe.descricao}</div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>Planta: {g.planta}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {g.niveis.sort((a, b) => a.nivel - b.nivel).map(n => (
                    <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: `1px solid ${colors.border}`, background: colors.bg, borderRadius: '4px' }}>
                      <span style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: colors.text, color: 'white', borderRadius: '50%' }}>
                        {n.nivel}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: colors.text }}>{n.user.nome}</div>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: colors.text, opacity: 0.7 }}>{n.user.matricula}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                        <button onClick={() => openEdit(n)} style={{ fontSize: '11px', color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Editar</button>
                        <button onClick={() => handleDelete(n)} style={{ fontSize: '11px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '4px', padding: '24px', width: '480px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>
              {modal.editing ? 'Editar Alçada' : 'Configurar Alçada'}
            </h2>

            {formError && (
              <div style={{ padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label className="field-label">Planta <span className="field-required">*</span></label>
              <select
                value={form.plantaId}
                onChange={e => setForm(f => ({ ...f, plantaId: e.target.value }))}
                className="field-input"
              >
                <option value="">Selecione uma planta...</option>
                {plantas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="field-label">Classe <span className="field-required">*</span></label>
                <select
                  value={form.classeId}
                  onChange={e => setForm(f => ({ ...f, classeId: e.target.value }))}
                  className="field-input"
                >
                  <option value="">Classe...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>Classe {c.numero} — {c.descricao}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Nível <span className="field-required">*</span></label>
                <select
                  value={form.nivel}
                  onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))}
                  className="field-input"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Nível {n}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="field-label">Aprovador <span className="field-required">*</span></label>
              <select
                value={form.userId}
                onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                className="field-input"
              >
                <option value="">Selecione um usuário...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.matricula})</option>
                ))}
              </select>
            </div>

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
