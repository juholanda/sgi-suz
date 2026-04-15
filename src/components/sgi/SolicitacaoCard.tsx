'use client'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { ClasseNum, STATUS_LABELS } from '@/lib/tokens'
import { ClickableCard } from '@/components/design-system/ClickableCard'

const TIPO_LABEL: Record<string, string> = {
  LOGICO: 'Lógico',
  FISICO: 'Físico',
  DISPOSITIVO_SEGURANCA: 'Disp. Segurança',
}

interface SolicitacaoCardProps {
  id: string
  protocolo: string
  status: string
  tipo?: string | null
  classe: { numero: number; prazoMaxDias?: number | null } | null
  equipamento: { tag: string; descricao: string }
  area: { nome: string }
  planta?: { nome: string }
  solicitante: { nome: string }
  periodoInicio?: Date | null
  periodoFim?: Date | null
  dataDesabilitacao?: Date | null
  prazoMaximoAtingido?: boolean
  prazoPrevitoAtingido?: boolean
  aprovacoes: { nivel: number; status: string; aprovador: { nome: string } }[]
  isAprovador?: boolean
  isSolicitante?: boolean
  isExecutante?: boolean
  className?: string
}

// Border/accent colors by classe number
const CLASSE_BORDER_COLORS: Record<number, string> = {
  1: '#1D4ED8',
  2: '#0D9488',
  3: '#EA580C',
  4: '#DC2626',
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return format(d, 'dd/MM', { locale: ptBR })
}

export function SolicitacaoCard({
  id,
  protocolo,
  status,
  tipo,
  classe,
  equipamento,
  area,
  planta,
  solicitante,
  periodoInicio,
  periodoFim,
  dataDesabilitacao,
  prazoMaximoAtingido,
  prazoPrevitoAtingido,
  aprovacoes,
  isAprovador = false,
  isSolicitante = false,
  isExecutante = false,
  className,
}: SolicitacaoCardProps) {
  const borderColor = classe ? (CLASSE_BORDER_COLORS[classe.numero] ?? '#94A3B8') : '#94A3B8'

  // Approval progress for EM_APROVACAO
  const aprovAprovadas = aprovacoes.filter(a => a.status === 'APROVADO').length
  const totalAprovacoes = aprovacoes.length

  // SLA calculation for DESABILITADO
  const prazoMaxDias = classe?.prazoMaxDias ?? null
  let slaPercent = 0
  if (status === 'DESABILITADO' && dataDesabilitacao && prazoMaxDias) {
    const diasDesabilitado = differenceInDays(new Date(), new Date(dataDesabilitacao))
    slaPercent = Math.min(100, Math.round((diasDesabilitado / prazoMaxDias) * 100))
  }
  const diasDesabilitado = dataDesabilitacao
    ? differenceInDays(new Date(), new Date(dataDesabilitacao))
    : 0

  const slaBarColor =
    slaPercent > 80 ? '#DC2626' : slaPercent > 50 ? '#EAB308' : '#16A34A'

  // Whether any action buttons exist for this card
  const hasButtons =
    (status === 'RASCUNHO' && isSolicitante) ||
    (status === 'EM_APROVACAO' && isAprovador) ||
    (status === 'EXECUCAO_AUTORIZADA' && isExecutante) ||
    (status === 'DESABILITADO' && isExecutante) ||
    (status === 'EM_VALIDACAO_DA_REABILITACAO' && isAprovador)

  const detailHref = `/solicitacoes/${id}`

  return (
    <ClickableCard
      href={detailHref}
      className={className}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 4,
        borderLeft: `4px solid ${borderColor}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Body ── */}
      <div style={{ padding: '12px 16px 0' }}>
        {/* Line 1: Classe badge · Protocolo · progress pill · Status badge */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {classe && (
            <ClasseBadge classe={classe.numero as ClasseNum} size="sm" />
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0038A8' }}>
            #{protocolo}
          </span>
          {status === 'EM_APROVACAO' && totalAprovacoes > 0 && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 6px',
                background: '#FEF5E5',
                color: '#AC6F00',
                borderRadius: 4,
              }}
            >
              {aprovAprovadas}/{totalAprovacoes}
            </span>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <StatusBadge status={status as any} size="sm" />
          </div>
        </div>

        {/* Line 2: TAG */}
        <div style={{ marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
            {equipamento.tag}
          </span>
        </div>

        {/* Line 3: descricao · tipo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', marginBottom: 4 }}>
          <span>{equipamento.descricao}</span>
          {tipo && TIPO_LABEL[tipo] && (
            <>
              <span style={{ color: '#D1D5DB' }}>·</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{TIPO_LABEL[tipo]}</span>
            </>
          )}
        </div>

        {/* Line 4: location_on icon + Area · Planta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, lineHeight: 1 }}>location_on</span>
          <span>
            {area.nome}
            {planta ? ` · ${planta.nome}` : ''}
          </span>
        </div>

        {/* Line 5: Contextual info */}
        {status === 'EM_APROVACAO' && periodoInicio && periodoFim && (
          <div
            style={{
              fontSize: 12,
              padding: '6px 8px',
              marginBottom: 8,
              background: '#F1F5F9',
              color: '#475569',
              borderRadius: 4,
            }}
          >
            Período previsto: {fmtDate(periodoInicio)} → {fmtDate(periodoFim)}
          </div>
        )}

        {status === 'DESABILITADO' && prazoMaxDias && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
              <span>{diasDesabilitado}d / prazo máximo</span>
              <span style={{ color: slaBarColor, fontWeight: 600 }}>{slaPercent}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 4 }}>
              <div
                style={{
                  width: `${slaPercent}%`,
                  height: '100%',
                  background: slaBarColor,
                  borderRadius: 4,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}

        {status === 'EM_VALIDACAO_DA_REABILITACAO' && (
          <div style={{ fontSize: 12, marginBottom: 8, color: '#0F766E' }}>
            Aguardando validação...
          </div>
        )}

        {status === 'EXECUCAO_AUTORIZADA' && (
          <div style={{ fontSize: 12, marginBottom: 8, color: '#1E40AF' }}>
            Aguardando execução
          </div>
        )}
      </div>

      {/* ── Footer with contextual action buttons ── */}
      {hasButtons && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderTop: '1px solid #F1F5F9',
            pointerEvents: 'auto',
          }}
        >
          {status === 'RASCUNHO' && isSolicitante && (
            <Link
              href={`/solicitacoes/nova?editar=${id}`}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#0038A8',
                borderRadius: 4,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Editar
            </Link>
          )}

          {status === 'EM_APROVACAO' && isAprovador && (
            <Link
              href={detailHref}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#0038A8',
                borderRadius: 4,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Analisar
            </Link>
          )}

          {status === 'EXECUCAO_AUTORIZADA' && isExecutante && (
            <Link
              href={detailHref}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#0038A8',
                borderRadius: 4,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Executar desabilitação →
            </Link>
          )}

          {status === 'DESABILITADO' && isExecutante && (
            <>
              <Link
                href={`/solicitacoes/${id}?acao=extensao`}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0038A8',
                  background: '#EBF0FB',
                  border: '1px solid #D8E4F8',
                  borderRadius: 4,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                Solicitar extensão
              </Link>
              <Link
                href={`/solicitacoes/${id}?acao=reabilitar`}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: '#16A34A',
                  borderRadius: 4,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                Reabilitar
              </Link>
            </>
          )}

          {status === 'EM_VALIDACAO_DA_REABILITACAO' && isAprovador && (
            <Link
              href={detailHref}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#16A34A',
                borderRadius: 4,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Validar
            </Link>
          )}
        </div>
      )}
    </ClickableCard>
  )
}

