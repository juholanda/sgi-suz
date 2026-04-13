import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Cores',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Paleta completa de cores do SGI. Todas as cores são definidas como variáveis CSS em `globals.css` e referenciadas via tokens em `design-system/tokens.ts`.',
      },
    },
  },
}

export default meta
type Story = StoryObj

/* ─── Color swatch ─────────────────────────────── */
function Swatch({ name, hex, textColor = '#0F172A', varName }: {
  name: string
  hex: string
  textColor?: string
  varName?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div
        style={{
          height: 56,
          borderRadius: 8,
          background: hex,
          border: hex === '#FFFFFF' || hex === '#F8FAFC' ? '1px solid #E2E8F0' : 'none',
        }}
      />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{name}</div>
        <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{hex}</div>
        {varName && <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace', marginTop: 1 }}>{varName}</div>}
      </div>
    </div>
  )
}

function PaletteRow({ label, swatches }: { label: string; swatches: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <p style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 16,
      }}>
        {label}
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '12px 16px',
      }}>
        {swatches}
      </div>
    </section>
  )
}

/* ── Primary palette ─────────────────────────────── */
export const PrimáriasESecundárias: Story = {
  name: 'Primárias e secundárias',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 900 }}>
      <PaletteRow label="Azul primário — brand" swatches={
        <>
          <Swatch name="Primary 50"  hex="#EBF0FB" varName="--color-primary-50" />
          <Swatch name="Primary 100" hex="#D8E4F8" varName="--color-primary-100" />
          <Swatch name="Primary 200" hex="#B0C8F1" varName="--color-primary-200" />
          <Swatch name="Primary 300" hex="#7DA4E8" varName="--color-primary-300" />
          <Swatch name="Primary 400" hex="#4A80DE" varName="--color-primary-400" />
          <Swatch name="Primary 500" hex="#1F5EC8" varName="--color-primary-500" />
          <Swatch name="Primary 600" hex="#0E4AB8" varName="--color-primary-600" />
          <Swatch name="Primary 700" hex="#0038A8" textColor="#fff" varName="--color-primary-700 ★" />
          <Swatch name="Primary 800" hex="#002D8A" textColor="#fff" varName="--color-primary-800" />
          <Swatch name="Primary 900" hex="#001E5C" textColor="#fff" varName="--color-primary-900" />
        </>
      } />

      <PaletteRow label="Neutro / Slate — textos e fundos" swatches={
        <>
          <Swatch name="Neutral 50"  hex="#F8FAFC" varName="--color-neutral-50" />
          <Swatch name="Neutral 100" hex="#F1F5F9" varName="--color-neutral-100" />
          <Swatch name="Neutral 200" hex="#E2E8F0" varName="--color-neutral-200" />
          <Swatch name="Neutral 300" hex="#CBD5E1" varName="--color-neutral-300" />
          <Swatch name="Neutral 400" hex="#94A3B8" varName="--color-neutral-400" />
          <Swatch name="Neutral 500" hex="#64748B" varName="--color-neutral-500" />
          <Swatch name="Neutral 600" hex="#475569" textColor="#fff" varName="--color-neutral-600" />
          <Swatch name="Neutral 700" hex="#334155" textColor="#fff" varName="--color-neutral-700" />
          <Swatch name="Neutral 800" hex="#1E293B" textColor="#fff" varName="--color-neutral-800" />
          <Swatch name="Neutral 900" hex="#0F172A" textColor="#fff" varName="--color-neutral-900" />
        </>
      } />
    </div>
  ),
}

/* ── Semantic colors ─────────────────────────────── */
export const Semânticas: Story = {
  name: 'Semânticas',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 900 }}>
      <PaletteRow label="Sucesso" swatches={
        <>
          <Swatch name="Lightest" hex="#F0FDF4" varName="--color-success-lightest" />
          <Swatch name="Lighter"  hex="#DCFCE7" varName="--color-success-lighter" />
          <Swatch name="Light"    hex="#BBF7D0" varName="--color-success-light" />
          <Swatch name="Default"  hex="#16A34A" textColor="#fff" varName="--color-success" />
          <Swatch name="Dark"     hex="#15803D" textColor="#fff" varName="--color-success-dark" />
          <Swatch name="Darker"   hex="#14532D" textColor="#fff" varName="--color-success-darker" />
        </>
      } />

      <PaletteRow label="Aviso" swatches={
        <>
          <Swatch name="Lightest" hex="#FEFCE8" varName="--color-warning-lightest" />
          <Swatch name="Lighter"  hex="#FEF9C3" varName="--color-warning-lighter" />
          <Swatch name="Light"    hex="#FEF08A" varName="--color-warning-light" />
          <Swatch name="Default"  hex="#EAB308" varName="--color-warning" />
          <Swatch name="Dark"     hex="#CA8A04" textColor="#fff" varName="--color-warning-dark" />
          <Swatch name="Darker"   hex="#92400E" textColor="#fff" varName="--color-warning-darker" />
        </>
      } />

      <PaletteRow label="Erro / Perigo" swatches={
        <>
          <Swatch name="Lightest" hex="#FFF5F5" varName="--color-danger-lightest" />
          <Swatch name="Lighter"  hex="#FEE2E2" varName="--color-danger-lighter" />
          <Swatch name="Light"    hex="#FECACA" varName="--color-danger-light" />
          <Swatch name="Default"  hex="#DC2626" textColor="#fff" varName="--color-danger" />
          <Swatch name="Dark"     hex="#B91C1C" textColor="#fff" varName="--color-danger-dark" />
          <Swatch name="Darker"   hex="#7F1D1D" textColor="#fff" varName="--color-danger-darker" />
        </>
      } />

      <PaletteRow label="Informação" swatches={
        <>
          <Swatch name="Lightest" hex="#ECFEFF" varName="--color-info-lightest" />
          <Swatch name="Lighter"  hex="#CFFAFE" varName="--color-info-lighter" />
          <Swatch name="Light"    hex="#A5F3FC" varName="--color-info-light" />
          <Swatch name="Default"  hex="#0891B2" textColor="#fff" varName="--color-info" />
          <Swatch name="Dark"     hex="#0E7490" textColor="#fff" varName="--color-info-dark" />
          <Swatch name="Darker"   hex="#164E63" textColor="#fff" varName="--color-info-darker" />
        </>
      } />
    </div>
  ),
}

/* ── Classes de severidade ───────────────────────── */
export const ClassesDeSeveridade: Story = {
  name: 'Classes de severidade',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700 }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
        Escala cromática de azul (seguro) → teal (moderado) → laranja (perigoso) → vermelho (crítico) → marrom (extremo / proibido).
        A progressão visual permite reconhecer o risco instantaneamente.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { classe: '1', label: 'Baixo risco',    desc: 'Azul — informacional, operação segura',          bg: '#DBEAFE', text: '#1E3A8A', border: '#93C5FD', badge: '#1D4ED8' },
          { classe: '2', label: 'Risco moderado', desc: 'Teal — atenção, gerenciável com controles',      bg: '#CCFBF1', text: '#0F766E', border: '#5EEAD4', badge: '#0D9488' },
          { classe: '3', label: 'Alto risco',     desc: 'Laranja — perigo crescente, aprovação rigorosa', bg: '#FFEDD5', text: '#7C2D12', border: '#FDBA74', badge: '#EA580C' },
          { classe: '4', label: 'Risco crítico',  desc: 'Vermelho — perigo alto, dupla aprovação',        bg: '#FEE2E2', text: '#7F1D1D', border: '#FCA5A5', badge: '#DC2626' },
          { classe: '5', label: 'NÃO FORÇÁVEL',   desc: 'Marrom escuro — instrumento protegido por lei',  bg: '#1C0505', text: '#FCA5A5', border: '#7F1D1D', badge: '#7F1D1D' },
        ].map(c => (
          <div key={c.classe} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: c.bg,
            border: `1.5px solid ${c.border}`,
          }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 6,
                background: c.badge, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>C{c.classe}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{c.label}</div>
              <div style={{ fontSize: 11, color: c.text, opacity: 0.7, marginTop: 1 }}>{c.desc}</div>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: c.text, opacity: 0.5, flexShrink: 0 }}>{c.badge}</span>
          </div>
        ))}
      </div>
    </div>
  ),
}

/* ── Status colors ───────────────────────────────── */
export const StatusDeSolicitacao: Story = {
  name: 'Status de solicitação',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 760 }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
        Cores agrupadas por <strong>semântica operacional</strong> — não apenas por ordem de fluxo.
        O operador reconhece o estado de urgência imediatamente pela cor, sem ler o texto.
      </p>

      {[
        {
          group: 'Neutro — sem ação urgente',
          color: '#94A3B8',
          items: [
            { label: 'Rascunho',  dot: '#94A3B8', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', desc: 'Não enviado ainda' },
            { label: 'Cancelada', dot: '#94A3B8', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', desc: 'Encerrado sem conclusão' },
          ],
        },
        {
          group: 'Atenção — aguarda decisão humana',
          color: '#D97706',
          items: [
            { label: 'Em aprovação',        dot: '#D97706', bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', desc: 'Aguardando aprovador' },
            { label: 'Extensão em análise', dot: '#EA580C', bg: '#FFF7ED', text: '#7C2D12', border: '#FDBA74', desc: 'Prorrogação em análise' },
          ],
        },
        {
          group: 'Em andamento — trabalho ativo',
          color: '#2563EB',
          items: [
            { label: 'Execução autorizada', dot: '#2563EB', bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD', desc: 'Aprovado, aguardando campo' },
            { label: 'Em execução',         dot: '#0038A8', bg: '#EBF0FB', text: '#002D8A', border: '#93C5FD', desc: 'Equipe no campo' },
          ],
        },
        {
          group: '⚠ Alerta operacional — intertravamento DESABILITADO',
          color: '#EA580C',
          items: [
            { label: 'Desabilitado', dot: '#EA580C', bg: '#FFF7ED', text: '#7C2D12', border: '#FB923C', desc: 'IT desligado — risco ativo' },
          ],
        },
        {
          group: 'Retorno à segurança — reabilitação',
          color: '#0D9488',
          items: [
            { label: 'Em reabilitação',             dot: '#0D9488', bg: '#F0FDFA', text: '#0F766E', border: '#5EEAD4', desc: 'Equipe reabilitando' },
            { label: 'Validação da reabilitação',   dot: '#0F766E', bg: '#CCFBF1', text: '#0F766E', border: '#2DD4BF', desc: 'Verificação final' },
          ],
        },
        {
          group: 'Encerrado com sucesso',
          color: '#16A34A',
          items: [
            { label: 'Encerrada', dot: '#16A34A', bg: '#F0FDF4', text: '#14532D', border: '#86EFAC', desc: 'IT reabilitado e validado' },
          ],
        },
        {
          group: 'Terminal negativo',
          color: '#DC2626',
          items: [
            { label: 'Rejeitada', dot: '#DC2626', bg: '#FEF2F2', text: '#7F1D1D', border: '#FCA5A5', desc: 'Aprovação negada' },
          ],
        },
      ].map(group => (
        <div key={group.group} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{group.group}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingLeft: 18 }}>
            {group.items.map(s => (
              <div key={s.label} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 6,
                background: s.bg,
                border: `1px solid ${s.border}`,
                minWidth: 220,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: s.text }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: s.text, opacity: 0.65 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}
