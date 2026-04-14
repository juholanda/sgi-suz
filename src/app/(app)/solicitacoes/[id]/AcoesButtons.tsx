'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusSolicitacao } from '@/lib/tokens'

interface Props {
  solicitacaoId: string
  status: StatusSolicitacao
  tipo?: string | null
}

type ChecklistResposta = {
  numero: number
  resposta: 'SIM' | 'NA' | ''
  observacao: string
}

const CHECKLIST_DESABILITACAO_BASE: ChecklistResposta[] = [
  { numero: 1, resposta: '', observacao: '' },
  { numero: 2, resposta: '', observacao: '' },
  { numero: 3, resposta: '', observacao: '' },
  { numero: 4, resposta: '', observacao: '' },
]

const CHECKLIST_REABILITACAO_BASE: ChecklistResposta[] = [
  { numero: 1, resposta: '', observacao: '' },
  { numero: 2, resposta: '', observacao: '' },
]

const CHECKLIST_LABELS: Record<number, string> = {
  1: 'A desabilitação será feita com o equipamento em operação?',
  2: 'Foi estabelecida uma proteção alternativa em substituição ao intertravamento desabilitado?',
  3: 'O cartão de advertência está instalado no equipamento ou painel?',
  4: 'A desabilitação será em instalação elétrica?',
}

const CHECKLIST_REAB_LABELS: Record<number, string> = {
  1: 'Todos os dispositivos de bloqueio/sinalização foram removidos?',
  2: 'Foram verificadas as condições de funcionamento do intertravamento/dispositivo de segurança?',
}

export default function AcoesButtons({ solicitacaoId, status, tipo }: Props) {
  const router = useRouter()
  const [showCancelarModal, setShowCancelarModal] = useState(false)
  const [showAprovarModal, setShowAprovarModal] = useState(false)
  const [showRejeitarModal, setShowRejeitarModal] = useState(false)
  const [showExtensaoModal, setShowExtensaoModal] = useState(false)
  const [showAprovarExtensaoModal, setShowAprovarExtensaoModal] = useState(false)
  const [showRejeitarExtensaoModal, setShowRejeitarExtensaoModal] = useState(false)
  const [showChecklistDesabModal, setShowChecklistDesabModal] = useState(false)
  const [showChecklistReabModal, setShowChecklistReabModal] = useState(false)
  const [showValidarReabModal, setShowValidarReabModal] = useState(false)
  const [showRejeitarReabModal, setShowRejeitarReabModal] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [motivoRejeicaoReab, setMotivoRejeicaoReab] = useState('')
  const [motivoRejeicaoExtensao, setMotivoRejeicaoExtensao] = useState('')
  const [comentarioAprovacao, setComentarioAprovacao] = useState('')
  const [comentarioValidacaoReab, setComentarioValidacaoReab] = useState('')
  const [comentarioAprovacaoExtensao, setComentarioAprovacaoExtensao] = useState('')
  const [justificativaExtensao, setJustificativaExtensao] = useState('')
  const [novoPeriodoFim, setNovoPeriodoFim] = useState('')
  const [checklistDesab, setChecklistDesab] = useState<ChecklistResposta[]>(CHECKLIST_DESABILITACAO_BASE)
  const [checklistReab, setChecklistReab] = useState<ChecklistResposta[]>(CHECKLIST_REABILITACAO_BASE)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isFisico = tipo === 'FISICO'
  const checklistDesabVisivel = checklistDesab.filter(item => isFisico || item.numero !== 3)
  const checklistDesabCompleto = checklistDesabVisivel.every(item => item.resposta === 'SIM' || item.resposta === 'NA')
  const checklistReabCompleto = checklistReab.every(item => item.resposta === 'SIM' || item.resposta === 'NA')

  async function acao(tipoAcao: string, body?: object) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/acoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoAcao, ...body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao executar ação')
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Erro inesperado na ação')
    } finally {
      setLoading(false)
    }
  }

  function updateChecklist(
    setState: React.Dispatch<React.SetStateAction<ChecklistResposta[]>>,
    numero: number,
    patch: Partial<ChecklistResposta>,
  ) {
    setState(prev => prev.map(item => (item.numero === numero ? { ...item, ...patch } : item)))
  }

  return (
    <>
      {error && (
        <div className="mb-4 px-3 py-2 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
          {error}
        </div>
      )}

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
          <>
            <button
              onClick={() => acao('INICIAR_EXECUCAO')}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#0038A8', borderRadius: '4px' }}
            >
              Iniciar Execução em Campo
            </button>
            <button
              onClick={() => setShowCancelarModal(true)}
              className="px-4 py-2 text-sm border"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#DC2626' }}
            >
              Cancelar solicitação
            </button>
          </>
        )}

        {status === 'EM_EXECUCAO' && (
          <button
            onClick={() => setShowChecklistDesabModal(true)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#EA580C', borderRadius: '4px' }}
          >
            Confirmar Desabilitação
          </button>
        )}

        {status === 'DESABILITADO' && (
          <>
            <button
              onClick={() => setShowExtensaoModal(true)}
              disabled={loading}
              className="px-4 py-2 text-sm border"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#B45309' }}
            >
              Solicitar extensão
            </button>
            <button
              onClick={() => acao('INICIAR_REABILITACAO')}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#8B5CF6', borderRadius: '4px' }}
            >
              Iniciar Reabilitação
            </button>
          </>
        )}

        {status === 'EXTENSAO_EM_ANALISE' && (
          <>
            <button
              onClick={() => setShowAprovarExtensaoModal(true)}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#16A34A', borderRadius: '4px' }}
            >
              Aprovar extensão
            </button>
            <button
              onClick={() => setShowRejeitarExtensaoModal(true)}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#DC2626', borderRadius: '4px' }}
            >
              Rejeitar extensão
            </button>
          </>
        )}

        {status === 'EM_REABILITACAO' && (
          <button
            onClick={() => setShowChecklistReabModal(true)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#6366F1', borderRadius: '4px' }}
          >
            Concluir Reabilitação
          </button>
        )}

        {status === 'EM_VALIDACAO_DA_REABILITACAO' && (
          <>
            <button
              onClick={() => setShowRejeitarReabModal(true)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#DC2626', borderRadius: '4px' }}
            >
              Rejeitar reabilitação
            </button>
            <button
              onClick={() => setShowValidarReabModal(true)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#10B981', borderRadius: '4px' }}
            >
              ✓ Validar Reabilitação — Encerrar
            </button>
          </>
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
            value={motivoCancelamento}
            onChange={e => setMotivoCancelamento(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Descreva o motivo..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowCancelarModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={!motivoCancelamento.trim() || loading}
              onClick={() => {
                acao('CANCELAR', { motivo: motivoCancelamento })
                setShowCancelarModal(false)
                setMotivoCancelamento('')
              }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: motivoCancelamento.trim() ? '#DC2626' : '#94A3B8', borderRadius: '4px' }}
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
            value={comentarioAprovacao}
            onChange={e => setComentarioAprovacao(e.target.value)}
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
              onClick={() => {
                acao('APROVAR', { comentario: comentarioAprovacao })
                setShowAprovarModal(false)
                setComentarioAprovacao('')
              }}
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
            value={motivoRejeicao}
            onChange={e => setMotivoRejeicao(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Justificativa obrigatória..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowRejeitarModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={!motivoRejeicao.trim() || loading}
              onClick={() => {
                acao('REJEITAR', { motivo: motivoRejeicao })
                setShowRejeitarModal(false)
                setMotivoRejeicao('')
              }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: motivoRejeicao.trim() ? '#DC2626' : '#94A3B8', borderRadius: '4px' }}
            >
              Confirmar rejeição
            </button>
          </div>
        </Modal>
      )}

      {showChecklistDesabModal && (
        <Modal title="Checklist de Desabilitação" onClose={() => setShowChecklistDesabModal(false)}>
          <div className="space-y-3 max-h-80 overflow-auto pr-1">
            {checklistDesabVisivel.map(item => (
              <ChecklistPergunta
                key={item.numero}
                label={CHECKLIST_LABELS[item.numero]}
                value={item}
                onResposta={value => updateChecklist(setChecklistDesab, item.numero, { resposta: value })}
                onObservacao={value => updateChecklist(setChecklistDesab, item.numero, { observacao: value })}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowChecklistDesabModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={!checklistDesabCompleto || loading}
              onClick={() => {
                acao('CONFIRMAR_DESABILITACAO', {
                  checklist: checklistDesabVisivel.map(item => ({
                    numero: item.numero,
                    resposta: item.resposta,
                    observacao: item.observacao || undefined,
                  })),
                })
                setShowChecklistDesabModal(false)
              }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: checklistDesabCompleto ? '#EA580C' : '#94A3B8', borderRadius: '4px' }}
            >
              Confirmar desabilitação
            </button>
          </div>
        </Modal>
      )}

      {showChecklistReabModal && (
        <Modal title="Checklist de Reabilitação" onClose={() => setShowChecklistReabModal(false)}>
          <div className="space-y-3 max-h-80 overflow-auto pr-1">
            {checklistReab.map(item => (
              <ChecklistPergunta
                key={item.numero}
                label={CHECKLIST_REAB_LABELS[item.numero]}
                value={item}
                onResposta={value => updateChecklist(setChecklistReab, item.numero, { resposta: value })}
                onObservacao={value => updateChecklist(setChecklistReab, item.numero, { observacao: value })}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowChecklistReabModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={!checklistReabCompleto || loading}
              onClick={() => {
                acao('CONCLUIR_REABILITACAO', {
                  checklist: checklistReab.map(item => ({
                    numero: item.numero,
                    resposta: item.resposta,
                    observacao: item.observacao || undefined,
                  })),
                })
                setShowChecklistReabModal(false)
              }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: checklistReabCompleto ? '#6366F1' : '#94A3B8', borderRadius: '4px' }}
            >
              Enviar para validação
            </button>
          </div>
        </Modal>
      )}

      {showExtensaoModal && (
        <Modal title="Solicitar Extensão de Prazo" onClose={() => setShowExtensaoModal(false)}>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Novo período estimado de término *
          </label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            value={novoPeriodoFim}
            onChange={e => setNovoPeriodoFim(e.target.value)}
          />
          <label className="block text-sm font-medium mt-3 mb-1.5" style={{ color: '#374151' }}>
            Justificativa da extensão *
          </label>
          <textarea
            rows={3}
            value={justificativaExtensao}
            onChange={e => setJustificativaExtensao(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Descreva o motivo para estender o período..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowExtensaoModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={!novoPeriodoFim || !justificativaExtensao.trim() || loading}
              onClick={() => {
                acao('SOLICITAR_EXTENSAO', {
                  novoPeriodoFim,
                  justificativa: justificativaExtensao,
                })
                setShowExtensaoModal(false)
                setNovoPeriodoFim('')
                setJustificativaExtensao('')
              }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: novoPeriodoFim && justificativaExtensao.trim() ? '#D97706' : '#94A3B8', borderRadius: '4px' }}
            >
              Enviar extensão
            </button>
          </div>
        </Modal>
      )}

      {showAprovarExtensaoModal && (
        <Modal title="Aprovar Extensão" onClose={() => setShowAprovarExtensaoModal(false)}>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Comentário (opcional)
          </label>
          <textarea
            rows={2}
            value={comentarioAprovacaoExtensao}
            onChange={e => setComentarioAprovacaoExtensao(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Comentário para aprovação da extensão..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowAprovarExtensaoModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={loading}
              onClick={() => {
                acao('APROVAR_EXTENSAO', { comentario: comentarioAprovacaoExtensao })
                setShowAprovarExtensaoModal(false)
                setComentarioAprovacaoExtensao('')
              }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#16A34A', borderRadius: '4px' }}
            >
              Confirmar aprovação
            </button>
          </div>
        </Modal>
      )}

      {showRejeitarExtensaoModal && (
        <Modal title="Rejeitar Extensão" onClose={() => setShowRejeitarExtensaoModal(false)}>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Motivo da rejeição *
          </label>
          <textarea
            rows={3}
            value={motivoRejeicaoExtensao}
            onChange={e => setMotivoRejeicaoExtensao(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Justificativa obrigatória..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowRejeitarExtensaoModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={!motivoRejeicaoExtensao.trim() || loading}
              onClick={() => {
                acao('REJEITAR_EXTENSAO', { motivo: motivoRejeicaoExtensao })
                setShowRejeitarExtensaoModal(false)
                setMotivoRejeicaoExtensao('')
              }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: motivoRejeicaoExtensao.trim() ? '#DC2626' : '#94A3B8', borderRadius: '4px' }}
            >
              Confirmar rejeição
            </button>
          </div>
        </Modal>
      )}

      {showValidarReabModal && (
        <Modal title="Validar Reabilitação" onClose={() => setShowValidarReabModal(false)}>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Comentário de validação (opcional)
          </label>
          <textarea
            rows={2}
            value={comentarioValidacaoReab}
            onChange={e => setComentarioValidacaoReab(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Registro opcional da validação..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowValidarReabModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={loading}
              onClick={() => {
                acao('VALIDAR_REABILITACAO', { comentario: comentarioValidacaoReab })
                setShowValidarReabModal(false)
                setComentarioValidacaoReab('')
              }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#10B981', borderRadius: '4px' }}
            >
              Confirmar validação
            </button>
          </div>
        </Modal>
      )}

      {showRejeitarReabModal && (
        <Modal title="Rejeitar Reabilitação" onClose={() => setShowRejeitarReabModal(false)}>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Motivo da rejeição *
          </label>
          <textarea
            rows={3}
            value={motivoRejeicaoReab}
            onChange={e => setMotivoRejeicaoReab(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Justificativa obrigatória..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowRejeitarReabModal(false)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Voltar
            </button>
            <button
              disabled={!motivoRejeicaoReab.trim() || loading}
              onClick={() => {
                acao('REJEITAR_REABILITACAO', { motivo: motivoRejeicaoReab })
                setShowRejeitarReabModal(false)
                setMotivoRejeicaoReab('')
              }}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: motivoRejeicaoReab.trim() ? '#DC2626' : '#94A3B8', borderRadius: '4px' }}
            >
              Confirmar rejeição
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function ChecklistPergunta({
  label,
  value,
  onResposta,
  onObservacao,
}: {
  label: string
  value: ChecklistResposta
  onResposta: (value: 'SIM' | 'NA') => void
  onObservacao: (value: string) => void
}) {
  return (
    <div className="border p-3" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
      <p className="text-xs font-medium mb-2" style={{ color: '#374151' }}>
        {value.numero}. {label}
      </p>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => onResposta('SIM')}
          className="px-3 py-1 text-xs border"
          style={{
            borderColor: value.resposta === 'SIM' ? '#16A34A' : '#E2E8F0',
            background: value.resposta === 'SIM' ? '#DCFCE7' : 'white',
            color: value.resposta === 'SIM' ? '#166534' : '#475569',
            borderRadius: '4px',
          }}
        >
          SIM
        </button>
        <button
          type="button"
          onClick={() => onResposta('NA')}
          className="px-3 py-1 text-xs border"
          style={{
            borderColor: value.resposta === 'NA' ? '#64748B' : '#E2E8F0',
            background: value.resposta === 'NA' ? '#F1F5F9' : 'white',
            color: value.resposta === 'NA' ? '#334155' : '#475569',
            borderRadius: '4px',
          }}
        >
          N.A.
        </button>
      </div>
      <input
        className="w-full px-2 py-1.5 border text-xs outline-none"
        style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
        placeholder="Observação (opcional)"
        value={value.observacao}
        onChange={e => onObservacao(e.target.value)}
      />
    </div>
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
