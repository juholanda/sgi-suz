'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DetalheClientProps } from './types'
import Breadcrumb from './Breadcrumb'
import DetalheHeader from './DetalheHeader'
import AcoesFooter from './AcoesFooter'
import TabDetalhes from './tabs/TabDetalhes'
import TabLinhaDoTempo from './tabs/TabLinhaDoTempo'
import TabAnexos from './tabs/TabAnexos'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

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

          {/* ── Tabs ── */}
          <Tabs defaultValue="detalhes" className="px-4 md:px-6 pb-6">
            <ScrollArea>
              <TabsList className="mb-3">
                <TabsTrigger value="detalhes">
                  <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>info</span>
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>timeline</span>
                  Linha do Tempo
                </TabsTrigger>
                <TabsTrigger value="anexos">
                  <span className="material-symbols-outlined" style={{ fontSize: 15, marginRight: 6, opacity: 0.7 }}>attach_file</span>
                  Anexos
                  {s.anexos.length > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                      background: '#F1F5F9', color: '#94A3B8', lineHeight: '16px', marginLeft: 6,
                    }}>
                      {s.anexos.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <Separator className="mb-5" />
            <TabsContent value="detalhes" className="mt-0">
              <TabDetalhes s={s} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-0">
              <TabLinhaDoTempo eventos={s.eventos} />
            </TabsContent>
            <TabsContent value="anexos" className="mt-0">
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
