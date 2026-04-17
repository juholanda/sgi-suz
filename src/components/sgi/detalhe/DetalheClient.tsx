'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DetalheClientProps } from './types'
import Breadcrumb from './Breadcrumb'
import DetalheHeader from './DetalheHeader'
import AcoesFooter from './AcoesFooter'
import PrazoInlineBar from './PrazoInlineBar'
import TabDetalhes from './tabs/TabDetalhes'
import TabLinhaDoTempo from './tabs/TabLinhaDoTempo'
import TabAnexos from './tabs/TabAnexos'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// ── Component ────────────────────────────────────────────────────────────────

export default function DetalheClient({ solicitacao: s, acoes, conflict, userId, perfis }: DetalheClientProps) {
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
      {/* Scrollable content area — extra padding when footer is present so content isn't hidden behind it */}
      <div
        style={{
          flex: 1,
          paddingBottom: hasFooter ? 88 : 0,
        }}
      >
        <div className="max-w-5xl mx-auto w-full">

          {/* ── Mobile native top bar ── */}
          <div
            className="md:hidden flex items-center px-3 shrink-0"
            style={{ height: 52, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}
          >
            <Link
              href="/solicitacoes"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, color: '#0F172A' }}
              aria-label="Voltar"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24, lineHeight: 1 }}>arrow_back</span>
            </Link>
            <span className="flex-1 text-center text-sm font-semibold truncate px-2" style={{ color: '#0F172A' }}>
              {s.equipamento.tag}
            </span>
            {s.status === 'ENCERRADA' ? (
              <a
                href={`/api/solicitacoes/${s.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, color: '#475569' }}
                aria-label="Exportar PDF"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22, lineHeight: 1 }}>picture_as_pdf</span>
              </a>
            ) : (
              <div style={{ width: 36 }} /> /* Placeholder para manter título centralizado */
            )}
          </div>

          {/* ── Desktop navigation bar ── */}
          <div className="hidden md:flex items-center gap-3 px-6 pt-6" style={{ marginBottom: 16 }}>
            <Breadcrumb protocolo={s.protocolo} />
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
          <div className="px-4 pt-5 md:pt-0 md:px-6" style={{ marginBottom: 20 }}>
            <DetalheHeader s={s} />
          </div>

          {/* ── Prazo inline (apenas DESABILITADO e EM_VALIDACAO_DA_REABILITACAO) ── */}
          <div className="px-4 md:px-6" style={{ marginBottom: 20 }}>
            <PrazoInlineBar
              status={s.status}
              dataDesabilitacao={s.dataDesabilitacao}
              dataReabilitacao={s.dataReabilitacao}
              periodoInicio={s.periodoInicio}
              periodoFim={s.periodoFim}
              classe={s.classe}
              prazoMaximoAtingido={s.prazoMaximoAtingido}
              prazoPrevitoAtingido={s.prazoPrevitoAtingido}
            />
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="detalhes" className="px-4 md:px-6 pb-6">
            <TabsList>
              <TabsTrigger value="detalhes">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>timeline</span>
                Linha do Tempo
              </TabsTrigger>
              <TabsTrigger value="anexos">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
                Anexos
                {s.anexos.length > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                    background: '#F1F5F9', color: '#94A3B8', lineHeight: '16px',
                  }}>
                    {s.anexos.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="detalhes">
              <TabDetalhes s={s} />
            </TabsContent>
            <TabsContent value="timeline">
              <TabLinhaDoTempo eventos={s.eventos} />
            </TabsContent>
            <TabsContent value="anexos">
              <TabAnexos anexos={s.anexos} />
            </TabsContent>
          </Tabs>

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
