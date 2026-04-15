'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ViewToggle, type ViewMode } from '@/components/ui/view-toggle'

interface Area {
  id: string
  nome: string
  planta: { nome: string }
}

interface Props {
  areas: Area[]
  showViewToggle?: boolean
}

const STATUS_OPTIONS = [
  { value: 'EM_APROVACAO', label: 'Em aprovação' },
  { value: 'EXECUCAO_AUTORIZADA', label: 'Exec. autorizada' },
  { value: 'EM_EXECUCAO', label: 'Em execução' },
  { value: 'DESABILITADO', label: 'Desabilitado' },
  { value: 'EM_REABILITACAO', label: 'Em reabilitação' },
  { value: 'EM_VALIDACAO_DA_REABILITACAO', label: 'Validação reab.' },
  { value: 'ENCERRADA', label: 'Encerrada' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'REJEITADA', label: 'Rejeitada' },
  { value: 'RASCUNHO', label: 'Rascunho' },
]

export function SolicitacoesFilters({ areas, showViewToggle = false }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Read current values from URL
  const currentSearch = searchParams.get('search') ?? ''
  const currentClasse = (searchParams.get('classe') ?? '').split(',').filter(Boolean)
  const currentAreaId = searchParams.get('areaId') ?? ''
  const currentSort = searchParams.get('sort') ?? 'recentes'
  const currentTipo = searchParams.get('tipo') ?? ''
  const currentStatus = searchParams.get('statusFiltro') ?? ''

  const [search, setSearch] = useState(currentSearch)

  useEffect(() => { setSearch(currentSearch) }, [currentSearch])

  function buildParams(overrides: Record<string, string | string[] | null>) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
        p.delete(k)
      } else if (Array.isArray(v)) {
        p.set(k, v.join(','))
      } else {
        p.set(k, v)
      }
    }
    return p.toString()
  }

  function navigate(overrides: Record<string, string | string[] | null>) {
    const qs = buildParams(overrides)
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  function toggleClasse(c: string) {
    const next = currentClasse.includes(c)
      ? currentClasse.filter(x => x !== c)
      : [...currentClasse, c]
    navigate({ classe: next })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate({ search: search.trim() || null })
  }

  const hasActiveFilters = currentClasse.length > 0 || currentAreaId || currentSearch || currentTipo || currentStatus

  const currentView = searchParams.get('view') ?? 'table'

  return (
    <div className="mb-4 space-y-3">
      {/* Top bar: search + filters (left) / sort + view toggle (right) */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Left: search + filters */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1" style={{ minWidth: '280px' }}>
          <div className="relative" style={{ maxWidth: '320px', flex: '1 1 auto' }}>
            <span
              className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1 }}
            >
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por TAG, protocolo ou solicitante..."
              className="w-full pl-9 pr-3 py-2 text-sm border outline-none"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#0F172A', background: 'white' }}
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); navigate({ search: null }) }}
              className="px-3 py-2 text-sm border"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#64748B' }}
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border"
            style={{
              borderColor: open || hasActiveFilters ? '#0038A8' : '#E2E8F0',
              borderRadius: '4px',
              background: open || hasActiveFilters ? '#EBF0FB' : 'white',
              color: open || hasActiveFilters ? '#0038A8' : '#64748B',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>tune</span>
            Filtros
            {hasActiveFilters && (
              <span
                className="w-4 h-4 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: '#0038A8', borderRadius: '50%' }}
              >
                {[currentClasse.length > 0, !!currentAreaId, !!currentSearch, !!currentTipo, !!currentStatus].filter(Boolean).length}
              </span>
            )}
          </button>
        </form>

        {/* Right: sort + view toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs" style={{ color: '#64748B', whiteSpace: 'nowrap' }}>Ordenar por</span>
            <select
              value={currentSort}
              onChange={e => navigate({ sort: e.target.value })}
              className="px-2 py-2 text-sm border outline-none"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#374151', background: 'white' }}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigas">Mais antigas</option>
              <option value="prazo">Por prazo</option>
            </select>
          </div>

          {showViewToggle && (
            <ViewToggle
              className="hidden sm:inline-flex"
              value={currentView as ViewMode}
              onChange={(mode) => navigate({ view: mode === 'table' ? null : mode })}
            />
          )}
        </div>
      </div>

      {/* Advanced filters panel */}
      {open && (
        <div
          ref={ref}
          className="p-4 space-y-4 border"
          style={{ borderColor: '#E2E8F0', borderRadius: '4px', background: '#F8FAFC' }}
        >
          {/* Área */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Área</label>
            <select
              value={currentAreaId}
              onChange={e => navigate({ areaId: e.target.value || null })}
              className="w-full px-3 py-2 text-sm border outline-none"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#374151', background: 'white' }}
            >
              <option value="">Todas as áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.planta.nome} › {a.nome}</option>
              ))}
            </select>
          </div>

          {/* Classe */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Classe</label>
            <div className="flex gap-2">
              {['1', '2', '3', '4'].map(c => {
                const active = currentClasse.includes(c)
                const colors: Record<string, string> = { '1': '#1D4ED8', '2': '#0D9488', '3': '#EA580C', '4': '#DC2626' }
                const color = colors[c]
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleClasse(c)}
                    className="px-3 py-1.5 text-xs font-semibold border transition-all"
                    style={{
                      borderRadius: '4px',
                      borderColor: active ? color : '#E2E8F0',
                      background: active ? `${color}18` : 'white',
                      color: active ? color : '#6B7280',
                    }}
                  >
                    CL{c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tipo de intertravamento */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Tipo de Intertravamento</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'LOGICO', label: 'Lógico' },
                { value: 'FISICO', label: 'Físico' },
                { value: 'DISPOSITIVO_SEGURANCA', label: 'Disp. Segurança' },
              ].map(t => {
                const active = currentTipo === t.value
                return (
                  <button key={t.value} type="button" onClick={() => navigate({ tipo: active ? null : t.value })}
                    className="px-3 py-1.5 text-xs font-medium border transition-all"
                    style={{ borderRadius: '4px', borderColor: active ? '#0038A8' : '#E2E8F0', background: active ? '#EBF0FB' : 'white', color: active ? '#0038A8' : '#6B7280' }}>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => {
                const active = currentStatus === opt.value
                return (
                  <button key={opt.value} type="button" onClick={() => navigate({ statusFiltro: active ? null : opt.value })}
                    className="px-3 py-1.5 text-xs font-medium border transition-all"
                    style={{ borderRadius: '4px', borderColor: active ? '#0038A8' : '#E2E8F0', background: active ? '#EBF0FB' : 'white', color: active ? '#0038A8' : '#6B7280' }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Limpar */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                navigate({ search: null, classe: null, areaId: null, tipo: null, statusFiltro: null })
              }}
              className="text-xs font-medium"
              style={{ color: '#DC2626' }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
