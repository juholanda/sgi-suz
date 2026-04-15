'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import type { StatusSolicitacao, ClasseNum } from '@/lib/tokens'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SolicitacaoRow {
  id: string
  protocolo: string
  status: string
  tipo: string | null
  tag: string
  descricao: string
  area: string
  planta: string
  classeNumero: number | null
  solicitante: string
  createdAt: string
  updatedAt: string
}

interface Props {
  todas: SolicitacaoRow[]
  andamento: SolicitacaoRow[]
  encerradas: SolicitacaoRow[]
  rascunhos: SolicitacaoRow[]
}

// ─── Tab config ─────────────────────────────────────────────────────────────

const TABS = [
  { key: 'todas',     label: 'Todas',         icon: 'list' },
  { key: 'andamento', label: 'Em andamento',  icon: 'sync' },
  { key: 'encerradas',label: 'Encerradas',    icon: 'check_circle' },
  { key: 'rascunhos', label: 'Rascunhos',     icon: 'draft' },
] as const

type TabKey = typeof TABS[number]['key']

// ─── Date formatter ─────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${dd}/${mm}/${yy}`
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DashboardTabs({ todas, andamento, encerradas, rascunhos }: Props) {
  const [tab, setTab] = useState<TabKey>('todas')

  const data: Record<TabKey, SolicitacaoRow[]> = { todas, andamento, encerradas, rascunhos }
  const items = data[tab]

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex gap-0 overflow-x-auto"
        style={{ borderBottom: '1px solid #E2E8F0', scrollbarWidth: 'none' }}
      >
        {TABS.map(t => {
          const isActive = tab === t.key
          const count = data[t.key].length
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#0038A8' : '#64748B',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #0038A8' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15, lineHeight: 1 }}>
                {t.icon}
              </span>
              {t.label}
              {count > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isActive ? '#EBF0FB' : '#F1F5F9',
                    color: isActive ? '#0038A8' : '#94A3B8',
                    lineHeight: '16px',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div
          className="flex items-center justify-center gap-2 py-12"
          style={{ color: '#94A3B8', fontSize: 13 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1 }}>
            inbox
          </span>
          Nenhuma solicitacao nesta categoria.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={thStyle}>Protocolo</th>
                <th style={thStyle}>TAG</th>
                <th style={{ ...thStyle, display: 'none' }} className="md:!table-cell">Area</th>
                <th style={thStyle}>Classe</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, display: 'none' }} className="md:!table-cell">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr
                  key={s.id}
                  style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                  onClick={() => window.location.href = `/solicitacoes/${s.id}`}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0038A8', fontSize: 12 }}>
                      {s.protocolo}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: '#0F172A' }}>
                        {s.tag}
                      </span>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{s.descricao}</div>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, display: 'none', fontSize: 12, color: '#475569' }} className="md:!table-cell">
                    {s.area}
                  </td>
                  <td style={tdStyle}>
                    {s.classeNumero && <ClasseBadge classe={s.classeNumero as ClasseNum} size="sm" />}
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                  </td>
                  <td style={{ ...tdStyle, display: 'none', fontSize: 12, color: '#64748B' }} className="md:!table-cell">
                    {fmtDate(s.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 600,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
}
