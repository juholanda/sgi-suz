'use client'

import type { StatusSolicitacao } from '@/lib/tokens'

interface WorkflowStepperProps {
  status: string
}

interface Step {
  label: string
  icon: string
}

const STEPS: Step[] = [
  { label: 'Rascunho', icon: 'edit_note' },
  { label: 'Aprovacao', icon: 'approval' },
  { label: 'Execucao', icon: 'engineering' },
  { label: 'Desabilitado', icon: 'lock_open' },
  { label: 'Reabilitacao', icon: 'replay' },
  { label: 'Validacao', icon: 'verified' },
  { label: 'Encerrada', icon: 'check_circle' },
]

function getStepIndex(status: string): number {
  switch (status as StatusSolicitacao) {
    case 'RASCUNHO':
      return 0
    case 'EM_APROVACAO':
      return 1
    case 'EXECUCAO_AUTORIZADA':
    case 'EM_EXECUCAO':
      return 2
    case 'DESABILITADO':
    case 'EXTENSAO_EM_ANALISE':
      return 3
    case 'EM_REABILITACAO':
      return 4
    case 'EM_VALIDACAO_DA_REABILITACAO':
      return 5
    case 'ENCERRADA':
      return 6
    case 'REJEITADA':
      return 1
    case 'CANCELADA':
      return -1 // special handling
    default:
      return 0
  }
}

export default function WorkflowStepper({ status }: WorkflowStepperProps) {
  const isRejeitada = status === 'REJEITADA'
  const isCancelada = status === 'CANCELADA'
  const currentIndex = getStepIndex(status)

  const CIRCLE_SIZE = 24
  const ICON_SIZE = 12

  const colors = {
    completed: '#0038A8',
    current: '#0038A8',
    future: '#E2E8F0',
    rejected: '#DC2626',
    cancelled: '#94A3B8',
    labelDefault: '#475569',
    labelMuted: '#94A3B8',
  }

  function getCircleStyle(index: number): React.CSSProperties {
    const base: React.CSSProperties = {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      position: 'relative',
      transition: 'all 200ms',
    }

    // Rejected: step 1 is red
    if (isRejeitada && index === 1) {
      return {
        ...base,
        backgroundColor: colors.rejected,
        border: `2px solid ${colors.rejected}`,
      }
    }

    // Cancelled: current step is gray
    if (isCancelada) {
      if (index === 0) {
        return {
          ...base,
          backgroundColor: colors.cancelled,
          border: `2px solid ${colors.cancelled}`,
        }
      }
      return {
        ...base,
        backgroundColor: 'transparent',
        border: `2px solid ${colors.future}`,
      }
    }

    // Completed steps
    if (index < currentIndex) {
      return {
        ...base,
        backgroundColor: colors.completed,
        border: `2px solid ${colors.completed}`,
      }
    }

    // Current step with pulse ring effect
    if (index === currentIndex) {
      return {
        ...base,
        backgroundColor: colors.current,
        border: `2px solid ${colors.current}`,
        boxShadow: `0 0 0 3px rgba(0, 56, 168, 0.2)`,
      }
    }

    // Future steps
    return {
      ...base,
      backgroundColor: 'transparent',
      border: `2px solid ${colors.future}`,
    }
  }

  function getLineStyle(index: number): React.CSSProperties {
    const base: React.CSSProperties = {
      flex: 1,
      height: 2,
      minWidth: 8,
      transition: 'background-color 200ms',
    }

    if (isRejeitada) {
      if (index < 1) {
        return { ...base, backgroundColor: colors.rejected }
      }
      return { ...base, backgroundColor: colors.future }
    }

    if (isCancelada) {
      return { ...base, backgroundColor: colors.future }
    }

    if (index < currentIndex) {
      return { ...base, backgroundColor: colors.completed }
    }

    return { ...base, backgroundColor: colors.future }
  }

  function getIconColor(index: number): string {
    if (isRejeitada && index === 1) return '#FFFFFF'
    if (isCancelada && index === 0) return '#FFFFFF'
    if (index <= currentIndex && !isCancelada) return '#FFFFFF'
    return colors.labelMuted
  }

  function getLabelColor(index: number): string {
    if (isRejeitada && index === 1) return colors.rejected
    if (isCancelada && index === 0) return colors.cancelled
    if (index <= currentIndex && !isCancelada) return colors.labelDefault
    return colors.labelMuted
  }

  return (
    <div
      style={{
        width: '100%',
        padding: '8px 0',
      }}
    >
      {/* Steps row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {STEPS.map((step, index) => (
          <div
            key={step.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: index < STEPS.length - 1 ? 1 : 'none',
            }}
          >
            {/* Step circle + label column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                position: 'relative',
              }}
            >
              {/* Circle with icon */}
              <div style={getCircleStyle(index)}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: ICON_SIZE,
                    color: getIconColor(index),
                    lineHeight: 1,
                  }}
                >
                  {step.icon}
                </span>
              </div>

              {/* Label — hidden on mobile */}
              <span
                className="hidden md:block"
                style={{
                  fontSize: 10,
                  color: getLabelColor(index),
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: index === currentIndex && !isCancelada ? 600 : 400,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div style={getLineStyle(index)} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
