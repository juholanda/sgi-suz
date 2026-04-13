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
    classe: {
      1: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0', badge: '#16A34A' },
      2: { bg: '#FEF9C3', text: '#A16207', border: '#FDE68A', badge: '#EAB308' },
      3: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA', badge: '#EA580C' },
      4: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', badge: '#DC2626' },
      5: { bg: '#3F0000', text: '#FFFFFF', border: '#7F1D1D', badge: '#7F1D1D' },
    },
    status: {
      RASCUNHO:                       { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', dot: '#6B7280' },
      EM_APROVACAO:                   { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE', dot: '#2563EB' },
      EXECUCAO_AUTORIZADA:            { bg: '#CFFAFE', text: '#0E7490', border: '#A5F3FC', dot: '#0891B2' },
      EM_EXECUCAO:                    { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
      DESABILITADO:                   { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
      EM_REABILITACAO:                { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' },
      EM_VALIDACAO_DA_REABILITACAO:   { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE', dot: '#6366F1' },
      ENCERRADA:                      { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
      REJEITADA:                      { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', dot: '#B91C1C' },
      CANCELADA:                      { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0', dot: '#9CA3AF' },
      EXTENSAO_EM_ANALISE:            { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', dot: '#D97706' },
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
  RASCUNHO: 'Rascunho',
  EM_APROVACAO: 'Em Aprovação',
  EXECUCAO_AUTORIZADA: 'Execução Autorizada',
  EM_EXECUCAO: 'Em Execução (Campo)',
  DESABILITADO: 'Desabilitado',
  EM_REABILITACAO: 'Em Reabilitação',
  EM_VALIDACAO_DA_REABILITACAO: 'Em Validação da Reabilitação',
  ENCERRADA: 'Encerrada',
  REJEITADA: 'Rejeitada',
  CANCELADA: 'Cancelada',
  EXTENSAO_EM_ANALISE: 'Extensão em Análise',
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
