'use client'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { ClasseNum, STATUS_LABELS } from '@/lib/tokens'

interface SolicitacaoCardProps {
  id: string
  protocolo: string
  status: string
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
    (status === 'EM_APROVACAO' && isAprovador) ||
    (status === 'EXECUCAO_AUTORIZADA' && isExecutante) ||
    (status === 'DESABILITADO' && isExecutante) ||
    (status === 'EM_VALIDACAO_DA_REABILITACAO' && isAprovador)

  return (
    <div
      className={`bg-white border relative${className ? ` ${className}` : ''}`}
      style={{
        borderColor: '#E2E8F0',
        borderRadius: '4px',
        borderLeft: `4px solid ${borderColor}`,
        overflow: 'hidden',
      }}
    >
      {/* Clickable overlay — whole card opens detail */}
      <Link
        href={`/solicitacoes/${id}`}
        className="absolute inset-0 z-0"
        aria-label={`Ver detalhes de ${protocolo}`}
      />

      <div className="relative z-10 pointer-events-none px-4 pt-3 pb-0">
        {/* Line 1: Classe badge · Identificador · progress pill · Status badge */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {classe && (
            <ClasseBadge classe={classe.numero as ClasseNum} size="sm" />
          )}
          <span className="font-mono text-xs font-semibold" style={{ color: '#0038A8' }}>
            #{protocolo}
          </span>
          {status === 'EM_APROVACAO' && totalAprovacoes > 0 && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5"
              style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: '4px' }}
            >
              {aprovAprovadas}/{totalAprovacoes}
            </span>
          )}
          <div className="ml-auto">
            <StatusBadge status={status as any} size="sm" />
          </div>
        </div>

        {/* Line 2: TAG */}
        <div className="mb-0.5">
          <span className="font-mono font-bold text-sm" style={{ color: '#0F172A' }}>
            {equipamento.tag}
          </span>
        </div>

        {/* Line 3: equipamento.descricao */}
        <div className="text-sm mb-1" style={{ color: '#374151' }}>
          {equipamento.descricao}
        </div>

        {/* Line 4: location_on icon + Area · Planta */}
        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: '#6B7280' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, lineHeight: 1 }}>location_on</span>
          <span>
            {area.nome}
            {planta ? ` · ${planta.nome}` : ''}
          </span>
        </div>

        {/* Line 5: Contextual info */}
        {status === 'EM_APROVACAO' && periodoInicio && periodoFim && (
          <div
            className="text-xs px-2 py-1.5 mb-2"
            style={{ background: '#F1F5F9', color: '#475569', borderRadius: '4px' }}
          >
            Período previsto: {fmtDate(periodoInicio)} → {fmtDate(periodoFim)}
          </div>
        )}

        {status === 'DESABILITADO' && prazoMaxDias && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#6B7280' }}>
              <span>{diasDesabilitado}d / prazo máximo</span>
              <span style={{ color: slaBarColor, fontWeight: 600 }}>{slaPercent}%</span>
            </div>
            <div className="w-full h-1.5" style={{ background: '#E2E8F0', borderRadius: '4px' }}>
              <div
                style={{
                  width: `${slaPercent}%`,
                  height: '100%',
                  background: slaBarColor,
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}

        {status === 'EM_VALIDACAO_DA_REABILITACAO' && (
          <div className="text-xs mb-2" style={{ color: '#0F766E' }}>
            Aguardando validação...
          </div>
        )}

        {status === 'EXECUCAO_AUTORIZADA' && (
          <div className="text-xs mb-2" style={{ color: '#1E40AF' }}>
            Aguardando execução
          </div>
        )}
      </div>

      {/* Line 6: Footer with contextual action buttons */}
      {hasButtons && (
        <div
          className="relative z-10 flex items-center gap-2 px-4 py-2"
          style={{ borderTop: '1px solid #F1F5F9' }}
        >
          {status === 'EM_APROVACAO' && isAprovador && (
            <Link
              href={`/solicitacoes/${id}`}
              className="px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: '#0038A8', borderRadius: '4px' }}
            >
              Analisar
            </Link>
          )}

          {status === 'EXECUCAO_AUTORIZADA' && isExecutante && (
            <Link
              href={`/solicitacoes/${id}`}
              className="px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: '#0038A8', borderRadius: '4px' }}
            >
              Executar desabilitação →
            </Link>
          )}

          {status === 'DESABILITADO' && isExecutante && (
            <>
              <Link
                href={`/solicitacoes/${id}?acao=extensao`}
                className="px-3 py-1.5 text-xs font-semibold"
                style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '4px', border: '1px solid #FDE68A' }}
              >
                Solicitar extensão
              </Link>
              <Link
                href={`/solicitacoes/${id}?acao=reabilitar`}
                className="px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: '#8B5CF6', borderRadius: '4px' }}
              >
                Reabilitar
              </Link>
            </>
          )}

          {status === 'EM_VALIDACAO_DA_REABILITACAO' && isAprovador && (
            <Link
              href={`/solicitacoes/${id}`}
              className="px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: '#10B981', borderRadius: '4px' }}
            >
              Validar
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
