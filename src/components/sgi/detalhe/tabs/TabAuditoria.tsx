'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { EventoDetalhe } from '../types'

function fmt(d: string) {
  return format(new Date(d), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
}

function fmtDate(d: string) {
  return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR })
}

function fmtTime(d: string) {
  return format(new Date(d), 'HH:mm', { locale: ptBR })
}

const ACAO_LABELS: Record<string, string> = {
  RASCUNHO_CRIADO: 'Rascunho criado',
  SOLICITACAO_ENVIADA: 'Solicitação enviada',
  APROVACAO_REGISTRADA: 'Aprovação registrada',
  PROXIMO_APROVADOR_NOTIFICADO: 'Notificação enviada',
  APROVACAO_COMPLETA: 'Aprovação completa',
  REJEICAO_REGISTRADA: 'Rejeição registrada',
  EXECUCAO_INICIADA: 'Execução iniciada',
  DESABILITACAO_CONFIRMADA: 'Desabilitação confirmada',
  REABILITACAO_INICIADA: 'Reabilitação iniciada',
  REABILITACAO_INICIADA_E_CONCLUIDA: 'Reabilitação iniciada e concluída',
  REABILITACAO_CONCLUIDA: 'Reabilitação concluída',
  REABILITACAO_CONCLUIDA_EXECUTANTE: 'Reabilitação concluída',
  REABILITACAO_VALIDADA: 'Reabilitação validada',
  REABILITACAO_REJEITADA: 'Reabilitação rejeitada',
  CANCELADA: 'Cancelamento',
  EXTENSAO_REGISTRADA: 'Extensão registrada',
  EXTENSAO_APROVADA: 'Extensão aprovada',
  EXTENSAO_REJEITADA: 'Extensão rejeitada',
}

interface TabAuditoriaProps {
  eventos: EventoDetalhe[]
  protocolo: string
}

export default function TabAuditoria({ eventos, protocolo }: TabAuditoriaProps) {
  if (eventos.length === 0) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '48px 16px',
          textAlign: 'center',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#CBD5E1', display: 'block', marginBottom: 8 }}>
          policy
        </span>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Nenhum registro de auditoria.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary card */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '14px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Protocolo
          </span>
          <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'inherit', color: '#0F172A', margin: '2px 0 0' }}>
            {protocolo}
          </p>
        </div>
        <div>
          <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total de eventos
          </span>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: '2px 0 0' }}>
            {eventos.length}
          </p>
        </div>
        <div>
          <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Primeiro evento
          </span>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', margin: '2px 0 0' }}>
            {fmt(eventos[0].createdAt)}
          </p>
        </div>
        <div>
          <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Último evento
          </span>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', margin: '2px 0 0' }}>
            {fmt(eventos[eventos.length - 1].createdAt)}
          </p>
        </div>
      </div>

      {/* Audit table */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderBottom: '1px solid #F1F5F9',
            background: '#F8FAFC',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#475569', lineHeight: 1 }}>
            policy
          </span>
          <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>
            Trilha de Auditoria
          </h3>
        </div>

        {/* Table header */}
        <div
          className="hidden md:flex"
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid #E2E8F0',
            background: '#FAFBFC',
            gap: 12,
          }}
        >
          <span style={{ width: 40, fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>#</span>
          <span style={{ width: 80, fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Data</span>
          <span style={{ width: 50, fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Hora</span>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Acao</span>
          <span style={{ width: 140, fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Usuario</span>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Detalhes</span>
        </div>

        {/* Rows */}
        {eventos.map((ev, i) => (
          <div
            key={ev.id}
            className="flex flex-col md:flex-row"
            style={{
              padding: '10px 16px',
              borderBottom: i < eventos.length - 1 ? '1px solid #F1F5F9' : 'none',
              gap: 4,
              alignItems: 'flex-start',
            }}
          >
            {/* Index */}
            <span
              className="hidden md:block"
              style={{ width: 40, fontSize: 12, fontFamily: 'inherit', color: '#94A3B8', flexShrink: 0 }}
            >
              {String(i + 1).padStart(3, '0')}
            </span>

            {/* Date */}
            <span
              className="hidden md:block"
              style={{ width: 80, fontSize: 12, color: '#475569', flexShrink: 0 }}
            >
              {fmtDate(ev.createdAt)}
            </span>

            {/* Time */}
            <span
              className="hidden md:block"
              style={{ width: 50, fontSize: 12, fontFamily: 'inherit', color: '#475569', flexShrink: 0 }}
            >
              {fmtTime(ev.createdAt)}
            </span>

            {/* Action */}
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#0F172A', minWidth: 0 }}>
              {ACAO_LABELS[ev.acao] ?? ev.acao}
            </span>

            {/* User */}
            <span style={{ width: 140, fontSize: 12, color: '#475569', flexShrink: 0 }}>
              {ev.user.nome}
            </span>

            {/* Details */}
            <span style={{ flex: 1, fontSize: 12, color: '#6B7280', minWidth: 0 }}>
              {ev.detalhes || '\u2014'}
            </span>

            {/* Mobile: date line */}
            <span className="md:hidden" style={{ fontSize: 11, color: '#94A3B8' }}>
              {fmt(ev.createdAt)} {'\u00B7'} {ev.user.nome}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
