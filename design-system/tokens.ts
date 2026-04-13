export type DesignTokens = {
  colors: {
    // Legacy flat colors (kept for backwards compatibility)
    primary: string;
    primaryHover: string;
    primaryLight: string;
    background: string;
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    // Severity classes (legacy flat)
    classe1: string;
    classe2: string;
    classe3: string;
    classe4: string;
    classe5: string;
    // Semantic color groups
    semantic: {
      primary:   { DEFAULT: string; light: string; lighter: string; dark: string; darker: string };
      secondary: { DEFAULT: string; light: string; lighter: string; dark: string; darker: string };
      success:   { DEFAULT: string; light: string; lighter: string; dark: string; darker: string };
      warning:   { DEFAULT: string; light: string; lighter: string; dark: string; darker: string };
      danger:    { DEFAULT: string; light: string; lighter: string; dark: string; darker: string };
      info:      { DEFAULT: string; light: string; lighter: string; dark: string; darker: string };
    };
    neutral: {
      50: string; 100: string; 200: string; 300: string; 400: string;
      500: string; 600: string; 700: string; 800: string; 900: string;
    };
    classe: {
      1: { DEFAULT: string; bg: string; text: string; label: string };
      2: { DEFAULT: string; bg: string; text: string; label: string };
      3: { DEFAULT: string; bg: string; text: string; label: string };
      4: { DEFAULT: string; bg: string; text: string; label: string };
      5: { DEFAULT: string; bg: string; text: string; label: string };
    };
    // Status colors
    status: {
      RASCUNHO: string;
      EM_APROVACAO: string;
      EXECUCAO_AUTORIZADA: string;
      EM_EXECUCAO: string;
      DESABILITADO: string;
      EM_REABILITACAO: string;
      EM_VALIDACAO_DA_REABILITACAO: string;
      ENCERRADA: string;
      REJEITADA: string;
      CANCELADA: string;
      EXTENSAO_EM_ANALISE: string;
    };
  };
  sidebar: {
    background: string;
    border: string;
    text: string;
    textMuted: string;
    activeText: string;
    activeBg: string;
    // Nav item interaction states
    navText: string;
    navBg: string;
    navHoverText: string;
    navHoverBg: string;
    navFocusRing: string;
    navPressedText: string;
    navPressedBg: string;
    navActiveText: string;
    navActiveBg: string;
    navActiveFontWeight: string;
    navDisabledText: string;
    navDisabledOpacity: string;
  };
  radius: string;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  typography: {
    fontFamily: { sans: string; mono: string };
    /** @deprecated use fontFamily.sans */
    fontFamilyLegacy: string;
    sizes: {
      '2xs': string;
      xs: string;
      sm: string;
      base: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    weights: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeights: {
      tight: number;
      snug: number;
      normal: number;
      relaxed: number;
    };
    letterSpacings: {
      tight: string;
      normal: string;
      wide: string;
      wider: string;
      widest: string;
    };
  };
  button: {
    sizes: {
      xs:  { height: string; padding: string; fontSize: string; iconSize: number };
      sm:  { height: string; padding: string; fontSize: string; iconSize: number };
      md:  { height: string; padding: string; fontSize: string; iconSize: number };
      lg:  { height: string; padding: string; fontSize: string; iconSize: number };
      xl:  { height: string; padding: string; fontSize: string; iconSize: number };
      fab: { height: string; width: string; iconSize: number };
    };
    variants: {
      primary:   { bg: string; text: string; hoverBg: string; borderColor: string };
      secondary: { bg: string; text: string; hoverBg: string; borderColor: string };
      tertiary:  { bg: string; text: string; hoverBg: string; borderColor: string };
      outline:   { bg: string; text: string; hoverBg: string; borderColor: string };
      danger:    { bg: string; text: string; hoverBg: string; borderColor: string };
      ghost:     { bg: string; text: string; hoverBg: string; borderColor: string };
      link:      { bg: string; text: string; hoverBg: string; borderColor: string };
    };
  };
};

const tokens: DesignTokens = {
  colors: {
    // Legacy flat colors
    primary: '#0038A8',
    primaryHover: '#002D8A',
    primaryLight: '#EBF0FB',
    background: '#F0F4F8',
    card: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    // Legacy severity classes (flat)
    classe1: '#1D4ED8',
    classe2: '#0D9488',
    classe3: '#EA580C',
    classe4: '#DC2626',
    classe5: '#7F1D1D',

    // Semantic color groups with variants
    semantic: {
      primary:   { DEFAULT: '#0038A8', light: '#EBF0FB', lighter: '#F5F8FF', dark: '#002D8A', darker: '#001F5C' },
      secondary: { DEFAULT: '#475569', light: '#F1F5F9', lighter: '#F8FAFC', dark: '#334155', darker: '#1E293B' },
      success:   { DEFAULT: '#16A34A', light: '#D1FAE5', lighter: '#F0FDF4', dark: '#15803D', darker: '#14532D' },
      warning:   { DEFAULT: '#EAB308', light: '#FEF9C3', lighter: '#FEFCE8', dark: '#CA8A04', darker: '#92400E' },
      danger:    { DEFAULT: '#DC2626', light: '#FEE2E2', lighter: '#FFF5F5', dark: '#B91C1C', darker: '#7F1D1D' },
      info:      { DEFAULT: '#0891B2', light: '#CFFAFE', lighter: '#ECFEFF', dark: '#0E7490', darker: '#164E63' },
    },

    // Neutral scale
    neutral: {
      50:  '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },

    // Classes de severidade (intertravamentos)
    // Escala cromática: azul (seguro) → teal → laranja → vermelho → marrom escuro (extremo)
    classe: {
      1: { DEFAULT: '#1D4ED8', bg: '#DBEAFE', text: '#1E3A8A', label: 'Baixo risco' },
      2: { DEFAULT: '#0D9488', bg: '#CCFBF1', text: '#0F766E', label: 'Risco moderado' },
      3: { DEFAULT: '#EA580C', bg: '#FFEDD5', text: '#7C2D12', label: 'Alto risco' },
      4: { DEFAULT: '#DC2626', bg: '#FEE2E2', text: '#7F1D1D', label: 'Risco crítico' },
      5: { DEFAULT: '#7F1D1D', bg: '#1C0505', text: '#FCA5A5', label: 'NÃO FORÇÁVEL' },
    },

    // Status colors
    // Lógica semântica por grupo de significado:
    // ── Neutros (inativo/encerrado sem ação):   cinza
    // ── Atenção (aguarda ação humana):          âmbar
    // ── Em andamento (trabalho ativo):          azul
    // ── Alerta operacional (intertravamento OFF): laranja
    // ── Retorno à segurança (reabilitação):    verde-água (teal)
    // ── Encerrado com sucesso:                  verde
    // ── Terminal negativo (falha/recusa):       vermelho
    status: {
      RASCUNHO:                       '#94A3B8', // cinza — rascunho, ainda não submetido
      CANCELADA:                      '#94A3B8', // cinza — encerrado sem conclusão
      EM_APROVACAO:                   '#D97706', // âmbar — aguarda aprovação humana
      EXTENSAO_EM_ANALISE:            '#F97316', // laranja-âmbar — prorrogação em análise
      EXECUCAO_AUTORIZADA:            '#2563EB', // azul — aprovado, pronto para executar
      EM_EXECUCAO:                    '#0038A8', // azul SGI — execução em andamento
      DESABILITADO:                   '#EA580C', // laranja — ⚠ intertravamento desabilitado (risco ativo)
      EM_REABILITACAO:                '#0D9488', // teal — retornando à segurança
      EM_VALIDACAO_DA_REABILITACAO:   '#0F766E', // teal escuro — validação final do retorno
      ENCERRADA:                      '#16A34A', // verde — concluído, intertravamento ativo novamente
      REJEITADA:                      '#DC2626', // vermelho — reprovado
    },
  },

  sidebar: {
    background: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    textMuted: '#64748B',
    activeText: '#0038A8',
    activeBg: '#EBF0FB',
    // Nav item interaction states
    navText:              '#374151',   // default label color
    navBg:                'transparent',
    navHoverText:         '#0038A8',   // blue on hover
    navHoverBg:           '#F5F8FF',   // very light blue tint
    navFocusRing:         '#0038A8',   // focus outline color
    navPressedText:       '#002D8A',   // darker blue on mousedown
    navPressedBg:         '#D8E4F8',   // pressed tint
    navActiveText:        '#0038A8',   // selected page — blue label
    navActiveBg:          '#EBF0FB',   // selected page — light blue bg
    navActiveFontWeight:  '600',
    navDisabledText:      '#94A3B8',   // muted, not interactive
    navDisabledOpacity:   '0.5',
  },

  radius: '4px',

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },

  typography: {
    fontFamily: {
      sans: 'Inter, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    fontFamilyLegacy: 'Inter, sans-serif',
    sizes: {
      '2xs': '10px',
      xs:   '12px',
      sm:   '13px',
      base: '14px',
      md:   '16px',
      lg:   '18px',
      xl:   '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    weights: {
      light:    300,
      normal:   400,
      medium:   500,
      semibold: 600,
      bold:     700,
    },
    lineHeights: {
      tight:   1.2,
      snug:    1.4,
      normal:  1.6,
      relaxed: 1.75,
    },
    letterSpacings: {
      tight:   '-0.02em',
      normal:  '0',
      wide:    '0.025em',
      wider:   '0.05em',
      widest:  '0.1em',
    },
  },

  button: {
    sizes: {
      xs:  { height: '28px', padding: '0 8px',  fontSize: '12px', iconSize: 14 },
      sm:  { height: '32px', padding: '0 12px', fontSize: '13px', iconSize: 16 },
      md:  { height: '36px', padding: '0 16px', fontSize: '14px', iconSize: 18 },
      lg:  { height: '40px', padding: '0 20px', fontSize: '15px', iconSize: 20 },
      xl:  { height: '48px', padding: '0 24px', fontSize: '16px', iconSize: 22 },
      fab: { height: '56px', width: '56px', iconSize: 24 },
    },
    variants: {
      primary:   { bg: '#0038A8',  text: '#FFFFFF', hoverBg: '#002D8A', borderColor: 'transparent' },
      secondary: { bg: '#F1F5F9',  text: '#0F172A', hoverBg: '#E2E8F0', borderColor: '#E2E8F0' },
      tertiary:  { bg: 'transparent', text: '#0038A8', hoverBg: '#EBF0FB', borderColor: 'transparent' },
      outline:   { bg: 'transparent', text: '#0038A8', hoverBg: '#EBF0FB', borderColor: '#0038A8' },
      danger:    { bg: '#DC2626',  text: '#FFFFFF', hoverBg: '#B91C1C', borderColor: 'transparent' },
      ghost:     { bg: 'transparent', text: '#475569', hoverBg: '#F1F5F9', borderColor: 'transparent' },
      link:      { bg: 'transparent', text: '#0038A8', hoverBg: 'transparent', borderColor: 'transparent' },
    },
  },
};

export default tokens;
