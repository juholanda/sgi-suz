import { tokens, StatusSolicitacao, STATUS_LABELS } from '@/lib/tokens'

interface Props {
  status: StatusSolicitacao
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: { height: 22, fontSize: 12, padding: '0px 8px' },
  md: { height: 24, fontSize: 12, padding: '0px 10px' },
  lg: { height: 28, fontSize: 13, padding: '0px 10px' },
} as const

const FALLBACK_COLORS = { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', dot: '#94A3B8' }

export function StatusBadge({ status, size = 'md' }: Props) {
  const colors = (tokens.colors.status as any)[status] ?? FALLBACK_COLORS
  const label = STATUS_LABELS[status] ?? String(status)
  const s = SIZE_MAP[size]
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: '100px',
        padding: s.padding,
        height: s.height,
        fontSize: s.fontSize,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  )
}
