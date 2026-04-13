import type { Meta, StoryObj } from '@storybook/react';
import tokens from '../../design-system/tokens';

const meta: Meta = {
  title: 'Components/Badge',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

// ---- Types ----
type StatusKey = keyof typeof tokens.colors.status;
type ClasseKey = 1 | 2 | 3 | 4 | 5;

const STATUS_LABELS: Record<StatusKey, string> = {
  RASCUNHO: 'Rascunho',
  EM_APROVACAO: 'Em Aprovação',
  EXECUCAO_AUTORIZADA: 'Execução Autorizada',
  EM_EXECUCAO: 'Em Execução',
  DESABILITADO: 'Desabilitado',
  EM_REABILITACAO: 'Em Reabilitação',
  EM_VALIDACAO_DA_REABILITACAO: 'Em Validação da Reabilitação',
  ENCERRADA: 'Encerrada',
  REJEITADA: 'Rejeitada',
  CANCELADA: 'Cancelada',
  EXTENSAO_EM_ANALISE: 'Extensão em Análise',
};

// ---- Inline Badge components (no external deps) ----

interface StatusBadgeProps {
  status: StatusKey;
  size?: 'sm' | 'md';
}

function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  // We derive readable colors from the semantic color palette so the badges look good
  const colorMap: Record<StatusKey, { bg: string; text: string; dot: string; border: string }> = {
    RASCUNHO:                     { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', border: '#CBD5E1' },
    EM_APROVACAO:                 { bg: '#DBEAFE', text: '#1D4ED8', dot: '#2563EB', border: '#BFDBFE' },
    EXECUCAO_AUTORIZADA:          { bg: '#CFFAFE', text: '#0E7490', dot: '#0891B2', border: '#A5F3FC' },
    EM_EXECUCAO:                  { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B', border: '#FDE68A' },
    DESABILITADO:                 { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444', border: '#FECACA' },
    EM_REABILITACAO:              { bg: '#EDE9FE', text: '#6D28D9', dot: '#8B5CF6', border: '#DDD6FE' },
    EM_VALIDACAO_DA_REABILITACAO: { bg: '#E0E7FF', text: '#4338CA', dot: '#6366F1', border: '#C7D2FE' },
    ENCERRADA:                    { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', border: '#A7F3D0' },
    REJEITADA:                    { bg: '#FEE2E2', text: '#991B1B', dot: '#B91C1C', border: '#FECACA' },
    CANCELADA:                    { bg: '#F8FAFC', text: '#64748B', dot: '#9CA3AF', border: '#E2E8F0' },
    EXTENSAO_EM_ANALISE:          { bg: '#FEF3C7', text: '#92400E', dot: '#D97706', border: '#FDE68A' },
  };

  const colors = colorMap[status];
  const padding = size === 'sm' ? '2px 8px' : '3px 10px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: tokens.radius,
      padding,
      fontSize,
      fontWeight: 500,
      fontFamily: tokens.typography.fontFamily.sans,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: colors.dot,
        flexShrink: 0,
        display: 'inline-block',
      }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface ClasseBadgeProps {
  classe: ClasseKey;
  showPrazo?: boolean;
  size?: 'sm' | 'md';
}

const CLASSE_PRAZO: Record<ClasseKey, string> = {
  1: '7 dias',
  2: '5 dias',
  3: '3 dias',
  4: '1 dia',
  5: 'NÃO FORÇÁVEL',
};

function ClasseBadge({ classe, showPrazo = false, size = 'md' }: ClasseBadgeProps) {
  const c = tokens.colors.classe[classe];
  const padding = size === 'sm' ? '2px 8px' : '3px 10px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.DEFAULT}`,
      borderRadius: tokens.radius,
      padding,
      fontSize,
      fontWeight: 600,
      fontFamily: tokens.typography.fontFamily.sans,
      whiteSpace: 'nowrap',
    }}>
      {c.label}
      {showPrazo && (
        <span style={{ fontWeight: 400, opacity: 0.8 }}>· {CLASSE_PRAZO[classe]}</span>
      )}
    </span>
  );
}

// ---- Stories ----

export const StatusAll: Story = {
  name: 'Status — Todos',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontFamily: tokens.typography.fontFamily.sans }}>
      {(Object.keys(STATUS_LABELS) as StatusKey[]).map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};

export const StatusSizes: Story = {
  name: 'Status — Tamanhos',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <p style={{ fontFamily: tokens.typography.fontFamily.sans, fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>size=&quot;sm&quot;</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(Object.keys(STATUS_LABELS) as StatusKey[]).map((s) => (
            <StatusBadge key={s} status={s} size="sm" />
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontFamily: tokens.typography.fontFamily.sans, fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>size=&quot;md&quot;</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(Object.keys(STATUS_LABELS) as StatusKey[]).map((s) => (
            <StatusBadge key={s} status={s} size="md" />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const ClasseAll: Story = {
  name: 'Classe — Todas',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {([1, 2, 3, 4, 5] as ClasseKey[]).map((n) => (
        <ClasseBadge key={n} classe={n} showPrazo />
      ))}
    </div>
  ),
};

export const ClasseSizes: Story = {
  name: 'Classe — Tamanhos',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <p style={{ fontFamily: tokens.typography.fontFamily.sans, fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>size=&quot;sm&quot;</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {([1, 2, 3, 4, 5] as ClasseKey[]).map((n) => (
            <ClasseBadge key={n} classe={n} size="sm" />
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontFamily: tokens.typography.fontFamily.sans, fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>size=&quot;md&quot;</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {([1, 2, 3, 4, 5] as ClasseKey[]).map((n) => (
            <ClasseBadge key={n} classe={n} size="md" />
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontFamily: tokens.typography.fontFamily.sans, fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Com prazo máximo</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {([1, 2, 3, 4, 5] as ClasseKey[]).map((n) => (
            <ClasseBadge key={n} classe={n} showPrazo />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Combined: Story = {
  name: 'Status + Classe em contexto',
  render: () => (
    <div style={{ fontFamily: tokens.typography.fontFamily.sans, maxWidth: '560px' }}>
      {[
        { id: 'SGI-001', titulo: 'Manutenção Bomba P-101', status: 'EM_EXECUCAO' as StatusKey, classe: 3 as ClasseKey },
        { id: 'SGI-002', titulo: 'Inspeção Válvula V-205', status: 'EXECUCAO_AUTORIZADA' as StatusKey, classe: 2 as ClasseKey },
        { id: 'SGI-003', titulo: 'Reparo Emergencial Reator R-10', status: 'EM_APROVACAO' as StatusKey, classe: 4 as ClasseKey },
        { id: 'SGI-004', titulo: 'Limpeza Tanque T-07', status: 'ENCERRADA' as StatusKey, classe: 1 as ClasseKey },
      ].map((row) => (
        <div key={row.id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #E2E8F0',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>{row.id}</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{row.titulo}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <ClasseBadge classe={row.classe} size="sm" />
            <StatusBadge status={row.status} size="sm" />
          </div>
        </div>
      ))}
    </div>
  ),
};
