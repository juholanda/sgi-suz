import type { Meta, StoryObj } from '@storybook/react';
import tokens from '../../design-system/tokens';

const meta: Meta = {
  title: 'Design Tokens/Typography',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

const SAMPLE = 'Gestão de Segurança Industrial — SGI Suzano';
const SAMPLE_LONG = 'The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow.';
const MONO_SAMPLE = 'SELECT * FROM solicitacoes WHERE classe >= 3 LIMIT 10;';

function Divider({ title }: { title: string }) {
  return (
    <h2 style={{
      fontFamily: tokens.typography.fontFamily.sans,
      fontSize: '11px',
      fontWeight: 600,
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: tokens.typography.letterSpacings.widest,
      borderBottom: '1px solid #E2E8F0',
      paddingBottom: '8px',
      marginBottom: '20px',
      marginTop: '40px',
    }}>
      {title}
    </h2>
  );
}

// ---- Size scale ----
function FontSizes() {
  const sizes = Object.entries(tokens.typography.sizes) as [string, string][];
  return (
    <div style={{ fontFamily: tokens.typography.fontFamily.sans }}>
      <Divider title="Escala de Tamanhos" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {sizes.map(([key, value]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <code style={{ width: '44px', fontSize: '11px', color: '#94A3B8', fontFamily: tokens.typography.fontFamily.mono, flexShrink: 0 }}>
              {key}
            </code>
            <code style={{ width: '40px', fontSize: '11px', color: '#94A3B8', fontFamily: tokens.typography.fontFamily.mono, flexShrink: 0 }}>
              {value}
            </code>
            <span style={{ fontSize: value, color: '#0F172A', lineHeight: tokens.typography.lineHeights.snug }}>
              {SAMPLE}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Sizes: Story = {
  render: () => <FontSizes />,
};

// ---- Weight scale ----
function FontWeights() {
  const weights = Object.entries(tokens.typography.weights) as [string, number][];
  return (
    <div style={{ fontFamily: tokens.typography.fontFamily.sans }}>
      <Divider title="Escala de Pesos" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {weights.map(([key, value]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <code style={{ width: '72px', fontSize: '11px', color: '#94A3B8', fontFamily: tokens.typography.fontFamily.mono, flexShrink: 0 }}>
              {key}
            </code>
            <code style={{ width: '32px', fontSize: '11px', color: '#94A3B8', fontFamily: tokens.typography.fontFamily.mono, flexShrink: 0 }}>
              {value}
            </code>
            <span style={{ fontSize: '18px', fontWeight: value, color: '#0F172A' }}>
              {SAMPLE_LONG}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Weights: Story = {
  render: () => <FontWeights />,
};

// ---- Line heights ----
function LineHeights() {
  const lineHeights = Object.entries(tokens.typography.lineHeights) as [string, number][];
  return (
    <div style={{ fontFamily: tokens.typography.fontFamily.sans }}>
      <Divider title="Line Heights" />
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {lineHeights.map(([key, value]) => (
          <div key={key} style={{ maxWidth: '200px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'baseline' }}>
              <code style={{ fontSize: '11px', color: '#94A3B8', fontFamily: tokens.typography.fontFamily.mono }}>
                {key}
              </code>
              <code style={{ fontSize: '11px', color: '#94A3B8', fontFamily: tokens.typography.fontFamily.mono }}>
                {value}
              </code>
            </div>
            <div style={{
              fontSize: '14px',
              lineHeight: value,
              color: '#0F172A',
              background: '#F8FAFC',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #E2E8F0',
            }}>
              Gestão de segurança industrial com controle de intertravamentos e permissões de trabalho.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const LineHeightsStory: Story = {
  name: 'Line Heights',
  render: () => <LineHeights />,
};

// ---- Letter spacing ----
function LetterSpacings() {
  const spacings = Object.entries(tokens.typography.letterSpacings) as [string, string][];
  return (
    <div style={{ fontFamily: tokens.typography.fontFamily.sans }}>
      <Divider title="Letter Spacing" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {spacings.map(([key, value]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <code style={{ width: '72px', fontSize: '11px', color: '#94A3B8', fontFamily: tokens.typography.fontFamily.mono, flexShrink: 0 }}>
              {key}
            </code>
            <code style={{ width: '72px', fontSize: '11px', color: '#94A3B8', fontFamily: tokens.typography.fontFamily.mono, flexShrink: 0 }}>
              {value}
            </code>
            <span style={{ fontSize: '14px', letterSpacing: value, color: '#0F172A', textTransform: 'uppercase' }}>
              SGI SUZANO INDUSTRIAL
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const LetterSpacingStory: Story = {
  name: 'Letter Spacing',
  render: () => <LetterSpacings />,
};

// ---- Recommended combinations ----
function TextCombinations() {
  return (
    <div style={{ fontFamily: tokens.typography.fontFamily.sans, maxWidth: '600px' }}>
      <Divider title="Combinações Recomendadas" />

      {/* Page title */}
      <div style={{ marginBottom: '32px', padding: '20px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'monospace' }}>
          title — 2xl / bold / tight
        </div>
        <h1 style={{
          fontFamily: tokens.typography.fontFamily.sans,
          fontSize: tokens.typography.sizes['2xl'],
          fontWeight: tokens.typography.weights.bold,
          lineHeight: tokens.typography.lineHeights.tight,
          color: '#0F172A',
          margin: 0,
        }}>
          Solicitação de Permissão de Trabalho
        </h1>
      </div>

      {/* Section title */}
      <div style={{ marginBottom: '32px', padding: '20px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'monospace' }}>
          subtitle — xl / semibold / snug
        </div>
        <h2 style={{
          fontFamily: tokens.typography.fontFamily.sans,
          fontSize: tokens.typography.sizes.xl,
          fontWeight: tokens.typography.weights.semibold,
          lineHeight: tokens.typography.lineHeights.snug,
          color: '#0F172A',
          margin: 0,
        }}>
          Dados do Intertravamento
        </h2>
      </div>

      {/* Body */}
      <div style={{ marginBottom: '32px', padding: '20px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'monospace' }}>
          body — base / normal / normal
        </div>
        <p style={{
          fontFamily: tokens.typography.fontFamily.sans,
          fontSize: tokens.typography.sizes.base,
          fontWeight: tokens.typography.weights.normal,
          lineHeight: tokens.typography.lineHeights.normal,
          color: '#475569',
          margin: 0,
        }}>
          O intertravamento de segurança garante que determinadas condições sejam atendidas antes de liberar a operação do equipamento. Verifique todos os itens antes de prosseguir com a execução.
        </p>
      </div>

      {/* Caption */}
      <div style={{ marginBottom: '32px', padding: '20px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'monospace' }}>
          caption — xs / normal / relaxed
        </div>
        <span style={{
          fontFamily: tokens.typography.fontFamily.sans,
          fontSize: tokens.typography.sizes.xs,
          fontWeight: tokens.typography.weights.normal,
          lineHeight: tokens.typography.lineHeights.relaxed,
          color: '#94A3B8',
        }}>
          Última atualização em 12 de abril de 2026 às 14:32 por Juliane Holanda
        </span>
      </div>

      {/* Label */}
      <div style={{ marginBottom: '32px', padding: '20px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'monospace' }}>
          label — xs / medium / tight / wide
        </div>
        <label style={{
          fontFamily: tokens.typography.fontFamily.sans,
          fontSize: tokens.typography.sizes.xs,
          fontWeight: tokens.typography.weights.medium,
          lineHeight: tokens.typography.lineHeights.tight,
          letterSpacing: tokens.typography.letterSpacings.wide,
          color: '#475569',
          textTransform: 'uppercase',
        }}>
          Número da Solicitação
        </label>
      </div>

      {/* Mono */}
      <div style={{ marginBottom: '32px', padding: '20px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'monospace' }}>
          mono — sm / normal / snug
        </div>
        <code style={{
          fontFamily: tokens.typography.fontFamily.mono,
          fontSize: tokens.typography.sizes.sm,
          fontWeight: tokens.typography.weights.normal,
          lineHeight: tokens.typography.lineHeights.snug,
          color: '#0038A8',
          background: '#EBF0FB',
          padding: '8px 12px',
          borderRadius: '4px',
          display: 'block',
        }}>
          {MONO_SAMPLE}
        </code>
      </div>
    </div>
  );
}

export const Combinations: Story = {
  render: () => <TextCombinations />,
};

// ---- Full scale (legacy) ----
function TypeScale() {
  const sizes = Object.entries(tokens.typography.sizes) as [string, string][];
  const weights = Object.entries(tokens.typography.weights) as [string, number][];

  return (
    <div style={{ fontFamily: tokens.typography.fontFamily.sans }}>
      <Divider title="Font Sizes" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
        {sizes.map(([key, value]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <div style={{ width: '60px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', flexShrink: 0 }}>
              {key}
            </div>
            <div style={{ width: '48px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', flexShrink: 0 }}>
              {value}
            </div>
            <div style={{ fontSize: value, color: '#0F172A', lineHeight: 1.4 }}>
              {SAMPLE_LONG}
            </div>
          </div>
        ))}
      </div>

      <Divider title="Font Weights" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {weights.map(([key, value]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <div style={{ width: '80px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', flexShrink: 0 }}>
              {key}
            </div>
            <div style={{ width: '36px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', flexShrink: 0 }}>
              {value}
            </div>
            <div style={{ fontSize: '16px', fontWeight: value, color: '#0F172A' }}>
              {SAMPLE_LONG}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Scale: Story = {
  render: () => <TypeScale />,
};
