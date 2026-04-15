/**
 * Tabs — Design System / SGI
 *
 * Componente de abas baseado em @radix-ui/react-tabs com cores da marca.
 * Estilo pill (rounded-full) com fundo #0038A8 quando ativo.
 *
 * Uso:
 * ```tsx
 * import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
 *
 * <Tabs defaultValue="tab-1">
 *   <TabsList>
 *     <TabsTrigger value="tab-1">Detalhes</TabsTrigger>
 *     <TabsTrigger value="tab-2">Timeline</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab-1">...</TabsContent>
 *   <TabsContent value="tab-2">...</TabsContent>
 * </Tabs>
 * ```
 */
import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const meta: Meta<typeof Tabs> = {
  title: 'Design System/Componentes/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Tabs com estilo pill** — abas com bordas arredondadas e cor primária #0038A8.

Construído sobre \`@radix-ui/react-tabs\` com classes Tailwind da marca.
Suporta scroll horizontal em telas pequenas via \`ScrollArea\`.
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
   1. BÁSICO — Tabs simples com conteúdo
══════════════════════════════════════════════════════ */
export const Basico: Story = {
  name: '1 · Interativo',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 600 }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        Clique nas abas para alternar o conteúdo.
      </p>
      <Tabs defaultValue="detalhes">
        <TabsList className="mb-3">
          <TabsTrigger value="detalhes">
            <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>info</span>
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>timeline</span>
            Linha do Tempo
          </TabsTrigger>
          <TabsTrigger value="anexos">
            <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>attach_file</span>
            Anexos
          </TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent value="detalhes">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 12 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>Conteudo da aba Detalhes</p>
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 12 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>Conteudo da aba Linha do Tempo</p>
          </div>
        </TabsContent>
        <TabsContent value="anexos">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 12 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>Conteudo da aba Anexos</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   2. COM SCROLL HORIZONTAL — muitas abas
══════════════════════════════════════════════════════ */
export const ComScroll: Story = {
  name: '2 · Com scroll horizontal',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 400 }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        Quando ha muitas abas, o scroll horizontal permite navegar.
      </p>
      <Tabs defaultValue="todas">
        <ScrollArea>
          <TabsList className="mb-3">
            <TabsTrigger value="todas">
              <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>list</span>
              Todas
            </TabsTrigger>
            <TabsTrigger value="andamento">
              <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>sync</span>
              Em andamento
            </TabsTrigger>
            <TabsTrigger value="encerradas">
              <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>check_circle</span>
              Encerradas
            </TabsTrigger>
            <TabsTrigger value="rascunhos">
              <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>draft</span>
              Rascunhos
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="todas">
          <p style={{ padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Todas as solicitacoes</p>
        </TabsContent>
        <TabsContent value="andamento">
          <p style={{ padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Em andamento</p>
        </TabsContent>
        <TabsContent value="encerradas">
          <p style={{ padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Encerradas</p>
        </TabsContent>
        <TabsContent value="rascunhos">
          <p style={{ padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Rascunhos</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   3. COM BADGES — contadores nas abas
══════════════════════════════════════════════════════ */
export const ComBadges: Story = {
  name: '3 · Com badges',
  render: () => {
    const Badge = ({ count, active }: { count: number; active?: boolean }) => (
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '1px 6px',
        borderRadius: 10,
        background: active ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
        color: active ? '#FFFFFF' : '#94A3B8',
        lineHeight: '16px',
        marginLeft: 6,
      }}>
        {count}
      </span>
    )

    return (
      <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 600 }}>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Badges com contadores dentro das abas.
        </p>
        <Tabs defaultValue="todas">
          <TabsList className="mb-3">
            <TabsTrigger value="todas">
              <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>list</span>
              Todas
              <Badge count={42} active />
            </TabsTrigger>
            <TabsTrigger value="andamento">
              <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>sync</span>
              Em andamento
              <Badge count={18} />
            </TabsTrigger>
            <TabsTrigger value="encerradas">
              <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>check_circle</span>
              Encerradas
              <Badge count={21} />
            </TabsTrigger>
            <TabsTrigger value="rascunhos">
              <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>draft</span>
              Rascunhos
              <Badge count={3} />
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
    )
  },
}

/* ═══════════════════════════════════════════════════
   4. CONTEXTO — como aparece no detalhe da solicitacao
══════════════════════════════════════════════════════ */
export const ContextoDetalhe: Story = {
  name: '4 · Contexto detalhe',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 700, background: '#F8FAFC', padding: 24, borderRadius: 12 }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        Como as tabs aparecem na pagina de detalhe da solicitacao.
      </p>

      {/* Simulated header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, marginBottom: 16 }}>
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
        <TabsList className="mb-3">
          <TabsTrigger value="detalhes">
            <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>info</span>
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>timeline</span>
            Linha do Tempo
          </TabsTrigger>
          <TabsTrigger value="anexos">
            <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>attach_file</span>
            Anexos
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: '#F1F5F9', color: '#94A3B8', lineHeight: '16px', marginLeft: 6 }}>2</span>
          </TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent value="detalhes">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>EQUIPAMENTO</div><div style={{ fontSize: 13, color: '#0F172A' }}>BRK-001-A</div></div>
              <div><div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>AREA</div><div style={{ fontSize: 13, color: '#0F172A' }}>Fibras</div></div>
              <div><div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>SOLICITANTE</div><div style={{ fontSize: 13, color: '#0F172A' }}>Joao Silva</div></div>
              <div><div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>EXECUTANTE</div><div style={{ fontSize: 13, color: '#0F172A' }}>Carlos Santos</div></div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 12 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>Eventos da timeline...</p>
          </div>
        </TabsContent>
        <TabsContent value="anexos">
          <div style={{ padding: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 12 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>2 anexos disponíveis...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════
   5. REFERENCIA TECNICA
══════════════════════════════════════════════════════ */
export const Referencia: Story = {
  name: '5 · Referencia tecnica',
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
            ['TabsList', 'TabsPrimitive.List', 'Barra de abas'],
            ['TabsTrigger', 'TabsPrimitive.Trigger', 'Botao de aba (pill)'],
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

      <Label>Tokens de estilo</Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'Ativo (bg)', hex: '#0038A8', bg: '#0038A8', text: '#FFFFFF' },
          { label: 'Ativo (text)', hex: '#FFFFFF', bg: '#FFFFFF', text: '#0F172A' },
          { label: 'Inativo (text)', hex: '#64748B', bg: '#64748B', text: '#FFFFFF' },
          { label: 'Hover (bg)', hex: '#F1F5F9', bg: '#F1F5F9', text: '#0F172A' },
          { label: 'Focus ring', hex: '#0038A880', bg: '#0038A880', text: '#FFFFFF' },
          { label: 'Separator', hex: '#E2E8F0', bg: '#E2E8F0', text: '#0F172A' },
        ].map(t => (
          <div key={t.label} style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ height: 28, background: t.bg }} />
            <div style={{ padding: '5px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{t.label}</div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748B' }}>{t.hex}</div>
            </div>
          </div>
        ))}
      </div>

      <Label>Dependencias</Label>
      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, lineHeight: 2 }}>
        <div>@radix-ui/react-tabs</div>
        <div>@radix-ui/react-scroll-area</div>
        <div>@radix-ui/react-separator</div>
        <div>tailwind-merge + clsx</div>
      </div>
    </div>
  ),
}
