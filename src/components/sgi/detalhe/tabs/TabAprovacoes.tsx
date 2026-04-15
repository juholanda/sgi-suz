'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AprovacaoDetalhe } from '../types'

function fmt(d: string | null | undefined) {
  if (!d) return '\u2014'
  return format(new Date(d), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
}

const PERFIL_LABELS: Record<string, string> = {
  APROVADOR: 'Aprovador',
  GESTOR_SMS: 'Gestor SMS',
  ADMINISTRADOR: 'Administrador',
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string; bg: string }> = {
  APROVADO:   { icon: 'check_circle', color: '#16A34A', label: 'Aprovado',           bg: '#D1FAE5' },
  REJEITADO:  { icon: 'cancel',       color: '#DC2626', label: 'Rejeitado',          bg: '#FEE2E2' },
  PENDENTE:   { icon: 'pending',      color: '#2563EB', label: 'Aguardando resposta', bg: '#DBEAFE' },
  AGUARDANDO: { icon: 'schedule',     color: '#94A3B8', label: 'Aguardando fila',    bg: '#F1F5F9' },
}

interface TabAprovacoesProps {
  aprovacoes: AprovacaoDetalhe[]
  status: string
}

export default function TabAprovacoes({ aprovacoes, status }: TabAprovacoesProps) {
  const aprovDesab = aprovacoes.filter(a => a.tipo === 'DESABILITACAO')
  const totalNiveis = aprovDesab.length
  const aprovadas = aprovDesab.filter(a => a.status === 'APROVADO').length
  const pct = totalNiveis > 0 ? Math.round((aprovadas / totalNiveis) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Progress bar */}
      {totalNiveis > 0 && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>
              {aprovadas} de {totalNiveis} aprovadores
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: pct === 100 ? '#16A34A' : '#0038A8',
                borderRadius: 3,
                transition: 'width 0.3s',
              }}
            />
          </div>
          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {aprovDesab.map((a, i) => {
              const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.AGUARDANDO
              return (
                <div
                  key={a.id}
                  title={`Nivel ${a.nivel}: ${a.aprovador.nome} - ${cfg.label}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: cfg.color,
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Aprovadores - Desabilitacao */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #F1F5F9',
            background: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#475569', lineHeight: 1 }}>
              task_alt
            </span>
            <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>
              Aprovadores {'\u2014'} Desabilitacao
            </h3>
          </div>
          {totalNiveis > 0 && (
            <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>
              {aprovadas} / {totalNiveis} aprovaram
            </span>
          )}
        </div>

        {aprovDesab.length === 0 ? (
          <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, color: '#94A3B8' }}>info</span>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>Nenhum aprovador configurado para esta classe/planta.</span>
          </div>
        ) : (
          <div>
            {aprovDesab.map((a, i) => {
              const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.AGUARDANDO
              const perfil = a.aprovador.perfis?.[0]?.perfil

              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < aprovDesab.length - 1 ? '1px solid #F1F5F9' : 'none',
                  }}
                >
                  {/* Level badge */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: '50%',
                      background: cfg.bg,
                      color: cfg.color,
                      flexShrink: 0,
                    }}
                  >
                    {a.nivel}
                  </div>

                  {/* Name + metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{a.aprovador.nome}</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94A3B8' }}>{a.aprovador.matricula}</span>
                      {perfil && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '1px 6px',
                            background: '#F1F5F9',
                            color: '#374151',
                            borderRadius: 4,
                          }}
                        >
                          {PERFIL_LABELS[perfil] ?? perfil}
                        </span>
                      )}
                    </div>
                    {a.comentario && (
                      <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 0 }}>
                        {a.comentario}
                      </p>
                    )}
                    {a.motivoRejeicao && (
                      <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 2, marginBottom: 0 }}>
                        Motivo: {a.motivoRejeicao}
                      </p>
                    )}
                  </div>

                  {/* Status + date */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: cfg.color }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>{cfg.icon}</span>
                      {cfg.label}
                    </span>
                    {a.respondidaEm && (
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{fmt(a.respondidaEm)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Responsavel pela validacao da reabilitacao */}
      {['DESABILITADO', 'EM_REABILITACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'ENCERRADA'].includes(status) && aprovDesab.length > 0 && (
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
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#475569', lineHeight: 1 }}>verified</span>
            <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>
              Responsavel pela Validacao da Reabilitacao
            </h3>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {(() => {
              const aprovadorFinal = aprovDesab[aprovDesab.length - 1]
              if (!aprovadorFinal) return null
              const perfil = aprovadorFinal.aprovador.perfis?.[0]?.perfil

              const statusText =
                status === 'EM_VALIDACAO_DA_REABILITACAO' ? 'Aguardando validacao desta pessoa' :
                status === 'ENCERRADA' ? 'Reabilitacao validada' :
                'Validara a reabilitacao ao concluir'

              const statusIcon =
                status === 'EM_VALIDACAO_DA_REABILITACAO' ? 'pending' :
                status === 'ENCERRADA' ? 'check_circle' : 'schedule'

              const statusColor =
                status === 'EM_VALIDACAO_DA_REABILITACAO' ? '#7C3AED' :
                status === 'ENCERRADA' ? '#16A34A' : '#94A3B8'

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: '50%',
                      background: '#EDE9FE',
                      color: '#7C3AED',
                      flexShrink: 0,
                    }}
                  >
                    {aprovadorFinal.aprovador.nome[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{aprovadorFinal.aprovador.nome}</span>
                      {perfil && (
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 6px', background: '#EDE9FE', color: '#7C3AED', borderRadius: 4 }}>
                          {PERFIL_LABELS[perfil] ?? perfil}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 0 }}>{statusText}</p>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: statusColor, flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>{statusIcon}</span>
                    {status === 'EM_VALIDACAO_DA_REABILITACAO' ? 'Aguardando' : status === 'ENCERRADA' ? 'Validado' : ''}
                  </span>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
