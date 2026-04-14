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
        className="bg-white border shadow-sm transition-shadow hover:shadow-md p-3.5 md:p-5"
        style={{
          borderColor: '#E6ECF5',
          borderRadius: '12px',
          borderLeft: `4px solid ${classAccent(data.classe?.numero)}`,
          width: '100%',
        }}
      >
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {classeNumero && <ClasseBadge classe={classeNumero} size="sm" />}
            <span className="text-[11px] font-mono font-semibold tracking-[0.01em]" style={{ color: '#52637A' }}>
              #{data.protocolo}
            </span>
            {data.aprovacoesCount && data.aprovacoesCount.total > 0 && (
              <span className="text-[11px] font-semibold" style={{ color: '#5B6B80' }}>
                {data.aprovacoesCount.aprovadas}/{data.aprovacoesCount.total}
              </span>
            )}
          </div>
          <StatusBadge status={data.status} size="sm" />
        </div>

        <p className="mt-2 text-[18px] font-semibold leading-6 tracking-[-0.01em]" style={{ color: '#0F172A' }}>
          {data.equipamento.tag}
        </p>
        <p className="mt-1 text-[13px] leading-[1.45]" style={{ color: '#5E7087' }}>
          {data.equipamento.descricao}
        </p>
        <p className="mt-1.5 text-[12px] leading-[1.45] font-medium" style={{ color: '#63768F' }}>
          {`📍 ${areaLinha}`}
        </p>

        {contextual && (
          <div
            className="mt-3 rounded-lg border px-3 py-2 text-[12px] leading-[1.4] font-medium"
            style={{
              background: '#F6F9FD',
              color: '#5A6B83',
              border: '1px solid #DFE7F1',
            }}
          >
            {contextual}
          </div>
        )}

        {(actionLabel || secondaryActionLabel) && (
          <div className="mt-3.5 flex gap-2 flex-wrap" onClick={e => e.preventDefault()}>
            {secondaryActionLabel && secondaryActionHref && (
              <Link
                href={secondaryActionHref}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border px-4 text-[13px] font-semibold"
                style={{
                  borderColor: '#CFD9E6',
                  color: '#334155',
                }}
              >
                {secondaryActionLabel}
              </Link>
            )}
            {actionLabel && actionHref && (
              <Link
                href={actionHref}
                className="inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-[13px] font-semibold text-white"
                style={{ background: primaryColor }}
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
