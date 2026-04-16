'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/design-system/Input'
import { Button } from '@/components/design-system/Button'
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
  { value: 'DESABILITADO', label: 'Desabilitado' },
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate({ search: search.trim() || null })
  }

  const hasActiveFilters = currentClasse.length > 0 || currentAreaId || currentSearch || currentTipo || currentStatus

  const currentView = searchParams.get('view') ?? 'table'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top bar: search + filters (left) / sort + view toggle (right) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Left: search + filters */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 280 }}>
          <div style={{ maxWidth: 360, flex: '1 1 auto' }}>
            <Input
              leadingIcon="search"
              size="md"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por TAG, protocolo ou solicitante..."
            />
          </div>
          {search && (
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => { setSearch(''); navigate({ search: null }) }}
              leadingIcon="close"
              aria-label="Limpar busca"
            />
          )}
          <Button
            variant={open || hasActiveFilters ? 'secondary' : 'outline'}
            size="md"
            type="button"
            onClick={() => setOpen(v => !v)}
            leadingIcon="tune"
          >
            Filtros
            {hasActiveFilters && (
              <span
                style={{
                  width: 16,
                  height: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: '#0038A8',
                  borderRadius: '50%',
                  marginLeft: 4,
                }}
              >
                {[currentClasse.length > 0, !!currentAreaId, !!currentSearch, !!currentTipo, !!currentStatus].filter(Boolean).length}
              </span>
            )}
          </Button>
        </form>

        {/* Right: sort + view toggle */}
        <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, color: '#64748B', whiteSpace: 'nowrap' }}>Ordenar por</span>
            <select
              value={currentSort}
              onChange={e => navigate({ sort: e.target.value })}
              className="field-input"
              style={{ minWidth: 150, height: 40, fontSize: 14 }}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigas">Mais antigas</option>
              <option value="prazo">Por prazo</option>
            </select>
          </div>

          {showViewToggle && (
            <ViewToggle
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
          style={{
            padding: 16,
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Área */}
          <div style={{ flex: '1 1 180px', minWidth: 160 }}>
            <label className="field-label">Área</label>
            <select
              value={currentAreaId}
              onChange={e => navigate({ areaId: e.target.value || null })}
              className="field-input"
              style={{ height: 36, fontSize: 13 }}
            >
              <option value="">Todas as áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.planta.nome} › {a.nome}</option>
              ))}
            </select>
          </div>

          {/* Classe */}
          <div style={{ flex: '0 1 130px', minWidth: 110 }}>
            <label className="field-label">Classe</label>
            <select
              value={currentClasse[0] ?? ''}
              onChange={e => navigate({ classe: e.target.value || null })}
              className="field-input"
              style={{ height: 36, fontSize: 13 }}
            >
              <option value="">Todas</option>
              <option value="1">CL1</option>
              <option value="2">CL2</option>
              <option value="3">CL3</option>
              <option value="4">CL4</option>
            </select>
          </div>

          {/* Tipo de intertravamento */}
          <div style={{ flex: '1 1 170px', minWidth: 150 }}>
            <label className="field-label">Tipo</label>
            <select
              value={currentTipo}
              onChange={e => navigate({ tipo: e.target.value || null })}
              className="field-input"
              style={{ height: 36, fontSize: 13 }}
            >
              <option value="">Todos os tipos</option>
              <option value="LOGICO">Lógico</option>
              <option value="FISICO">Físico</option>
              <option value="DISPOSITIVO_SEGURANCA">Disp. Segurança</option>
            </select>
          </div>

          {/* Status */}
          <div style={{ flex: '1 1 170px', minWidth: 150 }}>
            <label className="field-label">Status</label>
            <select
              value={currentStatus}
              onChange={e => navigate({ statusFiltro: e.target.value || null })}
              className="field-input"
              style={{ height: 36, fontSize: 13 }}
            >
              <option value="">Todos os status</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Limpar */}
          <Button
            variant="danger-outline"
            size="sm"
            type="button"
            leadingIcon="filter_list_off"
            disabled={!hasActiveFilters}
            onClick={() => {
              setSearch('')
              navigate({ search: null, classe: null, areaId: null, tipo: null, statusFiltro: null })
            }}
          >
            Limpar
          </Button>
        </div>
      )}
    </div>
  )
}
