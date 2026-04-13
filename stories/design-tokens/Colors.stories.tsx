import type { Meta, StoryObj } from '@storybook/react';
import tokens from '../../design-system/tokens';

const meta: Meta = {
  title: 'Design Tokens/Colors',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

// ---- Helpers ----

interface SwatchProps {
  name: string;
  value: string;
  label?: string;
}

function Swatch({ name, value, label }: SwatchProps) {
  const isLight = (hex: string) => {
    const c = hex.replace('#', '');
    if (c.length < 6) return true;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
  };

  const onColor = isLight(value) ? '#0F172A' : '#FFFFFF';

  return (
    <div style={{ minWidth: '110px', maxWidth: '130px', flex: '1 1 110px' }}>
      <div
        style={{
          height: '72px',
          backgroundColor: value,
          borderRadius: '6px',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '6px 8px',
          marginBottom: '6px',
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: onColor, opacity: 0.85 }}>
          {value}
        </span>
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#0F172A', lineHeight: 1.3 }}>
        {name}
      </div>
      {label && (
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
          {label}
        </div>
      )}
    </div>
  );
}

interface SemanticGroupProps {
  title: string;
  color: { DEFAULT: string; light: string; lighter: string; dark: string; darker: string };
}

function SemanticGroup({ title, color }: SemanticGroupProps) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Swatch name="darker" value={color.darker} />
        <Swatch name="dark" value={color.dark} />
        <Swatch name="DEFAULT" value={color.DEFAULT} />
        <Swatch name="light" value={color.light} />
        <Swatch name="lighter" value={color.lighter} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '48px' }}>
      <h2 style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        fontWeight: 700,
        color: '#0F172A',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '2px solid #E2E8F0',
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ---- All Colors story ----

function AllColors() {
  const { semantic, neutral, classe, status } = tokens.colors;

  const statusEntries = Object.entries(status) as [string, string][];
  const statusLabels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    EM_APROVACAO: 'Em Aprovação',
    EXECUCAO_AUTORIZADA: 'Execução Autorizada',
    EM_EXECUCAO: 'Em Execução',
    DESABILITADO: 'Desabilitado',
    EM_REABILITACAO: 'Em Reabilitação',
    EM_VALIDACAO_DA_REABILITACAO: 'Em Val. Reabilitação',
    ENCERRADA: 'Encerrada',
    REJEITADA: 'Rejeitada',
    CANCELADA: 'Cancelada',
    EXTENSAO_EM_ANALISE: 'Extensão em Análise',
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '900px' }}>

      {/* Semantic colors */}
      <Section title="Primária (Suzano Blue)">
        <SemanticGroup title="primary" color={semantic.primary} />
      </Section>

      <Section title="Secundária">
        <SemanticGroup title="secondary" color={semantic.secondary} />
      </Section>

      <Section title="Sucesso">
        <SemanticGroup title="success" color={semantic.success} />
      </Section>

      <Section title="Atenção">
        <SemanticGroup title="warning" color={semantic.warning} />
      </Section>

      <Section title="Perigo">
        <SemanticGroup title="danger" color={semantic.danger} />
      </Section>

      <Section title="Info">
        <SemanticGroup title="info" color={semantic.info} />
      </Section>

      {/* Neutral scale */}
      <Section title="Neutros">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {(Object.entries(neutral) as [string, string][]).map(([key, value]) => (
            <Swatch key={key} name={`neutral.${key}`} value={value} />
          ))}
        </div>
      </Section>

      {/* Classes SGI */}
      <Section title="Classes SGI (Severidade de Intertravamentos)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {([1, 2, 3, 4, 5] as const).map((n) => {
            const c = classe[n];
            return (
              <div key={n} style={{ minWidth: '160px' }}>
                <div style={{
                  height: '64px',
                  backgroundColor: c.bg,
                  borderRadius: '6px',
                  border: `2px solid ${c.DEFAULT}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: c.text,
                    padding: '4px 10px',
                    borderRadius: '4px',
                  }}>
                    Classe {n}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>Classe {n}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{c.label}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#94A3B8' }}>{c.DEFAULT}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Status SGI */}
      <Section title="Status SGI (Solicitações)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {statusEntries.map(([key, value]) => (
            <Swatch key={key} name={key} value={value} label={statusLabels[key]} />
          ))}
        </div>
      </Section>

    </div>
  );
}

export const All: Story = {
  render: () => <AllColors />,
};

// ---- Individual stories per semantic group ----

export const Primaria: Story = {
  render: () => (
    <div>
      <SemanticGroup title="Primária (Suzano Blue)" color={tokens.colors.semantic.primary} />
    </div>
  ),
};

export const Sucesso: Story = {
  render: () => (
    <div>
      <SemanticGroup title="Sucesso" color={tokens.colors.semantic.success} />
    </div>
  ),
};

export const Perigo: Story = {
  render: () => (
    <div>
      <SemanticGroup title="Perigo" color={tokens.colors.semantic.danger} />
    </div>
  ),
};

export const ClassesSGI: Story = {
  render: () => {
    const { classe } = tokens.colors;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontFamily: 'Inter, sans-serif' }}>
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const c = classe[n];
          return (
            <div key={n} style={{ minWidth: '160px' }}>
              <div style={{
                height: '80px',
                backgroundColor: c.bg,
                borderRadius: '6px',
                border: `2px solid ${c.DEFAULT}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
              }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: c.text,
                }}>
                  Classe {n}
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{c.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{c.DEFAULT}</div>
            </div>
          );
        })}
      </div>
    );
  },
};
