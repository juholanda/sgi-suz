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
  const maxW = wide ? 560 : 460
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full p-5 sm:p-6 overflow-y-auto"
        style={{
          borderRadius: '16px 16px 0 0',
          maxHeight: '92vh',
          maxWidth: maxW,
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @media (min-width: 640px) {
            .sgi-modal-card { border-radius: 10px !important; }
          }
        `}</style>
        <div className="sgi-modal-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F1F5F9',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                fontSize: 18,
                borderRadius: 8,
              }}
            >
              {'\u2715'}
            </button>
          </div>
          {children}
        </div>
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
        setModal('CHECKLIST_REAB')
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
      {/* Em md+ o footer respeita a largura do sidebar (CSS var publicada
          pelo componente Sidebar). Em mobile fica edge-to-edge. */}
      <style>{`
        @media (min-width: 768px) {
          .sgi-acoes-footer { left: var(--sgi-sidebar-w, 240px) !important; }
        }
      `}</style>
      {/* Fixed footer — always visible at viewport bottom */}
      <div
        className="sgi-acoes-footer"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
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
          {acoes.length > 0 && (() => {
            const aprovarAcao = acoes.find(a => a.id === 'APROVAR')
            const rejeitarAcao = acoes.find(a => a.id === 'REJEITAR')
            const isAprovarRejeitarPair = !!aprovarAcao && !!rejeitarAcao && acoes.length === 2

            return (
              <>
                {/* ── Mobile: Rejeitar (esq, vermelho) + Aprovar (dir, verde) full-width ── */}
                {isAprovarRejeitarPair && (
                  <div className="sm:hidden grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleAcaoClick(rejeitarAcao!)}
                      disabled={loading}
                      style={{
                        height: 48,
                        fontSize: 16,
                        fontWeight: 600,
                        background: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1 }}>thumb_down</span>
                      Rejeitar
                    </button>
                    <button
                      onClick={() => handleAcaoClick(aprovarAcao!)}
                      disabled={loading}
                      style={{
                        height: 48,
                        fontSize: 16,
                        fontWeight: 600,
                        background: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1 }}>thumb_up</span>
                      Aprovar
                    </button>
                  </div>
                )}

                {/* ── Desktop: par APROVAR/REJEITAR com Rejeitar (esq, vermelho) + Aprovar (dir, verde) ── */}
                {isAprovarRejeitarPair ? (
                  <div className="hidden sm:flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleAcaoClick(rejeitarAcao!)}
                      disabled={loading}
                      className="text-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        fontWeight: 600,
                        background: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                        transition: 'opacity 150ms',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>thumb_down</span>
                      Rejeitar
                    </button>
                    <button
                      onClick={() => handleAcaoClick(aprovarAcao!)}
                      disabled={loading}
                      className="text-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        fontWeight: 600,
                        background: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                        transition: 'opacity 150ms',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>thumb_up</span>
                      Aprovar
                    </button>
                  </div>
                ) : (
                  /* ── Desktop: demais ações (não é par APROVAR/REJEITAR) ── */
                  <div
                    className="flex"
                    style={{ flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}
                  >
                    {acoes.map(acao => {
                      const style = getButtonStyle(acao.variant)
                      return (
                        <button
                          key={acao.id}
                          onClick={() => handleAcaoClick(acao)}
                          disabled={loading}
                          className="text-[13px] sm:text-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
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
              </>
            )
          })()}
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
        <Modal title="Checklist de Execução em Campo" onClose={() => setModal(null)} wide>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, marginTop: 0 }}>
            Leia atentamente cada item antes de responder. N.A. deve ser justificado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {checklistDesab.map((item, i) => {
              if (item.hidden) return null
              const selected = item.resposta
              return (
                <div key={item.numero}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, padding: '2px 6px', background: '#F1F5F9', color: '#64748B', borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{item.numero}</span>
                    <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.4, flex: 1 }}>{item.descricao}</p>
                    <span style={{ fontSize: 11, color: '#CBD5E1', whiteSpace: 'nowrap', flexShrink: 0 }}>Obrigatório</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 30 }}>
                    {(['SIM', 'NA'] as const).map(opt => {
                      const isActive = selected === opt
                      const cardBorder = isActive
                        ? (opt === 'SIM' ? '#16A34A' : '#D97706')
                        : '#E2E8F0'
                      const textColor = isActive
                        ? (opt === 'SIM' ? '#16A34A' : '#92400E')
                        : '#94A3B8'
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateChecklist(setChecklistDesab, i, 'resposta', opt)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 12px',
                            background: '#FFFFFF',
                            border: `2px solid ${cardBorder}`,
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'all 150ms',
                          }}
                        >
                          {isActive && (
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: textColor, lineHeight: 1 }}>
                              {opt === 'SIM' ? 'check_circle' : 'help'}
                            </span>
                          )}
                          <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>
                            {opt === 'SIM' ? 'Sim' : 'N.A.'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {item.resposta === 'NA' && (
                    <div style={{ marginLeft: 30, marginTop: 8 }}>
                      <input className="w-full px-3 py-1.5 text-sm border outline-none" style={{ borderColor: '#EAB308', borderRadius: 6 }} placeholder="Justificativa obrigatória para N.A. *" value={item.observacao} onChange={e => updateChecklist(setChecklistDesab, i, 'observacao', e.target.value)} />
                    </div>
                  )}
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
              style={{ background: checklistValido(checklistDesab) && !checklistDesab.some(i => !i.hidden && i.resposta === 'NA' && !i.observacao.trim()) ? '#0038A8' : '#94A3B8', borderRadius: 6, border: 'none', cursor: 'pointer' }}
            >
              {loading ? 'Confirmando...' : 'Confirmar Desabilitação'}
            </button>
          </div>
        </Modal>
      )}

      {/* Checklist Reabilitacao */}
      {modal === 'CHECKLIST_REAB' && (
        <Modal title="Checklist de Reabilitação" onClose={() => setModal(null)} wide>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, marginTop: 0 }}>
            Confirme cada item antes de concluir a reabilitação. N.A. deve ser justificado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {checklistReab.map((item, i) => {
              const selected = item.resposta
              const descricao = item.numero === 1 && tipo === 'FISICO'
                ? `${item.descricao} (incluindo cartão de advertência)`
                : item.descricao
              return (
                <div key={item.numero}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, padding: '2px 6px', background: '#F1F5F9', color: '#64748B', borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{item.numero}</span>
                    <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.4, flex: 1 }}>{descricao}</p>
                    <span style={{ fontSize: 11, color: '#CBD5E1', whiteSpace: 'nowrap', flexShrink: 0 }}>Obrigatório</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 30 }}>
                    {(['SIM', 'NA'] as const).map(opt => {
                      const isActive = selected === opt
                      const cardBorder = isActive
                        ? (opt === 'SIM' ? '#16A34A' : '#D97706')
                        : '#E2E8F0'
                      const textColor = isActive
                        ? (opt === 'SIM' ? '#16A34A' : '#92400E')
                        : '#94A3B8'
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateChecklist(setChecklistReab, i, 'resposta', opt)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 12px',
                            background: '#FFFFFF',
                            border: `2px solid ${cardBorder}`,
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'all 150ms',
                          }}
                        >
                          {isActive && (
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: textColor, lineHeight: 1 }}>
                              {opt === 'SIM' ? 'check_circle' : 'help'}
                            </span>
                          )}
                          <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>
                            {opt === 'SIM' ? 'Sim' : 'N.A.'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {item.resposta === 'NA' && (
                    <div style={{ marginLeft: 30, marginTop: 8 }}>
                      <input className="w-full px-3 py-1.5 text-sm border outline-none" style={{ borderColor: '#EAB308', borderRadius: 6 }} placeholder="Justificativa obrigatória para N.A. *" value={item.observacao} onChange={e => updateChecklist(setChecklistReab, i, 'observacao', e.target.value)} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: 6, color: '#475569', background: 'white', cursor: 'pointer' }}>Cancelar</button>
            <button
              disabled={!checklistValido(checklistReab) || checklistReab.some(i => i.resposta === 'NA' && !i.observacao.trim()) || loading}
              onClick={() => executarAcao('CONCLUIR_REABILITACAO', { checklistItems: checklistReab.map(i => ({ numero: i.numero, descricao: i.descricao, resposta: i.resposta, observacao: i.observacao || undefined })) })}
              className="px-5 py-2 text-sm font-medium text-white"
              style={{ background: checklistValido(checklistReab) && !checklistReab.some(i => i.resposta === 'NA' && !i.observacao.trim()) ? '#0038A8' : '#94A3B8', borderRadius: 6, border: 'none', cursor: 'pointer' }}
            >
              {loading ? 'Confirmando...' : 'Confirmar Reabilitação'}
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
