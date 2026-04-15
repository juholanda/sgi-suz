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
  equipamento: { tag: string; tipo?: string | null }
  area: { nome: string; planta: { nome: string } }
  classe: { numero: number; prazoMaximoDias: number | null } | null
  solicitante: { nome: string }
}

type SortDir = 'asc' | 'desc'

const SORTABLE_COLS: Record<string, string> = {
  protocolo: 'Protocolo',
  tag: 'TAG',
  tipo: 'Tipo',
  classe: 'Classe',
  status: 'Status',
  solicitante: 'Solicitante',
  updatedAt: 'Atualizado em',
  periodo: 'Período',
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
    { key: 'classe',    label: 'Classe',     sortable: true },
    { key: 'protocolo', label: 'Protocolo', sortable: true },
    { key: 'tag',       label: 'TAG',        sortable: true },
    { key: 'tipo',      label: 'Tipo',       sortable: true },
    { key: 'status',    label: 'Status',     sortable: true },
    { key: 'solicitante', label: 'Solicitante', sortable: true },
    { key: 'updatedAt', label: 'Atualizado em', sortable: true },
    { key: 'periodo',   label: 'Período',    sortable: true },
  ]

  return (
    <div className="hidden sm:block overflow-x-auto bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
      <table className="w-full text-sm border-collapse" style={{ minWidth: '900px' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            {COLS.map(col => (
              <th
                key={col.key}
                className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap"
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
            {/* Sticky "Ver" header */}
            <th
              className="text-left px-4 py-3 text-xs font-semibold"
              style={{
                position: 'sticky',
                right: 0,
                background: '#F8FAFC',
                zIndex: 1,
                color: '#64748B',
                boxShadow: '-1px 0 0 #E2E8F0',
              }}
            >
              Ver
            </th>
          </tr>
        </thead>
        <tbody>
          {solicitacoes.map(s => (
            <tr
              key={s.id}
              className="border-b hover:bg-slate-50 transition-colors"
              style={{ borderColor: '#F1F5F9', cursor: 'pointer', background: '#FFFFFF' }}
              onClick={() => router.push(`/solicitacoes/${s.id}`)}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
              </td>
              <td className="px-4 py-3 font-sans text-xs font-semibold whitespace-nowrap" style={{ color: '#374151' }}>
                #{s.protocolo}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="font-sans text-xs font-bold" style={{ color: '#0F172A' }}>{s.equipamento.tag}</span>
              </td>
              <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#6B7280' }}>
                {s.equipamento.tipo
                  ? TIPO_LABELS[s.equipamento.tipo] ?? s.equipamento.tipo
                  : s.tipo
                    ? TIPO_LABELS[s.tipo] ?? s.tipo
                    : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
              </td>
              <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#6B7280' }}>
                {s.solicitante.nome}
              </td>
              <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#6B7280' }}>
                {format(s.updatedAt, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
              </td>
              <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#6B7280' }}>
                {s.periodoInicio
                  ? `${format(s.periodoInicio, 'dd/MM/yy', { locale: ptBR })} → ${s.periodoFim ? format(s.periodoFim, 'dd/MM/yy', { locale: ptBR }) : '—'}`
                  : '—'}
              </td>
              {/* Sticky "Ver" cell */}
              <td
                className="px-4 py-3 whitespace-nowrap"
                style={{
                  position: 'sticky',
                  right: 0,
                  background: 'white',
                  zIndex: 1,
                  boxShadow: '-1px 0 0 #F1F5F9',
                }}
                onClick={e => e.stopPropagation()}
              >
                <Link
                  href={`/solicitacoes/${s.id}`}
                  className="text-xs font-medium"
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
