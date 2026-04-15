'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DetalheClientProps } from './types'
import Breadcrumb from './Breadcrumb'
import DetalheHeader from './DetalheHeader'
import AcoesFooter from './AcoesFooter'
import TabDetalhes from './tabs/TabDetalhes'
import TabAprovacoes from './tabs/TabAprovacoes'
import TabLinhaDoTempo from './tabs/TabLinhaDoTempo'
import TabAnexos from './tabs/TabAnexos'
import TabAuditoria from './tabs/TabAuditoria'

// ── Tab configuration ────────────────────────────────────────────────────────

const TABS = [
  { key: 'detalhes',   label: 'Detalhes',       icon: 'info' },
  { key: 'aprovacoes', label: 'Aprovacoes',      icon: 'task_alt' },
  { key: 'timeline',   label: 'Linha do Tempo',  icon: 'timeline' },
  { key: 'anexos',     label: 'Anexos',           icon: 'attach_file' },
  { key: 'auditoria',  label: 'Auditoria',        icon: 'policy' },
] as const

type TabKey = typeof TABS[number]['key']

// ── Component ────────────────────────────────────────────────────────────────

export default function DetalheClient({ solicitacao: s, acoes, conflict, userId, perfis }: DetalheClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('detalhes')
  const hasFooter = acoes.length > 0 || conflict?.hasConflict

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#F8FAFC',
      }}
    >
      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          paddingBottom: hasFooter ? 20 : 0,
        }}
      >
        <div className="max-w-5xl mx-auto w-full">

          {/* ── Navigation bar ── */}
          <div className="flex items-center gap-3 px-4 md:px-6 pt-4 md:pt-6" style={{ marginBottom: 16 }}>
            {/* Mobile back button */}
            <Link
              href="/solicitacoes"
              className="md:hidden flex items-center justify-center shrink-0"
              style={{
                width: 36,
                height: 36,
                background: '#F1F5F9',
                borderRadius: 8,
                color: '#475569',
              }}
              aria-label="Voltar"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>
                arrow_back
              </span>
            </Link>

            {/* Desktop breadcrumb */}
            <div className="hidden md:block">
              <Breadcrumb protocolo={s.protocolo} />
            </div>

            {/* Mobile protocol */}
            <span
              className="md:hidden text-sm font-semibold"
              style={{ color: '#0F172A' }}
            >
              {s.protocolo}
            </span>

            {/* Exportar formulário — only for ENCERRADA */}
            {s.status === 'ENCERRADA' && (
              <a
                href={`/api/solicitacoes/${s.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border"
                style={{
                  borderColor: '#E2E8F0',
                  borderRadius: 4,
                  color: '#475569',
                  background: '#FFFFFF',
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15, lineHeight: 1 }}>picture_as_pdf</span>
                Exportar formulário
              </a>
            )}
          </div>

          {/* ── Header ── */}
          <div className="px-4 md:px-6" style={{ marginBottom: 20 }}>
            <DetalheHeader s={s} />
          </div>

          {/* ── Tab bar ── */}
          <div
            className="px-4 md:px-6"
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              marginBottom: 4,
            }}
          >
            {TABS.map(tab => {
              const isActive = activeTab === tab.key
              // Show count badges for some tabs
              let count: number | null = null
              if (tab.key === 'aprovacoes') count = s.aprovacoes.filter(a => a.tipo === 'DESABILITACAO').length
              if (tab.key === 'anexos') count = s.anexos.length
              if (tab.key === 'auditoria') count = s.eventos.length

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: isActive ? '1.5px solid #0038A8' : '1.5px solid #E2E8F0',
                    background: isActive ? '#EBF0FB' : '#FFFFFF',
                    color: isActive ? '#0038A8' : '#475569',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 15, lineHeight: 1 }}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                  {count !== null && count > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: isActive ? '#0038A8' : '#F1F5F9',
                        color: isActive ? '#FFFFFF' : '#64748B',
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

          {/* Separator */}
          <div style={{ height: 1, background: '#E2E8F0', margin: '12px 0 20px' }} />

          {/* ── Tab content ── */}
          <div className="px-4 md:px-6 pb-6">
            {activeTab === 'detalhes' && <TabDetalhes s={s} />}
            {activeTab === 'aprovacoes' && <TabAprovacoes aprovacoes={s.aprovacoes} status={s.status} />}
            {activeTab === 'timeline' && <TabLinhaDoTempo eventos={s.eventos} />}
            {activeTab === 'anexos' && <TabAnexos anexos={s.anexos} />}
            {activeTab === 'auditoria' && <TabAuditoria eventos={s.eventos} protocolo={s.protocolo} />}
          </div>

        </div>
      </div>

      {/* ── Actions footer (fixed at bottom) ── */}
      <AcoesFooter
        solicitacaoId={s.id}
        acoes={acoes}
        conflict={conflict}
        tipo={s.tipo}
        periodoFim={s.periodoFim}
        classeMaxDias={s.classe?.prazoMaximoDias ?? null}
      />
    </div>
  )
}
