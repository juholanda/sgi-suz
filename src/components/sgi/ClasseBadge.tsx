import { tokens, ClasseNum, CLASSE_LABELS, CLASSE_PRAZO_MAX } from '@/lib/tokens'

interface Props {
  classe: ClasseNum
  showPrazo?: boolean
  size?: 'sm' | 'md'
}

export function ClasseBadge({ classe, showPrazo = false, size = 'md' }: Props) {
  const colors = tokens.colors.classe[classe]
  const padding = size === 'sm' ? '2px 8px' : '3px 10px'
  const fontSize = size === 'sm' ? '11px' : '12px'

  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: '4px',
        padding,
        fontSize,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        whiteSpace: 'nowrap',
      }}
    >
      {CLASSE_LABELS[classe]}
      {showPrazo && (
        <span style={{ fontWeight: 400, opacity: 0.8 }}>· {CLASSE_PRAZO_MAX[classe]}</span>
      )}
    </span>
  )
}
