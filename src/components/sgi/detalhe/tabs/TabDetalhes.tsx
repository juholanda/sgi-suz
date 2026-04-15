'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import PrazoCard from '../PrazoCard'
import type { SolicitacaoDetalhe } from '../types'

const TIPO_LABELS: Record<string, string> = {
  LOGICO: 'Lógico',
  FISICO: 'Físico',
  DISPOSITIVO_SEGURANCA: 'Dispositivo de Segurança',
}

function fmt(d: string | null | undefined) {
  if (!d) return '\u2014'
  return format(new Date(d), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
}

// ── Section card ─────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
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
          {icon}
        </span>
        <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

// ── Detail row ───────────────────────────────────────────────────────────────

function Row({ label, value, mono, highlight }: { label: string; value?: string | null; mono?: boolean; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #F8FAFC' }}>
      <dt style={{ width: 130, flexShrink: 0, fontSize: 12, fontWeight: 500, color: '#64748B' }}>{label}</dt>
      <dd
        style={{
          flex: 1,
          fontSize: 13,
          color: highlight ? '#0038A8' : '#0F172A',
          fontFamily: 'inherit',
          fontWeight: mono ? 600 : 400,
          margin: 0,
        }}
      >
        {value || <span style={{ color: '#94A3B8' }}>{'\u2014'}</span>}
      </dd>
    </div>
  )
}

// ── Checklist display ────────────────────────────────────────────────────────

function ChecklistSection({ tipo, items }: { tipo: string; items: SolicitacaoDetalhe['checklists'] }) {
  const label = tipo === 'DESABILITACAO' ? 'Desabilitação' : 'Reabilitação'
  const accentColor = tipo === 'DESABILITACAO' ? '#EA580C' : '#0D9488'

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accentColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: accentColor }}>{label}</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>({items.length} itens)</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '8px 12px',
              background: '#F8FAFC',
              borderRadius: 6,
              border: '1px solid #F1F5F9',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 36,
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                background:
                  item.resposta === 'SIM' ? '#D1FAE5' :
                  item.resposta === 'NA' ? '#F1F5F9' :
                  '#FEF9C3',
                color:
                  item.resposta === 'SIM' ? '#065F46' :
                  item.resposta === 'NA' ? '#64748B' :
                  '#B45309',
                flexShrink: 0,
              }}
            >
              {item.resposta ?? '\u2014'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item.descricao}</span>
              {item.observacao && (
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 0 }}>
                  Obs: {item.observacao}
                </p>
              )}
            </div>
            <span style={{ fontSize: 11, color: '#CBD5E1', flexShrink: 0 }}>#{item.numero}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface TabDetalhesProps {
  s: SolicitacaoDetalhe
}

export default function TabDetalhes({ s }: TabDetalhesProps) {
  const checklistDesab = s.checklists.filter(c => c.tipo === 'DESABILITACAO')
  const checklistReab = s.checklists.filter(c => c.tipo === 'REABILITACAO')
  const hasChecklists = checklistDesab.length > 0 || checklistReab.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informações Básicas */}
        <Section title="Informações Básicas" icon="info">
          <dl style={{ display: 'flex', flexDirection: 'column' }}>
            <Row label="TAG" value={s.equipamento.tag} mono highlight />
            <Row label="Nome" value={s.equipamento.descricao} />
            <Row label="Tipo" value={s.tipo ? TIPO_LABELS[s.tipo] ?? s.tipo : null} />
            <Row label="Classe" value={s.classe ? `Classe ${s.classe.numero}` : null} />
            <Row label="Planta" value={s.area?.planta?.nome} />
            <Row label="Área" value={s.area?.nome} />
            <Row label="Função" value={s.funcaoIntertravamento} />
            <Row label="Motivo" value={s.motivoDesabilitacao} />
            <Row label="Data da solicitação" value={fmt(s.createdAt)} />
            <Row label="Solicitante" value={`${s.solicitante.nome} (${s.solicitante.matricula})`} />
            <Row label="E-mail" value={s.solicitante.email} />
            <Row
              label="Executante"
              value={s.executante ? `${s.executante.nome} (${s.executante.matricula})` : null}
            />
            <Row label="Medidas contingenciais" value={s.medidasContingenciais} />
          </dl>
        </Section>

        {/* Período e Prazos */}
        <Section title="Período e Prazos" icon="schedule">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Status de prazo dinâmico */}
            <PrazoCard
              status={s.status}
              periodoInicio={s.periodoInicio}
              periodoFim={s.periodoFim}
              dataEnvio={s.dataEnvioAprovacao}
              dataDesabilitacao={s.dataDesabilitacao}
              dataAprovacaoFinal={null}
              prazoMaximoDias={s.classe?.prazoMaximoDias ?? null}
              prazoPrevitoAtingido={s.prazoPrevitoAtingido}
              prazoMaximoAtingido={s.prazoMaximoAtingido}
              createdAt={s.createdAt}
              embedded
            />
            <dl style={{ display: 'flex', flexDirection: 'column' }}>
              <Row label="Início previsto" value={fmt(s.periodoInicio)} />
              <Row label="Fim previsto" value={fmt(s.periodoFim)} />
              <Row
                label="Prazo máximo"
                value={s.classe?.prazoMaximoDias ? `${s.classe.prazoMaximoDias} dia(s)` : 'Não forçável'}
              />
              <Row label="Desabilitado em" value={fmt(s.dataDesabilitacao)} />
              <Row label="Reabilitado em" value={fmt(s.dataReabilitacao)} />
              <Row label="Encerrado em" value={fmt(s.dataEncerramento)} />
            </dl>
          </div>
        </Section>
      </div>

      {/* Checklists de campo */}
      {hasChecklists && (
        <Section title="Checklists de Campo" icon="checklist">
          {checklistDesab.length > 0 && <ChecklistSection tipo="DESABILITACAO" items={checklistDesab} />}
          {checklistReab.length > 0 && <ChecklistSection tipo="REABILITACAO" items={checklistReab} />}
        </Section>
      )}

      {/* Extensoes de prazo */}
      {s.extensoes && s.extensoes.length > 0 && (
        <Section title="Extensões de Prazo" icon="event_repeat">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.extensoes.map(ext => (
              <div
                key={ext.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  background: '#F8FAFC',
                  borderRadius: 6,
                  border: '1px solid #F1F5F9',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background:
                      ext.status === 'APROVADA' ? '#D1FAE5' :
                      ext.status === 'REJEITADA' ? '#FEE2E2' :
                      '#FEF3C7',
                    color:
                      ext.status === 'APROVADA' ? '#065F46' :
                      ext.status === 'REJEITADA' ? '#B91C1C' :
                      '#92400E',
                  }}
                >
                  {ext.status}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: '#0F172A' }}>
                    Nova data: {fmt(ext.novaDataFim)}
                  </span>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{ext.justificativa}</p>
                </div>
                <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0 }}>{fmt(ext.createdAt)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
