import type { Meta, StoryObj } from '@storybook/react';
import tokens from '../../design-system/tokens';

const meta: Meta = {
  title: 'Design Tokens/Spacing',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

function SpacingScale() {
  const spacings = Object.entries(tokens.spacing) as [string, string][];

  return (
    <div style={{ fontFamily: tokens.typography.fontFamily.sans }}>
      <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
        Spacing Scale
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {spacings.map(([key, value]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '36px', fontSize: '12px', color: '#64748B', fontFamily: 'monospace', flexShrink: 0, fontWeight: 500 }}>
              {key}
            </div>
            <div style={{ width: '40px', fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace', flexShrink: 0 }}>
              {value}
            </div>
            <div
              style={{
                height: '20px',
                width: value,
                backgroundColor: '#0038A8',
                borderRadius: '2px',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                height: '20px',
                width: value,
                backgroundColor: '#EBF0FB',
                borderRadius: '2px',
                border: '1px dashed #0038A8',
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export const Scale: Story = {
  render: () => <SpacingScale />,
};
