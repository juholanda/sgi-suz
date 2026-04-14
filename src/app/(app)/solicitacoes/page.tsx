import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { PageBreadcrumb } from '@/components/sgi/PageBreadcrumb'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseNum, STATUS_LABELS, StatusSolicitacao } from '@/lib/tokens'

type SortBy =
  | 'protocolo'
  | 'status'
  | 'classeNumero'
  | 'equipamentoTag'
  | 'areaNome'
  | 'executanteNome'
  | 'periodoInicio'
  | 'periodoFim'
  | 'updatedAt'

type SortOrder = 'asc' | 'desc'

type SearchParams = Record<string, string | string[] | undefined>

type QuickFilter = 'all' | 'andamento' | 'rascunhos'

const QUICK_STATUS: Record<Exclude<QuickFilter, 'all'>, StatusSolicitacao[]> = {
  andamento: [
    'EM_APROVACAO',
    'EXECUCAO_AUTORIZADA',
    'EM_EXECUCAO',
    'DESABILITADO',
    'EM_REABILITACAO',
    'EM_VALIDACAO_DA_REABILITACAO',
    'EXTENSAO_EM_ANALISE',
  ],
  rascunhos: ['RASCUNHO'],
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value: value as StatusSolicitacao,
  label,
}))

const SORT_COLUMNS: Array<{ key: SortBy; label: string }> = [
  { key: 'protocolo', label: 'Protocolo' },
  { key: 'status', label: 'Status' },
  { key: 'classeNumero', label: 'Classe' },
  { key: 'equipamentoTag', label: 'TAG' },
  { key: 'areaNome', label: 'Área' },
  { key: 'executanteNome', label: 'Executante' },
  { key: 'periodoInicio', label: 'Início' },
  { key: 'periodoFim', label: 'Fim' },
  { key: 'updatedAt', label: 'Atualizado em' },
]

function pickParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function parseSortBy(value: string): SortBy {
  const valid = SORT_COLUMNS.some(col => col.key === value)
  return valid ? (value as SortBy) : 'updatedAt'
}

function parseSortOrder(value: string): SortOrder {
  return value === 'asc' ? 'asc' : 'desc'
}

function parseQuick(value: string): QuickFilter {
  if (value === 'andamento' || value === 'rascunhos') return value
  return 'all'
}

function buildOrderBy(sortBy: SortBy, sortOrder: SortOrder): Prisma.SolicitacaoOrderByWithRelationInput {
  switch (sortBy) {
    case 'protocolo':
      return { protocolo: sortOrder }
    case 'status':
      return { status: sortOrder }
    case 'classeNumero':
      return { classe: { numero: sortOrder } }
    case 'equipamentoTag':
      return { equipamento: { tag: sortOrder } }
    case 'areaNome':
      return { area: { nome: sortOrder } }
    case 'executanteNome':
      return { executante: { nome: sortOrder } }
    case 'periodoInicio':
      return { periodoInicio: sortOrder }
    case 'periodoFim':
      return { periodoFim: sortOrder }
    default:
      return { updatedAt: sortOrder }
  }
}

function formatDateTime(value: Date | null) {
  if (!value) return '—'
  return value.toLocaleString('pt-BR')
}

function buildQueryString(base: URLSearchParams, updates: Record<string, string>) {
  const next = new URLSearchParams(base.toString())
  for (const [key, value] of Object.entries(updates)) {
    if (!value) next.delete(key)
    else next.set(key, value)
  }
  return next.toString()
}

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const quick = parseQuick(pickParam(searchParams?.quick))
  const status = pickParam(searchParams?.status)
  const classe = pickParam(searchParams?.classe)
  const areaId = pickParam(searchParams?.areaId)
  const sortBy = parseSortBy(pickParam(searchParams?.sortBy))
  const sortOrder = parseSortOrder(pickParam(searchParams?.sortOrder))

  const quickStatuses =
    !status && quick !== 'all' ? QUICK_STATUS[quick as Exclude<QuickFilter, 'all'>] : undefined

  const where: Prisma.SolicitacaoWhereInput = {
    ...(status
      ? { status }
      : quickStatuses
      ? { status: { in: quickStatuses } }
      : {}),
    ...(classe ? { classe: { numero: Number(classe) } } : {}),
    ...(areaId ? { areaId } : {}),
  }

  const baseWhere: Prisma.SolicitacaoWhereInput = {
    ...(classe ? { classe: { numero: Number(classe) } } : {}),
    ...(areaId ? { areaId } : {}),
  }

  const [items, total, areas, allCount, andamentoCount, rascunhosCount] = await Promise.all([
    prisma.solicitacao.findMany({
      where,
      include: {
        equipamento: true,
        area: { include: { planta: true } },
        classe: true,
        solicitante: { select: { nome: true } },
        executante: { select: { nome: true } },
      },
      orderBy: buildOrderBy(sortBy, sortOrder),
      take: 200,
    }),
    prisma.solicitacao.count({ where }),
    prisma.area.findMany({
      where: { ativa: true, planta: { ativa: true } },
      include: { planta: { select: { nome: true } } },
      orderBy: [{ planta: { nome: 'asc' } }, { nome: 'asc' }],
    }),
    prisma.solicitacao.count({ where: baseWhere }),
    prisma.solicitacao.count({
      where: { ...baseWhere, status: { in: QUICK_STATUS.andamento } },
    }),
    prisma.solicitacao.count({
      where: { ...baseWhere, status: { in: QUICK_STATUS.rascunhos } },
    }),
  ])

  const filterInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#0F172A',
    outline: 'none',
    background: 'white',
    fontFamily: 'inherit',
  }

  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (quick !== 'all') query.set('quick', quick)
  if (classe) query.set('classe', classe)
  if (areaId) query.set('areaId', areaId)
  if (sortBy) query.set('sortBy', sortBy)
  if (sortOrder) query.set('sortOrder', sortOrder)

  const quickChips: Array<{ key: QuickFilter; label: string; count: number }> = [
    { key: 'all', label: 'Todas', count: allCount },
    { key: 'andamento', label: 'Em andamento', count: andamentoCount },
    { key: 'rascunhos', label: 'Rascunhos', count: rascunhosCount },
  ]

  const mobileCardAction = (statusValue: StatusSolicitacao) => {
    if (statusValue === 'EXECUCAO_AUTORIZADA') return 'Executar desabilitação →'
    if (statusValue === 'EM_APROVACAO') return 'Analisar'
    if (statusValue === 'DESABILITADO') return 'Reabilitar'
    if (statusValue === 'EM_VALIDACAO_DA_REABILITACAO') return 'Validar'
    return undefined
  }

  return (
    <div className="p-6">
      <PageBreadcrumb
        backHref="/dashboard"
        items={[
          { label: 'Início', href: '/dashboard' },
          { label: 'Solicitações' },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
            Solicitações
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#475569' }}>
            Consulta com filtros e ordenação por coluna
          </p>
        </div>
        <Link
          href="/solicitacoes/nova"
          className="px-4 py-2 text-sm font-medium text-white"
          style={{ background: '#0038A8', borderRadius: '4px' }}
        >
          + Nova Solicitação
        </Link>
      </div>

      <form
        method="get"
        className="mb-4 hidden grid gap-3 border bg-white p-4 md:grid md:grid-cols-4"
        style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
      >
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: '#475569' }}>
            Status
          </label>
          <select name="status" defaultValue={status} style={filterInputStyle}>
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: '#475569' }}>
            Classe
          </label>
          <select name="classe" defaultValue={classe} style={filterInputStyle}>
            <option value="">Todas as classes</option>
            {[1, 2, 3, 4, 5].map(numero => (
              <option key={numero} value={numero}>
                Classe {numero}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: '#475569' }}>
            Área
          </label>
          <select name="areaId" defaultValue={areaId} style={filterInputStyle}>
            <option value="">Todas as áreas</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>
                {area.planta.nome} · {area.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-[38px] px-4 text-sm font-medium text-white"
            style={{ background: '#0038A8', borderRadius: '4px' }}
          >
            Aplicar filtros
          </button>
          <Link
            href="/solicitacoes"
            className="h-[38px] px-4 text-sm font-medium inline-flex items-center justify-center border"
            style={{ borderColor: '#E2E8F0', color: '#475569', borderRadius: '4px' }}
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="mb-3 text-sm" style={{ color: '#64748B' }}>
        {total} solicitação(ões) encontrada(s)
      </div>

      <div className="mb-4 md:hidden">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {quickChips.map(chip => {
            const href = `/solicitacoes?${buildQueryString(query, {
              quick: chip.key === 'all' ? '' : chip.key,
              status: '',
            })}`
            const active = quick === chip.key && !status
            return (
              <Link
                key={chip.key}
                href={href}
                className="whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium"
                style={{
                  borderColor: active ? '#0038A8' : '#CBD5E1',
                  background: active ? '#1E40AF' : '#F8FAFC',
                  color: active ? '#FFFFFF' : '#475569',
                }}
              >
                {chip.label} ({chip.count})
              </Link>
            )
          })}
        </div>

        <details className="rounded border bg-white" style={{ borderColor: '#E2E8F0' }}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium" style={{ color: '#334155' }}>
            Filtros avançados
          </summary>
          <form method="get" className="grid gap-3 border-t p-4" style={{ borderColor: '#E2E8F0' }}>
            {quick !== 'all' && <input type="hidden" name="quick" value={quick} />}
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: '#475569' }}>
                Status
              </label>
              <select name="status" defaultValue={status} style={filterInputStyle}>
                <option value="">Todos os status</option>
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: '#475569' }}>
                Classe
              </label>
              <select name="classe" defaultValue={classe} style={filterInputStyle}>
                <option value="">Todas as classes</option>
                {[1, 2, 3, 4, 5].map(numero => (
                  <option key={numero} value={numero}>
                    Classe {numero}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: '#475569' }}>
                Área
              </label>
              <select name="areaId" defaultValue={areaId} style={filterInputStyle}>
                <option value="">Todas as áreas</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.planta.nome} · {area.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="h-[38px] px-4 text-sm font-medium text-white"
                style={{ background: '#0038A8', borderRadius: '4px' }}
              >
                Aplicar
              </button>
              <Link
                href="/solicitacoes"
                className="h-[38px] inline-flex items-center justify-center border px-4 text-sm font-medium"
                style={{ borderColor: '#E2E8F0', color: '#475569', borderRadius: '4px' }}
              >
                Limpar
              </Link>
            </div>
          </form>
        </details>
      </div>

      {items.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 border bg-white px-4 py-10 text-sm"
          style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#94A3B8' }}
        >
          <span style={{ fontSize: '20px' }}>🗂️</span>
          <span>Nenhuma solicitação encontrada</span>
          <Link href="/solicitacoes/nova" className="text-xs font-medium" style={{ color: '#0038A8' }}>
            Criar nova solicitação
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map(item => (
              <SolicitacaoCard
                key={item.id}
                data={{
                  id: item.id,
                  protocolo: item.protocolo,
                  status: item.status as StatusSolicitacao,
                  equipamento: { tag: item.equipamento.tag, descricao: item.equipamento.descricao },
                  area: { nome: item.area.nome, planta: { nome: item.area.planta.nome } },
                  classe: item.classe ? { numero: item.classe.numero } : null,
                  periodoInicio: item.periodoInicio,
                  periodoFim: item.periodoFim,
                  dataEnvio: item.dataEnvio,
                  dataAprovacaoFinal: item.dataAprovacaoFinal,
                  dataDesabilitacao: item.dataDesabilitacao,
                  dataReabilitacao: item.dataReabilitacao,
                  prazoPrevitoAtingido: item.prazoPrevitoAtingido,
                  prazoMaximoAtingido: item.prazoMaximoAtingido,
                }}
                actionHref={`/solicitacoes/${item.id}`}
                actionLabel={mobileCardAction(item.status as StatusSolicitacao)}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto border bg-white md:block" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <table className="min-w-full text-sm">
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {SORT_COLUMNS.map(column => {
                  const isActive = sortBy === column.key
                  const nextOrder: SortOrder = isActive && sortOrder === 'asc' ? 'desc' : 'asc'
                  const href = `/solicitacoes?${buildQueryString(query, {
                    sortBy: column.key,
                    sortOrder: nextOrder,
                  })}`
                  return (
                    <th
                      key={column.key}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#475569' }}
                    >
                      <Link href={href} className="inline-flex items-center gap-1 hover:underline">
                        {column.label}
                        {isActive && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </Link>
                    </th>
                  )
                })}
                <th
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#475569' }}
                >
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-t" style={{ borderColor: '#E2E8F0' }}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs" style={{ color: '#334155' }}>
                    #{item.protocolo}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={item.status as StatusSolicitacao} size="sm" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {item.classe ? <ClasseBadge classe={item.classe.numero as ClasseNum} size="sm" /> : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold" style={{ color: '#0F172A' }}>
                    {item.equipamento.tag}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: '#334155' }}>
                    {item.area.planta.nome} · {item.area.nome}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: '#334155' }}>
                    {item.executante?.nome ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: '#334155' }}>
                    {formatDateTime(item.periodoInicio)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: '#334155' }}>
                    {formatDateTime(item.periodoFim)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: '#334155' }}>
                    {formatDateTime(item.updatedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/solicitacoes/${item.id}`} className="text-sm font-medium" style={{ color: '#0038A8' }}>
                      Ver detalhe
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  )
}
