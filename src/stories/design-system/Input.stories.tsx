import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input, Textarea, Select } from '@/components/design-system/Input'

const meta: Meta = {
  title: 'Design System/Input',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'white' },
  },
  tags: ['autodocs'],
}

export default meta

// ─── Helper to show a grid of states ────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#94A3B8',
      marginBottom: 16,
      marginTop: 32,
      paddingBottom: 8,
      borderBottom: '1px solid #F1F5F9',
    }}>
      {children}
    </h2>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
      {children}
    </div>
  )
}

function StateLabel({ label, description }: { label: string; description?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 600,
        color: '#475569',
        background: '#F1F5F9',
        padding: '2px 8px',
        borderRadius: 4,
        marginBottom: 4,
      }}>
        {label}
      </span>
      {description && (
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 6px' }}>{description}</p>
      )}
    </div>
  )
}

// ─── All States Story ────────────────────────────────────────────────────────

export const TodosOsEstados: StoryObj = {
  name: 'Todos os estados — Text Input',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 960, padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
        Input
      </h1>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 32 }}>
        Campo de texto com suporte a todos os estados de interação. Label, hint, erro e sucesso são opcionais.
      </p>

      <SectionTitle>Estados</SectionTitle>
      <Grid>
        <div>
          <StateLabel label="Default" description="Estado inicial sem interação" />
          <Input
            label="Nome completo"
            placeholder="Digite seu nome"
          />
        </div>

        <div>
          <StateLabel label="Com valor" description="Campo preenchido" />
          <Input
            label="Nome completo"
            defaultValue="João Silva"
          />
        </div>

        <div>
          <StateLabel label="Focus" description="Ao receber foco (clique no campo)" />
          <Input
            label="E-mail"
            placeholder="seu@email.com"
            autoFocus
          />
        </div>

        <div>
          <StateLabel label="Error" description="Dado inválido com mensagem de erro" />
          <Input
            label="E-mail"
            defaultValue="joao@"
            variant="error"
            errorMessage="Insira um e-mail válido."
          />
        </div>

        <div>
          <StateLabel label="Success" description="Validação bem-sucedida" />
          <Input
            label="Matrícula"
            defaultValue="000123"
            variant="success"
            successMessage="Matrícula encontrada."
          />
        </div>

        <div>
          <StateLabel label="Disabled" description="Não interativo" />
          <Input
            label="Código do sistema"
            defaultValue="SGI-2024"
            disabled
          />
        </div>

        <div>
          <StateLabel label="Obrigatório" description="Label com asterisco" />
          <Input
            label="TAG do equipamento"
            placeholder="Ex: FIB-ABC-001"
            required
          />
        </div>

        <div>
          <StateLabel label="Com hint" description="Texto de ajuda abaixo" />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            hint="Mínimo de 8 caracteres, incluindo letras e números."
          />
        </div>
      </Grid>

      <SectionTitle>Com ícones</SectionTitle>
      <Grid>
        <div>
          <StateLabel label="Ícone leading" description="Busca, filtro, etc." />
          <Input
            label="Buscar"
            placeholder="Pesquisar equipamentos..."
            leadingIcon="search"
          />
        </div>

        <div>
          <StateLabel label="Ícone trailing" description="Unidade, moeda, etc." />
          <Input
            label="Temperatura"
            placeholder="0"
            type="number"
            trailingIcon="thermostat"
          />
        </div>

        <div>
          <StateLabel label="Busca com erro" />
          <Input
            label="TAG"
            defaultValue="FIB-???"
            leadingIcon="barcode_scanner"
            variant="error"
            errorMessage="TAG não encontrada no sistema."
          />
        </div>
      </Grid>

      <SectionTitle>Tamanhos</SectionTitle>
      <Grid>
        <div>
          <StateLabel label="sm — 32px" />
          <Input label="Tamanho pequeno" placeholder="Small" size="sm" />
        </div>
        <div>
          <StateLabel label="md — 40px (padrão)" />
          <Input label="Tamanho médio" placeholder="Medium (default)" size="md" />
        </div>
        <div>
          <StateLabel label="lg — 44px" />
          <Input label="Tamanho grande" placeholder="Large" size="lg" />
        </div>
      </Grid>
    </div>
  ),
}

// ─── Textarea ────────────────────────────────────────────────────────────────

export const TextareaEstados: StoryObj = {
  name: 'Textarea',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 960, padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Textarea</h1>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 32 }}>
        Campo de texto multi-linha com os mesmos estados do Input.
      </p>

      <Grid>
        <div>
          <StateLabel label="Default" />
          <Textarea
            label="Motivo da desabilitação"
            placeholder="Descreva o motivo..."
            rows={3}
          />
        </div>

        <div>
          <StateLabel label="Com valor" />
          <Textarea
            label="Motivo da desabilitação"
            defaultValue="Intertravamento preventivo para manutenção do sensor de temperatura FIB-SEN-044."
            rows={3}
          />
        </div>

        <div>
          <StateLabel label="Error" />
          <Textarea
            label="Justificativa"
            defaultValue="ok"
            variant="error"
            errorMessage="Justificativa muito curta. Mínimo de 20 caracteres."
            rows={3}
          />
        </div>

        <div>
          <StateLabel label="Disabled" />
          <Textarea
            label="Observações (somente leitura)"
            defaultValue="Aprovado pelo coordenador de área."
            disabled
            rows={3}
          />
        </div>

        <div>
          <StateLabel label="Com hint" />
          <Textarea
            label="Descrição técnica"
            placeholder="Descreva o problema com detalhes..."
            hint="Seja específico: inclua sintomas, condições e frequência do problema."
            rows={4}
          />
        </div>

        <div>
          <StateLabel label="Obrigatório" />
          <Textarea
            label="Motivo"
            placeholder="Motivo é obrigatório..."
            required
            rows={3}
          />
        </div>
      </Grid>
    </div>
  ),
}

// ─── Select / Dropdown ───────────────────────────────────────────────────────

export const SelectEstados: StoryObj = {
  name: 'Select / Dropdown',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 960, padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Select</h1>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 32 }}>
        Dropdown nativo com ícone de chevron customizado e margem adequada à direita.
      </p>

      <Grid>
        <div>
          <StateLabel label="Default (sem seleção)" />
          <Select
            label="Área"
            placeholder="Selecione uma área..."
          >
            <option value="fibras">Área de Fibras</option>
            <option value="caldeira">Caldeira e Utilidades</option>
            <option value="producao">Produção</option>
          </Select>
        </div>

        <div>
          <StateLabel label="Com valor selecionado" />
          <Select
            label="Classe de risco"
            defaultValue="2"
          >
            <option value="1">Classe 1 — Baixo risco</option>
            <option value="2">Classe 2 — Risco moderado</option>
            <option value="3">Classe 3 — Alto risco</option>
            <option value="4">Classe 4 — Risco crítico</option>
            <option value="5">Classe 5 — NÃO FORÇÁVEL</option>
          </Select>
        </div>

        <div>
          <StateLabel label="Error" />
          <Select
            label="Planta"
            placeholder="Selecione..."
            variant="error"
            errorMessage="Campo obrigatório."
          >
            <option value="aracruz">Unidade Aracruz</option>
            <option value="limeira">Unidade Limeira</option>
          </Select>
        </div>

        <div>
          <StateLabel label="Disabled" />
          <Select
            label="Equipamento (somente leitura)"
            defaultValue="fib-abc-001"
            disabled
          >
            <option value="fib-abc-001">FIB-ABC-001</option>
          </Select>
        </div>

        <div>
          <StateLabel label="Com hint" />
          <Select
            label="Cargo"
            placeholder="Selecione o cargo..."
            hint="O cargo determina as permissões de acesso ao sistema."
          >
            <option value="esp-op">Especialista de Operação</option>
            <option value="esp-man">Especialista de Manutenção</option>
            <option value="coord">Coordenador de Área</option>
            <option value="ger">Gerente de Área</option>
          </Select>
        </div>

        <div>
          <StateLabel label="Obrigatório" />
          <Select
            label="Perfil"
            placeholder="Selecione o perfil..."
            required
          >
            <option value="solicitante">Solicitante</option>
            <option value="executante">Executante</option>
            <option value="aprovador">Aprovador</option>
            <option value="gestor">Gestor SMS</option>
          </Select>
        </div>
      </Grid>
    </div>
  ),
}

// ─── Formulário completo (uso real) ─────────────────────────────────────────

export const FormularioCompleto: StoryObj = {
  name: 'Formulário completo — uso real',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 560, padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
        Nova Solicitação de Desabilitação
      </h1>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
        Preencha os dados para abrir uma solicitação de intertravamento.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Input
          label="TAG do equipamento"
          placeholder="Ex: FIB-ABC-001"
          leadingIcon="barcode_scanner"
          required
        />

        <Select label="Classe de risco" required placeholder="Selecione...">
          <option value="1">Classe 1 — Baixo risco (até 7 dias)</option>
          <option value="2">Classe 2 — Risco moderado (até 5 dias)</option>
          <option value="3">Classe 3 — Alto risco (até 3 dias)</option>
          <option value="4">Classe 4 — Risco crítico (até 1 dia)</option>
          <option value="5">Classe 5 — NÃO FORÇÁVEL</option>
        </Select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input
            label="Data início"
            type="datetime-local"
            required
          />
          <Input
            label="Data fim prevista"
            type="datetime-local"
            required
          />
        </div>

        <Textarea
          label="Motivo da desabilitação"
          placeholder="Descreva detalhadamente o motivo..."
          hint="Seja específico. Esta informação será avaliada pelo aprovador."
          required
          rows={4}
        />

        <Input
          label="E-mail para notificação"
          type="email"
          placeholder="equipe@suzano.com.br"
          hint="Você receberá atualizações sobre o status desta solicitação."
        />

        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <button
            style={{
              flex: 1,
              height: 40,
              background: '#0038A8',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Enviar solicitação
          </button>
          <button
            style={{
              flex: 1,
              height: 40,
              background: 'white',
              color: '#475569',
              border: '1.5px solid #E2E8F0',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Salvar rascunho
          </button>
        </div>
      </div>
    </div>
  ),
}

// ─── Token reference ─────────────────────────────────────────────────────────

export const TokensDeReferencia: StoryObj = {
  name: 'Tokens de referência',
  render: () => {
    const tokens = [
      { classe: '.field-input', desc: 'Input base — todos os campos' },
      { classe: '.field-input:hover', desc: 'Border: #94A3B8 ao passar o mouse' },
      { classe: '.field-input:focus', desc: 'Border: #0038A8 + ring rgba(0,56,168,.12)' },
      { classe: '.field-input--error', desc: 'Border: #DC2626' },
      { classe: '.field-input--error:focus', desc: 'Ring: rgba(220,38,38,.12)' },
      { classe: '.field-input--success', desc: 'Border: #16A34A' },
      { classe: '.field-input:disabled', desc: 'bg: #F8FAFC, color: #94A3B8' },
      { classe: 'select.field-input', desc: 'padding-right: 36px — espaço para o chevron; height: 40px (herda do base)' },
      { classe: '.field-label', desc: 'Label do campo — 13px, medium, #374151' },
      { classe: '.field-required', desc: 'Asterisco obrigatório — vermelho #DC2626' },
      { classe: '.field-hint', desc: 'Texto de ajuda — 12px, #94A3B8' },
      { classe: '.field-error-msg', desc: 'Mensagem de erro — 12px, #DC2626' },
      { classe: '.field-success-msg', desc: 'Mensagem de sucesso — 12px, #16A34A' },
    ]

    return (
      <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 860, padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
          Tokens de referência — Input
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
          Classes CSS geradas em <code style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>globals.css</code> e utilizadas pelo componente.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', color: '#475569', fontWeight: 600, borderBottom: '1px solid #E2E8F0' }}>Classe / Seletor</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', color: '#475569', fontWeight: 600, borderBottom: '1px solid #E2E8F0' }}>Comportamento</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t.classe} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                  <code style={{ background: '#EBF0FB', color: '#0038A8', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                    {t.classe}
                  </code>
                </td>
                <td style={{ padding: '10px 16px', color: '#475569' }}>{t.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },
}
