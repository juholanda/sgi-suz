'use client'
import Link from 'next/link'
import {
  SolicitacaoQuadranteCard,
  type SolicitacaoQuadranteCardProps,
} from './SolicitacaoQuadranteCard'

// ─── Shared type (mirrors SolicitacaoQuadranteCard props + extra) ─────────────

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
}

interface Props {
  q1: QuadranteItem[]
  q2: QuadranteItem[]
  q3: QuadranteItem[]
  q4: QuadranteItem[]
  isExecutante: boolean
}

// ─── CTA config per quadrant / status ────────────────────────────────────────
// Design system: azul primário, vermelho perigo, verde sucesso, cinza secundário
// Sem lilás / roxo.

type Cta = SolicitacaoQuadranteCardProps['cta']

function getCta(status: string, quadrant: number): Cta {
  if (quadrant === 1) {
    if (status === 'RASCUNHO')            return { label: 'Continuar rascunho',   bg: '#0038A8', color: '#fff' }
    if (status === 'EXECUCAO_AUTORIZADA') return { label: 'Confirmar execução',   bg: '#0038A8', color: '#fff' }
  }
  if (quadrant === 2) return { label: 'Ver agora',            bg: '#DC2626', color: '#fff' }
  if (quadrant === 3) return { label: 'Acompanhar',           bg: '#F1F5F9', color: '#374151' }
  if (quadrant === 4) return { label: 'Iniciar reabilitação', bg: '#10B981', color: '#fff' }
  return null
}

// ─── Quadrant block ───────────────────────────────────────────────────────────

const BLOCK_HEIGHT = 420
const MAX_VISIBLE  = 5

function QuadranteBlock({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  items,
  quadrant,
  tabHref,
  emptyLabel,
}: {
  title: string
  subtitle: string
  icon: string
  iconColor: string
  iconBg: string
  items: QuadranteItem[]
  quadrant: number
  tabHref: string
  emptyLabel: string
}) {
  const visible = items.slice(0, MAX_VISIBLE)
  const extra   = items.length - MAX_VISIBLE

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        height: BLOCK_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Fixed header ── */}
      <div
        style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid #F1F5F9',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: icon + title + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
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
                fontSize: 14,
                color: '#0F172A',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </span>
            {items.length > 0 && (
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 14,
                  color: iconColor,
                  lineHeight: '20px',
                  flexShrink: 0,
                }}
              >
                ({items.length})
              </span>
            )}
          </div>

          {/* Right: link */}
          {items.length > 0 && (
            <Link
              href={tabHref}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#0038A8',
                textDecoration: 'none',
                marginLeft: 12,
                flexShrink: 0,
              }}
            >
              Ver todas →
            </Link>
          )}
        </div>

        <p
          style={{
            fontWeight: 400,
            fontSize: 12,
            color: '#64748B',
            lineHeight: '18px',
            marginTop: 4,
            marginBottom: 0,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* ── Scrollable body ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px 24px',
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
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, lineHeight: 1 }}
            >
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
                showRisk={quadrant === 2}
                cta={getCta(item.status, quadrant)}
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
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 13, lineHeight: 1 }}
                >
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

export default function SolicitanteDashboard({ q1, q2, q3, q4 }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
      }}
      className="sm:grid-cols-2 grid-cols-1"
    >
      <QuadranteBlock
        title="Minhas pendências"
        subtitle="Pendências que precisam da sua decisão agora."
        icon="inbox"
        iconColor="#0038A8"
        iconBg="#EBF0FB"
        items={q1}
        quadrant={1}
        tabHref="/solicitacoes?tab=pendencias"
        emptyLabel="Nenhuma pendência no momento."
      />
      <QuadranteBlock
        title="Em risco de prazo"
        subtitle="Itens com risco de SLA e atenção imediata."
        icon="warning"
        iconColor="#DC2626"
        iconBg="#FEF2F2"
        items={q2}
        quadrant={2}
        tabHref="/solicitacoes?tab=risco"
        emptyLabel="Sem riscos de prazo no momento."
      />
      <QuadranteBlock
        title="Aguardando terceiros"
        subtitle="Em andamento, dependendo da ação de outras áreas."
        icon="hourglass_empty"
        iconColor="#6366F1"
        iconBg="#EEF2FF"
        items={q3}
        quadrant={3}
        tabHref="/solicitacoes?tab=aguardando"
        emptyLabel="Nada aguardando terceiros no momento."
      />
      <QuadranteBlock
        title="Desabilitadas no momento"
        subtitle="Intertravamentos abertos operacionalmente."
        icon="lock_open"
        iconColor="#0D9488"
        iconBg="#F0FDFA"
        items={q4}
        quadrant={4}
        tabHref="/solicitacoes?tab=desabilitadas"
        emptyLabel="Nenhum intertravamento ativo no momento."
      />
    </div>
  )
}
