'use client'

import { differenceInHours } from 'date-fns'

interface Props {
  status: string
  dataDesabilitacao?: string | null
  dataReabilitacao?: string | null
  periodoInicio?: string | null
  periodoFim?: string | null
  classe?: { numero: number; prazoMaximoDias: number | null } | null
  prazoMaximoAtingido?: boolean
  prazoPrevitoAtingido?: boolean
}

/** Formata total de horas como "3d 5h", "5h", "2d" etc. */
function formatDH(totalHoras: number): string {
  if (totalHoras <= 0) return '0h'
  const d = Math.floor(totalHoras / 24)
  const h = totalHoras % 24
  if (d > 0 && h > 0) return `${d}d ${h}h`
  if (d > 0) return `${d}d`
  return `${h}h`
}

/** Barra de prazo — exibida apenas para status DESABILITADO */
export default function PrazoInlineBar({
  status,
  dataDesabilitacao,
  periodoInicio,
  periodoFim,
  classe,
  prazoMaximoAtingido,
  prazoPrevitoAtingido,
}: Props) {
  if (status !== 'DESABILITADO') return null
  if (!dataDesabilitacao) return null

  const now   = new Date()
  const desab = new Date(dataDesabilitacao)
  const horasDecorridas = Math.max(0, differenceInHours(now, desab))

  const maxDias = classe?.prazoMaximoDias ?? 0
  const inicio  = periodoInicio ? new Date(periodoInicio) : null
  const fim     = periodoFim    ? new Date(periodoFim)    : null

  const horasPrevisto  = inicio && fim ? Math.max(0, differenceInHours(fim, inicio)) : 0
  const diasPrevisto   = Math.floor(horasPrevisto / 24)
  const diasMax        = maxDias

  const horasReferencia = horasPrevisto > 0 ? horasPrevisto : maxDias * 24
  const pct = horasReferencia > 0 ? Math.min((horasDecorridas / horasReferencia) * 100, 100) : 0

  const excedeuPrevisto = horasPrevisto > 0 && horasDecorridas >= horasPrevisto
  const excedeuMax      = diasMax > 0       && horasDecorridas >= diasMax * 24

  const horasRestantes = horasReferencia > 0 ? Math.max(0, horasReferencia - horasDecorridas) : 0
  const diasRestantes  = Math.floor(horasRestantes / 24)

  // Cores: azul escuro → laranja (apertado) → vermelho (estourado)
  let barColor     = '#1E3A8A'
  let counterColor = '#374151'
  if (excedeuMax) {
    barColor = '#DC2626'; counterColor = '#DC2626'
  } else if (excedeuPrevisto || (horasRestantes > 0 && diasRestantes <= 1)) {
    barColor = '#EA580C'; counterColor = '#C2410C'
  } else if (horasRestantes > 0 && diasRestantes <= 2) {
    barColor = '#D97706'; counterColor = '#92400E'
  }

  let alertaTexto: string | null = null
  let alertaCor = '#DC2626'
  if (prazoMaximoAtingido || excedeuMax) {
    alertaTexto = 'Prazo máximo atingido — ação imediata necessária'
    alertaCor = '#DC2626'
  } else if (prazoPrevitoAtingido) {
    alertaTexto = 'Prazo previsto atingido — risco de exceder o prazo máximo'
    alertaCor = '#D97706'
  }

  return (
    <>
      <style>{`
        @keyframes prazo-ping {
          0%   { transform: scale(1);   opacity: 0.65; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .prazo-dot-ring { animation: prazo-ping 1.5s ease-out infinite; }
      `}</style>

      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', fontFamily: 'Inter, sans-serif' }}>

        {alertaTexto && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: alertaCor, lineHeight: 1 }}>warning</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: alertaCor }}>{alertaTexto}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

          {/* Dot pulsante */}
          <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
            <span className="prazo-dot-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#DC2626' }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#DC2626' }} />
          </div>

          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Desabilitado
          </span>

          {horasReferencia > 0 && (
            <>
              <div style={{ flex: 1, minWidth: 80, maxWidth: 200, height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#E2E8F0' }}>
                <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: 3, transition: 'width 300ms' }} />
              </div>
              <span style={{ fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
                <strong style={{ fontWeight: 700, color: counterColor }}>{formatDH(horasDecorridas)}</strong>
                <span style={{ color: '#CBD5E1', margin: '0 3px' }}>/</span>
                <span style={{ color: '#64748B' }}>{formatDH(horasReferencia)}</span>
              </span>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0, flexWrap: 'wrap' }}>

            {diasPrevisto > 0 && (
              <span style={{ fontSize: 12, color: '#1E293B', whiteSpace: 'nowrap' }}>
                Prazo previsto&nbsp;<strong style={{ fontWeight: 600 }}>{diasPrevisto}d</strong>
                {excedeuPrevisto && (
                  <span style={{ color: '#DC2626', fontWeight: 500, marginLeft: 4 }}>(excedido)</span>
                )}
              </span>
            )}

            {diasMax > 0 && (
              <>
                {diasPrevisto > 0 && <span style={{ fontSize: 11, color: '#CBD5E1' }}>·</span>}
                <span style={{ fontSize: 12, color: '#1E293B', whiteSpace: 'nowrap' }}>
                  Prazo máximo&nbsp;<strong style={{ fontWeight: 600 }}>{diasMax}d</strong>
                  {excedeuMax && (
                    <span style={{ color: '#DC2626', fontWeight: 500, marginLeft: 4 }}>(excedido)</span>
                  )}
                </span>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
