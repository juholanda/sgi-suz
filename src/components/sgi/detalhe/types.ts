/**
 * types.ts — Shared types for the solicitação detail page
 *
 * Single source of truth for the serialized data shape passed from
 * the server component (page.tsx) to the client tree.
 * Dates are serialized as ISO strings for JSON transport.
 */

import type { Acao, ConflictInfo } from '@/lib/acoes'

// ── Nested entities ──────────────────────────────────────────────────────────

export interface AprovacaoDetalhe {
  id: string
  nivel: number
  status: string
  tipo: string
  comentario: string | null
  motivoRejeicao: string | null
  respondidaEm: string | null
  aprovador: {
    id: string
    nome: string
    matricula: string
    perfis: { perfil: string }[]
  }
}

export interface ChecklistItemDetalhe {
  id: string
  tipo: string // 'DESABILITACAO' | 'REABILITACAO'
  numero: number
  descricao: string
  resposta: string | null
  observacao: string | null
}

export interface AnexoDetalhe {
  id: string
  nome: string | null
  filename: string | null
  tipo: string | null
  mimeType: string | null
  tamanho: number | null
  url: string | null
}

export interface EventoDetalhe {
  id: string
  acao: string
  detalhes: string | null
  createdAt: string
  user: { nome: string; cargo?: string | null }
}

// ── Main serialized solicitação ──────────────────────────────────────────────

export interface SolicitacaoDetalhe {
  id: string
  protocolo: string
  status: string
  tipo: string | null
  funcaoIntertravamento: string | null
  motivoDesabilitacao: string | null
  medidasContingenciais: string | null
  periodoInicio: string | null
  periodoFim: string | null
  dataDesabilitacao: string | null
  dataReabilitacao: string | null
  dataEncerramento: string | null
  dataEnvioAprovacao: string | null
  prazoMaximoAtingido: boolean
  prazoPrevitoAtingido: boolean
  createdAt: string
  solicitanteId: string
  executanteId: string | null
  equipamento: { tag: string; descricao: string }
  area: { nome: string; planta: { nome: string } }
  classe: { numero: number; prazoMaximoDias: number | null } | null
  solicitante: { nome: string; matricula: string; email: string }
  executante: { nome: string; matricula: string } | null
  aprovacoes: AprovacaoDetalhe[]
  checklists: ChecklistItemDetalhe[]
  anexos: AnexoDetalhe[]
  eventos: EventoDetalhe[]
  extensoes?: Array<{
    id: string
    novaDataFim: string
    justificativa: string
    status: string
    createdAt: string
  }>
}

// ── Props for the top-level client component ─────────────────────────────────

export interface DetalheClientProps {
  solicitacao: SolicitacaoDetalhe
  acoes: Acao[]
  conflict: ConflictInfo | null
  userId: string
  perfis: string[]
}
