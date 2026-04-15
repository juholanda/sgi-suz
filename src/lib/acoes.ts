/**
 * acoes.ts — Centralized Action Matrix
 *
 * SOURCE OF TRUTH for which actions a user can perform on a Solicitação.
 * Runs server-side; result is serialized to the client component.
 *
 * Rules:
 *  - Both APROVAR and REJEITAR always require a confirmation modal.
 *  - Conflict of interest: user cannot approve their own solicitação
 *    or one where they are the executante.
 *  - Destructive actions (cancel, reject) always secondary with confirmation.
 *  - At most 1 primary + rest secondary/danger.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type AcaoVariant = 'primary' | 'secondary' | 'danger'

export interface Acao {
  id: string
  label: string
  icon: string
  variant: AcaoVariant
  requiresConfirmation: boolean
  requiresJustificativa: boolean
  confirmTitle?: string
  confirmDescription?: string
}

export interface ConflictInfo {
  hasConflict: boolean
  message: string | null
}

// ─── Conflict of interest ────────────────────────────────────────────────────

function checkConflict(
  userId: string,
  solicitanteId: string,
  executanteId: string | null,
): ConflictInfo {
  if (userId === solicitanteId) {
    return {
      hasConflict: true,
      message: 'Você é o solicitante desta solicitação e não pode aprová-la.',
    }
  }
  if (executanteId && userId === executanteId) {
    return {
      hasConflict: true,
      message: 'Você é o executante desta solicitação e não pode aprová-la.',
    }
  }
  return { hasConflict: false, message: null }
}

// ─── Main function ───────────────────────────────────────────────────────────

export function getAcoesPermitidas(opts: {
  status: string
  perfis: string[]
  userId: string
  solicitanteId: string
  executanteId: string | null
  aprovacoes: Array<{ aprovadorId: string; status: string; tipo: string; nivel: number }>
  hasExtensaoPendente?: boolean
}): { acoes: Acao[]; conflict: ConflictInfo | null } {
  const { status, perfis, userId, solicitanteId, executanteId, aprovacoes, hasExtensaoPendente } = opts
  const acoes: Acao[] = []

  const isSolicitante = userId === solicitanteId
  const isExecutante  = executanteId !== null && userId === executanteId
  const isAdmin       = perfis.includes('ADMINISTRADOR')
  const isGestorSms   = perfis.includes('GESTOR_SMS')

  // Approval-related checks
  const minhaAprovPendente = aprovacoes.find(
    a => a.aprovadorId === userId && a.status === 'PENDENTE' && a.tipo === 'DESABILITACAO',
  )
  const fuiAprovador = aprovacoes.some(
    a => a.aprovadorId === userId && a.tipo === 'DESABILITACAO',
  )
  const conflict = (minhaAprovPendente || fuiAprovador)
    ? checkConflict(userId, solicitanteId, executanteId)
    : null

  // ─── SOLICITANTE actions ─────────────────────────────────────────────
  if (isSolicitante || isAdmin) {
    if (status === 'RASCUNHO') {
      acoes.push({
        id: 'ENVIAR_APROVACAO',
        label: 'Enviar para aprovação',
        icon: 'send',
        variant: 'primary',
        requiresConfirmation: true,
        requiresJustificativa: false,
        confirmTitle: 'Enviar para aprovação?',
        confirmDescription: 'A solicitação será enviada para a cadeia de aprovação. Você não poderá editá-la enquanto estiver em análise.',
      })
      acoes.push({
        id: 'DESCARTAR',
        label: 'Descartar rascunho',
        icon: 'delete',
        variant: 'danger',
        requiresConfirmation: true,
        requiresJustificativa: false,
        confirmTitle: 'Descartar rascunho?',
        confirmDescription: 'Esta ação não pode ser desfeita.',
      })
    }

    if (['EM_APROVACAO', 'EXECUCAO_AUTORIZADA'].includes(status)) {
      acoes.push({
        id: 'CANCELAR',
        label: 'Cancelar solicitação',
        icon: 'cancel',
        variant: 'danger',
        requiresConfirmation: true,
        requiresJustificativa: true,
        confirmTitle: 'Cancelar solicitação?',
        confirmDescription: 'Informe o motivo do cancelamento.',
      })
    }

    if (status === 'DESABILITADO' && !hasExtensaoPendente) {
      acoes.push({
        id: 'SOLICITAR_EXTENSAO',
        label: 'Solicitar extensão de prazo',
        icon: 'event',
        variant: 'secondary',
        requiresConfirmation: true,
        requiresJustificativa: true,
        confirmTitle: 'Solicitar extensão?',
        confirmDescription: 'Informe a nova data e justificativa.',
      })
    }

    if (['REJEITADA', 'CANCELADA'].includes(status)) {
      acoes.push({
        id: 'CLONAR',
        label: status === 'REJEITADA' ? 'Clonar e corrigir' : 'Clonar como nova',
        icon: 'content_copy',
        variant: 'secondary',
        requiresConfirmation: false,
        requiresJustificativa: false,
      })
    }
  }

  // ─── EXECUTANTE actions ──────────────────────────────────────────────
  if (isExecutante || isSolicitante || isAdmin) {
    if (status === 'EXECUCAO_AUTORIZADA') {
      acoes.push({
        id: 'INICIAR_EXECUCAO',
        label: 'Iniciar execução',
        icon: 'play_arrow',
        variant: 'primary',
        requiresConfirmation: true,
        requiresJustificativa: false,
        confirmTitle: 'Iniciar execução?',
        confirmDescription: 'Confirma o início da execução de campo para desabilitação do intertravamento.',
      })
    }

    if (status === 'EM_EXECUCAO') {
      acoes.push({
        id: 'CONFIRMAR_DESABILITACAO',
        label: 'Confirmar desabilitação',
        icon: 'check_circle',
        variant: 'primary',
        requiresConfirmation: true,
        requiresJustificativa: false,
        confirmTitle: 'Confirmar desabilitação?',
        confirmDescription: 'Preencha o checklist de campo e confirme a desabilitação.',
      })
    }

    if (status === 'DESABILITADO') {
      acoes.push({
        id: 'INICIAR_REABILITACAO',
        label: 'Iniciar reabilitação',
        icon: 'replay',
        variant: 'primary',
        requiresConfirmation: true,
        requiresJustificativa: false,
        confirmTitle: 'Iniciar reabilitação?',
        confirmDescription: 'Confirma o início do processo de reabilitação do intertravamento.',
      })
    }

    if (status === 'EM_REABILITACAO') {
      acoes.push({
        id: 'CONCLUIR_REABILITACAO',
        label: 'Enviar para validação',
        icon: 'task_alt',
        variant: 'primary',
        requiresConfirmation: true,
        requiresJustificativa: false,
        confirmTitle: 'Enviar para validação?',
        confirmDescription: 'O checklist de reabilitação será enviado para validação do aprovador.',
      })
    }
  }

  // ─── APROVADOR actions ───────────────────────────────────────────────
  // Both APROVAR and REJEITAR always open confirmation modal (user requirement)
  if (!conflict?.hasConflict) {
    if (status === 'EM_APROVACAO' && minhaAprovPendente) {
      acoes.push({
        id: 'APROVAR',
        label: 'Aprovar',
        icon: 'thumb_up',
        variant: 'primary',
        requiresConfirmation: true,
        requiresJustificativa: false,
        confirmTitle: 'Aprovar solicitação?',
        confirmDescription: 'Confirma a aprovação desta solicitação de desabilitação. Você pode adicionar um comentário opcional.',
      })
      acoes.push({
        id: 'REJEITAR',
        label: 'Rejeitar',
        icon: 'thumb_down',
        variant: 'danger',
        requiresConfirmation: true,
        requiresJustificativa: true,
        confirmTitle: 'Rejeitar solicitação?',
        confirmDescription: 'Informe o motivo da rejeição. A solicitação será devolvida ao solicitante.',
      })
    }

    if (status === 'EM_VALIDACAO_DA_REABILITACAO' && fuiAprovador) {
      acoes.push({
        id: 'VALIDAR_REABILITACAO',
        label: 'Validar e encerrar',
        icon: 'verified',
        variant: 'primary',
        requiresConfirmation: true,
        requiresJustificativa: false,
        confirmTitle: 'Validar reabilitação e encerrar?',
        confirmDescription: 'Confirma que o intertravamento foi corretamente reabilitado. A solicitação será encerrada.',
      })
      acoes.push({
        id: 'REJEITAR_REABILITACAO',
        label: 'Rejeitar reabilitação',
        icon: 'undo',
        variant: 'danger',
        requiresConfirmation: true,
        requiresJustificativa: true,
        confirmTitle: 'Rejeitar reabilitação?',
        confirmDescription: 'Informe o motivo. O intertravamento voltará ao estado Desabilitado.',
      })
    }

    if (status === 'EXTENSAO_EM_ANALISE') {
      // Only show if user is an approver for this solicitação
      const isAprovadorParaEsta = aprovacoes.some(a => a.aprovadorId === userId)
      if (isAprovadorParaEsta) {
        acoes.push({
          id: 'APROVAR_EXTENSAO',
          label: 'Aprovar extensão',
          icon: 'event_available',
          variant: 'primary',
          requiresConfirmation: true,
          requiresJustificativa: false,
          confirmTitle: 'Aprovar extensão de prazo?',
          confirmDescription: 'Confirma a aprovação da extensão de prazo solicitada.',
        })
        acoes.push({
          id: 'REJEITAR_EXTENSAO',
          label: 'Rejeitar extensão',
          icon: 'event_busy',
          variant: 'danger',
          requiresConfirmation: true,
          requiresJustificativa: true,
          confirmTitle: 'Rejeitar extensão?',
          confirmDescription: 'Informe o motivo da rejeição da extensão.',
        })
      }
    }
  }

  // ─── Export (ENCERRADA) ──────────────────────────────────────────────
  if (status === 'ENCERRADA') {
    acoes.push({
      id: 'EXPORTAR_PDF',
      label: 'Exportar formulário',
      icon: 'picture_as_pdf',
      variant: 'secondary',
      requiresConfirmation: false,
      requiresJustificativa: false,
    })
  }

  // ─── Sort: primary first, then secondary, then danger ────────────────
  const order: Record<AcaoVariant, number> = { primary: 0, secondary: 1, danger: 2 }
  acoes.sort((a, b) => order[a.variant] - order[b.variant])

  return { acoes, conflict }
}
