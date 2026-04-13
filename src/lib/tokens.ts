/**
 * tokens.ts — fonte de verdade das cores de badge/status/classe
 *
 * Lógica de cores por status (semântica operacional):
 *  · Neutro (inativo):     cinza   → RASCUNHO, CANCELADA
 *  · Atenção (aguarda):    âmbar   → EM_APROVACAO, EXTENSAO_EM_ANALISE
 *  · Em andamento:         azul    → EXECUCAO_AUTORIZADA, EM_EXECUCAO
 *  · Alerta (IT desabilitado): laranja → DESABILITADO
 *  · Retorno à segurança:  teal    → EM_REABILITACAO, EM_VALIDACAO_DA_REABILITACAO
 *  · Concluído com sucesso: verde  → ENCERRADA
 *  · Terminal negativo:    vermelho → REJEITADA
 *
 * Lógica de cores por classe de severidade (escala cromática):
 *  · Classe 1 — Baixo risco:     azul  (informacional, seguro)
 *  · Classe 2 — Risco moderado:  teal  (atenção, mas gerenciável)
 *  · Classe 3 — Alto risco:      laranja (perigo crescente)
 *  · Classe 4 — Risco crítico:   vermelho (perigo alto)
 *  · Classe 5 — Não forçável:    marrom escuro (extremo, proibido)
 */
export const tokens = {
  colors: {
    primary: '#0038A8',
    primaryHover: '#002D8A',
    primaryLight: '#EBF0FB',
    background: '#F0F4F8',
    backgroundCard: '#FFFFFF',
    border: '#E2E8F0',
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#94A3B8',
    },

    // ── Classes de severidade ─────────────────────────────────────────────
    classe: {
      1: { bg: '#DBEAFE', text: '#1E3A8A', border: '#93C5FD', badge: '#1D4ED8' }, // azul
      2: { bg: '#CCFBF1', text: '#0F766E', border: '#5EEAD4', badge: '#0D9488' }, // teal
      3: { bg: '#FFEDD5', text: '#7C2D12', border: '#FDBA74', badge: '#EA580C' }, // laranja
      4: { bg: '#FEE2E2', text: '#7F1D1D', border: '#FCA5A5', badge: '#DC2626' }, // vermelho
      5: { bg: '#1C0505', text: '#FCA5A5', border: '#7F1D1D', badge: '#7F1D1D' }, // marrom extremo
    },

    // ── Status de solicitação ─────────────────────────────────────────────
    status: {
      // Neutro — rascunho / cancelado (cinza; sem urgência, sem ação necessária)
      RASCUNHO:     { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', dot: '#94A3B8' },
      CANCELADA:    { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', dot: '#94A3B8' },

      // Atenção — aguarda ação humana (âmbar/laranja)
      EM_APROVACAO:        { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', dot: '#D97706' },
      EXTENSAO_EM_ANALISE: { bg: '#FFF7ED', text: '#7C2D12', border: '#FDBA74', dot: '#EA580C' },

      // Em andamento — trabalho ativo (azul)
      EXECUCAO_AUTORIZADA: { bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD', dot: '#2563EB' },
      EM_EXECUCAO:         { bg: '#EBF0FB', text: '#002D8A', border: '#93C5FD', dot: '#0038A8' },

      // Alerta operacional — ⚠ intertravamento DESABILITADO (laranja forte)
      // Este é o estado mais crítico do ponto de vista de segurança
      DESABILITADO: { bg: '#FFF7ED', text: '#7C2D12', border: '#FB923C', dot: '#EA580C' },

      // Retorno à segurança — reabilitação em curso (teal)
      EM_REABILITACAO:               { bg: '#F0FDFA', text: '#0F766E', border: '#5EEAD4', dot: '#0D9488' },
      EM_VALIDACAO_DA_REABILITACAO:  { bg: '#CCFBF1', text: '#0F766E', border: '#2DD4BF', dot: '#0F766E' },

      // Terminal positivo — encerrado com sucesso (verde)
      ENCERRADA: { bg: '#F0FDF4', text: '#14532D', border: '#86EFAC', dot: '#16A34A' },

      // Terminal negativo — rejeitado (vermelho)
      REJEITADA: { bg: '#FEF2F2', text: '#7F1D1D', border: '#FCA5A5', dot: '#DC2626' },
    },
  },
  borderRadius: '4px',
  fontFamily: 'Inter, sans-serif',
} as const

export type ClasseNum = 1 | 2 | 3 | 4 | 5
export type StatusSolicitacao =
  | 'RASCUNHO'
  | 'EM_APROVACAO'
  | 'EXECUCAO_AUTORIZADA'
  | 'EM_EXECUCAO'
  | 'DESABILITADO'
  | 'EM_REABILITACAO'
  | 'EM_VALIDACAO_DA_REABILITACAO'
  | 'ENCERRADA'
  | 'REJEITADA'
  | 'CANCELADA'
  | 'EXTENSAO_EM_ANALISE'

export const STATUS_LABELS: Record<StatusSolicitacao, string> = {
  RASCUNHO:                     'Rascunho',
  EM_APROVACAO:                 'Em aprovação',
  EXECUCAO_AUTORIZADA:          'Execução autorizada',
  EM_EXECUCAO:                  'Em execução',
  DESABILITADO:                 'Desabilitado',
  EM_REABILITACAO:              'Em reabilitação',
  EM_VALIDACAO_DA_REABILITACAO: 'Em validação da reabilitação',
  ENCERRADA:                    'Encerrada',
  REJEITADA:                    'Rejeitada',
  CANCELADA:                    'Cancelada',
  EXTENSAO_EM_ANALISE:          'Extensão em análise',
}

export const CLASSE_LABELS: Record<ClasseNum, string> = {
  1: 'Classe 1',
  2: 'Classe 2',
  3: 'Classe 3',
  4: 'Classe 4',
  5: 'Classe 5',
}

export const CLASSE_PRAZO_MAX: Record<ClasseNum, string> = {
  1: '7 dias',
  2: '5 dias',
  3: '3 dias',
  4: '1 dia',
  5: 'NÃO FORÇÁVEL',
}
