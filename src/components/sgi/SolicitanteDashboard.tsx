'use client'
import Link from 'next/link'
import {
  SolicitacaoQuadranteCard,
} from './SolicitacaoQuadranteCard'

// ─── Shared type ─────────────────────────────────────────────────────────────

export type QuadranteItem = {
  id: string
  protocolo: string
  status: string
  tipo: string | null
  periodoInicio: Date | null
  periodoFim: Date | null
  dataDesabilitacao: Date | null
  prazoMaximoAtingido: boolean
  prazoPrevitoAtingido: boolean
  createdAt: Date
  equipamento: { tag: string; descricao: string }
  area: { nome: string; planta: { nome: string } }
  classe: { numero: number; prazoMaximoDias: number | null } | null
  aprovacoes: { nivel: number; status: string }[]
  executanteId: string | null
  /** CTA button config — computed server-side per profile */
  cta?: { label: string; bg: string; color: string } | null
}

export type QuadranteConfig = {
  title: string
  subtitle: string
  icon: string
  iconColor: string
  iconBg: string
  items: QuadranteItem[]
  tabHref: string
  emptyLabel: string
  /** Show risk pill on items */
  showRisk?: boolean
}

interface Props {
  quadrants: QuadranteConfig[]
  userId: string
}

// ─── Quadrant block ───────────────────────────────────────────────────────────

const MAX_VISIBLE = 5

function QuadranteBlock({ config }: { config: QuadranteConfig }) {
  const { title, subtitle, icon, iconColor, iconBg, items, tabHref, emptyLabel, showRisk } = config
  const visible = items.slice(0, MAX_VISIBLE)
  const extra = items.length - MAX_VISIBLE

  return (
    <div
      className="md:h-[420px]"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Fixed header ── */}
      <div
        className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4"
        style={{ borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 15,
                color: iconColor,
                lineHeight: 1,
                background: iconBg,
                borderRadius: 6,
                padding: 4,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
            <span
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: '#0F172A',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </span>
            {items.length > 0 && (
              <span style={{ fontWeight: 400, fontSize: 13, color: '#64748B', lineHeight: '20px', flexShrink: 0 }}>
                ({items.length})
              </span>
            )}
          </div>

          {items.length > 0 && (
            <Link
              href={tabHref}
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#0038A8',
                textDecoration: 'none',
                marginLeft: 8,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              Ver todas →
            </Link>
          )}
        </div>

        <p style={{ fontWeight: 400, fontSize: 12, color: '#64748B', lineHeight: '18px', marginTop: 4, marginBottom: 0 }}>
          {subtitle}
        </p>
      </div>

      {/* ── Scrollable body ── */}
      <div
        className="p-4 md:p-6 md:pt-4"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent',
        } as React.CSSProperties}
      >
        {items.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              background: '#F8FAFC',
              border: '1px dashed #E2E8F0',
              borderRadius: 8,
              fontSize: 12,
              color: '#94A3B8',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>
              check_circle
            </span>
            {emptyLabel}
          </div>
        ) : (
          <>
            {visible.map(item => (
              <SolicitacaoQuadranteCard
                key={item.id}
                id={item.id}
                status={item.status}
                tipo={item.tipo}
                classe={item.classe}
                equipamento={item.equipamento}
                area={{ nome: item.area.nome }}
                aprovacoes={item.aprovacoes}
                dataDesabilitacao={item.dataDesabilitacao}
                prazoMaximoAtingido={item.prazoMaximoAtingido}
                prazoPrevitoAtingido={item.prazoPrevitoAtingido}
                periodoInicio={item.periodoInicio}
                periodoFim={item.periodoFim}
                showRisk={showRisk}
                cta={item.cta ?? null}
              />
            ))}
            {extra > 0 && (
              <Link
                href={tabHref}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '8px 0',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#0038A8',
                  border: '1px dashed #C7D7F4',
                  borderRadius: 6,
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13, lineHeight: 1 }}>
                  expand_more
                </span>
                Ver mais {extra} {extra === 1 ? 'solicitação' : 'solicitações'}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Grid 2×2 ─────────────────────────────────────────────────────────────────

export default function SolicitanteDashboard({ quadrants }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {quadrants.map((config, i) => (
        <QuadranteBlock key={i} config={config} />
      ))}
    </div>
  )
}
