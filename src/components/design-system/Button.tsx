import React, { forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-outline' | 'tertiary' | 'link' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leadingIcon?: string
  trailingIcon?: string
  /** Renders as full-width block */
  fullWidth?: boolean
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className = '',
    children,
    disabled,
    style,
    ...rest
  },
  ref
) {
  const iconSize = ICON_SIZE[size]
  const isDisabled = disabled || loading

  const classes = [
    'btn',
    `btn-${size}`,
    `btn-${variant}`,
    loading ? 'btn-loading' : '',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={ref}
      className={classes}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      style={style}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block rounded-full border-2"
          style={{
            width: iconSize,
            height: iconSize,
            borderColor: 'currentColor',
            borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      ) : leadingIcon ? (
        <Icon name={leadingIcon} size={iconSize} />
      ) : null}

      {children}

      {!loading && trailingIcon && <Icon name={trailingIcon} size={iconSize} />}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
