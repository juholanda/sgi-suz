'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusSolicitacao } from '@/lib/tokens'

interface Props {
  solicitacaoId: string
  status: StatusSolicitacao
}

export default function AcoesButtons({ solicitacaoId, status }: Props) {
  const router = useRouter()
  const [showCancelarModal, setShowCancelarModal] = useState(false)
  const [showAprovarModal, setShowAprovarModal] = useState(false)
  const [showRejeitarModal, setShowRejeitarModal] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  async function acao(tipo: string, body?: object) {
    setLoading(true)
    await fetch(`/api/solicitacoes/${solicitacaoId}/acoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, ...body }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {status === 'EM_APROVACAO' && (
          <>
            <button
              onClick={() => setShowAprovarModal(true)}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#16A34A', borderRadius: '4px' }}
            >
              ✓ Aprovar
            </button>
            <button
              onClick={() => setShowRejeitarModal(true)}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#DC2626', borderRadius: '4px' }}
            >
              ✕ Rejeitar
            </button>
          </>
        )}

        {status === 'EXECUCAO_AUTORIZADA' && (
          <button
            onClick={() => acao('INICIAR_EXECUCAO')}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#0038A8', borderRadius: '4px' }}
          >
            Iniciar Execução em Campo
          </button>
        )}

        {status === 'EM_EXECUCAO' && (
          <button
            onClick={() => acao('CONFIRMAR_DESABILITACAO')}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#EA580C', borderRadius: '4px' }}
          >
            Confirmar Desabilitação
          </button>
        )}

        {status === 'DESABILITADO' && (
          <button
            onClick={() => acao('INICIAR_REABILITACAO')}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#8B5CF6', borderRadius: '4px' }}
          >
            Iniciar Reabilitação
          </button>
        )}

        {status === 'EM_REABILITACAO' && (
          <button
            onClick={() => acao('CONCLUIR_REABILITACAO')}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#6366F1', borderRadius: '4px' }}
          >
            Concluir Reabilitação
          </button>
        )}

        {status === 'EM_VALIDACAO_DA_REABILITACAO' && (
          <button
            onClick={() => acao('VALIDAR_REABILITACAO')}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#10B981', borderRadius: '4px' }}
          >
            ✓ Validar Reabilitação — Encerrar
          </button>
        )}

        {['RASCUNHO', 'EM_APROVACAO'].includes(status) && (
          <button
            onClick={() => setShowCancelarModal(true)}
            className="px-4 py-2 text-sm border"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#DC2626' }}
          >
            Cancelar solicitação
          </button>
        )}
      </div>

      {/* Modal Cancelar */}
      {showCancelarModal && (
        <Modal title="Cancelar Solicitação" onClose={() => setShowCancelarModal(false)}>
          <div
            className="mb-4 px-3 py-2 text-sm"
            style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}
          >
            Esta ação não pode ser desfeita. Os aprovadores já notificados serão avisados.
          </div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Motivo do cancelamento *
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Descreva o motivo..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowCancelarModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={!motivo.trim() || loading}
              onClick={() => { acao('CANCELAR', { motivo }); setShowCancelarModal(false) }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: motivo.trim() ? '#DC2626' : '#94A3B8', borderRadius: '4px' }}
            >
              Confirmar cancelamento
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Aprovar */}
      {showAprovarModal && (
        <Modal title="Confirmar Aprovação" onClose={() => setShowAprovarModal(false)}>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Comentário (opcional)
          </label>
          <textarea
            rows={2}
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Comentário opcional..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowAprovarModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={loading}
              onClick={() => { acao('APROVAR', { comentario }); setShowAprovarModal(false) }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#16A34A', borderRadius: '4px' }}
            >
              Confirmar aprovação
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Rejeitar */}
      {showRejeitarModal && (
        <Modal title="Rejeitar Solicitação" onClose={() => setShowRejeitarModal(false)}>
          <div className="mb-3 px-3 py-2 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
            O solicitante será notificado. A solicitação não poderá ser reativada — será necessário criar uma nova.
          </div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Motivo da rejeição *
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Justificativa obrigatória..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowRejeitarModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={!motivo.trim() || loading}
              onClick={() => { acao('REJEITAR', { motivo }); setShowRejeitarModal(false) }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: motivo.trim() ? '#DC2626' : '#94A3B8', borderRadius: '4px' }}
            >
              Confirmar rejeição
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full max-w-md p-6" style={{ borderRadius: '4px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} className="text-sm" style={{ color: '#94A3B8' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
