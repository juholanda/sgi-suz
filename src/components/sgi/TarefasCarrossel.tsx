'use client'
import { useRef } from 'react'
import { SolicitacaoCard } from '@/components/sgi/SolicitacaoCard'

export interface PendenciaItem {
  id: string
  protocolo: string
  status: string
  tipo: string | null
  classe: { numero: number; prazoMaxDias: number | null } | null
  equipamento: { tag: string; descricao: string }
  area: { nome: string }
  planta: { nome: string }
  solicitante: { nome: string }
  periodoInicio: string | null
  periodoFim: string | null
  dataDesabilitacao: string | null
  prazoMaximoAtingido: boolean
  prazoPrevitoAtingido: boolean
  aprovacoes: { nivel: number; status: string; aprovador: { nome: string } }[]
  isAprovador: boolean
  isSolicitante: boolean
  isExecutante: boolean
}

interface Props {
  items: PendenciaItem[]
}

export function TarefasCarrossel({ items }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  if (items.length === 0) {
    return (
      <div
        className="bg-white border rounded flex items-center gap-3 px-5 py-4"
        style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#10B981' }}>
          check_circle
        </span>
        <p className="text-sm" style={{ color: '#475569' }}>
          Nenhuma tarefa pendente. Tudo em dia!
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Arrow left */}
      {items.length > 3 && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 flex items-center justify-center bg-white border shadow-sm"
          style={{ borderRadius: '50%', borderColor: '#E2E8F0' }}
          aria-label="Anterior"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, color: '#475569' }}>
            chevron_left
          </span>
        </button>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map(item => (
          <div
            key={item.id}
            className="shrink-0"
            style={{ width: 320, minWidth: 320 }}
          >
            <SolicitacaoCard
              id={item.id}
              protocolo={item.protocolo}
              status={item.status}
              tipo={item.tipo}
              classe={item.classe}
              equipamento={item.equipamento}
              area={item.area}
              planta={item.planta}
              solicitante={item.solicitante}
              periodoInicio={item.periodoInicio ? new Date(item.periodoInicio) : null}
              periodoFim={item.periodoFim ? new Date(item.periodoFim) : null}
              dataDesabilitacao={item.dataDesabilitacao ? new Date(item.dataDesabilitacao) : null}
              prazoMaximoAtingido={item.prazoMaximoAtingido}
              prazoPrevitoAtingido={item.prazoPrevitoAtingido}
              aprovacoes={item.aprovacoes}
              isAprovador={item.isAprovador}
              isSolicitante={item.isSolicitante}
              isExecutante={item.isExecutante}
            />
          </div>
        ))}
      </div>

      {/* Arrow right */}
      {items.length > 3 && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 flex items-center justify-center bg-white border shadow-sm"
          style={{ borderRadius: '50%', borderColor: '#E2E8F0' }}
          aria-label="Próximo"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, color: '#475569' }}>
            chevron_right
          </span>
        </button>
      )}
    </div>
  )
}
