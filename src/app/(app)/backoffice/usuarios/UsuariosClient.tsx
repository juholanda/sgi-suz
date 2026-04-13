'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Planta {
  id: string
  nome: string
  ativa: boolean
}

interface Area {
  id: string
  nome: string
  plantaId: string
  ativa: boolean
}

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
  perfis: UsuarioPerfil[]
}

interface Props {
  usuarios: Usuario[]
  plantas: Planta[]
  areas: Area[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERFIL_LABELS: Record<string, string> = {
  SOLICITANTE:   'Solicitante',
  EXECUTANTE:    'Executante',
  APROVADOR:     'Aprovador',
  GESTOR_SMS:    'Gestor SMS',
  ADMINISTRADOR: 'Administrador',
}

const PERFIL_COLORS: Record<string, { bg: string; text: string }> = {
  SOLICITANTE:   { bg: '#DBEAFE', text: '#1D4ED8' },
  EXECUTANTE:    { bg: '#DCFCE7', text: '#15803D' },
  APROVADOR:     { bg: '#FEF3C7', text: '#B45309' },
  GESTOR_SMS:    { bg: '#FEE2E2', text: '#B91C1C' },
  ADMINISTRADOR: { bg: '#F3E8FF', text: '#7E22CE' },
}

const PERFIS_OPTIONS = [
  'SOLICITANTE',
  'EXECUTANTE',
  'APROVADOR',
  'GESTOR_SMS',
  'ADMINISTRADOR',
]

// ── Icon helper ───────────────────────────────────────────────────────────────

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UsuariosClient({ usuarios, plantas, areas }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Which user row is expanded
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  // Per-user add-form state
  const [addPerfil, setAddPerfil] = useState('')
  const [addPlantaId, setAddPlantaId] = useState('')
  const [addAreaId, setAddAreaId] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  // Areas filtered by selected planta
  const areasFiltered = addPlantaId
    ? areas.filter(a => a.plantaId === addPlantaId && a.ativa)
    : []

  function toggleExpand(userId: string) {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
    } else {
      setExpandedUserId(userId)
      setAddPerfil('')
      setAddPlantaId('')
      setAddAreaId('')
      setAddError('')
    }
  }

  async function handleAdd(userId: string) {
    if (!addPerfil) { setAddError('Selecione um perfil'); return }
    setAdding(true)
    setAddError('')
    try {
      const res = await fetch('/api/admin/perfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          perfil: addPerfil,
          plantaId: addPlantaId || null,
          areaId: addAreaId || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setAddError(data.error || 'Erro ao adicionar perfil')
        return
      }
      setAddPerfil('')
      setAddPlantaId('')
      setAddAreaId('')
      startTransition(() => router.refresh())
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(perfilId: string) {
    const res = await fetch(`/api/admin/perfis/${perfilId}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      alert('Erro ao remover perfil')
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Usuários e perfis</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Backoffice · Associação Usuário × Perfil × Planta/Área</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Matrícula', 'Nome', 'E-mail', 'Perfis / Escopo', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>
                  Nenhum usuário cadastrado
                </td>
              </tr>
            ) : usuarios.map(u => (
              <>
                {/* Main row */}
                <tr
                  key={u.id}
                  className="border-t"
                  style={{
                    borderColor: '#F1F5F9',
                    background: expandedUserId === u.id ? '#F8FAFF' : undefined,
                  }}
                >
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: '#0038A8' }}>{u.matricula}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#0F172A' }}>{u.nome}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.perfis.map(p => {
                        const colors = PERFIL_COLORS[p.perfil] ?? { bg: '#F1F5F9', text: '#475569' }
                        return (
                          <span
                            key={p.id}
                            className="text-xs px-2 py-0.5 font-medium"
                            style={{ background: colors.bg, color: colors.text, borderRadius: '4px' }}
                            title={`${p.planta?.nome ?? 'Global'}${p.area ? ` › ${p.area.nome}` : ''}`}
                          >
                            {PERFIL_LABELS[p.perfil]}
                            {p.planta && <span style={{ opacity: 0.7 }}> · {p.planta.nome}</span>}
                          </span>
                        )
                      })}
                      {u.perfis.length === 0 && (
                        <span className="text-xs" style={{ color: '#94A3B8' }}>Sem perfil</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-1 font-medium"
                      style={{
                        borderRadius: '4px',
                        background: u.ativo ? '#D1FAE5' : '#F1F5F9',
                        color: u.ativo ? '#065F46' : '#64748B',
                      }}
                    >
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleExpand(u.id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 border transition-colors"
                      style={{
                        borderColor: expandedUserId === u.id ? '#0038A8' : '#E2E8F0',
                        color: expandedUserId === u.id ? '#0038A8' : '#475569',
                        background: expandedUserId === u.id ? '#EBF0FB' : 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name="manage_accounts" size={14} />
                      Gerenciar perfis
                      <Icon name={expandedUserId === u.id ? 'expand_less' : 'expand_more'} size={14} />
                    </button>
                  </td>
                </tr>

                {/* Expanded panel row */}
                {expandedUserId === u.id && (
                  <tr
                    key={`${u.id}-panel`}
                    className="border-t"
                    style={{ borderColor: '#EBF0FB', background: '#F8FAFF' }}
                  >
                    <td colSpan={6} className="px-6 py-5">
                      <div style={{ maxWidth: '720px' }}>
                        <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#64748B' }}>
                          Perfis atribuídos
                        </p>

                        {/* Current profiles list */}
                        {u.perfis.length === 0 ? (
                          <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
                            Nenhum perfil atribuído a este usuário.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {u.perfis.map(p => {
                              const colors = PERFIL_COLORS[p.perfil] ?? { bg: '#F1F5F9', text: '#475569' }
                              return (
                                <div
                                  key={p.id}
                                  className="flex items-center gap-1.5 text-xs font-medium pr-1 pl-2.5 py-1"
                                  style={{
                                    background: colors.bg,
                                    color: colors.text,
                                    borderRadius: '4px',
                                    border: `1px solid ${colors.bg}`,
                                  }}
                                >
                                  <span>{PERFIL_LABELS[p.perfil]}</span>
                                  {p.planta && (
                                    <span style={{ opacity: 0.75 }}>· {p.planta.nome}</span>
                                  )}
                                  {p.area && (
                                    <span style={{ opacity: 0.6 }}>› {p.area.nome}</span>
                                  )}
                                  <button
                                    onClick={() => handleDelete(p.id)}
                                    disabled={isPending}
                                    title="Remover perfil"
                                    className="flex items-center justify-center w-4 h-4 ml-0.5 rounded-full transition-opacity hover:opacity-100"
                                    style={{
                                      opacity: 0.6,
                                      background: 'rgba(0,0,0,0.08)',
                                      color: colors.text,
                                      border: 'none',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Icon name="close" size={11} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Add form */}
                        <div
                          className="border p-4"
                          style={{ borderColor: '#E2E8F0', borderRadius: '4px', background: 'white' }}
                        >
                          <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#64748B' }}>
                            Adicionar novo perfil
                          </p>
                          <div className="flex flex-wrap gap-3 items-end">
                            {/* Perfil select */}
                            <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
                              <label className="field-label">Perfil <span style={{ color: '#DC2626' }}>*</span></label>
                              <select
                                value={addPerfil}
                                onChange={e => { setAddPerfil(e.target.value); setAddError('') }}
                                className="field-input"
                              >
                                <option value="">Selecione...</option>
                                {PERFIS_OPTIONS.map(p => (
                                  <option key={p} value={p}>{PERFIL_LABELS[p]}</option>
                                ))}
                              </select>
                            </div>

                            {/* Planta select */}
                            <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
                              <label className="field-label">Planta</label>
                              <select
                                value={addPlantaId}
                                onChange={e => { setAddPlantaId(e.target.value); setAddAreaId('') }}
                                className="field-input"
                              >
                                <option value="">Global (sem planta)</option>
                                {plantas.filter(p => p.ativa).map(p => (
                                  <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                              </select>
                            </div>

                            {/* Area select — only shown when planta selected */}
                            {addPlantaId && (
                              <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
                                <label className="field-label">Área</label>
                                <select
                                  value={addAreaId}
                                  onChange={e => setAddAreaId(e.target.value)}
                                  className="field-input"
                                >
                                  <option value="">Todas as áreas</option>
                                  {areasFiltered.map(a => (
                                    <option key={a.id} value={a.id}>{a.nome}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Add button */}
                            <div className="flex items-end" style={{ paddingBottom: '0' }}>
                              <button
                                onClick={() => handleAdd(u.id)}
                                disabled={adding || isPending}
                                className="flex items-center gap-1.5 px-4 text-sm font-medium text-white"
                                style={{
                                  height: '36px',
                                  background: adding ? '#93C5FD' : '#0038A8',
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: adding ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Icon name={adding ? 'hourglass_empty' : 'add'} size={16} />
                                {adding ? 'Adicionando...' : 'Adicionar'}
                              </button>
                            </div>
                          </div>

                          {/* Error message */}
                          {addError && (
                            <p className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: '#DC2626' }}>
                              <Icon name="error" size={14} />
                              {addError}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
