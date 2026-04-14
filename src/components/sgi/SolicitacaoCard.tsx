'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseNum, StatusSolicitacao } from '@/lib/tokens'

export interface SolicitacaoCardData {
  id: string
  protocolo: string
  status: StatusSolicitacao
  tipo?: string | null
  periodoInicio?: Date | null
  periodoFim?: Date | null
  dataEnvio?: Date | null
  dataAprovacaoFinal?: Date | null
  dataDesabilitacao?: Date | null
  dataReabilitacao?: Date | null
  prazoPrevitoAtingido?: boolean
  prazoMaximoAtingido?: boolean
  equipamento: { tag: string; descricao: string }
  area: { nome: string; planta?: { nome: string } | null }
  classe: { numero: number } | null
  aprovacoesCount?: { total: number; aprovadas: number } | null
}

interface Props {
  data: SolicitacaoCardData
  href?: string
  actionLabel?: string
  actionHref?: string
  secondaryActionLabel?: string
  secondaryActionHref?: string
  primaryColor?: string
  className?: string
}

function formatDate(value?: Date | null) {
  if (!value) return '—'
  return value.toLocaleDateString('pt-BR')
}

function duracaoPeriodo(inicio?: Date | null, fim?: Date | null) {
  if (!inicio || !fim) return null
  const total = Math.max(0, fim.getTime() - inicio.getTime())
  const totalHours = Math.floor(total / 3_600_000)
  const dias = Math.floor(totalHours / 24)
  const horas = totalHours % 24
  return `${dias}d ${horas}h`
}

function getContextLine(data: SolicitacaoCardData) {
  if (data.status === 'EM_APROVACAO') {
    return `Período previsto: ${formatDate(data.periodoInicio)} → ${formatDate(data.periodoFim)}`
  }

  if (data.status === 'DESABILITADO') {
    const total = duracaoPeriodo(data.periodoInicio, data.periodoFim)
    const atual = data.dataDesabilitacao
      ? formatDistanceToNow(data.dataDesabilitacao, { locale: ptBR })
      : '0h'
    if (!total) return `Prazo em andamento: ${atual}`
    return `${atual} / ${total}`
  }

  if (data.status === 'EM_VALIDACAO_DA_REABILITACAO') {
    if (!data.dataReabilitacao) return 'Aguardando validação'
    return `Aguardando validação há ${formatDistanceToNow(data.dataReabilitacao, {
      locale: ptBR,
      addSuffix: false,
    })}`
  }

  return null
}

function classAccent(classe?: number | null) {
  if (classe === 4) return '#DC2626'
  if (classe === 3) return '#EA580C'
  if (classe === 2) return '#EAB308'
  return '#16A34A'
}

export function SolicitacaoCard({
  data,
  href,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  primaryColor = '#1D4ED8',
  className,
}: Props) {
  const contextual = getContextLine(data)
  const areaLinha = `${data.area.planta?.nome ?? '—'} - ${data.area.nome}`
  const classeNumero = data.classe?.numero as ClasseNum | undefined

  return (
    <Link
      href={href ?? `/solicitacoes/${data.id}`}
      className={`block w-full ${className ?? ''}`}
      style={{ maxWidth: '100%' }}
    >
      <div
        className="bg-white border shadow-sm hover:shadow-md transition-shadow p-4 md:p-5"
        style={{
          borderColor: '#E2E8F0',
          borderRadius: '10px',
          borderLeft: `4px solid ${classAccent(data.classe?.numero)}`,
          width: '100%',
        }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {classeNumero && <ClasseBadge classe={classeNumero} size="sm" />}
            <span className="text-xs font-mono font-medium" style={{ color: '#475569' }}>
              #{data.protocolo}
            </span>
            {data.aprovacoesCount && data.aprovacoesCount.total > 0 && (
              <span className="text-xs font-semibold" style={{ color: '#475569' }}>
                {data.aprovacoesCount.aprovadas}/{data.aprovacoesCount.total}
              </span>
            )}
          </div>
          <StatusBadge status={data.status} size="sm" />
        </div>

        <p className="text-xl font-bold mt-2" style={{ color: '#0F172A' }}>
          {data.equipamento.tag}
        </p>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          {data.equipamento.descricao}
        </p>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          {`📍 ${areaLinha}`}
        </p>

        {contextual && (
          <div
            className="mt-3 px-3 py-2 text-sm"
            style={{
              background: '#F8FAFC',
              color: '#64748B',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
            }}
          >
            {contextual}
          </div>
        )}

        {(actionLabel || secondaryActionLabel) && (
          <div className="mt-4 flex gap-2 flex-wrap" onClick={e => e.preventDefault()}>
            {secondaryActionLabel && secondaryActionHref && (
              <Link
                href={secondaryActionHref}
                className="px-4 py-2 text-sm font-medium border"
                style={{
                  borderColor: '#CBD5E1',
                  color: '#334155',
                  borderRadius: '8px',
                }}
              >
                {secondaryActionLabel}
              </Link>
            )}
            {actionLabel && actionHref && (
              <Link
                href={actionHref}
                className="px-4 py-2 text-sm font-semibold text-white"
                style={{ background: primaryColor, borderRadius: '8px' }}
              >
                {actionLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
