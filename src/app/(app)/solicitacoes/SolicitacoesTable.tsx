'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusSolicitacao, ClasseNum } from '@/lib/tokens'

const TIPO_LABELS: Record<string, { label: string; icon: string }> = {
  LOGICO: { label: 'Lógico', icon: 'memory' },
  FISICO: { label: 'Físico', icon: 'precision_manufacturing' },
  DISPOSITIVO_SEGURANCA: { label: 'Disp. Segurança', icon: 'shield' },
}

type Solicitacao = {
  id: string
  protocolo: string
  status: string
  tipo: string | null
  periodoInicio: Date | null
  periodoFim: Date | null
  updatedAt: Date
  dataDesabilitacao: Date | null
  dataReabilitacao?: Date | null
  prazoMaximoAtingido?: boolean
  prazoPrevitoAtingido?: boolean
  equipamento: { tag: string; tipo?: string | null }
  area: { nome: string; planta: { nome: string } }
  classe: { numero: number; prazoMaximoDias: number | null } | null
  solicitante: { nome: string }
}

type SortDir = 'asc' | 'desc'

const SORTABLE_COLS: Record<string, string> = {
  protocolo: 'Protocolo',
  tag: 'TAG',
  area: 'Área',
  classe: 'Classe',
  tipo: 'Tipo',
  periodo: 'Período',
  status: 'Status',
  updatedAt: 'Atualizado em',
}

/** Calcula indicador de prazo (DESABILITADO, EXECUCAO_AUTORIZADA, EM_VALIDACAO_DA_REABILITACAO) */
function getPrazoIndicator(s: Solicitacao): { text: string; color: string; dot: string; pulse: boolean } | null {
  const now = new Date()
  // Texto sempre em cinza escuro — a urgência vem pelo dot colorido + pulse
  const TEXT_COLOR = '#334155'

  // Para DESABILITADO: calcula baseado em dataDesabilitacao + prazoMaximoDias
  if (s.status === 'DESABILITADO' && s.dataDesabilitacao && s.classe?.prazoMaximoDias) {
    const desab = new Date(s.dataDesabilitacao)
    const limite = new Date(desab)
    limite.setDate(limite.getDate() + s.classe.prazoMaximoDias)
    const diffMs = limite.getTime() - now.getTime()
    const diffHoras = Math.ceil(diffMs / 3_600_000)

    // Atrasado
    if (diffMs < 0) {
      const atrasoH = Math.abs(diffHoras)
      if (atrasoH < 24) return { text: `Reabilitação atrasada ${atrasoH}h`, color: TEXT_COLOR, dot: '#DC2626', pulse: true }
      const atrasoD = Math.ceil(atrasoH / 24)
      return { text: `Reabilitação atrasada ${atrasoD}d`, color: TEXT_COLOR, dot: '#DC2626', pulse: true }
    }
    // Últimas 24h
    if (diffHoras <= 24) {
      return { text: `Faltam ${diffHoras}h para reabilitar`, color: TEXT_COLOR, dot: '#DC2626', pulse: true }
    }
    // 24-48h → "até amanhã"
    if (diffHoras <= 48) {
      return { text: 'Reabilitar até amanhã', color: TEXT_COLOR, dot: '#D97706', pulse: false }
    }
    // 48h+ → não mostra nada (sem ruído visual)
    return null
  }

  // Para EXECUCAO_AUTORIZADA: verifica se já passou do periodoFim
  if (s.status === 'EXECUCAO_AUTORIZADA' && s.periodoFim) {
    const fim = new Date(s.periodoFim)
    const diffMs = fim.getTime() - now.getTime()
    const diffHoras = Math.ceil(diffMs / 3_600_000)

    if (diffMs < 0) {
      const atrasoH = Math.abs(diffHoras)
      if (atrasoH < 24) return { text: `Execução atrasada ${atrasoH}h`, color: TEXT_COLOR, dot: '#DC2626', pulse: true }
      const atrasoD = Math.ceil(atrasoH / 24)
      return { text: `Execução atrasada ${atrasoD}d`, color: TEXT_COLOR, dot: '#DC2626', pulse: true }
    }
    if (diffHoras <= 24) {
      return { text: `Faltam ${diffHoras}h para executar`, color: TEXT_COLOR, dot: '#DC2626', pulse: true }
    }
    if (diffHoras <= 48) {
      return { text: 'Executar até amanhã', color: TEXT_COLOR, dot: '#D97706', pulse: false }
    }
    // 48h+ → não mostra nada
    return null
  }

  // Para EM_VALIDACAO_DA_REABILITACAO — só mostra se passou de 3 dias aguardando
  if (s.status === 'EM_VALIDACAO_DA_REABILITACAO' && s.dataReabilitacao) {
    const reab = new Date(s.dataReabilitacao)
    const dias = Math.floor((now.getTime() - reab.getTime()) / 86_400_000)
    if (dias > 3) {
      return { text: `Aguardando validação há ${dias}d`, color: TEXT_COLOR, dot: '#94A3B8', pulse: false }
    }
  }

  return null
}

interface Props {
  solicitacoes: Solicitacao[]
}

export default function SolicitacoesTable({ solicitacoes }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sortCol = searchParams.get('sortCol') ?? ''
  const sortDir = (searchParams.get('sortDir') ?? 'asc') as SortDir

  function handleSort(col: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (sortCol === col) {
      p.set('sortDir', sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      p.set('sortCol', col)
      p.set('sortDir', 'asc')
    }
    router.push(`${pathname}?${p.toString()}`)
  }

  function SortChevron({ col }: { col: string }) {
    if (!(col in SORTABLE_COLS)) return null
    const active = sortCol === col
    return (
      <span
        className="material-symbols-outlined ml-1 align-middle select-none"
        style={{ fontSize: 13, lineHeight: 1, color: active ? '#0038A8' : '#64748B', verticalAlign: 'middle' }}
      >
        {active && sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
      </span>
    )
  }

  const COLS: { key: string; label: string; sortable: boolean }[] = [
    { key: 'protocolo', label: 'Protocolo', sortable: true },
    { key: 'tag',       label: 'TAG',        sortable: true },
    { key: 'area',      label: 'Área',       sortable: true },
    { key: 'classe',    label: 'Classe',     sortable: true },
    { key: 'tipo',      label: 'Tipo',       sortable: true },
    { key: 'periodo',   label: 'Período',    sortable: true },
    { key: 'status',    label: 'Status',     sortable: true },
    { key: 'updatedAt', label: 'Atualizado em', sortable: true },
  ]

  return (
    <div className="hidden sm:block overflow-x-auto bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
      <table className="w-full text-sm border-collapse" style={{ minWidth: '960px' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            {COLS.map(col => (
              <th
                key={col.key}
                className="text-left px-4 py-3.5 text-sm font-semibold whitespace-nowrap"
                style={{
                  color: sortCol === col.key ? '#0038A8' : '#1E293B',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                {col.label}
                {col.sortable && <SortChevron col={col.key} />}
              </th>
            ))}
            {/* Sticky "Ações" header */}
            <th
              className="text-left px-4 py-3.5 text-sm font-semibold"
              style={{
                position: 'sticky',
                right: 0,
                background: '#F8FAFC',
                zIndex: 1,
                color: '#1E293B',
                boxShadow: '-1px 0 0 #E2E8F0',
              }}
            >
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {solicitacoes.map(s => (
            <tr
              key={s.id}
              className="border-b hover:bg-slate-50 transition-colors"
              style={{ borderColor: '#E5E7EB', cursor: 'pointer', background: '#FFFFFF' }}
              onClick={() => router.push(`/solicitacoes/${s.id}`)}
            >
              <td className="px-4 py-3.5 font-sans text-sm whitespace-nowrap" style={{ color: '#1F2937' }}>
                #{s.protocolo}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="font-sans text-sm" style={{ color: '#0F172A' }}>{s.equipamento.tag}</span>
              </td>
              <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={{ color: '#4B5563' }}>
                {s.area.nome}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
              </td>
              <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={{ color: '#4B5563' }}>
                {(() => {
                  const tipo = s.equipamento.tipo ?? s.tipo
                  const info = tipo ? TIPO_LABELS[tipo] : null
                  if (!info) return '—'
                  return (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, color: '#64748B' }}>{info.icon}</span>
                      {info.label}
                    </span>
                  )
                })()}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="text-sm" style={{ color: '#4B5563' }}>
                  {s.periodoInicio
                    ? `${format(s.periodoInicio, 'dd/MM/yy', { locale: ptBR })} → ${s.periodoFim ? format(s.periodoFim, 'dd/MM/yy', { locale: ptBR }) : '—'}`
                    : '—'}
                </div>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                {(() => {
                  const prazo = getPrazoIndicator(s)
                  if (!prazo) return null
                  return (
                    <div className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 400, fontFamily: 'Inter, sans-serif', color: prazo.color, lineHeight: 1.2, marginTop: 6 }}>
                      <span
                        style={{
                          width: 7, height: 7, borderRadius: '50%', background: prazo.dot, flexShrink: 0,
                        }}
                      />
                      {prazo.text}
                    </div>
                  )
                })()}
              </td>
              <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={{ color: '#4B5563' }}>
                {format(s.updatedAt, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
              </td>
              {/* Sticky "Ver" cell */}
              <td
                className="px-4 py-3.5 whitespace-nowrap"
                style={{
                  position: 'sticky',
                  right: 0,
                  background: 'white',
                  zIndex: 1,
                  boxShadow: '-1px 0 0 #E5E7EB',
                }}
                onClick={e => e.stopPropagation()}
              >
                <Link
                  href={`/solicitacoes/${s.id}`}
                  className="text-sm font-medium"
                  style={{ color: '#0038A8' }}
                >
                  Ver →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
