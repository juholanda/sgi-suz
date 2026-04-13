import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../src/components/sgi/Button';
import tokens from '../../design-system/tokens';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'outline', 'danger', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ---- Playground ----
export const Playground: Story = {
  args: {
    children: 'Botão',
    variant: 'primary',
    size: 'md',
  },
};

// ---- Todas as variantes ----
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', fontFamily: tokens.typography.fontFamily.sans }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

// ---- Todos os tamanhos ----
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', fontFamily: tokens.typography.fontFamily.sans }}>
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

// ---- Com ícone à esquerda ----
export const WithIconLeft: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
      <Button variant="primary" iconLeft="add">Adicionar</Button>
      <Button variant="secondary" iconLeft="edit">Editar</Button>
      <Button variant="outline" iconLeft="download">Exportar</Button>
      <Button variant="danger" iconLeft="delete">Excluir</Button>
    </div>
  ),
};

// ---- Com ícone à direita ----
export const WithIconRight: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
      <Button variant="primary" iconRight="arrow_forward">Próximo</Button>
      <Button variant="secondary" iconRight="open_in_new">Abrir</Button>
      <Button variant="outline" iconRight="chevron_right">Ver mais</Button>
    </div>
  ),
};

// ---- Somente ícone ----
export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
      <Button variant="primary" iconOnly="add" size="xs" />
      <Button variant="primary" iconOnly="add" size="sm" />
      <Button variant="primary" iconOnly="add" size="md" />
      <Button variant="primary" iconOnly="add" size="lg" />
      <Button variant="primary" iconOnly="add" size="xl" />
      <Button variant="outline" iconOnly="edit" />
      <Button variant="ghost" iconOnly="more_vert" />
      <Button variant="danger" iconOnly="delete" />
    </div>
  ),
};

// ---- FAB ----
export const FAB: Story = {
  render: () => (
    <div style={{ height: '180px', position: 'relative', background: '#F0F4F8', borderRadius: '8px', padding: '16px', fontFamily: tokens.typography.fontFamily.sans, fontSize: '14px', color: '#475569' }}>
      <p>O botão FAB aparece fixado no canto inferior direito da tela.</p>
      <Button fab variant="primary" iconOnly="add" />
    </div>
  ),
};

// ---- Estado loading ----
export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
      <Button variant="primary" loading>Salvando...</Button>
      <Button variant="secondary" loading>Carregando</Button>
      <Button variant="outline" loading iconLeft="save">Processando</Button>
      <Button variant="danger" loading>Excluindo</Button>
    </div>
  ),
};

// ---- Estado disabled ----
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="outline" disabled>Outline</Button>
      <Button variant="danger" disabled>Danger</Button>
      <Button variant="ghost" disabled>Ghost</Button>
      <Button variant="link" disabled>Link</Button>
    </div>
  ),
};

// ---- Full width ----
export const FullWidth: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
      <Button variant="primary" fullWidth>Entrar</Button>
      <Button variant="secondary" fullWidth iconLeft="upload">Importar arquivo</Button>
      <Button variant="outline" fullWidth iconRight="arrow_forward">Próximo passo</Button>
    </div>
  ),
};

// ---- Variantes em todos os tamanhos (grid completo) ----
export const SizeVariantMatrix: Story = {
  render: () => {
    const variants: Array<'primary' | 'secondary' | 'tertiary' | 'outline' | 'danger' | 'ghost' | 'link'> = [
      'primary', 'secondary', 'tertiary', 'outline', 'danger', 'ghost', 'link',
    ];
    const sizes: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl'> = ['xs', 'sm', 'md', 'lg', 'xl'];

    return (
      <div style={{ fontFamily: tokens.typography.fontFamily.sans }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#64748B', fontWeight: 600, borderBottom: '1px solid #E2E8F0' }}>
                Variant \ Size
              </th>
              {sizes.map((s) => (
                <th key={s} style={{ textAlign: 'center', padding: '8px 12px', fontSize: '12px', color: '#64748B', fontWeight: 600, borderBottom: '1px solid #E2E8F0' }}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v}>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: '#475569', fontWeight: 500, borderBottom: '1px solid #F1F5F9', fontFamily: 'monospace' }}>
                  {v}
                </td>
                {sizes.map((s) => (
                  <td key={s} style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #F1F5F9' }}>
                    <Button variant={v} size={s}>{v}</Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

// ---- Como link (href) ----
export const AsLink: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button href="#" variant="primary">Ir para página</Button>
      <Button href="#" variant="link" iconRight="open_in_new">Documentação</Button>
    </div>
  ),
};
