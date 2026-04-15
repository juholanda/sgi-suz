'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input, Select } from '@/components/design-system/Input'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top bar: search + filters (left) / sort + view toggle (right) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Left: search + filters */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 280 }}>
          <div style={{ maxWidth: 320, flex: '1 1 auto' }}>
            <Input
              leadingIcon="search"
              size="sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por TAG, protocolo ou solicitante..."
            />
          </div>
          {search && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => { setSearch(''); navigate({ search: null }) }}
              leadingIcon="close"
              aria-label="Limpar busca"
            />
          )}
          <Button
            variant={open || hasActiveFilters ? 'secondary' : 'outline'}
            size="sm"
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
            <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>Ordenar por</span>
            <Select
              size="sm"
              value={currentSort}
              onChange={e => navigate({ sort: e.target.value })}
              style={{ minWidth: 140 }}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigas">Mais antigas</option>
              <option value="prazo">Por prazo</option>
            </Select>
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
            flexDirection: 'column',
            gap: 16,
          }}
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
            <div style={{ display: 'flex', gap: 8 }}>
              {['1', '2', '3', '4'].map(c => {
                const active = currentClasse.includes(c)
                const colors: Record<string, string> = { '1': '#1D4ED8', '2': '#0D9488', '3': '#EA580C', '4': '#DC2626' }
                const color = colors[c]
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleClasse(c)}
                    className="btn btn-sm"
                    style={{
                      borderRadius: 6,
                      border: `1.5px solid ${active ? color : '#E2E8F0'}`,
                      background: active ? `${color}18` : 'white',
                      color: active ? color : '#6B7280',
                      fontWeight: 600,
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { value: 'LOGICO', label: 'Lógico' },
                { value: 'FISICO', label: 'Físico' },
                { value: 'DISPOSITIVO_SEGURANCA', label: 'Disp. Segurança' },
              ].map(t => {
                const active = currentTipo === t.value
                return (
                  <Button key={t.value} type="button" size="sm"
                    variant={active ? 'secondary' : 'outline'}
                    onClick={() => navigate({ tipo: active ? null : t.value })}>
                    {t.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="field-label">Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUS_OPTIONS.map(opt => {
                const active = currentStatus === opt.value
                return (
                  <Button key={opt.value} type="button" size="sm"
                    variant={active ? 'secondary' : 'outline'}
                    onClick={() => navigate({ statusFiltro: active ? null : opt.value })}>
                    {opt.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Limpar */}
          {hasActiveFilters && (
            <Button
              variant="danger-outline"
              size="sm"
              type="button"
              leadingIcon="filter_list_off"
              onClick={() => {
                setSearch('')
                navigate({ search: null, classe: null, areaId: null, tipo: null, statusFiltro: null })
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
