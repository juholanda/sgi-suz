import { tokens, StatusSolicitacao, STATUS_LABELS } from '@/lib/tokens'

interface Props {
  status: StatusSolicitacao
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const colors = tokens.colors.status[status]
  const label = STATUS_LABELS[status]
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: '100px',
        padding: '0px 8px',
        height: '24px',
        fontSize: '12px',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        lineHeight: '18px',
      }}
    >
      {label}
    </span>
  )
}
