import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Tipografia',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Sistema tipográfico do SGI. Fonte principal: **Inter**. Todos os tamanhos, pesos e estilos de texto usados no produto, do H1 ao label de formulário.',
      },
    },
  },
}

export default meta
type Story = StoryObj

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 20,
      marginTop: 40,
    }}>
      {children}
    </p>
  )
}

function TypeRow({ name, token, style, children }: {
  name: string
  token: string
  style: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 32,
      padding: '14px 0',
      borderBottom: '1px solid #F1F5F9',
    }}>
      <div style={{ minWidth: 160, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{name}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', marginTop: 2 }}>{token}</div>
      </div>
      <div style={{ flex: 1, ...style, fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>
        {children}
      </div>
    </div>
  )
}

/* ── Headings ────────────────────────────────────── */
export const Cabeçalhos: Story = {
  name: 'Cabeçalhos',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 800 }}>
      <SectionLabel>Desktop — cabeçalhos</SectionLabel>

      <TypeRow name="Display / H1" token="36px · bold · tight" style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2 }}>
        Gestão de intertravamentos
      </TypeRow>
      <TypeRow name="H2" token="30px · bold · tight" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>
        Solicitações de desabilitação
      </TypeRow>
      <TypeRow name="H3" token="24px · semibold · snug" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.4 }}>
        Aprovações pendentes
      </TypeRow>
      <TypeRow name="H4" token="20px · semibold · snug" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.4 }}>
        Informações do equipamento
      </TypeRow>
      <TypeRow name="H5" token="18px · semibold · normal" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5 }}>
        Dados da solicitação
      </TypeRow>
      <TypeRow name="H6 / Section" token="16px · semibold · normal" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>
        Histórico de alterações
      </TypeRow>

      <SectionLabel>Mobile — cabeçalhos (reduzidos)</SectionLabel>
      <TypeRow name="H1 mobile" token="28px · bold · tight" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
        Gestão de intertravamentos
      </TypeRow>
      <TypeRow name="H2 mobile" token="22px · bold · tight" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
        Solicitações de desabilitação
      </TypeRow>
      <TypeRow name="H3 mobile" token="18px · semibold · snug" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.4 }}>
        Aprovações pendentes
      </TypeRow>
    </div>
  ),
}

/* ── Body text ───────────────────────────────────── */
export const Parágrafos: Story = {
  name: 'Parágrafos e corpo',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 800 }}>
      <SectionLabel>Texto de corpo</SectionLabel>

      <TypeRow name="Body large" token="16px · regular · relaxed" style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.75 }}>
        O sistema de gestão de intertravamentos garante rastreabilidade completa em cada etapa do processo de desabilitação de instrumentos de segurança na operação industrial.
      </TypeRow>
      <TypeRow name="Body base" token="14px · regular · relaxed" style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.75 }}>
        O sistema de gestão de intertravamentos garante rastreabilidade completa em cada etapa do processo de desabilitação de instrumentos de segurança na operação industrial.
      </TypeRow>
      <TypeRow name="Body small" token="13px · regular · relaxed" style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.75 }}>
        O sistema de gestão de intertravamentos garante rastreabilidade completa em cada etapa do processo de desabilitação de instrumentos de segurança na operação industrial.
      </TypeRow>
      <TypeRow name="Caption" token="12px · regular · normal" style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.6, color: '#64748B' }}>
        Apenas notificações do seu perfil ativo são exibidas. Em caso de dúvidas, contate o administrador.
      </TypeRow>
      <TypeRow name="Micro" token="10px · medium · wide" style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.05em', color: '#94A3B8', textTransform: 'uppercase' }}>
        CRIADO EM 12 ABR 2026 · 09:42
      </TypeRow>

      <SectionLabel>Texto com peso</SectionLabel>
      <TypeRow name="Body medium" token="14px · medium · relaxed" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.75 }}>
        O sistema de gestão de intertravamentos garante rastreabilidade completa.
      </TypeRow>
      <TypeRow name="Body semibold" token="14px · semibold · relaxed" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.75 }}>
        O sistema de gestão de intertravamentos garante rastreabilidade completa.
      </TypeRow>
    </div>
  ),
}

/* ── UI text ─────────────────────────────────────── */
export const TextosDeInterface: Story = {
  name: 'Textos de interface',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 800 }}>
      <SectionLabel>Labels e formulários</SectionLabel>

      <TypeRow name="Field label" token="13px · medium" style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
        Área de instalação
      </TypeRow>
      <TypeRow name="Field label required" token="13px · medium + asterisco" style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
        Área de instalação <span style={{ color: '#DC2626' }}>*</span>
      </TypeRow>
      <TypeRow name="Placeholder" token="14px · regular · muted" style={{ fontSize: 14, fontWeight: 400, color: '#94A3B8' }}>
        Digite a descrição da solicitação...
      </TypeRow>
      <TypeRow name="Field hint" token="12px · regular · muted" style={{ fontSize: 12, fontWeight: 400, color: '#94A3B8' }}>
        Informe o prazo desejado. Solicitações acima de 72 h requerem aprovação de Gestor SMS.
      </TypeRow>
      <TypeRow name="Field error" token="12px · regular · danger" style={{ fontSize: 12, fontWeight: 400, color: '#DC2626' }}>
        Campo obrigatório. Por favor preencha este campo.
      </TypeRow>

      <SectionLabel>Ações e navegação</SectionLabel>
      <TypeRow name="Button sm" token="12px · semibold" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.01em' }}>
        Aprovar
      </TypeRow>
      <TypeRow name="Button md" token="14px · medium" style={{ fontSize: 14, fontWeight: 500, letterSpacing: '0.01em' }}>
        Confirmar aprovação
      </TypeRow>
      <TypeRow name="Button lg" token="16px · medium" style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.01em' }}>
        Entrar no sistema
      </TypeRow>
      <TypeRow name="Link" token="14px · medium · primary · underline" style={{ fontSize: 14, fontWeight: 500, color: '#0038A8', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
        Ver detalhes da solicitação
      </TypeRow>
      <TypeRow name="Nav item" token="14px · regular → 600 active" style={{ fontSize: 14, fontWeight: 400, color: '#374151' }}>
        Solicitações
      </TypeRow>

      <SectionLabel>Badges e tags</SectionLabel>
      <TypeRow name="Badge label" token="11px · semibold · uppercase · wide" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0038A8' }}>
        Em aprovação
      </TypeRow>
      <TypeRow name="Tag" token="12px · medium" style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>
        Classe 2
      </TypeRow>
      <TypeRow name="Section label" token="11px · semibold · uppercase · wider" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>
        Aprovações pendentes
      </TypeRow>
    </div>
  ),
}

/* ── Type scale table ────────────────────────────── */
export const EscalaCompleta: Story = {
  name: 'Escala completa',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 900 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
        Tokens de tipografia — referência
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              {['Token CSS', 'Tamanho', 'px', 'Pesos disponíveis', 'Uso principal'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#94A3B8', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['--font-size-4xl', '4xl', '36px', 'bold', 'Display / H1 desktop'],
              ['--font-size-3xl', '3xl', '30px', 'bold', 'H2 desktop'],
              ['--font-size-2xl', '2xl', '24px', 'semibold', 'H3 / página title'],
              ['--font-size-xl',  'xl',  '20px', 'semibold', 'H4 / card title'],
              ['--font-size-lg',  'lg',  '18px', 'semibold', 'H5 / section title'],
              ['--font-size-md',  'md',  '16px', 'regular / semibold', 'Body large / H6'],
              ['--font-size-base','base','14px', 'regular / medium / semibold', 'Body base / botão md'],
              ['--font-size-sm',  'sm',  '13px', 'regular / medium', 'Body small / label'],
              ['--font-size-xs',  'xs',  '12px', 'regular / medium / semibold', 'Caption / botão sm / hint'],
              ['--font-size-2xs', '2xs', '10px', 'medium / semibold', 'Micro / timestamp'],
            ].map(([token, scale, px, weights, use]) => (
              <tr key={token} style={{ borderBottom: '1px solid #F8FAFC' }}>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#0038A8', fontSize: 12 }}>{token}</td>
                <td style={{ padding: '8px 12px', color: '#64748B' }}>{scale}</td>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0F172A' }}>{px}</td>
                <td style={{ padding: '8px 12px', color: '#64748B' }}>{weights}</td>
                <td style={{ padding: '8px 12px', color: '#64748B' }}>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Pesos de fonte
        </p>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {[
            { name: 'Light', weight: 300, token: '--font-weight-light' },
            { name: 'Regular', weight: 400, token: '--font-weight-normal' },
            { name: 'Medium', weight: 500, token: '--font-weight-medium' },
            { name: 'Semibold', weight: 600, token: '--font-weight-semibold' },
            { name: 'Bold', weight: 700, token: '--font-weight-bold' },
          ].map(w => (
            <div key={w.name}>
              <div style={{ fontSize: 20, fontWeight: w.weight, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>Ag</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 4 }}>{w.name} · {w.weight}</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94A3B8' }}>{w.token}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}
