'use client'
import { useState, useEffect } from 'react'
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

const CLASSE_OPTIONS = [
  { value: '1', label: 'Classe 1' },
  { value: '2', label: 'Classe 2' },
  { value: '3', label: 'Classe 3' },
  { value: '4', label: 'Classe 4' },
]

const TIPO_OPTIONS = [
  { value: 'LOGICO', label: 'Lógico' },
  { value: 'FISICO', label: 'Físico' },
  { value: 'DISPOSITIVO_SEGURANCA', label: 'Disp. Segurança' },
]

export function SolicitacoesFilters({ areas, showViewToggle }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Read current values from URL
  const currentSearch = searchParams.get('search') ?? ''
  const currentClasse = searchParams.get('classe') ?? ''
  const currentAreaId = searchParams.get('areaId') ?? ''
  const currentSort = searchParams.get('sort') ?? 'recentes'
  const currentTipo = searchParams.get('tipo') ?? ''
  const currentStatus = searchParams.get('statusFiltro') ?? ''
  const currentView = searchParams.get('view') ?? 'table'

  const [search, setSearch] = useState(currentSearch)

  useEffect(() => { setSearch(currentSearch) }, [currentSearch])

  function navigate(overrides: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === '') {
        p.delete(k)
      } else {
        p.set(k, v)
      }
    }
    const qs = p.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate({ search: search.trim() || null })
  }

  const hasActiveFilters = !!currentClasse || !!currentAreaId || !!currentSearch || !!currentTipo || !!currentStatus

  return (
    <div className="mb-4">
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
        {/* Search input */}
        <div className="relative" style={{ minWidth: 200, flex: '1 1 240px', maxWidth: 320 }}>
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
            placeholder="Buscar TAG, protocolo..."
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

        {/* Classe dropdown */}
        <select
          value={currentClasse}
          onChange={e => navigate({ classe: e.target.value || null })}
          className="field-input shrink-0"
          style={{ width: 'auto', minWidth: 120, color: currentClasse ? '#0F172A' : '#94A3B8' }}
        >
          <option value="">Classe</option>
          {CLASSE_OPTIONS.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Tipo dropdown */}
        <select
          value={currentTipo}
          onChange={e => navigate({ tipo: e.target.value || null })}
          className="field-input shrink-0"
          style={{ width: 'auto', minWidth: 130, color: currentTipo ? '#0F172A' : '#94A3B8' }}
        >
          <option value="">Tipo</option>
          {TIPO_OPTIONS.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          value={currentStatus}
          onChange={e => navigate({ statusFiltro: e.target.value || null })}
          className="field-input shrink-0"
          style={{ width: 'auto', minWidth: 140, color: currentStatus ? '#0F172A' : '#94A3B8' }}
        >
          <option value="">Status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Área dropdown */}
        <select
          value={currentAreaId}
          onChange={e => navigate({ areaId: e.target.value || null })}
          className="field-input shrink-0"
          style={{ width: 'auto', minWidth: 130, color: currentAreaId ? '#0F172A' : '#94A3B8' }}
        >
          <option value="">Área</option>
          {areas.map(a => (
            <option key={a.id} value={a.id}>{a.planta.nome} › {a.nome}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              navigate({ search: null, classe: null, areaId: null, tipo: null, statusFiltro: null })
            }}
            className="shrink-0 flex items-center gap-1"
            style={{
              height: 40,
              padding: '0 12px',
              border: '1.5px solid #FCA5A5',
              borderRadius: 6,
              background: '#FEF2F2',
              color: '#DC2626',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15, lineHeight: 1 }}>filter_list_off</span>
            Limpar
          </button>
        )}

        {/* Spacer to push right-side controls */}
        <div style={{ flex: 1 }} />

        {/* Sort — text + chevron */}
        <div className="relative shrink-0">
          <select
            value={currentSort}
            onChange={e => navigate({ sort: e.target.value })}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              fontWeight: 500,
              color: '#475569',
              cursor: 'pointer',
              paddingRight: 20,
              paddingLeft: 0,
              height: 36,
            }}
          >
            <option value="recentes">Ordenar por: Mais recentes</option>
            <option value="antigas">Ordenar por: Mais antigas</option>
            <option value="prazo">Ordenar por: Prazo</option>
          </select>
          <span
            className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ fontSize: 16, color: '#475569', lineHeight: 1 }}
          >
            expand_more
          </span>
        </div>

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
              onClick={() => navigate({ view: 'table' })}
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
    </div>
  )
}
