'use client'

interface AlertaBannerProps {
  prazoMaximoAtingido: boolean
  prazoPrevitoAtingido: boolean
  classeNumero?: number | null
  status: string
}

interface BannerConfig {
  key: string
  bgColor: string
  borderColor: string
  textColor: string
  icon: string
  message: string
}

const TERMINAL_STATUSES = ['ENCERRADA', 'REJEITADA', 'CANCELADA']
// Status que já mostram o alerta de prazo dentro do PrazoInlineBar — não duplicar aqui
const PRAZO_INLINE_STATUSES = ['DESABILITADO', 'EM_VALIDACAO_DA_REABILITACAO']

export default function AlertaBanner({
  prazoMaximoAtingido,
  prazoPrevitoAtingido,
  classeNumero,
  status,
}: AlertaBannerProps) {
  const banners: BannerConfig[] = []
  const isTerminal = TERMINAL_STATUSES.includes(status)
  const usaInlineBar = PRAZO_INLINE_STATUSES.includes(status)

  if (prazoMaximoAtingido) {
    if (isTerminal && status === 'ENCERRADA') {
      // Histórico: encerrada fora do prazo — tom informativo, não exige ação
      banners.push({
        key: 'prazo-max-historico',
        bgColor: '#FEF2F2',
        borderColor: '#DC2626',
        textColor: '#7F1D1D',
        icon: 'history',
        message: 'Encerrada fora do prazo máximo',
      })
    } else if (!isTerminal && !usaInlineBar) {
      // Em andamento: ação imediata necessária (DESABILITADO/EM_VALIDACAO usam o InlineBar)
      banners.push({
        key: 'prazo-max',
        bgColor: '#FEF2F2',
        borderColor: '#DC2626',
        textColor: '#7F1D1D',
        icon: 'warning',
        message: 'Prazo máximo atingido — ação imediata necessária',
      })
    }
  }

  if (prazoPrevitoAtingido && !prazoMaximoAtingido && !isTerminal && !usaInlineBar) {
    banners.push({
      key: 'prazo-previsto',
      bgColor: '#FFFBEB',
      borderColor: '#D97706',
      textColor: '#78350F',
      icon: 'warning',
      message: 'Prazo previsto atingido — risco de exceder o prazo máximo',
    })
  }

  if (classeNumero === 4 && !isTerminal) {
    banners.push({
      key: 'classe-4',
      bgColor: '#FFF7ED',
      borderColor: '#EA580C',
      textColor: '#7C2D12',
      icon: 'priority_high',
      message: 'Classe 4 — criticidade máxima',
    })
  }

  if (banners.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {banners.map((banner) => (
        <div
          key={banner.key}
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            backgroundColor: banner.bgColor,
            borderLeft: `3px solid ${banner.borderColor}`,
            borderRadius: 4,
            minHeight: 32,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 16,
              color: banner.borderColor,
              flexShrink: 0,
            }}
          >
            {banner.icon}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: banner.textColor,
              lineHeight: 1.3,
            }}
          >
            {banner.message}
          </span>
        </div>
      ))}
    </div>
  )
}
