'use client'

import { differenceInDays, format } from 'date-fns'

interface PrazoCardProps {
  status: string
  periodoInicio?: Date | string | null
  periodoFim?: Date | string | null
  dataEnvio?: Date | string | null
  dataDesabilitacao?: Date | string | null
  dataAprovacaoFinal?: Date | string | null
  prazoMaximoDias?: number | null
  prazoPrevitoAtingido: boolean
  prazoMaximoAtingido: boolean
  createdAt: Date | string
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

function formatDate(d: Date): string {
  return format(d, 'dd/MM/yyyy')
}

function formatShort(d: Date): string {
  return format(d, 'dd/MM')
}

/** Semaforo dot color */
type SemaforoColor = 'green' | 'yellow' | 'red'

function getSemaforoHex(color: SemaforoColor): string {
  switch (color) {
    case 'green':
      return '#16A34A'
    case 'yellow':
      return '#D97706'
    case 'red':
      return '#DC2626'
  }
}

function SemaforoDot({ color }: { color: SemaforoColor }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: getSemaforoHex(color),
        flexShrink: 0,
      }}
    />
  )
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  fontFamily: 'Inter, sans-serif',
}

const leftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
}

const iconStyle: React.CSSProperties = {
  fontSize: 18,
  color: '#475569',
  flexShrink: 0,
}

const textPrimaryStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#0F172A',
  lineHeight: 1.4,
}

const textSecondaryStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#475569',
  lineHeight: 1.4,
}

export default function PrazoCard(props: PrazoCardProps) {
  const {
    status,
    periodoInicio,
    periodoFim,
    dataEnvio,
    dataDesabilitacao,
    dataAprovacaoFinal,
    prazoMaximoDias,
    prazoPrevitoAtingido,
    prazoMaximoAtingido,
    createdAt,
  } = props

  const now = new Date()

  // Don't render for terminal statuses
  if (['ENCERRADA', 'REJEITADA', 'CANCELADA'].includes(status)) {
    return null
  }

  // RASCUNHO
  if (status === 'RASCUNHO') {
    const created = toDate(createdAt)!
    return (
      <div style={cardStyle}>
        <div style={leftStyle}>
          <span className="material-symbols-outlined" style={iconStyle}>
            draft
          </span>
          <span style={textPrimaryStyle}>
            Rascunho criado em {formatShort(created)}
          </span>
        </div>
      </div>
    )
  }

  // EM_APROVACAO
  if (status === 'EM_APROVACAO') {
    const ref = toDate(dataEnvio) ?? toDate(createdAt)!
    const dias = differenceInDays(now, ref)
    const semaforo: SemaforoColor = dias > 5 ? 'red' : dias >= 3 ? 'yellow' : 'green'

    return (
      <div style={cardStyle}>
        <div style={leftStyle}>
          <span className="material-symbols-outlined" style={iconStyle}>
            schedule
          </span>
          <span style={textPrimaryStyle}>
            Em aprovacao ha {dias} dia{dias !== 1 ? 's' : ''}
          </span>
        </div>
        <SemaforoDot color={semaforo} />
      </div>
    )
  }

  // EXECUCAO_AUTORIZADA
  if (status === 'EXECUCAO_AUTORIZADA') {
    const fim = toDate(periodoFim)
    if (fim) {
      const diasRestantes = differenceInDays(fim, now)
      const atrasado = diasRestantes < 0

      let semaforo: SemaforoColor = 'green'
      if (atrasado) {
        semaforo = 'red'
      } else if (diasRestantes <= 2) {
        semaforo = 'red'
      } else if (diasRestantes <= 5) {
        semaforo = 'yellow'
      }

      return (
        <div style={cardStyle}>
          <div style={leftStyle}>
            <span className="material-symbols-outlined" style={iconStyle}>
              event
            </span>
            <div>
              {atrasado ? (
                <span style={{ ...textPrimaryStyle, color: '#DC2626' }}>
                  Atrasado {Math.abs(diasRestantes)} dia{Math.abs(diasRestantes) !== 1 ? 's' : ''}
                </span>
              ) : (
                <span style={textPrimaryStyle}>
                  Executar ate {formatDate(fim)}
                </span>
              )}
              {!atrasado && (
                <div style={textSecondaryStyle}>
                  {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          <SemaforoDot color={semaforo} />
        </div>
      )
    }

    // No periodoFim, just show authorization
    return (
      <div style={cardStyle}>
        <div style={leftStyle}>
          <span className="material-symbols-outlined" style={iconStyle}>
            event
          </span>
          <span style={textPrimaryStyle}>Execucao autorizada</span>
        </div>
      </div>
    )
  }

  // EM_EXECUCAO
  if (status === 'EM_EXECUCAO') {
    const inicio = toDate(periodoInicio) ?? toDate(dataAprovacaoFinal) ?? now
    return (
      <div style={cardStyle}>
        <div style={leftStyle}>
          <span className="material-symbols-outlined" style={iconStyle}>
            engineering
          </span>
          <span style={textPrimaryStyle}>
            Em execucao desde {formatShort(inicio)}
          </span>
        </div>
      </div>
    )
  }

  // DESABILITADO
  if (status === 'DESABILITADO' || status === 'EXTENSAO_EM_ANALISE') {
    const desab = toDate(dataDesabilitacao) ?? now
    const diasDesabilitado = differenceInDays(now, desab)
    const maxDias = prazoMaximoDias ?? 0
    const pct = maxDias > 0 ? Math.min((diasDesabilitado / maxDias) * 100, 100) : 0

    let barColor: string
    if (pct > 80) {
      barColor = '#DC2626'
    } else if (pct > 50) {
      barColor = '#D97706'
    } else {
      barColor = '#16A34A'
    }

    return (
      <div style={cardStyle}>
        <div style={{ ...leftStyle, flex: 1 }}>
          <span className="material-symbols-outlined" style={iconStyle}>
            lock_open
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={textPrimaryStyle}>
              Tempo desabilitado: {diasDesabilitado} dia{diasDesabilitado !== 1 ? 's' : ''}
            </div>
            {maxDias > 0 && (
              <>
                <div style={textSecondaryStyle}>
                  Prazo maximo: {maxDias} dia{maxDias !== 1 ? 's' : ''}
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    marginTop: 6,
                    height: 4,
                    backgroundColor: '#E2E8F0',
                    borderRadius: 2,
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: 200,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: barColor,
                      borderRadius: 2,
                      transition: 'width 300ms',
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // EM_REABILITACAO
  if (status === 'EM_REABILITACAO') {
    const ref = toDate(dataDesabilitacao) ?? now
    return (
      <div style={cardStyle}>
        <div style={leftStyle}>
          <span className="material-symbols-outlined" style={iconStyle}>
            replay
          </span>
          <span style={textPrimaryStyle}>
            Em reabilitacao desde {formatShort(ref)}
          </span>
        </div>
      </div>
    )
  }

  // EM_VALIDACAO_DA_REABILITACAO
  if (status === 'EM_VALIDACAO_DA_REABILITACAO') {
    const dias = differenceInDays(now, toDate(dataDesabilitacao) ?? now)
    const semaforo: SemaforoColor = dias > 5 ? 'red' : dias >= 3 ? 'yellow' : 'green'

    return (
      <div style={cardStyle}>
        <div style={leftStyle}>
          <span className="material-symbols-outlined" style={iconStyle}>
            verified
          </span>
          <span style={textPrimaryStyle}>
            Aguardando validacao ha {dias} dia{dias !== 1 ? 's' : ''}
          </span>
        </div>
        <SemaforoDot color={semaforo} />
      </div>
    )
  }

  return null
}
