'use client'
/**
 * CardCtaFooter — Design System Primitive
 *
 * A footer strip placed at the bottom of a ClickableCard.
 * Renders a tinted action link and stops click-event propagation so
 * the parent ClickableCard's onClick does NOT also fire.
 *
 * Usage:
 *   <ClickableCard href="/foo">
 *     … card body …
 *     <CardCtaFooter href="/foo" label="Ver agora" bg="#DC2626" color="#fff" />
 *   </ClickableCard>
 */

import Link from 'next/link'

export interface CardCtaFooterProps {
  href: string
  label: string
  /** Button background colour token (e.g. '#0038A8') */
  bg: string
  /** Button text colour token (e.g. '#ffffff') */
  color: string
}

export function CardCtaFooter({ href, label, bg, color }: CardCtaFooterProps) {
  return (
    <div
      // Stop propagation so the wrapping ClickableCard doesn't double-navigate
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      style={{
        borderTop: '1px solid #F1F5F9',
        padding: '10px 16px 14px',
      }}
    >
      <Link
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 12px',
          background: bg,
          color,
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: '18px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  )
}
