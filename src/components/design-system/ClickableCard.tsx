'use client'
/**
 * ClickableCard — Design System Primitive
 *
 * A card container that is entirely clickable (like a link) while also
 * allowing interactive child elements (buttons, links) to work independently.
 *
 * Why not a real <a> tag?
 *   Nesting an interactive CTA <Link> inside an <a> produces invalid HTML and
 *   browser-specific stacking / click bugs. Using onClick avoids all of that.
 *
 * Accessibility:
 *   role="link" + tabIndex={0} + Enter/Space key support + visible focus ring.
 *   Middle-click opens in a new tab (matching native link behaviour).
 */

import { useRouter } from 'next/navigation'
import React from 'react'

export interface ClickableCardProps {
  href: string
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

// Safe router hook — returns null if not inside a Next.js app router (e.g. Storybook docs)
function useSafeRouter() {
  try {
    return useRouter()
  } catch {
    return null
  }
}

export function ClickableCard({ href, children, style, className }: ClickableCardProps) {
  const router = useSafeRouter()

  function navigate() {
    if (router) {
      router.push(href)
    } else if (typeof window !== 'undefined' && href && href !== '#') {
      window.location.href = href
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate()
    }
  }

  function handleAuxClick(e: React.MouseEvent<HTMLDivElement>) {
    // Middle-click → open in new tab
    if (e.button === 1) {
      e.preventDefault()
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={navigate}
      onAuxClick={handleAuxClick}
      onKeyDown={handleKeyDown}
      className={className}
      style={{ cursor: 'pointer', outline: 'none', ...style }}
      // Show focus ring via CSS class (see globals or tailwind)
      data-clickable-card
    >
      {children}
    </div>
  )
}
