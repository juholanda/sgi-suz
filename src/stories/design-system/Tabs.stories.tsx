/**
 * Tabs — Design System / SGI
 *
 * Componente de abas com borda inferior baseado em @radix-ui/react-tabs.
 * Estilo underline com cor primaria #0038A8 e icones Material Symbols.
 *
 * Uso:
 * ```tsx
 * import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
 *
 * <Tabs defaultValue="tab-1">
 *   <TabsList>
 *     <TabsTrigger value="tab-1">
 *       <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
 *       Detalhes
 *     </TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab-1">...</TabsContent>
 * </Tabs>
 * ```
 */
import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Design System/Componentes/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Tabs com borda inferior** — estilo underline com cor primaria #0038A8.

Construido sobre \`@radix-ui/react-tabs\` com icones Material Symbols.
A borda inferior indica a aba ativa. Hover mostra fundo suave com bordas arredondadas.
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Tabs>

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '28px 0 10px' }}>
    {children}
  </p>
)

/* ═══════════════════════════════════════════════════
   1. INTERATIVO — Tabs com icones e conteudo
══════════════════════════════════════════════════════ */
export const Interativo: Story = {
  name: '1 · Interativo',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 600 }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        Clique nas abas para alternar o conteudo. Observe a borda inferior azul.
      </p>
      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>timeline</span>
            Linha do Tempo
          </TabsTrigger>
          <TabsTrigger value="anexos">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
            Anexos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="detalhes">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>Conteudo da aba Detalhes</p>
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>Conteudo da aba Linha do Tempo</p>
          </div>
        </TabsContent>
        <TabsContent value="anexos">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>Conteudo da aba Anexos</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   2. COM BADGES — contadores nas abas
══════════════════════════════════════════════════════ */
export const ComBadges: Story = {
  name: '2 · Com badges',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700 }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        Badges com contadores acompanham as abas.
      </p>
      <Tabs defaultValue="todas">
        <TabsList>
          <TabsTrigger value="todas">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>list</span>
            Todas
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: '#EBF0FB', color: '#0038A8', lineHeight: '16px' }}>42</span>
          </TabsTrigger>
          <TabsTrigger value="andamento">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sync</span>
            Em andamento
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: '#F1F5F9', color: '#94A3B8', lineHeight: '16px' }}>18</span>
          </TabsTrigger>
          <TabsTrigger value="encerradas">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
            Encerradas
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: '#F1F5F9', color: '#94A3B8', lineHeight: '16px' }}>21</span>
          </TabsTrigger>
          <TabsTrigger value="rascunhos">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>draft</span>
            Rascunhos
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: '#F1F5F9', color: '#94A3B8', lineHeight: '16px' }}>3</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="todas">
          <p style={{ padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>42 solicitacoes</p>
        </TabsContent>
        <TabsContent value="andamento">
          <p style={{ padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>18 em andamento</p>
        </TabsContent>
        <TabsContent value="encerradas">
          <p style={{ padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>21 encerradas</p>
        </TabsContent>
        <TabsContent value="rascunhos">
          <p style={{ padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>3 rascunhos</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   3. CONTEXTO — como aparece no detalhe da solicitacao
══════════════════════════════════════════════════════ */
export const ContextoDetalhe: Story = {
  name: '3 · Contexto detalhe',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700, background: '#F8FAFC', padding: 24, borderRadius: 12 }}>
      {/* Simulated header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EBF0FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#0038A8' }}>description</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>SGI-2024-0042</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Classe 2 - Logico</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#FFEDD5', color: '#EA580C' }}>
            Desabilitado
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>timeline</span>
            Linha do Tempo
          </TabsTrigger>
          <TabsTrigger value="anexos">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
            Anexos
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: '#F1F5F9', color: '#94A3B8', lineHeight: '16px' }}>2</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="detalhes">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>EQUIPAMENTO</div><div style={{ fontSize: 13, color: '#0F172A' }}>BRK-001-A</div></div>
              <div><div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>AREA</div><div style={{ fontSize: 13, color: '#0F172A' }}>Fibras</div></div>
              <div><div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>SOLICITANTE</div><div style={{ fontSize: 13, color: '#0F172A' }}>Joao Silva</div></div>
              <div><div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>EXECUTANTE</div><div style={{ fontSize: 13, color: '#0F172A' }}>Carlos Santos</div></div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>Eventos da timeline...</p>
          </div>
        </TabsContent>
        <TabsContent value="anexos">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>2 anexos disponveis...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   4. REFERENCIA TECNICA
══════════════════════════════════════════════════════ */
export const Referencia: Story = {
  name: '4 · Referencia tecnica',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#374151', maxWidth: 720 }}>
      <Label>Componentes exportados</Label>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
            {['Componente', 'Base Radix', 'Descricao'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94A3B8', fontWeight: 600, fontSize: 11 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['Tabs', 'TabsPrimitive.Root', 'Container raiz'],
            ['TabsList', 'TabsPrimitive.List', 'Barra com borda inferior'],
            ['TabsTrigger', 'TabsPrimitive.Trigger', 'Botao de aba (underline)'],
            ['TabsContent', 'TabsPrimitive.Content', 'Conteudo da aba'],
          ].map(([comp, base, desc]) => (
            <tr key={comp} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#0038A8', fontWeight: 600 }}>{comp}</td>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748B', fontSize: 11 }}>{base}</td>
              <td style={{ padding: '6px 10px', color: '#374151' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Label>Anatomia do estilo</Label>
      <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, fontSize: 12, lineHeight: 1.8 }}>
        <div><strong>TabsList:</strong> borda inferior <code style={{ background: '#EBF0FB', padding: '1px 4px', borderRadius: 3 }}>#E2E8F0</code>, flex com overflow-x-auto</div>
        <div><strong>TabsTrigger (inativo):</strong> texto <code style={{ background: '#EBF0FB', padding: '1px 4px', borderRadius: 3 }}>#64748B</code>, borda transparente</div>
        <div><strong>TabsTrigger (hover):</strong> fundo <code style={{ background: '#EBF0FB', padding: '1px 4px', borderRadius: 3 }}>#F1F5F9</code>, texto <code style={{ background: '#EBF0FB', padding: '1px 4px', borderRadius: 3 }}>#0038A8</code></div>
        <div><strong>TabsTrigger (ativo):</strong> borda inferior <code style={{ background: '#EBF0FB', padding: '1px 4px', borderRadius: 3 }}>#0038A8</code>, texto <code style={{ background: '#EBF0FB', padding: '1px 4px', borderRadius: 3 }}>#0038A8</code></div>
      </div>

      <Label>Dependencias</Label>
      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, lineHeight: 2 }}>
        <div>@radix-ui/react-tabs</div>
        <div>tailwind-merge + clsx</div>
      </div>
    </div>
  ),
}
