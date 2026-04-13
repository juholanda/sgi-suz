/**
 * ─────────────────────────────────────────────────────────
 * Button — Design System / SGI
 * ─────────────────────────────────────────────────────────
 * Componente de ação principal. Toda interação de usuário
 * que resulta em uma ação deve usar um botão — seja inline,
 * em formulários, modais ou barras de ações.
 *
 * Regras:
 *  · Uma única ação primária por tela / seção
 *  · Ícone sempre à esquerda do label (salvo trailing arrow)
 *  · Nunca desabilite sem explicar o motivo ao usuário
 *  · Em mobile, prefira sempre fullWidth para toque seguro
 */
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/design-system/Button'

const meta: Meta<typeof Button> = {
  title: 'Design System/Componentes/Botões',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Uso básico:**
\`\`\`tsx
import { Button } from '@/components/design-system/Button'

<Button variant="primary" leadingIcon="add">Nova solicitação</Button>
<Button variant="danger" size="sm" leadingIcon="delete">Excluir</Button>
<Button variant="outline" loading>Processando...</Button>
\`\`\`

**Classes CSS puras** (sem React):
\`\`\`html
<button class="btn btn-primary btn-md">Confirmar</button>
<button class="btn btn-danger btn-sm" disabled>Excluir</button>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'tertiary', 'success', 'danger', 'danger-outline', 'link'],
      table: { category: 'Aparência' },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      table: { category: 'Aparência' },
    },
    fullWidth: { control: 'boolean', table: { category: 'Aparência' } },
    leadingIcon: { control: 'text', table: { category: 'Conteúdo', description: 'Material Symbol — ex.: "add", "check", "delete"' } },
    trailingIcon: { control: 'text', table: { category: 'Conteúdo' } },
    loading: { control: 'boolean', table: { category: 'Estado' } },
    disabled: { control: 'boolean', table: { category: 'Estado' } },
    children: { table: { category: 'Conteúdo' } },
  },
}

export default meta
type Story = StoryObj<typeof Button>

/* ─── Helpers ──────────────────────────────────────── */
const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '28px 0 10px' }}>
    {children}
  </p>
)
const Divider = () => <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '8px 0' }} />
const Row = ({ children, gap = 10 }: { children: React.ReactNode; gap?: number }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap, alignItems: 'center' }}>{children}</div>
)

/* ═══════════════════════════════════════════════════
   1. OVERVIEW — all variants at a glance
══════════════════════════════════════════════════════ */
export const VisãoGeral: Story = {
  name: '1 · Visão geral',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 860 }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
        Hierarquia de ações: use <strong>primary</strong> para a ação principal, <strong>secondary/outline</strong> para ações alternativas,
        <strong> ghost/tertiary</strong> para ações discretas, <strong>success</strong> para confirmações positivas e <strong>danger</strong> para ações destrutivas.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px 24px', alignItems: 'center' }}>

        {/* Primary */}
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Primary</span>
        <Row>
          <Button variant="primary" leadingIcon="add">Nova solicitação</Button>
          <Button variant="primary" leadingIcon="check">Confirmar</Button>
          <Button variant="primary" trailingIcon="arrow_forward">Avançar</Button>
        </Row>

        {/* Secondary */}
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Secondary</span>
        <Row>
          <Button variant="secondary" leadingIcon="edit">Editar</Button>
          <Button variant="secondary" leadingIcon="download">Exportar</Button>
          <Button variant="secondary">Cancelar</Button>
        </Row>

        {/* Outline */}
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Outline</span>
        <Row>
          <Button variant="outline" leadingIcon="visibility">Ver detalhes</Button>
          <Button variant="outline" leadingIcon="filter_list">Filtrar</Button>
          <Button variant="outline">Voltar</Button>
        </Row>

        {/* Ghost */}
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Ghost</span>
        <Row>
          <Button variant="ghost" leadingIcon="close">Fechar</Button>
          <Button variant="ghost" leadingIcon="more_horiz">Mais opções</Button>
          <Button variant="ghost">Ignorar</Button>
        </Row>

        {/* Tertiary */}
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Tertiary</span>
        <Row>
          <Button variant="tertiary" leadingIcon="history">Histórico</Button>
          <Button variant="tertiary">Ver todos</Button>
        </Row>

        {/* Success */}
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Success</span>
        <Row>
          <Button variant="success" leadingIcon="check_circle">Concluir</Button>
          <Button variant="success" leadingIcon="verified">Reabilitar</Button>
        </Row>

        {/* Danger */}
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Danger</span>
        <Row>
          <Button variant="danger" leadingIcon="delete">Excluir</Button>
          <Button variant="danger-outline" leadingIcon="cancel">Rejeitar</Button>
        </Row>

        {/* Link */}
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Link</span>
        <Row>
          <Button variant="link" leadingIcon="open_in_new">Documentação</Button>
          <Button variant="link">Ver mais</Button>
        </Row>

      </div>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   2. STATES — all states for each variant
══════════════════════════════════════════════════════ */
export const Estados: Story = {
  name: '2 · Estados',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 860 }}>
      <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>
        Cada variante tem 4 estados: <strong>Default → Hover → Loading → Disabled</strong>.
        Passe o mouse para ver o hover.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '100px repeat(4, auto)',
        gap: '10px 20px',
        alignItems: 'center',
      }}>
        {/* Header */}
        <span />
        {['Default', 'Com ícone', 'Loading', 'Disabled'].map(h => (
          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{h}</span>
        ))}

        {/* Rows */}
        {([
          ['primary',       'Confirmar'],
          ['secondary',     'Cancelar'],
          ['outline',       'Ver detalhes'],
          ['ghost',         'Ignorar'],
          ['tertiary',      'Ver histórico'],
          ['success',       'Concluir'],
          ['danger',        'Excluir'],
          ['danger-outline','Rejeitar'],
        ] as const).map(([v, label]) => (
          <>
            <span key={`${v}-l`} style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{v}</span>
            <Button key={`${v}-d`} variant={v}>{label}</Button>
            <Button key={`${v}-i`} variant={v} leadingIcon="check">{label}</Button>
            <Button key={`${v}-lo`} variant={v} loading>{label}</Button>
            <Button key={`${v}-dis`} variant={v} disabled>{label}</Button>
          </>
        ))}
      </div>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   3. SIZES — sm / md / lg with full spec
══════════════════════════════════════════════════════ */
export const Tamanhos: Story = {
  name: '3 · Tamanhos',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700 }}>
      {/* Size comparison */}
      <Label>Comparação de tamanhos — Primary</Label>
      <Row>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Button variant="primary" size="sm" leadingIcon="add">Pequeno</Button>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>sm · 30px · 12px</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Button variant="primary" size="md" leadingIcon="add">Médio</Button>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>md · 36px · 14px</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Button variant="primary" size="lg" leadingIcon="add">Grande</Button>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>lg · 44px · 16px</span>
        </div>
      </Row>

      {/* When to use each */}
      <Label>Quando usar cada tamanho</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, borderLeft: '3px solid #E2E8F0' }}>
          <strong style={{ fontSize: 12, color: '#0F172A' }}>sm (30px)</strong>
          <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 8px' }}>Tabelas, chips de ação em linha, toolbars densas</p>
          <Row gap={6}>
            <Button variant="success" size="sm" leadingIcon="check">Aprovar</Button>
            <Button variant="danger-outline" size="sm" leadingIcon="close">Rejeitar</Button>
            <Button variant="ghost" size="sm" leadingIcon="more_horiz">Ações</Button>
          </Row>
        </div>
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, borderLeft: '3px solid #94A3B8' }}>
          <strong style={{ fontSize: 12, color: '#0F172A' }}>md (36px) — padrão</strong>
          <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 8px' }}>Formulários, modais, barras de ação de página</p>
          <Row gap={8}>
            <Button variant="primary" size="md" leadingIcon="save">Salvar</Button>
            <Button variant="secondary" size="md">Cancelar</Button>
          </Row>
        </div>
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, borderLeft: '3px solid #0038A8' }}>
          <strong style={{ fontSize: 12, color: '#0F172A' }}>lg (44px)</strong>
          <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 8px' }}>CTAs de página inteira, login, onboarding, telas mobile</p>
          <Button variant="primary" size="lg" fullWidth leadingIcon="login">Entrar no sistema</Button>
        </div>
      </div>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   4. ICONS — leading / trailing / icon-only
══════════════════════════════════════════════════════ */
export const Ícones: Story = {
  name: '4 · Ícones',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700 }}>
      <Label>Ícone à esquerda — leadingIcon (mais comum)</Label>
      <Row>
        <Button variant="primary"       leadingIcon="add">Nova solicitação</Button>
        <Button variant="secondary"     leadingIcon="edit">Editar</Button>
        <Button variant="outline"       leadingIcon="download">Exportar</Button>
        <Button variant="success"       leadingIcon="check_circle">Concluir</Button>
        <Button variant="danger"        leadingIcon="delete">Excluir</Button>
        <Button variant="ghost"         leadingIcon="logout">Sair</Button>
      </Row>

      <Label>Ícone à direita — trailingIcon (seta de navegação)</Label>
      <Row>
        <Button variant="primary"   trailingIcon="arrow_forward">Próximo passo</Button>
        <Button variant="secondary" trailingIcon="chevron_right">Ver relatório</Button>
        <Button variant="link"      trailingIcon="open_in_new">Abrir no sistema</Button>
      </Row>

      <Label>Apenas ícone — sem texto (para toolbars e tabelas)</Label>
      <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
        Sempre use <code style={{ background: '#F1F5F9', padding: '1px 4px', borderRadius: 3 }}>aria-label</code> para acessibilidade.
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="ghost"   size="sm" leadingIcon="edit"        aria-label="Editar" />
        <Button variant="ghost"   size="sm" leadingIcon="delete"       aria-label="Excluir" />
        <Button variant="ghost"   size="sm" leadingIcon="more_vert"    aria-label="Mais opções" />
        <Divider />
        <Button variant="outline" size="md" leadingIcon="filter_list"  aria-label="Filtrar" />
        <Button variant="outline" size="md" leadingIcon="search"       aria-label="Buscar" />
        <Button variant="outline" size="md" leadingIcon="refresh"      aria-label="Atualizar" />
        <Divider />
        <Button variant="danger"  size="sm" leadingIcon="delete"       aria-label="Excluir" />
        <Button variant="success" size="sm" leadingIcon="check"        aria-label="Aprovar" />
      </div>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   5. USAGE PATTERNS — real product contexts
══════════════════════════════════════════════════════ */
export const PadrõesDeUso: Story = {
  name: '5 · Padrões de uso',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700 }}>

      <Label>Barra de ações de formulário</Label>
      <div style={{
        padding: '16px 20px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 10,
      }}>
        <Button variant="ghost" leadingIcon="close">Cancelar</Button>
        <Button variant="secondary" leadingIcon="save_as">Salvar rascunho</Button>
        <Button variant="primary" leadingIcon="send">Enviar para aprovação</Button>
      </div>

      <Label>Ações de aprovação em tabela</Label>
      <div style={{
        padding: '12px 16px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>SOL-2024-0183</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>TAG-CV-1234 · Classe 2 · Em aprovação</div>
        </div>
        <Row gap={6}>
          <Button variant="outline" size="sm" leadingIcon="visibility">Ver</Button>
          <Button variant="danger-outline" size="sm" leadingIcon="close">Rejeitar</Button>
          <Button variant="success" size="sm" leadingIcon="check">Aprovar</Button>
        </Row>
      </div>

      <Label>Modal de confirmação destrutiva</Label>
      <div style={{
        padding: '20px 24px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        maxWidth: 400,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>Cancelar solicitação?</div>
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
          Esta ação não pode ser desfeita. A solicitação SOL-2024-0183 será cancelada permanentemente.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost">Voltar</Button>
          <Button variant="danger" leadingIcon="cancel">Confirmar cancelamento</Button>
        </div>
      </div>

      <Label>CTA de onboarding / login — mobile</Label>
      <div style={{
        padding: '24px 20px',
        background: '#F0F4F8',
        borderRadius: 12,
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <Button variant="primary" size="lg" fullWidth leadingIcon="login">Entrar no sistema</Button>
        <Button variant="outline" size="lg" fullWidth>Preciso de ajuda</Button>
      </div>

    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   6. PLAYGROUND
══════════════════════════════════════════════════════ */
export const Playground: Story = {
  name: '6 · Playground',
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Botão SGI',
    leadingIcon: 'add',
    loading: false,
    disabled: false,
    fullWidth: false,
  },
}

/* ═══════════════════════════════════════════════════
   7. DEVELOPER REFERENCE
══════════════════════════════════════════════════════ */
export const Referência: Story = {
  name: '7 · Referência técnica',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#374151', maxWidth: 720 }}>

      <Label>Props da API React</Label>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
            {['Prop', 'Tipo', 'Padrão', 'Descrição'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94A3B8', fontWeight: 600, fontSize: 11 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['variant', 'ButtonVariant', '"primary"', 'Estilo visual'],
            ['size', 'ButtonSize', '"md"', 'Altura do botão (sm=30 md=36 lg=44)'],
            ['loading', 'boolean', 'false', 'Spinner + bloqueia interação'],
            ['disabled', 'boolean', 'false', 'Desabilita e reduz opacidade'],
            ['leadingIcon', 'string', '—', 'Nome do Material Symbol (esquerda)'],
            ['trailingIcon', 'string', '—', 'Nome do Material Symbol (direita)'],
            ['fullWidth', 'boolean', 'false', 'width: 100%'],
          ].map(([prop, type, def, desc]) => (
            <tr key={prop} style={{ borderBottom: '1px solid #F8FAFC' }}>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#0038A8' }}>{prop}</td>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748B', fontSize: 11 }}>{type}</td>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#94A3B8', fontSize: 11 }}>{def}</td>
              <td style={{ padding: '6px 10px', color: '#374151' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Label>Classes CSS puras — tokens</Label>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
            {['Classe', 'Token CSS', 'Valor'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94A3B8', fontWeight: 600, fontSize: 11 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['.btn-primary bg',  '--color-primary-700', '#0038A8'],
            ['.btn-primary hover', '--color-primary-800', '#002D8A'],
            ['.btn-secondary bg', '--color-primary-50', '#EBF0FB'],
            ['.btn-success bg', '—', '#16A34A'],
            ['.btn-danger bg', '—', '#DC2626'],
            ['font-weight', '--font-weight-medium', '500'],
            ['border-radius', '—', '8px'],
            ['transition', '—', '120ms ease'],
            ['focus-ring', '--color-primary-700 25%', 'rgba(0,56,168,0.25)'],
          ].map(([cls, token, val]) => (
            <tr key={cls} style={{ borderBottom: '1px solid #F8FAFC' }}>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#0038A8', fontSize: 12 }}>{cls}</td>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748B', fontSize: 11 }}>{token}</td>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#374151', fontWeight: 600 }}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}
