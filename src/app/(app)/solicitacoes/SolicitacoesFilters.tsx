'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

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

export function SolicitacoesFilters({ areas, showViewToggle }: Props) {
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
  const currentView = searchParams.get('view') ?? 'table'

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

  return (
    <div className="mb-4 space-y-3">
      {/* Search bar + actions row */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative" style={{ maxWidth: '320px', flex: '1 1 320px' }}>
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1 }}
          >
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por TAG, protocolo ou solicitante..."
            className="field-input"
            style={{ paddingLeft: 36 }}
          />
        </div>

        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); navigate({ search: null }) }}
            className="field-input"
            style={{
              width: 40, height: 40, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748B' }}>close</span>
          </button>
        )}

        {/* Filtros button */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 shrink-0"
          style={{
            height: 40,
            border: `1.5px solid ${open || hasActiveFilters ? '#0038A8' : '#E2E8F0'}`,
            borderRadius: 6,
            background: open || hasActiveFilters ? '#EBF0FB' : 'white',
            color: open || hasActiveFilters ? '#0038A8' : '#64748B',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'border-color 120ms ease, background 120ms ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>tune</span>
          Filtros
          {hasActiveFilters && (
            <span
              className="w-4 h-4 flex items-center justify-center text-xs font-bold text-white"
              style={{ background: '#0038A8', borderRadius: '50%', fontSize: 10 }}
            >
              {[currentClasse.length > 0, !!currentAreaId, !!currentSearch, !!currentTipo, !!currentStatus].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={e => navigate({ sort: e.target.value })}
          className="field-input shrink-0"
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="recentes">Mais recentes</option>
          <option value="antigas">Mais antigas</option>
          <option value="prazo">Por prazo</option>
        </select>

        {/* Spacer to push view toggle to the right */}
        {showViewToggle && <div style={{ flex: 1 }} />}

        {/* View toggle */}
        {showViewToggle && (
          <div
            className="flex shrink-0"
            style={{
              border: '1.5px solid #E2E8F0',
              borderRadius: 6,
              overflow: 'hidden',
              background: 'white',
            }}
          >
            <button
              type="button"
              onClick={() => navigate({ view: 'cards' })}
              style={{
                width: 38,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentView === 'cards' ? '#EBF0FB' : 'transparent',
                color: currentView === 'cards' ? '#0038A8' : '#94A3B8',
                border: 'none',
                borderRight: '1px solid #E2E8F0',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              title="Visualização em cards"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>view_agenda</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: currentView === 'table' ? 'table' : 'table' })}
              style={{
                width: 38,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentView === 'table' ? '#EBF0FB' : 'transparent',
                color: currentView === 'table' ? '#0038A8' : '#94A3B8',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              title="Visualização em tabela"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>reorder</span>
            </button>
          </div>
        )}
      </form>

      {/* Advanced filters panel */}
      {open && (
        <div
          ref={ref}
          className="p-4 space-y-4"
          style={{ border: '1.5px solid #E2E8F0', borderRadius: 6, background: '#F8FAFC' }}
        >
          {/* Área */}
          <div>
            <label className="field-label">Área</label>
            <select
              value={currentAreaId}
              onChange={e => navigate({ areaId: e.target.value || null })}
              className="field-input"
            >
              <option value="">Todas as áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.planta.nome} › {a.nome}</option>
              ))}
            </select>
          </div>

          {/* Classe */}
          <div>
            <label className="field-label">Classe</label>
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
                    className="px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      borderRadius: 6,
                      border: `1.5px solid ${active ? color : '#E2E8F0'}`,
                      background: active ? `${color}18` : 'white',
                      color: active ? color : '#6B7280',
                      cursor: 'pointer',
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
            <label className="field-label">Tipo de Intertravamento</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'LOGICO', label: 'Lógico' },
                { value: 'FISICO', label: 'Físico' },
                { value: 'DISPOSITIVO_SEGURANCA', label: 'Disp. Segurança' },
              ].map(t => {
                const active = currentTipo === t.value
                return (
                  <button key={t.value} type="button" onClick={() => navigate({ tipo: active ? null : t.value })}
                    className="px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      borderRadius: 6,
                      border: `1.5px solid ${active ? '#0038A8' : '#E2E8F0'}`,
                      background: active ? '#EBF0FB' : 'white',
                      color: active ? '#0038A8' : '#6B7280',
                      cursor: 'pointer',
                    }}>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="field-label">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => {
                const active = currentStatus === opt.value
                return (
                  <button key={opt.value} type="button" onClick={() => navigate({ statusFiltro: active ? null : opt.value })}
                    className="px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      borderRadius: 6,
                      border: `1.5px solid ${active ? '#0038A8' : '#E2E8F0'}`,
                      background: active ? '#EBF0FB' : 'white',
                      color: active ? '#0038A8' : '#6B7280',
                      cursor: 'pointer',
                    }}>
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
              style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
