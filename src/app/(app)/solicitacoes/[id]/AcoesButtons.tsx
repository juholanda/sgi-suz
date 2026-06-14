'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusSolicitacao } from '@/lib/tokens'
import { ActionFooter } from '@/components/design-system/ActionFooter'
import { Checkbox } from '@/components/design-system/Checkbox'

interface ChecklistItemState {
  numero: number
  descricao: string
  resposta: 'SIM' | 'NA' | ''
  observacao: string
  hidden?: boolean // RF-054: ocultar item 3 para não-físico
}

interface Props {
  solicitacaoId: string
  status: StatusSolicitacao
  isAprovador: boolean
  isSolicitante: boolean
  isExecutante: boolean
  tipo: string | null // FISICO | LOGICO | DISPOSITIVO_SEGURANCA
  aprovacoes: { nivel: number; status: string; aprovador: { nome: string } }[]
  totalNiveis: number
  periodoFim?: Date | null
  classeMaxDias?: number | null
}

const CHECKLIST_DESABILITACAO: Omit<ChecklistItemState, 'resposta' | 'observacao'>[] = [
  { numero: 1, descricao: 'A desabilitação será feita com o equipamento em operação?' },
  { numero: 2, descricao: 'Foi estabelecida uma proteção alternativa em substituição ao intertravamento/dispositivo de segurança desabilitado?' },
  { numero: 3, descricao: 'O cartão de advertência está instalado no equipamento ou painel?' },
  { numero: 4, descricao: 'A desabilitação será em instalação elétrica?' },
]

const CHECKLIST_REABILITACAO: Omit<ChecklistItemState, 'resposta' | 'observacao'>[] = [
  { numero: 1, descricao: 'Todos os dispositivos de bloqueio/sinalização foram removidos?' }, // note about cartão added in render for FISICO
  { numero: 2, descricao: 'Foram verificadas as condições de funcionamento do intertravamento/dispositivo de segurança?' },
]

export default function AcoesButtons({
  solicitacaoId, status, isAprovador, isSolicitante, isExecutante, tipo, aprovacoes, totalNiveis,
  periodoFim, classeMaxDias,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [comentario, setComentario] = useState('')
  const [novaDataFim, setNovaDataFim] = useState('')
  const [justificativaExtensao, setJustificativaExtensao] = useState('')
  const [confirmacaoValidacao, setConfirmacaoValidacao] = useState(false)

  // Checklist de desabilitação — RF-053, RF-054
  const [checklistDesab, setChecklistDesab] = useState<ChecklistItemState[]>(
    CHECKLIST_DESABILITACAO.map(item => ({
      ...item,
      resposta: '',
      observacao: '',
      hidden: item.numero === 3 && tipo !== 'FISICO', // RF-054
    }))
  )

  // Checklist de reabilitação — RF-074, RF-075
  const [checklistReab, setChecklistReab] = useState<ChecklistItemState[]>(
    CHECKLIST_REABILITACAO.map(item => ({
      ...item,
      resposta: '',
      observacao: '',
    }))
  )

  function updateChecklist(
    setter: typeof setChecklistDesab,
    index: number,
    field: 'resposta' | 'observacao',
    value: string
  ) {
    setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function checklistValido(items: ChecklistItemState[]) {
    return items.every(item => item.hidden || item.resposta !== '')
  }

  async function acao(tipo_acao: string, body?: object) {
    setLoading(true)
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/acoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipo_acao, ...body }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Erro ao executar ação')
        return
      }
      setModal(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Progresso de aprovações — RF-035
  const aprovDesab = aprovacoes.filter(a => ['PENDENTE', 'APROVADO', 'AGUARDANDO'].includes(a.status))
  const aprovadas = aprovacoes.filter(a => a.status === 'APROVADO').length
  const hasMinhaAprovPendente = aprovacoes.some(a => a.status === 'PENDENTE')

  const canAprovar = isAprovador && status === 'EM_APROVACAO' && hasMinhaAprovPendente
  const canValidarReab = isAprovador && status === 'EM_VALIDACAO_DA_REABILITACAO'
  // Merged: canExecutar replaces canIniciarExec + canConfirmarDesab — opens CHECKLIST_DESAB modal directly
  const canExecutar = (isSolicitante || isExecutante) && status === 'EXECUCAO_AUTORIZADA'
  // Spec: Executante (and Solicitante) can initiate rehabilitation when DESABILITADO
  const canIniciarReab = (isSolicitante || isExecutante) && status === 'DESABILITADO'
  const canCancelar = isSolicitante && ['RASCUNHO', 'EM_APROVACAO', 'EXECUCAO_AUTORIZADA'].includes(status)
  const canSolicitarExtensao = isSolicitante && status === 'DESABILITADO'
  // Spec: Solicitante can clone from REJEITADA/CANCELADA
  const canClonar = isSolicitante && ['REJEITADA', 'CANCELADA'].includes(status)
  const canExportarPdf = status === 'ENCERRADA'

  const hasAcoes = canAprovar || canValidarReab || canExecutar ||
    canIniciarReab || canCancelar || canSolicitarExtensao || canClonar || canExportarPdf

  if (!hasAcoes) return null

  return (
    <>
      {/* Progresso de aprovação — RF-035 */}
      {status === 'EM_APROVACAO' && totalNiveis > 0 && (
        <div className="px-4 md:px-6 pb-2 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2 px-4 py-2.5 text-sm" style={{ background: '#DBEAFE', borderRadius: '4px', color: '#1D4ED8' }}>
            <span className="font-medium">{aprovadas} de {totalNiveis} aprovadores concluíram</span>
            <div className="flex gap-1 ml-2">
              {Array.from({ length: totalNiveis }, (_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: i < aprovadas ? '#16A34A' : '#BFDBFE' }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <ActionFooter>

        {/* Aprovar */}
        {canAprovar && (
          <>
            <button
              onClick={() => setModal('APROVAR')}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#16A34A', borderRadius: '4px' }}
            >
              ✓ Aprovar
            </button>
            <button
              onClick={() => setModal('REJEITAR')}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#DC2626', borderRadius: '4px' }}
            >
              ✕ Rejeitar
            </button>
          </>
        )}

        {/* Validar reabilitação — RF-081 */}
        {canValidarReab && (
          <>
            <button
              onClick={() => setModal('VALIDAR_REABILITACAO')}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#10B981', borderRadius: '4px' }}
            >
              ✓ Validar e Encerrar
            </button>
            <button
              onClick={() => setModal('REJEITAR_REABILITACAO')}
              className="px-4 py-2 text-sm font-medium"
              style={{ borderRadius: '4px', border: '1px solid #DC2626', color: '#DC2626' }}
            >
              Devolver — Corrigir
            </button>
          </>
        )}

        {/* Execução — abre checklist diretamente (sem estado intermediário EM_EXECUCAO) */}
        {canExecutar && (
          <button
            onClick={() => setModal('CHECKLIST_DESAB')}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#0038A8', borderRadius: '4px' }}
          >
            Iniciar Execução em Campo
          </button>
        )}

        {/* Iniciar reabilitação — abre checklist diretamente (sem estado intermediário EM_REABILITACAO) */}
        {canIniciarReab && (
          <button
            onClick={() => setModal('CHECKLIST_REAB')}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#0D9488', borderRadius: '4px' }}
          >
            Iniciar Reabilitação
          </button>
        )}

        {/* Solicitar Extensão */}
        {canSolicitarExtensao && (
          <button
            onClick={() => setModal('SOLICITAR_EXTENSAO')}
            className="px-4 py-2 text-sm font-medium"
            style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '4px', border: '1px solid #FDE68A' }}
          >
            Solicitar Extensão
          </button>
        )}

        {/* Cancelar */}
        {canCancelar && (
          <button
            onClick={() => setModal('CANCELAR')}
            className="px-4 py-2 text-sm border"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#DC2626' }}
          >
            Cancelar solicitação
          </button>
        )}

        {/* Clonar como nova solicitação — spec: Solicitante can clone from REJEITADA/CANCELADA */}
        {canClonar && (
          <button
            onClick={() => router.push(`/solicitacoes/nova?clonar=${solicitacaoId}`)}
            className="px-4 py-2 text-sm font-medium"
            style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px', border: '1px solid #BFD0F0' }}
          >
            Clonar como nova solicitação
          </button>
        )}

        {/* Exportar PDF — when ENCERRADA */}
        {canExportarPdf && (
          <a
            href={`/api/solicitacoes/${solicitacaoId}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            style={{ background: '#F1F5F9', color: '#475569', borderRadius: '4px', border: '1px solid #E2E8F0' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>picture_as_pdf</span>
            Exportar formulário digital (PDF)
          </a>
        )}
      </ActionFooter>

      {/* ── Modal: Checklist Desabilitação ─── RF-053, RF-054, RF-056 */}
      {modal === 'CHECKLIST_DESAB' && (
        <Modal title="Checklist de Execução em Campo" onClose={() => setModal(null)} wide>
          <div className="px-3 py-2 text-sm mb-4" style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '4px', border: '1px solid #FDE68A' }}>
            Leia atentamente cada item antes de responder. Todos os itens são obrigatórios. N.A. deve ser justificado.
          </div>
          <div className="space-y-4">
            {checklistDesab.map((item, i) => {
              if (item.hidden) return null
              return (
                <div key={item.numero} className="border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 shrink-0"
                      style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}
                    >
                      {item.numero}
                    </span>
                    <p className="text-sm" style={{ color: '#374151' }}>{item.descricao}</p>
                  </div>
                  <div className="flex gap-3 ml-8">
                    {(['SIM', 'NA'] as const).map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`desab-${item.numero}`}
                          value={opt}
                          checked={item.resposta === opt}
                          onChange={() => updateChecklist(setChecklistDesab, i, 'resposta', opt)}
                          style={{ accentColor: '#0038A8' }}
                        />
                        <span className="text-sm font-medium" style={{ color: opt === 'SIM' ? '#16A34A' : '#6B7280' }}>
                          {opt === 'NA' ? 'N.A.' : 'SIM'}
                        </span>
                      </label>
                    ))}
                  </div>
                  {/* Justificativa obrigatória para N.A. */}
                  {item.resposta === 'NA' && (
                    <div className="ml-8 mt-2">
                      <input
                        className="w-full px-3 py-1.5 text-sm border outline-none"
                        style={{ borderColor: '#EAB308', borderRadius: '4px' }}
                        placeholder="Justificativa obrigatória para N.A. *"
                        value={item.observacao}
                        onChange={e => updateChecklist(setChecklistDesab, i, 'observacao', e.target.value)}
                      />
                    </div>
                  )}
                  {/* Indicador de pendente */}
                  {item.resposta === '' && (
                    <p className="ml-8 mt-1 text-xs" style={{ color: '#EF4444' }}>Item obrigatório — RF-055</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Valida N.A. sem justificativa */}
          {checklistDesab.some(i => !i.hidden && i.resposta === 'NA' && !i.observacao.trim()) && (
            <div className="mt-3 px-3 py-2 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
              Itens marcados N.A. exigem justificativa.
            </div>
          )}

          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Cancelar
            </button>
            <button
              disabled={
                !checklistValido(checklistDesab) ||
                checklistDesab.some(i => !i.hidden && i.resposta === 'NA' && !i.observacao.trim()) ||
                loading
              }
              onClick={() => acao('CONFIRMAR_DESABILITACAO', {
                checklistItems: checklistDesab.filter(i => !i.hidden).map(i => ({
                  numero: i.numero,
                  descricao: i.descricao,
                  resposta: i.resposta,
                  observacao: i.observacao || undefined,
                })),
              })}
              className="px-5 py-2 text-sm font-medium text-white"
              style={{
                background: (checklistValido(checklistDesab) && !checklistDesab.some(i => !i.hidden && i.resposta === 'NA' && !i.observacao.trim()))
                  ? '#EA580C' : '#94A3B8',
                borderRadius: '4px',
                cursor: checklistValido(checklistDesab) ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Confirmando...' : 'Confirmar Desabilitação'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Checklist Reabilitação ─── RF-074, RF-075, RF-077 */}
      {modal === 'CHECKLIST_REAB' && (
        <Modal title="Checklist de Reabilitação" onClose={() => setModal(null)} wide>
          <div className="px-3 py-2 text-sm mb-4" style={{ background: '#CCFBF1', color: '#0F766E', borderRadius: '4px' }}>
            Confirme cada item antes de concluir a reabilitação. Todos os itens são obrigatórios.
          </div>
          <div className="space-y-4">
            {checklistReab.map((item, i) => (
              <div key={item.numero} className="border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 shrink-0"
                    style={{ background: '#CCFBF1', color: '#0F766E', borderRadius: '4px' }}
                  >
                    {item.numero}
                  </span>
                  <p className="text-sm" style={{ color: '#374151' }}>
                    {item.numero === 1 && tipo === 'FISICO'
                      ? `${item.descricao} (incluindo cartão de advertência)`  // RF-075
                      : item.descricao}
                  </p>
                </div>
                <div className="flex gap-3 ml-8">
                  {(['SIM', 'NA'] as const).map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`reab-${item.numero}`}
                        value={opt}
                        checked={item.resposta === opt}
                        onChange={() => updateChecklist(setChecklistReab, i, 'resposta', opt)}
                        style={{ accentColor: '#0D9488' }}
                      />
                      <span className="text-sm font-medium" style={{ color: opt === 'SIM' ? '#16A34A' : '#6B7280' }}>
                        {opt === 'NA' ? 'N.A.' : 'SIM'}
                      </span>
                    </label>
                  ))}
                </div>
                {item.resposta === 'NA' && (
                  <div className="ml-8 mt-2">
                    <input
                      className="w-full px-3 py-1.5 text-sm border outline-none"
                      style={{ borderColor: '#EAB308', borderRadius: '4px' }}
                      placeholder="Justificativa para N.A. *"
                      value={item.observacao}
                      onChange={e => updateChecklist(setChecklistReab, i, 'observacao', e.target.value)}
                    />
                  </div>
                )}
                {item.resposta === '' && (
                  <p className="ml-8 mt-1 text-xs" style={{ color: '#EF4444' }}>Item obrigatório</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
              Cancelar
            </button>
            <button
              disabled={!checklistValido(checklistReab) || checklistReab.some(i => i.resposta === 'NA' && !i.observacao.trim()) || loading}
              onClick={() => acao('INICIAR_REABILITACAO_COMPLETA', {
                checklistItems: checklistReab.map(i => ({
                  numero: i.numero,
                  descricao: i.descricao,
                  resposta: i.resposta,
                  observacao: i.observacao || undefined,
                })),
              })}
              className="px-5 py-2 text-sm font-medium text-white"
              style={{
                background: (checklistValido(checklistReab) && !checklistReab.some(i => i.resposta === 'NA' && !i.observacao.trim()))
                  ? '#0D9488' : '#94A3B8',
                borderRadius: '4px',
              }}
            >
              {loading ? 'Confirmando...' : 'Concluir Reabilitação'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Validar reabilitação — RF-081 */}
      {modal === 'VALIDAR_REABILITACAO' && (
        <Modal title="Validar e Encerrar Solicitação" onClose={() => { setModal(null); setConfirmacaoValidacao(false) }}>
          <div className="mb-3 px-3 py-2 text-sm" style={{ background: '#D1FAE5', color: '#065F46', borderRadius: '4px' }}>
            Ao validar, a solicitação será encerrada de forma permanente e imutável (RF-085).
          </div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Comentário (opcional)</label>
          <textarea
            rows={2}
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
          />
          {/* Confirmação digital — RF-081 */}
          <div className="mt-4">
            <Checkbox
              checked={confirmacaoValidacao}
              onCheckedChange={setConfirmacaoValidacao}
              label={
                <span className="text-sm" style={{ color: '#374151' }}>
                  <strong>Confirmo minha identidade e valido digitalmente</strong> a reabilitação deste intertravamento.
                </span>
              }
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => { setModal(null); setConfirmacaoValidacao(false) }}
              className="px-4 py-2 text-sm border"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
            >
              Voltar
            </button>
            <button
              disabled={!confirmacaoValidacao || loading}
              onClick={() => acao('VALIDAR_REABILITACAO', { comentario })}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: confirmacaoValidacao && !loading ? '#10B981' : '#94A3B8', borderRadius: '4px' }}
            >
              {loading ? 'Validando...' : 'Validar e Encerrar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Devolver reabilitação — RF-082 */}
      {modal === 'REJEITAR_REABILITACAO' && (
        <Modal title="Devolver Reabilitação" onClose={() => setModal(null)}>
          <div className="mb-3 px-3 py-2 text-sm" style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '4px' }}>
            O executante receberá o motivo e deverá corrigir e reenviar.
          </div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Motivo da devolução *</label>
          <textarea
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Justificativa obrigatória..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>Voltar</button>
            <button
              disabled={!motivo.trim() || loading}
              onClick={() => acao('REJEITAR_REABILITACAO', { motivo })}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: motivo.trim() ? '#DC2626' : '#94A3B8', borderRadius: '4px' }}
            >
              Confirmar Devolução
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Cancelar */}
      {modal === 'CANCELAR' && (
        <Modal title="Cancelar Solicitação" onClose={() => setModal(null)}>
          <div className="mb-4 px-3 py-2 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
            Esta ação não pode ser desfeita. Os aprovadores já notificados serão avisados.
          </div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Motivo do cancelamento *</label>
          <textarea
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Descreva o motivo..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>Voltar</button>
            <button
              disabled={!motivo.trim() || loading}
              onClick={() => acao('CANCELAR', { motivo })}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: motivo.trim() ? '#DC2626' : '#94A3B8', borderRadius: '4px' }}
            >
              Confirmar cancelamento
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Solicitar Extensão */}
      {modal === 'SOLICITAR_EXTENSAO' && (
        <Modal title="Solicitar Extensão de Prazo" onClose={() => setModal(null)}>
          {/* Info: período original e SLA máximo */}
          <div className="mb-4 px-3 py-2.5 text-sm" style={{ background: '#F8FAFC', color: '#374151', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1, color: '#94A3B8' }}>event</span>
              <span><strong>Fim original:</strong> {periodoFim ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(periodoFim)) : '—'}</span>
            </div>
            {classeMaxDias && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1, color: '#94A3B8' }}>timer</span>
                <span><strong>Prazo máximo da classe:</strong> {classeMaxDias} dia(s)</span>
              </div>
            )}
          </div>

          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Nova data fim *
          </label>
          <input
            type="datetime-local"
            value={novaDataFim}
            onChange={e => setNovaDataFim(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none mb-4"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
          />

          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Justificativa *
          </label>
          <textarea
            rows={3}
            value={justificativaExtensao}
            onChange={e => setJustificativaExtensao(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Descreva o motivo da extensão solicitada..."
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setModal(null)}
              className="px-4 py-2 text-sm border"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
            >
              Voltar
            </button>
            <button
              disabled={!novaDataFim || !justificativaExtensao.trim() || loading}
              onClick={() => acao('SOLICITAR_EXTENSAO', { novaDataFim: new Date(novaDataFim).toISOString(), justificativa: justificativaExtensao })}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{
                background: (novaDataFim && justificativaExtensao.trim()) ? '#D97706' : '#94A3B8',
                borderRadius: '4px',
              }}
            >
              {loading ? 'Enviando...' : 'Solicitar Extensão'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Aprovar */}
      {modal === 'APROVAR' && (
        <Modal title="Confirmar Aprovação" onClose={() => setModal(null)}>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Comentário (opcional)</label>
          <textarea
            rows={2}
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Comentário opcional..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>Voltar</button>
            <button
              disabled={loading}
              onClick={() => acao('APROVAR', { comentario })}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#16A34A', borderRadius: '4px' }}
            >
              Confirmar aprovação
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Rejeitar */}
      {modal === 'REJEITAR' && (
        <Modal title="Rejeitar Solicitação" onClose={() => setModal(null)}>
          <div className="mb-3 px-3 py-2 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
            O solicitante será notificado. A solicitação não poderá ser reativada — será necessário criar uma nova.
          </div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Motivo da rejeição *</label>
          <textarea
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full px-3 py-2 border text-sm outline-none"
            style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            placeholder="Justificativa obrigatória..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>Voltar</button>
            <button
              disabled={!motivo.trim() || loading}
              onClick={() => acao('REJEITAR', { motivo })}
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

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full my-4 p-6" style={{ borderRadius: '16px', maxWidth: wide ? '640px' : '480px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} className="text-sm" style={{ color: '#94A3B8' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
