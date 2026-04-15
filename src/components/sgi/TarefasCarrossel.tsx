'use client'
import Link from 'next/link'
import { useRef } from 'react'

interface Tarefa {
  id: string
  tag: string
  protocolo: string
  area: string
  planta?: string
  acao: string
  acaoLabel: string
  acaoColor: string
  acaoBg: string
  ctaLabel: string
  ctaColor: string
  urgente?: boolean
}

interface Props {
  tarefas: Tarefa[]
}

export function TarefasCarrossel({ tarefas }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
  }

  if (tarefas.length === 0) {
    return (
      <div className="bg-white border rounded flex items-center gap-3 px-5 py-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#10B981' }}>check_circle</span>
        <p className="text-sm" style={{ color: '#475569' }}>Nenhuma tarefa pendente. Tudo em dia!</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Arrow left */}
      {tarefas.length > 3 && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 flex items-center justify-center bg-white border shadow-sm"
          style={{ borderRadius: '50%', borderColor: '#E2E8F0' }}
          aria-label="Anterior"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, color: '#475569' }}>chevron_left</span>
        </button>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tarefas.map(t => (
          <div
            key={`${t.id}-${t.acao}`}
            className="bg-white border flex flex-col gap-2 p-4 shrink-0"
            style={{
              borderColor: '#E2E8F0',
              borderRadius: '8px',
              borderLeft: `3px solid ${t.acaoColor}`,
              width: 260,
              minWidth: 260,
            }}
          >
            {/* Badge ação */}
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold px-2 py-0.5"
                style={{ background: t.acaoBg, color: t.acaoColor, borderRadius: '4px' }}
              >
                {t.acaoLabel}
              </span>
              {t.urgente && (
                <span className="text-xs font-medium" style={{ color: '#B91C1C' }}>⚠ Urgente</span>
              )}
            </div>

            {/* TAG + protocolo */}
            <div>
              <div className="font-mono text-sm font-bold" style={{ color: '#0F172A' }}>{t.tag}</div>
              <div className="font-mono text-xs" style={{ color: '#94A3B8' }}>{t.protocolo}</div>
            </div>

            {/* Área */}
            <p className="text-xs" style={{ color: '#6B7280' }}>{t.area}{t.planta ? ` · ${t.planta}` : ''}</p>

            {/* CTA */}
            <Link
              href={`/solicitacoes/${t.id}`}
              className="mt-auto w-full text-center px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: t.ctaColor, borderRadius: '4px' }}
            >
              {t.ctaLabel}
            </Link>
          </div>
        ))}
      </div>

      {/* Arrow right */}
      {tarefas.length > 3 && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 flex items-center justify-center bg-white border shadow-sm"
          style={{ borderRadius: '50%', borderColor: '#E2E8F0' }}
          aria-label="Próximo"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, color: '#475569' }}>chevron_right</span>
        </button>
      )}
    </div>
  )
}
