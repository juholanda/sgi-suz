'use client'
/**
 * SolicitacaoQuadranteCard — Dashboard quadrant card
 *
 * Layout contract (no z-index, no invisible links):
 *   ┌─────────────────────────────────┐
 *   │ [CL X]  TAG             STATUS  │  ← Row 1
 *   │ descrição · Tipo                │  ← Row 2
 *   │ 📍 Área                         │  ← Row 3
 *   │ 📅 DD/MM/AA → DD/MM/AA          │  ← Row 4 (conditional)
 *   │ ⚠ Prazo se encerrando           │  ← Risk pill (conditional)
 *   │ ████████░░░░ 72% SLA bar        │  ← SLA (conditional)
 *   ├─────────────────────────────────┤
 *   │ [ CTA button → ]                │  ← CardCtaFooter (conditional)
 *   └─────────────────────────────────┘
 *
 * Uses ClickableCard (onClick-based) so there is no invisible <a> overlay
 * fighting with the CTA <Link> for z-index. All content is in plain document
 * flow — the CTA footer is always physically AFTER the body rows.
 */

import { differenceInDays } from 'date-fns'
import { ClickableCard } from '@/components/design-system/ClickableCard'
import { CardCtaFooter } from '@/components/design-system/CardCtaFooter'

// ─── Token maps ───────────────────────────────────────────────────────────────

const CLASSE_COLOR: Record<number, string> = {
  1: '#1D4ED8',
  2: '#D08700',
  3: '#EA580C',
  4: '#DC2626',
}

const STATUS_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  RASCUNHO:                     { bg: '#F1F5F9', color: '#475569',  label: 'Rascunho' },
  EM_APROVACAO:                 { bg: '#FEF5E5', color: '#AC6F00',  label: 'Em aprovação' },
  EXECUCAO_AUTORIZADA:          { bg: '#EBF0FB', color: '#0038A8',  label: 'Exec. autorizada' },
  DESABILITADO:                 { bg: '#FFF7ED', color: '#C2410C',  label: 'Desabilitado' },
  EM_VALIDACAO_DA_REABILITACAO: { bg: '#CCFBF1', color: '#0F766E',  label: 'Aguard. validação' },
  EXTENSAO_EM_ANALISE:          { bg: '#FFFBEB', color: '#D97706',  label: 'Ext. em análise' },
  ENCERRADA:                    { bg: '#F0FDF4', color: '#15803D',  label: 'Encerrada' },
  CANCELADA:                    { bg: '#F1F5F9', color: '#475569',  label: 'Cancelada' },
  REJEITADA:                    { bg: '#FEF2F2', color: '#DC2626',  label: 'Rejeitada' },
}

const TIPO_LABEL: Record<string, string> = {
  LOGICO:                'Lógico',
  FISICO:                'Físico',
  DISPOSITIVO_SEGURANCA: 'Disp. Segurança',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MapPin() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 1.5C4.343 1.5 3 2.843 3 4.5C3 6.938 6 10.5 6 10.5C6 10.5 9 6.938 9 4.5C9 2.843 7.657 1.5 6 1.5Z"
        stroke="#6A7178" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="6" cy="4.5" r="1" stroke="#6A7178" strokeWidth="1" />
    </svg>
  )
}

function ApprovalCounter({ aprovacoes }: { aprovacoes: { nivel: number; status: string }[] }) {
  const approved = aprovacoes.filter(a => a.status === 'APROVADO').length
  const total    = aprovacoes.length
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <span style={{ fontWeight: 600, fontSize: 12, color: '#6A7178', lineHeight: '18px', whiteSpace: 'nowrap' }}>
        {approved}/{total}
      </span>
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {aprovacoes.map((a, i) => (
          <div
            key={i}
            style={{
              width: 10,
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
  periodoInicio?: Date | null
  periodoFim?: Date | null
  showRisk?: boolean
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
  periodoInicio,
  periodoFim,
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
    <ClickableCard
      href={`/solicitacoes/${id}`}
      style={{
        background: '#FFFFFF',
        borderRadius: 4,
        borderTop:    '1px solid #E2E8F0',
        borderRight:  '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        borderLeft:   `4px solid ${classeColor}`,
        // No position, no z-index, no overflow tricks.
        // Body + CTA stack in plain document flow.
      }}
    >
      {/* ── Body — all informational rows ───────────────────────────────── */}
      <div
        style={{
          padding: '14px 16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Row 1 — Header: [CL badge + TAG] | [approvals? + status chip] */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {classe && (
              <span
                style={{
                  background: classeColor,
                  color: '#FFFFFF',
                  borderRadius: 2,
                  padding: '1.75px 5.25px',
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: '18px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                CL {classe.numero}
              </span>
            )}
            <span
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: '#101213',
                lineHeight: '24px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {equipamento.tag}
            </span>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {showApproval && <ApprovalCounter aprovacoes={aprovacoes} />}
            <span
              style={{
                background: chip.bg,
                color: chip.color,
                borderRadius: 100,
                padding: '3px 8px',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: '18px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {chip.label}
            </span>
          </div>
        </div>

        {/* Row 2 — Description · Tipo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6A7178', lineHeight: '18px' }}>
            {equipamento.descricao || '—'}
          </span>
          {tipo && TIPO_LABEL[tipo] && (
            <>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#D9D9D9', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#6A7178', lineHeight: '18px', flexShrink: 0 }}>
                {TIPO_LABEL[tipo]}
              </span>
            </>
          )}
        </div>

        {/* Row 3 — Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin />
          <span style={{ fontSize: 12, color: '#6A7178', lineHeight: '18px' }}>
            {area.nome || '—'}
          </span>
        </div>

        {/* Row 4 — Period */}
        {periodoInicio && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#6A7178', lineHeight: 1 }}>
              calendar_today
            </span>
            <span style={{ fontSize: 12, color: '#6A7178', lineHeight: '18px' }}>
              {new Date(periodoInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              {periodoFim
                ? ` → ${new Date(periodoFim).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`
                : ''}
            </span>
          </div>
        )}

        {/* Risk indicator */}
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
            <span style={{ fontSize: 11, fontWeight: 500, color: '#DC2626', lineHeight: '16px' }}>
              {riskLabel}
            </span>
          </div>
        )}

        {/* SLA bar */}
        {showSla && (
          <SlaBar
            dataDesabilitacao={dataDesabilitacao}
            prazoMaximoDias={classe?.prazoMaximoDias ?? null}
          />
        )}
      </div>

      {/* ── CTA footer — always below ALL body rows ──────────────────────── */}
      {cta && (
        <CardCtaFooter
          href={`/solicitacoes/${id}`}
          label={cta.label}
          bg={cta.bg}
          color={cta.color}
        />
      )}
    </ClickableCard>
  )
}
