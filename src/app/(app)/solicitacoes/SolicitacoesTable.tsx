'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusSolicitacao, ClasseNum } from '@/lib/tokens'

const TIPO_LABELS: Record<string, string> = {
  LOGICO: 'Lógico',
  FISICO: 'Físico',
  DISPOSITIVO_SEGURANCA: 'Disp. Segurança',
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
  equipamento: { tag: string; tipo?: string | null }
  area: { nome: string; planta: { nome: string } }
  classe: { numero: number; prazoMaximoDias: number | null } | null
  solicitante: { nome: string }
}

type SortDir = 'asc' | 'desc'

const SORTABLE_COLS: Record<string, string> = {
  protocolo: 'Protocolo',
  tag: 'TAG',
  classe: 'Classe',
  tipo: 'Tipo',
  periodo: 'Período',
  updatedAt: 'Atualizado em',
  status: 'Status',
}

/** Calcula indicador de prazo de reabilitação (só para DESABILITADO) */
function getPrazoIndicator(s: Solicitacao): { text: string; color: string; dot: string } | null {
  if (s.status !== 'DESABILITADO') return null
  if (!s.dataDesabilitacao || !s.classe?.prazoMaximoDias) return null

  const now = new Date()
  const desab = new Date(s.dataDesabilitacao)
  const limite = new Date(desab)
  limite.setDate(limite.getDate() + s.classe.prazoMaximoDias)

  const diffMs = limite.getTime() - now.getTime()
  const diffDias = Math.ceil(diffMs / 86_400_000)

  if (diffDias < 0) {
    const atraso = Math.abs(diffDias)
    return { text: `Reabilitação atrasada ${atraso}d`, color: '#DC2626', dot: '#DC2626' }
  }
  if (diffDias === 0) {
    return { text: 'Reabilitar hoje', color: '#EA580C', dot: '#EA580C' }
  }
  if (diffDias === 1) {
    return { text: 'Reabilitar até amanhã', color: '#D97706', dot: '#D97706' }
  }
  if (diffDias <= 2) {
    return { text: `Reabilitar em ${diffDias}d`, color: '#D97706', dot: '#D97706' }
  }
  // Prazo ok, sem indicador
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
        style={{ fontSize: 13, lineHeight: 1, color: active ? '#0038A8' : '#CBD5E1', verticalAlign: 'middle' }}
      >
        {active && sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
      </span>
    )
  }

  const COLS: { key: string; label: string; sortable: boolean }[] = [
    { key: 'protocolo', label: 'Protocolo', sortable: true },
    { key: 'tag',       label: 'TAG',        sortable: true },
    { key: 'classe',    label: 'Classe',     sortable: true },
    { key: 'tipo',      label: 'Tipo',       sortable: true },
    { key: 'periodo',   label: 'Período',    sortable: true },
    { key: 'updatedAt', label: 'Atualizado em', sortable: true },
    { key: 'status',    label: 'Status',     sortable: true },
  ]

  return (
    <div className="hidden sm:block overflow-x-auto bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
      <table className="w-full text-sm border-collapse" style={{ minWidth: '960px' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            {COLS.map(col => (
              <th
                key={col.key}
                className="text-left px-4 py-3.5 text-xs font-semibold whitespace-nowrap"
                style={{
                  color: sortCol === col.key ? '#0038A8' : '#64748B',
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
              className="text-left px-4 py-3.5 text-xs font-semibold"
              style={{
                position: 'sticky',
                right: 0,
                background: '#F8FAFC',
                zIndex: 1,
                color: '#64748B',
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
              <td className="px-4 py-3.5 whitespace-nowrap">
                {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
              </td>
              <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={{ color: '#4B5563' }}>
                {s.equipamento.tipo
                  ? TIPO_LABELS[s.equipamento.tipo] ?? s.equipamento.tipo
                  : s.tipo
                    ? TIPO_LABELS[s.tipo] ?? s.tipo
                    : '—'}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="text-sm" style={{ color: '#4B5563' }}>
                  {s.periodoInicio
                    ? `${format(s.periodoInicio, 'dd/MM/yy', { locale: ptBR })} → ${s.periodoFim ? format(s.periodoFim, 'dd/MM/yy', { locale: ptBR }) : '—'}`
                    : '—'}
                </div>
                {(() => {
                  const prazo = getPrazoIndicator(s)
                  if (!prazo) return null
                  return (
                    <div className="flex items-center gap-1" style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: prazo.color, fontWeight: 500, lineHeight: 1.2, marginTop: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: prazo.dot, flexShrink: 0 }} />
                      {prazo.text}
                    </div>
                  )
                })()}
              </td>
              <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={{ color: '#4B5563' }}>
                {format(s.updatedAt, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
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
