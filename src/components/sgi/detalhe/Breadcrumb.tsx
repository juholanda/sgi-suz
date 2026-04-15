'use client'

import Link from 'next/link'

interface BreadcrumbProps {
  protocolo: string
}

export default function Breadcrumb({ protocolo }: BreadcrumbProps) {
  const linkStyle: React.CSSProperties = {
    color: '#64748B',
    textDecoration: 'none',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    transition: 'color 150ms',
  }

  const separatorStyle: React.CSSProperties = {
    color: '#94A3B8',
    fontSize: 13,
    margin: '0 6px',
    userSelect: 'none',
  }

  const currentStyle: React.CSSProperties = {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0,
      }}
    >
      <Link href="/dashboard" style={linkStyle}>
        Inicio
      </Link>

      <span style={separatorStyle} aria-hidden="true">
        ›
      </span>

      <Link href="/solicitacoes" style={linkStyle}>
        Solicitacoes
      </Link>

      <span style={separatorStyle} aria-hidden="true">
        ›
      </span>

      <span style={currentStyle} aria-current="page">
        #{protocolo}
      </span>
    </nav>
  )
}
