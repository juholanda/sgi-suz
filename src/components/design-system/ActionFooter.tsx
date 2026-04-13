'use client'
import React from 'react'

export interface ActionFooterProps {
  /** Primary action(s) — placed left-side or full-width on mobile */
  children: React.ReactNode
  /** Extra className for the inner row */
  className?: string
}

/**
 * ActionFooter
 * Sticky bottom bar for page-level CTA buttons.
 * Sits at the bottom of the nearest scroll container (<main>).
 * On mobile it clears the MobileNav (bottom-20); on desktop bottom-0.
 */
export function ActionFooter({ children, className = '' }: ActionFooterProps) {
  return (
    <div
      className="sticky bottom-20 md:bottom-0"
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.07)',
        zIndex: 30,
      }}
    >
      <div className={`flex flex-wrap items-center gap-3 px-4 py-3 md:px-6 max-w-4xl mx-auto ${className}`}>
        {children}
      </div>
    </div>
  )
}
