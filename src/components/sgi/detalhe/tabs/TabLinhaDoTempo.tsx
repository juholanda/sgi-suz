'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { EventoDetalhe } from '../types'

function fmt(d: string) {
  return format(new Date(d), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
}

const ACAO_LABELS: Record<string, string> = {
  RASCUNHO_CRIADO: 'Rascunho criado',
  SOLICITACAO_ENVIADA: 'Enviada para aprovação',
  APROVACAO_REGISTRADA: 'Aprovação registrada',
  PROXIMO_APROVADOR_NOTIFICADO: 'Encaminhada ao próximo aprovador',
  APROVACAO_COMPLETA: 'Aprovação concluída',
  REJEICAO_REGISTRADA: 'Rejeitada',
  EXECUCAO_INICIADA: 'Execução iniciada',
  DESABILITACAO_CONFIRMADA: 'Desabilitação confirmada',
  REABILITACAO_INICIADA: 'Reabilitação iniciada',
  REABILITACAO_INICIADA_E_CONCLUIDA: 'Reabilitação concluída',
  REABILITACAO_CONCLUIDA: 'Reabilitação concluída',
  REABILITACAO_CONCLUIDA_EXECUTANTE: 'Reabilitação concluída',
  REABILITACAO_VALIDADA: 'Validação concluída — encerrada',
  REABILITACAO_REJEITADA: 'Validação reprovada',
  CANCELADA: 'Cancelada',
  EXTENSAO_REGISTRADA: 'Extensão de prazo solicitada',
  EXTENSAO_APROVADA: 'Extensão de prazo aprovada',
  EXTENSAO_REJEITADA: 'Extensão de prazo recusada',
}

const ACAO_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  RASCUNHO_CRIADO:                    { icon: 'edit_note',    color: '#475569', bg: '#F1F5F9' },
  SOLICITACAO_ENVIADA:                { icon: 'send',         color: '#0038A8', bg: '#EBF0FB' },
  APROVACAO_REGISTRADA:               { icon: 'thumb_up',     color: '#16A34A', bg: '#D1FAE5' },
  PROXIMO_APROVADOR_NOTIFICADO:       { icon: 'notification_important', color: '#2563EB', bg: '#DBEAFE' },
  APROVACAO_COMPLETA:                 { icon: 'verified',     color: '#16A34A', bg: '#D1FAE5' },
  REJEICAO_REGISTRADA:                { icon: 'thumb_down',   color: '#DC2626', bg: '#FEE2E2' },
  EXECUCAO_INICIADA:                  { icon: 'engineering',  color: '#0038A8', bg: '#EBF0FB' },
  DESABILITACAO_CONFIRMADA:           { icon: 'lock_open',    color: '#EA580C', bg: '#FFEDD5' },
  REABILITACAO_INICIADA:              { icon: 'replay',       color: '#0D9488', bg: '#CCFBF1' },
  REABILITACAO_INICIADA_E_CONCLUIDA:  { icon: 'task_alt',     color: '#0D9488', bg: '#CCFBF1' },
  REABILITACAO_CONCLUIDA:             { icon: 'task_alt',     color: '#0D9488', bg: '#CCFBF1' },
  REABILITACAO_CONCLUIDA_EXECUTANTE:  { icon: 'task_alt',     color: '#0D9488', bg: '#CCFBF1' },
  REABILITACAO_VALIDADA:              { icon: 'check_circle', color: '#16A34A', bg: '#D1FAE5' },
  REABILITACAO_REJEITADA:             { icon: 'undo',         color: '#DC2626', bg: '#FEE2E2' },
  CANCELADA:                          { icon: 'block',        color: '#DC2626', bg: '#FEE2E2' },
  EXTENSAO_REGISTRADA:                { icon: 'event',        color: '#D97706', bg: '#FEF3C7' },
  EXTENSAO_APROVADA:                  { icon: 'event_available', color: '#16A34A', bg: '#D1FAE5' },
  EXTENSAO_REJEITADA:                 { icon: 'event_busy',   color: '#DC2626', bg: '#FEE2E2' },
}

const DEFAULT_ICON = { icon: 'info', color: '#475569', bg: '#F1F5F9' }

interface TabLinhaDoTempoProps {
  eventos: EventoDetalhe[]
}

export default function TabLinhaDoTempo({ eventos }: TabLinhaDoTempoProps) {
  if (eventos.length === 0) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '40px 16px',
          textAlign: 'center',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#CBD5E1', display: 'block', marginBottom: 8 }}>
          timeline
        </span>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Nenhum evento registrado.</p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '20px 16px',
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div
          style={{
            position: 'absolute',
            left: 15,
            top: 0,
            bottom: 0,
            width: 2,
            background: '#E2E8F0',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {eventos.map((ev, i) => {
            const cfg = ACAO_ICONS[ev.acao] ?? DEFAULT_ICON
            const isLast = i === eventos.length - 1

            return (
              <div key={ev.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                {/* Icon circle */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: cfg.bg,
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                    border: '2px solid #FFFFFF',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, color: cfg.color, lineHeight: 1 }}
                  >
                    {cfg.icon}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingTop: 4, paddingBottom: isLast ? 0 : 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', lineHeight: 1.4 }}>
                    {ACAO_LABELS[ev.acao] ?? ev.acao}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 12, color: '#475569' }}>{ev.user.nome}</span>
                    <span style={{ fontSize: 12, color: '#CBD5E1' }}>{'\u00B7'}</span>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{fmt(ev.createdAt)}</span>
                  </div>
                  {ev.detalhes && (
                    <p
                      style={{
                        fontSize: 12,
                        color: '#6B7280',
                        marginTop: 4,
                        marginBottom: 0,
                        padding: '6px 10px',
                        background: '#F8FAFC',
                        borderRadius: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {ev.detalhes}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
