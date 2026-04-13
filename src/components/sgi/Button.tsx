'use client';

import React, { useState, CSSProperties } from 'react';
import tokens from '../../../design-system/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Material Symbol icon name rendered on the left */
  iconLeft?: string;
  /** Material Symbol icon name rendered on the right */
  iconRight?: string;
  /** Renders only an icon (makes the button square/circular) */
  iconOnly?: string;
  /** Floating Action Button — fixed, bottom-right corner */
  fab?: boolean;
  /** Shows a spinner in place of iconLeft */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  /** Renders an <a> tag instead of <button> */
  href?: string;
}

// Spinner component using CSS animation via inline keyframes injected once
let spinnerInjected = false;
function ensureSpinnerStyles() {
  if (typeof document === 'undefined' || spinnerInjected) return;
  spinnerInjected = true;
  const style = document.createElement('style');
  style.textContent = `@keyframes sgi-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

function Spinner({ size }: { size: number }) {
  if (typeof document !== 'undefined') ensureSpinnerStyles();
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'sgi-spin 0.7s linear infinite',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

function MaterialIcon({ name, size }: { name: string; size: number }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  iconOnly,
  fab = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  href,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  const variantTokens = tokens.button.variants[variant];
  const sizeTokens = fab ? tokens.button.sizes.fab : tokens.button.sizes[size];

  const isDisabled = disabled || loading;
  const isIconOnly = !!iconOnly || (!children && (!!iconLeft || !!iconRight));

  // Compute background
  let bg = variantTokens.bg;
  if (isDisabled) {
    bg = variant === 'link' || variant === 'ghost' || variant === 'tertiary' ? 'transparent' : tokens.colors.neutral[200];
  } else if (active) {
    bg = variantTokens.hoverBg;
  } else if (hovered) {
    bg = variantTokens.hoverBg;
  }

  // Compute text color
  let color = variantTokens.text;
  if (isDisabled) {
    color = tokens.colors.neutral[400];
  }

  // Compute border
  const borderColor = isDisabled ? 'transparent' : variantTokens.borderColor;
  const hasBorder = borderColor !== 'transparent';

  const buttonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: tokens.typography.fontFamily.sans,
    fontWeight: tokens.typography.weights.medium,
    fontSize: fab ? '14px' : (sizeTokens as { fontSize: string }).fontSize,
    height: fab ? (tokens.button.sizes.fab as { height: string }).height : (sizeTokens as { height: string }).height,
    width: fab
      ? (tokens.button.sizes.fab as { width: string }).width
      : isIconOnly && !fab
      ? (sizeTokens as { height: string }).height
      : fullWidth
      ? '100%'
      : 'auto',
    padding: fab || isIconOnly ? 0 : (sizeTokens as { padding: string }).padding,
    backgroundColor: bg,
    color,
    border: hasBorder ? `1px solid ${borderColor}` : 'none',
    borderRadius: fab ? '50%' : tokens.radius,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    textDecoration: variant === 'link' && hovered && !isDisabled ? 'underline' : 'none',
    transition: 'background-color 0.15s, color 0.15s, opacity 0.15s',
    outline: 'none',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    lineHeight: 1,
    ...(fab
      ? {
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,56,168,0.35)',
        }
      : {}),
  };

  const iconSize = fab
    ? tokens.button.sizes.fab.iconSize
    : (sizeTokens as { iconSize: number }).iconSize;

  const leftEl = loading ? (
    <Spinner size={iconSize} />
  ) : iconLeft ? (
    <MaterialIcon name={iconLeft} size={iconSize} />
  ) : null;

  const rightEl = iconRight ? <MaterialIcon name={iconRight} size={iconSize} /> : null;
  const onlyEl = iconOnly ? <MaterialIcon name={iconOnly} size={iconSize} /> : null;

  const sharedProps = {
    style: buttonStyle,
    onMouseEnter: () => !isDisabled && setHovered(true),
    onMouseLeave: () => { setHovered(false); setActive(false); },
    onMouseDown: () => !isDisabled && setActive(true),
    onMouseUp: () => setActive(false),
    onClick: isDisabled ? undefined : onClick,
    'aria-disabled': isDisabled || undefined,
    'aria-busy': loading || undefined,
  };

  const content = iconOnly ? (
    onlyEl
  ) : (
    <>
      {leftEl}
      {children}
      {rightEl}
    </>
  );

  if (href) {
    return (
      <a href={isDisabled ? undefined : href} {...sharedProps} role="button" tabIndex={isDisabled ? -1 : 0}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} disabled={isDisabled} {...sharedProps}>
      {content}
    </button>
  );
}

export default Button;
