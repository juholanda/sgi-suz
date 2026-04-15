'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Acao, ConflictInfo } from '@/lib/acoes'
import { Checkbox } from '@/components/design-system/Checkbox'

// ── Checklist types ──────────────────────────────────────────────────────────

interface ChecklistItemState {
  numero: number
  descricao: string
  resposta: 'SIM' | 'NA' | ''
  observacao: string
  hidden?: boolean
}

const CHECKLIST_DESABILITACAO: Omit<ChecklistItemState, 'resposta' | 'observacao'>[] = [
  { numero: 1, descricao: 'A desabilitacao sera feita com o equipamento em operacao?' },
  { numero: 2, descricao: 'Foi estabelecida uma protecao alternativa em substituicao ao intertravamento/dispositivo de seguranca desabilitado?' },
  { numero: 3, descricao: 'O cartao de advertencia esta instalado no equipamento ou painel?' },
  { numero: 4, descricao: 'A desabilitacao sera em instalacao eletrica?' },
]

const CHECKLIST_REABILITACAO: Omit<ChecklistItemState, 'resposta' | 'observacao'>[] = [
  { numero: 1, descricao: 'Todos os dispositivos de bloqueio/sinalizacao foram removidos?' },
  { numero: 2, descricao: 'Foram verificadas as condicoes de funcionamento do intertravamento/dispositivo de seguranca?' },
]

// ── Modal component ──────────────────────────────────────────────────────────

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="bg-white w-full my-4 p-6"
        style={{ borderRadius: 8, maxWidth: wide ? 640 : 480 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              fontSize: 18,
              borderRadius: 4,
            }}
          >
            {'\u2715'}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Variant → style mapping ──────────────────────────────────────────────────

function getButtonStyle(variant: Acao['variant']): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: '#0038A8', color: '#FFFFFF', border: 'none' }
    case 'secondary':
      return { background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }
    case 'danger':
      return { background: 'transparent', color: '#DC2626', border: '1px solid #DC2626' }
  }
}

// ── Main component ───────────────────────────────────────────────────────────

interface AcoesFooterProps {
  solicitacaoId: string
  acoes: Acao[]
  conflict: ConflictInfo | null
  tipo: string | null
  periodoFim: string | null
  classeMaxDias: number | null
}

export default function AcoesFooter({
  solicitacaoId,
  acoes,
  conflict,
  tipo,
  periodoFim,
  classeMaxDias,
}: AcoesFooterProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [comentario, setComentario] = useState('')
  const [novaDataFim, setNovaDataFim] = useState('')
  const [justificativaExtensao, setJustificativaExtensao] = useState('')
  const [confirmacaoValidacao, setConfirmacaoValidacao] = useState(false)

  // Checklist state
  const [checklistDesab, setChecklistDesab] = useState<ChecklistItemState[]>(
    CHECKLIST_DESABILITACAO.map(item => ({
      ...item,
      resposta: '',
      observacao: '',
      hidden: item.numero === 3 && tipo !== 'FISICO',
    })),
  )

  const [checklistReab, setChecklistReab] = useState<ChecklistItemState[]>(
    CHECKLIST_REABILITACAO.map(item => ({
      ...item,
      resposta: '',
      observacao: '',
    })),
  )

  function updateChecklist(
    setter: typeof setChecklistDesab,
    index: number,
    field: 'resposta' | 'observacao',
    value: string,
  ) {
    setter(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function checklistValido(items: ChecklistItemState[]) {
    return items.every(item => item.hidden || item.resposta !== '')
  }

  async function executarAcao(tipoAcao: string, body?: object) {
    setLoading(true)
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/acoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoAcao, ...body }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Erro ao executar acao')
        return
      }
      setModal(null)
      setMotivo('')
      setComentario('')
      setNovaDataFim('')
      setJustificativaExtensao('')
      setConfirmacaoValidacao(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Map action id to modal/handler
  function handleAcaoClick(acao: Acao) {
    switch (acao.id) {
      case 'ENVIAR_APROVACAO':
        if (acao.requiresConfirmation) {
          setModal('ENVIAR_APROVACAO')
        } else {
          executarAcao('ENVIAR_APROVACAO')
        }
        break
      case 'DESCARTAR':
        setModal('DESCARTAR')
        break
      case 'CANCELAR':
        setModal('CANCELAR')
        break
      case 'EDITAR':
        router.push(`/solicitacoes/nova?editar=${solicitacaoId}`)
        break
      case 'CLONAR':
        router.push(`/solicitacoes/nova?clonar=${solicitacaoId}`)
        break
      case 'SOLICITAR_EXTENSAO':
        setModal('SOLICITAR_EXTENSAO')
        break
      case 'INICIAR_EXECUCAO':
      case 'CONFIRMAR_DESABILITACAO':
        setModal('CHECKLIST_DESAB')
        break
      case 'INICIAR_REABILITACAO':
        setModal('CHECKLIST_REAB')
        break
      case 'CONCLUIR_REABILITACAO':
        setModal('CONCLUIR_REABILITACAO')
        break
      case 'APROVAR':
        setModal('APROVAR')
        break
      case 'REJEITAR':
        setModal('REJEITAR')
        break
      case 'VALIDAR_REABILITACAO':
        setModal('VALIDAR_REABILITACAO')
        break
      case 'REJEITAR_REABILITACAO':
        setModal('REJEITAR_REABILITACAO')
        break
      case 'APROVAR_EXTENSAO':
        setModal('APROVAR_EXTENSAO')
        break
      case 'REJEITAR_EXTENSAO':
        setModal('REJEITAR_EXTENSAO')
        break
      case 'EXPORTAR_PDF':
        window.open(`/api/solicitacoes/${solicitacaoId}/pdf`, '_blank')
        break
      default:
        break
    }
  }

  if (acoes.length === 0 && !conflict?.hasConflict) return null

  return (
    <>
      {/* Sticky footer — visible at the bottom, respects sidebar */}
      <div
        className="fixed-footer-actions"
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 40,
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '12px 16px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-5xl mx-auto w-full">
          {/* Conflict message */}
          {conflict?.hasConflict && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: '#FEF3C7',
                borderRadius: 6,
                marginBottom: acoes.length > 0 ? 8 : 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D97706', lineHeight: 1 }}>
                info
              </span>
              <span style={{ fontSize: 13, color: '#92400E' }}>{conflict.message}</span>
            </div>
          )}

          {/* Action buttons */}
          {acoes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {acoes.map(acao => {
                const style = getButtonStyle(acao.variant)
                return (
                  <button
                    key={acao.id}
                    onClick={() => handleAcaoClick(acao)}
                    disabled={loading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 6,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'opacity 150ms',
                      whiteSpace: 'nowrap',
                      ...style,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>
                      {acao.icon}
                    </span>
                    {acao.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────── */}

      {/* Enviar para aprovacao */}
      {modal === 'ENVIAR_APROVACAO' && (
        <Modal title="Enviar para aprovacao?" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
            A solicitacao sera enviada para a cadeia de aprovacao. Voce nao podera edita-la enquanto estiver em analise.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={loading} onClick={() => executarAcao('ENVIAR_APROVACAO')} className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#0038A8', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Enviando...' : 'Confirmar envio'}
            </button>
          </div>
        </Modal>
      )}

      {/* Descartar rascunho */}
      {modal === 'DESCARTAR' && (
        <Modal title="Descartar rascunho?" onClose={() => setModal(null)}>
          <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            Esta acao nao pode ser desfeita.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={loading} onClick={() => executarAcao('DESCARTAR')} className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#DC2626', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Descartando...' : 'Descartar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Cancelar */}
      {modal === 'CANCELAR' && (
        <Modal title="Cancelar Solicitacao" onClose={() => setModal(null)}>
          <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            Esta acao nao pode ser desfeita. Os aprovadores ja notificados serao avisados.
          </div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Motivo do cancelamento *</label>
          <textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-3 py-2 border text-sm outline-none" style={{ borderColor: '#E2E8F0', borderRadius: 6 }} placeholder="Descreva o motivo..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={!motivo.trim() || loading} onClick={() => executarAcao('CANCELAR', { motivo })} className="px-4 py-2 text-sm font-medium text-white" style={{ background: motivo.trim() ? '#DC2626' : '#94A3B8', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Cancelando...' : 'Confirmar cancelamento'}
            </button>
          </div>
        </Modal>
      )}

      {/* Solicitar extensao */}
      {modal === 'SOLICITAR_EXTENSAO' && (
        <Modal title="Solicitar Extensao de Prazo" onClose={() => setModal(null)}>
          <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, color: '#374151', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1, color: '#94A3B8' }}>event</span>
              <span><strong>Fim original:</strong> {periodoFim ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(periodoFim)) : '\u2014'}</span>
            </div>
            {classeMaxDias && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1, color: '#94A3B8' }}>timer</span>
                <span><strong>Prazo maximo da classe:</strong> {classeMaxDias} dia(s)</span>
              </div>
            )}
          </div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Nova data fim *</label>
          <input type="datetime-local" value={novaDataFim} onChange={e => setNovaDataFim(e.target.value)} className="w-full px-3 py-2 border text-sm outline-none" style={{ borderColor: '#E2E8F0', borderRadius: 6, marginBottom: 12 }} />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Justificativa *</label>
          <textarea rows={3} value={justificativaExtensao} onChange={e => setJustificativaExtensao(e.target.value)} className="w-full px-3 py-2 border text-sm outline-none" style={{ borderColor: '#E2E8F0', borderRadius: 6 }} placeholder="Descreva o motivo da extensao..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={!novaDataFim || !justificativaExtensao.trim() || loading} onClick={() => executarAcao('SOLICITAR_EXTENSAO', { novaDataFim: new Date(novaDataFim).toISOString(), justificativa: justificativaExtensao })} className="px-4 py-2 text-sm font-medium text-white" style={{ background: novaDataFim && justificativaExtensao.trim() ? '#D97706' : '#94A3B8', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Enviando...' : 'Solicitar Extensao'}
            </button>
          </div>
        </Modal>
      )}

      {/* Aprovar */}
      {modal === 'APROVAR' && (
        <Modal title="Confirmar Aprovacao" onClose={() => setModal(null)}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Comentario (opcional)</label>
          <textarea rows={2} value={comentario} onChange={e => setComentario(e.target.value)} className="w-full px-3 py-2 border text-sm outline-none" style={{ borderColor: '#E2E8F0', borderRadius: 6 }} placeholder="Comentario opcional..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={loading} onClick={() => executarAcao('APROVAR', { comentario })} className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#16A34A', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Aprovando...' : 'Confirmar aprovacao'}
            </button>
          </div>
        </Modal>
      )}

      {/* Rejeitar */}
      {modal === 'REJEITAR' && (
        <Modal title="Rejeitar Solicitacao" onClose={() => setModal(null)}>
          <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            O solicitante sera notificado. A solicitacao nao podera ser reativada.
          </div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Motivo da rejeicao *</label>
          <textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-3 py-2 border text-sm outline-none" style={{ borderColor: '#E2E8F0', borderRadius: 6 }} placeholder="Justificativa obrigatoria..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={!motivo.trim() || loading} onClick={() => executarAcao('REJEITAR', { motivo })} className="px-4 py-2 text-sm font-medium text-white" style={{ background: motivo.trim() ? '#DC2626' : '#94A3B8', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Rejeitando...' : 'Confirmar rejeicao'}
            </button>
          </div>
        </Modal>
      )}

      {/* Checklist Desabilitacao */}
      {modal === 'CHECKLIST_DESAB' && (
        <Modal title="Checklist de Execucao em Campo" onClose={() => setModal(null)} wide>
          <div style={{ padding: '8px 12px', background: '#FEF3C7', color: '#92400E', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            Leia atentamente cada item antes de responder. Todos os itens sao obrigatorios. N.A. deve ser justificado.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {checklistDesab.map((item, i) => {
              if (item.hidden) return null
              return (
                <div key={item.numero} style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 24, padding: '2px 6px', background: '#EBF0FB', color: '#0038A8', borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{item.numero}</span>
                    <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.4 }}>{item.descricao}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginLeft: 34 }}>
                    {(['SIM', 'NA'] as const).map(opt => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="radio" name={`desab-${item.numero}`} value={opt} checked={item.resposta === opt} onChange={() => updateChecklist(setChecklistDesab, i, 'resposta', opt)} style={{ accentColor: '#0038A8' }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: opt === 'SIM' ? '#16A34A' : '#6B7280' }}>{opt === 'NA' ? 'N.A.' : 'SIM'}</span>
                      </label>
                    ))}
                  </div>
                  {item.resposta === 'NA' && (
                    <div style={{ marginLeft: 34, marginTop: 8 }}>
                      <input className="w-full px-3 py-1.5 text-sm border outline-none" style={{ borderColor: '#EAB308', borderRadius: 6 }} placeholder="Justificativa obrigatoria para N.A. *" value={item.observacao} onChange={e => updateChecklist(setChecklistDesab, i, 'observacao', e.target.value)} />
                    </div>
                  )}
                  {item.resposta === '' && <p style={{ marginLeft: 34, marginTop: 4, fontSize: 11, color: '#EF4444', marginBottom: 0 }}>Item obrigatorio</p>}
                </div>
              )
            })}
          </div>
          {checklistDesab.some(i => !i.hidden && i.resposta === 'NA' && !i.observacao.trim()) && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, fontSize: 13 }}>Itens marcados N.A. exigem justificativa.</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Cancelar</button>
            <button
              disabled={!checklistValido(checklistDesab) || checklistDesab.some(i => !i.hidden && i.resposta === 'NA' && !i.observacao.trim()) || loading}
              onClick={() => executarAcao('CONFIRMAR_DESABILITACAO', { checklistItems: checklistDesab.filter(i => !i.hidden).map(i => ({ numero: i.numero, descricao: i.descricao, resposta: i.resposta, observacao: i.observacao || undefined })) })}
              className="px-5 py-2 text-sm font-medium text-white"
              style={{ background: checklistValido(checklistDesab) && !checklistDesab.some(i => !i.hidden && i.resposta === 'NA' && !i.observacao.trim()) ? '#EA580C' : '#94A3B8', borderRadius: 6, border: 'none', cursor: 'pointer' }}
            >
              {loading ? 'Confirmando...' : 'Confirmar Desabilitacao'}
            </button>
          </div>
        </Modal>
      )}

      {/* Checklist Reabilitacao */}
      {modal === 'CHECKLIST_REAB' && (
        <Modal title="Checklist de Reabilitacao" onClose={() => setModal(null)} wide>
          <div style={{ padding: '8px 12px', background: '#CCFBF1', color: '#0F766E', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            Confirme cada item antes de concluir a reabilitacao. Todos os itens sao obrigatorios.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {checklistReab.map((item, i) => (
              <div key={item.numero} style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 24, padding: '2px 6px', background: '#CCFBF1', color: '#0F766E', borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{item.numero}</span>
                  <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.4 }}>
                    {item.numero === 1 && tipo === 'FISICO' ? `${item.descricao} (incluindo cartao de advertencia)` : item.descricao}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, marginLeft: 34 }}>
                  {(['SIM', 'NA'] as const).map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="radio" name={`reab-${item.numero}`} value={opt} checked={item.resposta === opt} onChange={() => updateChecklist(setChecklistReab, i, 'resposta', opt)} style={{ accentColor: '#0D9488' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: opt === 'SIM' ? '#16A34A' : '#6B7280' }}>{opt === 'NA' ? 'N.A.' : 'SIM'}</span>
                    </label>
                  ))}
                </div>
                {item.resposta === 'NA' && (
                  <div style={{ marginLeft: 34, marginTop: 8 }}>
                    <input className="w-full px-3 py-1.5 text-sm border outline-none" style={{ borderColor: '#EAB308', borderRadius: 6 }} placeholder="Justificativa para N.A. *" value={item.observacao} onChange={e => updateChecklist(setChecklistReab, i, 'observacao', e.target.value)} />
                  </div>
                )}
                {item.resposta === '' && <p style={{ marginLeft: 34, marginTop: 4, fontSize: 11, color: '#EF4444', marginBottom: 0 }}>Item obrigatorio</p>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Cancelar</button>
            <button
              disabled={!checklistValido(checklistReab) || checklistReab.some(i => i.resposta === 'NA' && !i.observacao.trim()) || loading}
              onClick={() => executarAcao('INICIAR_REABILITACAO_COMPLETA', { checklistItems: checklistReab.map(i => ({ numero: i.numero, descricao: i.descricao, resposta: i.resposta, observacao: i.observacao || undefined })) })}
              className="px-5 py-2 text-sm font-medium text-white"
              style={{ background: checklistValido(checklistReab) && !checklistReab.some(i => i.resposta === 'NA' && !i.observacao.trim()) ? '#0D9488' : '#94A3B8', borderRadius: 6, border: 'none', cursor: 'pointer' }}
            >
              {loading ? 'Confirmando...' : 'Concluir Reabilitacao'}
            </button>
          </div>
        </Modal>
      )}

      {/* Concluir reabilitacao (enviar para validacao) */}
      {modal === 'CONCLUIR_REABILITACAO' && (
        <Modal title="Enviar para validacao?" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
            O checklist de reabilitacao sera enviado para validacao do aprovador.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={loading} onClick={() => executarAcao('CONCLUIR_REABILITACAO')} className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#0038A8', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Validar reabilitacao */}
      {modal === 'VALIDAR_REABILITACAO' && (
        <Modal title="Validar e Encerrar Solicitacao" onClose={() => { setModal(null); setConfirmacaoValidacao(false) }}>
          <div style={{ padding: '8px 12px', background: '#D1FAE5', color: '#065F46', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            Ao validar, a solicitacao sera encerrada de forma permanente e imutavel.
          </div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Comentario (opcional)</label>
          <textarea rows={2} value={comentario} onChange={e => setComentario(e.target.value)} className="w-full px-3 py-2 border text-sm outline-none" style={{ borderColor: '#E2E8F0', borderRadius: 6 }} />
          <div style={{ marginTop: 16 }}>
            <Checkbox checked={confirmacaoValidacao} onCheckedChange={setConfirmacaoValidacao} label={<span style={{ fontSize: 13, color: '#374151' }}><strong>Confirmo minha identidade e valido digitalmente</strong> a reabilitacao deste intertravamento.</span>} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => { setModal(null); setConfirmacaoValidacao(false) }} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={!confirmacaoValidacao || loading} onClick={() => executarAcao('VALIDAR_REABILITACAO', { comentario })} className="px-4 py-2 text-sm font-medium text-white" style={{ background: confirmacaoValidacao && !loading ? '#10B981' : '#94A3B8', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Validando...' : 'Validar e Encerrar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Rejeitar reabilitacao */}
      {modal === 'REJEITAR_REABILITACAO' && (
        <Modal title="Devolver Reabilitacao" onClose={() => setModal(null)}>
          <div style={{ padding: '8px 12px', background: '#FEF3C7', color: '#92400E', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            O executante recebera o motivo e devera corrigir e reenviar.
          </div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Motivo da devolucao *</label>
          <textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-3 py-2 border text-sm outline-none" style={{ borderColor: '#E2E8F0', borderRadius: 6 }} placeholder="Justificativa obrigatoria..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={!motivo.trim() || loading} onClick={() => executarAcao('REJEITAR_REABILITACAO', { motivo })} className="px-4 py-2 text-sm font-medium text-white" style={{ background: motivo.trim() ? '#DC2626' : '#94A3B8', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Enviando...' : 'Confirmar Devolucao'}
            </button>
          </div>
        </Modal>
      )}

      {/* Aprovar extensao */}
      {modal === 'APROVAR_EXTENSAO' && (
        <Modal title="Aprovar extensao de prazo?" onClose={() => setModal(null)}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Comentario (opcional)</label>
          <textarea rows={2} value={comentario} onChange={e => setComentario(e.target.value)} className="w-full px-3 py-2 border text-sm outline-none" style={{ borderColor: '#E2E8F0', borderRadius: 6 }} placeholder="Comentario opcional..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={loading} onClick={() => executarAcao('APROVAR_EXTENSAO', { comentario })} className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#16A34A', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Aprovando...' : 'Aprovar extensao'}
            </button>
          </div>
        </Modal>
      )}

      {/* Rejeitar extensao */}
      {modal === 'REJEITAR_EXTENSAO' && (
        <Modal title="Rejeitar extensao de prazo" onClose={() => setModal(null)}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Motivo da rejeicao *</label>
          <textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-3 py-2 border text-sm outline-none" style={{ borderColor: '#E2E8F0', borderRadius: 6 }} placeholder="Justificativa obrigatoria..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Voltar</button>
            <button disabled={!motivo.trim() || loading} onClick={() => executarAcao('REJEITAR_EXTENSAO', { motivo })} className="px-4 py-2 text-sm font-medium text-white" style={{ background: motivo.trim() ? '#DC2626' : '#94A3B8', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Rejeitando...' : 'Rejeitar extensao'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
