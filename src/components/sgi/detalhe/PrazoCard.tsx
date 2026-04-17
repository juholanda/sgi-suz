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
  /** When true, renders without the outer card border (for embedding inside another section) */
  embedded?: boolean
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

const embeddedStyle: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  borderRadius: 6,
  padding: '10px 12px',
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
    embedded = false,
  } = props

  const wrapStyle = embedded ? embeddedStyle : cardStyle
  const now = new Date()

  // Don't render for terminal statuses
  if (['ENCERRADA', 'REJEITADA', 'CANCELADA'].includes(status)) {
    return null
  }

  // RASCUNHO
  if (status === 'RASCUNHO') {
    const created = toDate(createdAt)!
    return (
      <div style={wrapStyle}>
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
      <div style={wrapStyle}>
        <div style={leftStyle}>
          <span className="material-symbols-outlined" style={iconStyle}>
            schedule
          </span>
          <span style={textPrimaryStyle}>
            Em aprovação há {dias} dia{dias !== 1 ? 's' : ''}
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
        <div style={wrapStyle}>
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
                  Executar até {formatDate(fim)}
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
      <div style={wrapStyle}>
        <div style={leftStyle}>
          <span className="material-symbols-outlined" style={iconStyle}>
            event
          </span>
          <span style={textPrimaryStyle}>Execução autorizada</span>
        </div>
      </div>
    )
  }

  // DESABILITADO
  if (status === 'DESABILITADO' || status === 'EXTENSAO_EM_ANALISE') {
    const desab = toDate(dataDesabilitacao) ?? now
    const diasDesabilitado = differenceInDays(now, desab)
    const maxDias = prazoMaximoDias ?? 0

    // Prazo planejado pelo usuário (periodoFim - periodoInicio)
    const inicio = toDate(periodoInicio)
    const fim = toDate(periodoFim)
    const prazoPlanejado = inicio && fim ? differenceInDays(fim, inicio) : 0

    // A barra usa o prazo planejado como referência principal
    const referencia = prazoPlanejado > 0 ? prazoPlanejado : maxDias
    const pct = referencia > 0 ? Math.min((diasDesabilitado / referencia) * 100, 100) : 0

    // Marcador do limite máximo na barra (se diferente do planejado)
    const maxMarkerPct = prazoPlanejado > 0 && maxDias > 0 && maxDias !== prazoPlanejado
      ? Math.min((maxDias / referencia) * 100, 100)
      : 0

    // Texto da contagem
    const diasRestantes = referencia > 0 ? referencia - diasDesabilitado : 0

    // Determinar nível de urgência — alinhado com lógica da tabela (dias restantes)
    const excedeuMax = maxDias > 0 && diasDesabilitado >= maxDias
    // Critico (pulsa) apenas no último dia ou quando já excedeu
    // — evita ruído visual em solicitações com prazo de 2+ dias
    const critico = excedeuMax || diasRestantes <= 1

    let barColor: string
    let dotColor: string
    if (excedeuMax) {
      barColor = '#DC2626'
      dotColor = '#DC2626'
    } else if (diasRestantes <= 1) {
      // Reabilitar hoje/amanhã → laranja forte
      barColor = '#EA580C'
      dotColor = '#EA580C'
    } else if (diasRestantes <= 2) {
      // Reabilitar em 2 dias → âmbar
      barColor = '#D97706'
      dotColor = '#D97706'
    } else {
      barColor = '#16A34A'
      dotColor = '#16A34A'
    }

    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: `1px solid ${critico ? '#FECACA' : '#E2E8F0'}`,
          borderRadius: 10,
          padding: '14px 16px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Top row: pulse dot + title + days badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {/* Pulsing dot */}
          <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
            <span
              className=""
              style={{
                display: 'block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: dotColor,
                // Variáveis CSS consumidas pela keyframe sgi-pulse em globals.css
                ['--sgi-pulse-color' as any]: `${dotColor}66`,
                ['--sgi-pulse-color-fade' as any]: `${dotColor}00`,
              }}
            />
          </div>

          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', flex: 1 }}>
            Desabilitado há {diasDesabilitado} dia{diasDesabilitado !== 1 ? 's' : ''}
          </span>

          {/* Days remaining badge — cores alinhadas com a tabela */}
          {referencia > 0 && (() => {
            let badgeBg: string, badgeText: string
            if (excedeuMax) {
              badgeBg = '#FEE2E2'; badgeText = '#DC2626'
            } else if (diasRestantes <= 1) {
              badgeBg = '#FFF7ED'; badgeText = '#C2410C'
            } else if (diasRestantes <= 2) {
              badgeBg = '#FEF3C7'; badgeText = '#92400E'
            } else {
              badgeBg = '#F0FDF4'; badgeText = '#16A34A'
            }
            return (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 10,
                  backgroundColor: badgeBg,
                  color: badgeText,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {diasRestantes > 0
                  ? `${diasRestantes}d restante${diasRestantes !== 1 ? 's' : ''}`
                  : `${Math.abs(diasRestantes)}d excedido${Math.abs(diasRestantes) !== 1 ? 's' : ''}`}
              </span>
            )
          })()}
        </div>

        {/* Progress bar */}
        {referencia > 0 && (
          <div
            style={{
              height: 6,
              backgroundColor: '#E2E8F0',
              borderRadius: 3,
              overflow: 'visible',
              width: '100%',
              position: 'relative',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(pct, 100)}%`,
                backgroundColor: barColor,
                borderRadius: 3,
                transition: 'width 300ms',
              }}
            />
            {/* Marker for class maximum when different from planned */}
            {maxMarkerPct > 0 && maxMarkerPct < 100 && (
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: `${maxMarkerPct}%`,
                  width: 2,
                  height: 10,
                  backgroundColor: '#DC2626',
                  borderRadius: 1,
                }}
                title={`Limite máximo: ${maxDias} dias`}
              />
            )}
          </div>
        )}

        {/* Bottom info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {prazoPlanejado > 0 && (
            <span style={{ fontSize: 11, color: '#64748B' }}>
              Prazo planejado: {prazoPlanejado}d
            </span>
          )}
          {prazoPlanejado > 0 && maxDias > 0 && (
            <span style={{ fontSize: 11, color: '#CBD5E1' }}>·</span>
          )}
          {maxDias > 0 && (
            <span style={{ fontSize: 11, color: excedeuMax ? '#DC2626' : '#64748B', fontWeight: excedeuMax ? 600 : 400 }}>
              Máximo: {maxDias}d
            </span>
          )}
        </div>
      </div>
    )
  }

  // EM_VALIDACAO_DA_REABILITACAO
  if (status === 'EM_VALIDACAO_DA_REABILITACAO') {
    const dias = differenceInDays(now, toDate(dataDesabilitacao) ?? now)
    const semaforo: SemaforoColor = dias > 5 ? 'red' : dias >= 3 ? 'yellow' : 'green'

    return (
      <div style={wrapStyle}>
        <div style={leftStyle}>
          <span className="material-symbols-outlined" style={iconStyle}>
            verified
          </span>
          <span style={textPrimaryStyle}>
            Aguardando validação há {dias} dia{dias !== 1 ? 's' : ''}
          </span>
        </div>
        <SemaforoDot color={semaforo} />
      </div>
    )
  }

  return null
}
