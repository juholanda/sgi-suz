import { tokens, ClasseNum, CLASSE_LABELS, CLASSE_PRAZO_MAX } from '@/lib/tokens'

interface Props {
  classe: ClasseNum
  showPrazo?: boolean
  size?: 'sm' | 'md'
}

export function ClasseBadge({ classe, showPrazo = false, size = 'md' }: Props) {
  const colors = tokens.colors.classe[classe]
  const padding = size === 'sm' ? '1.75px 5.25px' : '2px 8px'
  const fontSize = '12px'

  return (
    <span
      style={{
        background: colors.badge,
        color: '#FFFFFF',
        borderRadius: '2px',
        padding,
        fontSize,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        whiteSpace: 'nowrap',
        lineHeight: '18px',
      }}
    >
      CL {classe}
      {showPrazo && (
        <span style={{ fontWeight: 400, opacity: 0.85 }}>· {CLASSE_PRAZO_MAX[classe]}</span>
      )}
    </span>
  )
}
