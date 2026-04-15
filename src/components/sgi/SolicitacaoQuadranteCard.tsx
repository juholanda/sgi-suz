'use client'
/**
 * SolicitacaoQuadranteCard — Design System Component
 *
 * Spec:
 *   Container: bg #FFFFFF, border-radius 4px, padding 16px, border-left 4px, flex-col gap 8px
 *   Row 1: flex-row justify-between center — [ClasseBadge + TAG] | [ApprovalCounter + StatusChip]
 *   Row 2: flex-row center gap 8 — description · separator · tipo
 *   Row 3: flex-row center gap 4 — MapPin + area name
 *   Optional: risk indicator, SLA bar, CTA footer
 */

import Link from 'next/link'
import { differenceInDays } from 'date-fns'

// ─── Token maps ───────────────────────────────────────────────────────────────

/** Left-border + ClasseBadge background colour per Classe number */
const CLASSE_COLOR: Record<number, string> = {
  1: '#1D4ED8',
  2: '#D08700',
  3: '#EA580C',
  4: '#DC2626',
}

/** Status chip appearance */
const STATUS_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  RASCUNHO:                     { bg: '#F1F5F9', color: '#475569',  label: 'Rascunho' },
  EM_APROVACAO:                 { bg: '#FEF5E5', color: '#AC6F00',  label: 'Em aprovação' },
  EXECUCAO_AUTORIZADA:          { bg: '#EBF0FB', color: '#0038A8',  label: 'Exec. autorizada' },
  EM_EXECUCAO:                  { bg: '#EBF0FB', color: '#002D8A',  label: 'Em execução' },
  DESABILITADO:                 { bg: '#F0FDFA', color: '#0D9488',  label: 'Desabilitado' },
  EM_REABILITACAO:              { bg: '#EEF2FF', color: '#6366F1',  label: 'Em reabilitação' },
  EM_VALIDACAO_DA_REABILITACAO: { bg: '#F0FDF4', color: '#16A34A',  label: 'Aguard. validação' },
  EXTENSAO_EM_ANALISE:          { bg: '#FFFBEB', color: '#D97706',  label: 'Ext. em análise' },
  ENCERRADA:                    { bg: '#F0FDF4', color: '#16A34A',  label: 'Encerrada' },
  CANCELADA:                    { bg: '#FEF2F2', color: '#DC2626',  label: 'Cancelada' },
  REJEITADA:                    { bg: '#FEF2F2', color: '#DC2626',  label: 'Rejeitada' },
}

/** Interlock type labels */
const TIPO_LABEL: Record<string, string> = {
  LOGICO:               'Lógico',
  FISICO:               'Físico',
  DISPOSITIVO_SEGURANCA:'Disp. Segurança',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Inline MapPin SVG — 12×12, stroke #6A7178 */
function MapPin() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 1.5C4.343 1.5 3 2.843 3 4.5C3 6.938 6 10.5 6 10.5C6 10.5 9 6.938 9 4.5C9 2.843 7.657 1.5 6 1.5Z"
        stroke="#6A7178"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="4.5" r="1" stroke="#6A7178" strokeWidth="1" />
    </svg>
  )
}

/** Approval progress — fraction text + segmented bar */
function ApprovalCounter({ aprovacoes }: { aprovacoes: { nivel: number; status: string }[] }) {
  const approved = aprovacoes.filter(a => a.status === 'APROVADO').length
  const total    = aprovacoes.length
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 71.6, height: 18, flexShrink: 0 }}>
      {/* Fraction */}
      <span style={{ fontWeight: 600, fontSize: 12, color: '#6A7178', lineHeight: '18px', whiteSpace: 'nowrap' }}>
        {approved}/{total}
      </span>
      {/* Segments */}
      <div style={{ width: 48, display: 'flex', gap: 2, flexShrink: 0 }}>
        {aprovacoes.map((a, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: a.status === 'APROVADO' ? '#303D60' : '#CED4DA',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** SLA progress bar — shown when DESABILITADO */
function SlaBar({
  dataDesabilitacao,
  prazoMaximoDias,
}: {
  dataDesabilitacao?: Date | null
  prazoMaximoDias?: number | null
}) {
  if (!dataDesabilitacao || !prazoMaximoDias) return null
  const dias = Math.max(0, differenceInDays(new Date(), new Date(dataDesabilitacao)))
  const pct  = Math.min(100, Math.round((dias / prazoMaximoDias) * 100))
  const cor  = pct > 80 ? '#DC2626' : pct > 50 ? '#EAB308' : '#16A34A'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6A7178', marginBottom: 4 }}>
        <span>{dias}d / {prazoMaximoDias}d máx.</span>
        <span style={{ color: cor, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ width: '100%', height: 4, background: '#E2E8F0', borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SolicitacaoQuadranteCardProps {
  id: string
  status: string
  tipo: string | null
  classe: { numero: number; prazoMaximoDias: number | null } | null
  equipamento: { tag: string; descricao: string }
  area: { nome: string }
  aprovacoes: { nivel: number; status: string }[]
  dataDesabilitacao?: Date | null
  prazoMaximoAtingido?: boolean
  prazoPrevitoAtingido?: boolean
  /** Show risk pill (e.g. when card is in "Em risco de prazo" quadrant) */
  showRisk?: boolean
  /** CTA shown in card footer. Pass null to hide. */
  cta?: { label: string; bg: string; color: string } | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SolicitacaoQuadranteCard({
  id,
  status,
  tipo,
  classe,
  equipamento,
  area,
  aprovacoes,
  dataDesabilitacao,
  prazoMaximoAtingido,
  prazoPrevitoAtingido,
  showRisk = false,
  cta,
}: SolicitacaoQuadranteCardProps) {
  const classeColor  = classe ? (CLASSE_COLOR[classe.numero] ?? '#D9E1EB') : '#D9E1EB'
  const chip         = STATUS_CHIP[status] ?? { bg: '#F1F5F9', color: '#475569', label: status }
  const showApproval = status === 'EM_APROVACAO' && aprovacoes.length > 0
  const showSla      = status === 'DESABILITADO'
  const riskLabel    = prazoMaximoAtingido
    ? 'Prazo máximo atingido'
    : prazoPrevitoAtingido
    ? 'Prazo previsto atingido'
    : 'Prazo se encerrando'

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 4,
        borderTop:    '1px solid #E2E8F0',
        borderRight:  '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        borderLeft:   `4px solid ${classeColor}`,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 108,
      }}
    >
      {/* ── Invisible full-card link ── */}
      <Link
        href={`/solicitacoes/${id}`}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        aria-label={`Ver solicitação ${equipamento.tag}`}
      />

      {/* ── Non-interactive body ── */}
      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {/* Row 1 — Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Left: ClasseBadge + TAG */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {classe && (
              <div
                style={{
                  background: classeColor,
                  borderRadius: 2,
                  padding: '1.75px 5.25px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#FFFFFF',
                    lineHeight: '18px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  CL {classe.numero}
                </span>
              </div>
            )}
            <span
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: '#101213',
                lineHeight: '24px',
              }}
            >
              {equipamento.tag}
            </span>
          </div>

          {/* Right: ApprovalCounter (optional) + StatusChip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {showApproval && <ApprovalCounter aprovacoes={aprovacoes} />}
            <div
              style={{
                background: chip.bg,
                borderRadius: 100,
                padding: '0px 8px',
                height: 24,
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: chip.color,
                  lineHeight: '18px',
                  whiteSpace: 'nowrap',
                }}
              >
                {chip.label}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2 — Description · Separator · Tipo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            minHeight: 18,
          }}
        >
          <span
            style={{
              fontWeight: 400,
              fontSize: 12,
              color: '#6A7178',
              lineHeight: '18px',
            }}
          >
            {equipamento.descricao || '—'}
          </span>
          {tipo && TIPO_LABEL[tipo] && (
            <>
              <div
                style={{
                  width: 4.67,
                  height: 4.67,
                  borderRadius: '50%',
                  background: '#D9D9D9',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  color: '#6A7178',
                  lineHeight: '18px',
                  flexShrink: 0,
                }}
              >
                {TIPO_LABEL[tipo]}
              </span>
            </>
          )}
        </div>

        {/* Row 3 — Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 18 }}>
          <MapPin />
          <span
            style={{
              fontWeight: 400,
              fontSize: 12,
              color: '#6A7178',
              lineHeight: '18px',
            }}
          >
            {area.nome || '—'}
          </span>
        </div>

        {/* Risk indicator — shown in "Em risco de prazo" quadrant */}
        {showRisk && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              background: '#FEF2F2',
              borderRadius: 4,
              alignSelf: 'flex-start',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M5.5 1L1 9.5H10L5.5 1Z" stroke="#DC2626" strokeWidth="1" strokeLinejoin="round" />
              <line x1="5.5" y1="4.5" x2="5.5" y2="7" stroke="#DC2626" strokeWidth="1" strokeLinecap="round" />
              <circle cx="5.5" cy="8.25" r="0.5" fill="#DC2626" />
            </svg>
            <span
              style={{
                fontWeight: 500,
                fontSize: 11,
                color: '#DC2626',
                lineHeight: '16px',
              }}
            >
              {riskLabel}
            </span>
          </div>
        )}

        {/* SLA bar — shown when DESABILITADO */}
        {showSla && (
          <SlaBar
            dataDesabilitacao={dataDesabilitacao}
            prazoMaximoDias={classe?.prazoMaximoDias ?? null}
          />
        )}
      </div>

      {/* ── CTA footer — interactive, above link overlay ── */}
      {cta && (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            borderTop: '1px solid #F1F5F9',
            padding: '10px 16px 16px',
          }}
        >
          <Link
            href={`/solicitacoes/${id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              background: cta.bg,
              color: cta.color,
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {cta.label}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}
