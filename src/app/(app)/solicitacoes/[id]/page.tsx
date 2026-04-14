import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import AcoesButtons from './AcoesButtons'
import { PageBreadcrumb } from '@/components/sgi/PageBreadcrumb'

async function getSolicitacao(id: string) {
  return prisma.solicitacao.findUnique({
    where: { id },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true, matricula: true, email: true } },
      executante:  { select: { nome: true, matricula: true } },
      aprovacoes: {
        include: { aprovador: { select: { nome: true, matricula: true } } },
        orderBy: { nivel: 'asc' },
      },
      checklists: { orderBy: { numero: 'asc' } },
      anexos: true,
      eventos: {
        include: { user: { select: { nome: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

const TIPO_LABELS: Record<string, string> = {
  LOGICO: 'Lógico',
  FISICO: 'Físico',
  DISPOSITIVO_SEGURANCA: 'Dispositivo de Segurança',
}

const ACAO_LABELS: Record<string, string> = {
  RASCUNHO_CRIADO: 'Rascunho criado',
  SOLICITACAO_ENVIADA: 'Solicitação enviada para aprovação',
  APROVACAO_REGISTRADA: 'Aprovação registrada',
  REJEICAO_REGISTRADA: 'Solicitação rejeitada',
  EXECUCAO_INICIADA: 'Execução iniciada em campo',
  DESABILITACAO_CONFIRMADA: 'Desabilitação confirmada',
  REABILITACAO_INICIADA: 'Reabilitação iniciada',
  REABILITACAO_ENVIADA_PARA_VALIDACAO: 'Reabilitação enviada para validação',
  REABILITACAO_REJEITADA: 'Reabilitação rejeitada para correção',
  REABILITACAO_VALIDADA: 'Reabilitação validada — solicitação encerrada',
  CANCELADA: 'Solicitação cancelada',
  EXTENSAO_SOLICITADA: 'Solicitação de extensão registrada',
  EXTENSAO_APROVADA: 'Extensão de prazo aprovada',
  EXTENSAO_REJEITADA: 'Extensão de prazo rejeitada',
}

function fmt(d: Date | null | undefined) {
  if (!d) return '—'
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

function pickParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default async function SolicitacaoDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const s = await getSolicitacao(params.id)
  if (!s) notFound()
  const abaRaw = pickParam(searchParams?.aba)
  const abaAtiva = abaRaw === 'aprovacoes' || abaRaw === 'timeline' ? abaRaw : 'detalhes'

  const aprovDesab = s.aprovacoes.filter(a => a.tipo === 'DESABILITACAO')
  const aprovReab  = s.aprovacoes.filter(a => a.tipo === 'REABILITACAO')

  return (
    <div className="max-w-4xl p-6 pb-40 md:pb-28">
      <PageBreadcrumb
        backHref="/solicitacoes"
        items={[
          { label: 'Solicitações', href: '/solicitacoes' },
          { label: s.protocolo, href: `/solicitacoes/${s.id}` },
          { label: 'Detalhe' },
        ]}
      />
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold font-mono" style={{ color: '#0F172A' }}>{s.protocolo}</h1>
            <StatusBadge status={s.status as StatusSolicitacao} />
            {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} showPrazo />}
          </div>
          <div className="flex items-center gap-3 text-sm" style={{ color: '#475569' }}>
            <span>{s.area.planta.nome} › {s.area.nome}</span>
            <span>·</span>
            <span className="font-mono font-medium" style={{ color: '#0038A8' }}>{s.equipamento.tag}</span>
            <span>·</span>
            <span>{s.tipo ? TIPO_LABELS[s.tipo] : '—'}</span>
          </div>
        </div>

        {/* SLA flags */}
        {(s.prazoPrevitoAtingido || s.prazoMaximoAtingido) && (
          <div className="flex flex-col gap-1">
            {s.prazoMaximoAtingido && (
              <span className="text-xs px-2 py-1 font-medium" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
                ⚠ Prazo máximo atingido
              </span>
            )}
            {s.prazoPrevitoAtingido && !s.prazoMaximoAtingido && (
              <span className="text-xs px-2 py-1 font-medium" style={{ background: '#FEF3C7', color: '#B45309', borderRadius: '4px' }}>
                ⏱ Prazo previsto atingido
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ações (client component) */}
      <AcoesButtons
        solicitacaoId={s.id}
        status={s.status as StatusSolicitacao}
        tipo={s.tipo}
      />

      <div className="mb-4 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'detalhes', label: 'Detalhes' },
            { key: 'aprovacoes', label: 'Aprovações' },
            { key: 'timeline', label: 'Linha do tempo' },
          ].map(tab => {
            const active = abaAtiva === tab.key
            return (
              <a
                key={tab.key}
                href={`/solicitacoes/${s.id}?aba=${tab.key}`}
                className="whitespace-nowrap border px-4 py-1.5 text-sm font-medium"
                style={{
                  borderColor: active ? '#0038A8' : '#CBD5E1',
                  background: active ? '#EBF0FB' : '#F8FAFC',
                  color: active ? '#0038A8' : '#64748B',
                  borderRadius: '999px',
                }}
              >
                {tab.label}
              </a>
            )
          })}
        </div>
      </div>

      {abaAtiva === 'detalhes' && (
        <div className="grid grid-cols-1 gap-4 mb-4 md:hidden">
          <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>Intertravamento</h3>
            <dl className="space-y-2">
              <DetailRow label="TAG" value={s.equipamento.tag} mono />
              <DetailRow label="Tipo" value={s.tipo ? TIPO_LABELS[s.tipo] : '—'} />
              <DetailRow label="Função" value={s.funcaoIntertravamento} />
              <DetailRow label="Motivo" value={s.motivoDesabilitacao} />
            </dl>
          </div>
          <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>Período e SLA</h3>
            <dl className="space-y-2">
              <DetailRow label="Início previsto" value={fmt(s.periodoInicio)} />
              <DetailRow label="Fim previsto" value={fmt(s.periodoFim)} />
              <DetailRow label="Prazo máximo" value={s.classe?.prazoMaximoDias ? `${s.classe.prazoMaximoDias} dia(s)` : 'NÃO FORÇÁVEL'} />
            </dl>
          </div>
          <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>Medidas contingenciais</h3>
            <p className="text-sm" style={{ color: '#374151', lineHeight: '1.6' }}>
              {s.medidasContingenciais || <span style={{ color: '#94A3B8' }}>Não informadas</span>}
            </p>
          </div>
        </div>
      )}

      {abaAtiva === 'aprovacoes' && (
        <div className="space-y-4 mb-4 md:hidden">
          <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>
              Aprovações — Desabilitação
            </h3>
            {aprovDesab.length === 0 ? (
              <p className="text-sm" style={{ color: '#94A3B8' }}>Sem aprovações de desabilitação.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {aprovDesab.map(a => (
                  <div key={a.id} className="p-3" style={{ background: '#F8FAFC', borderRadius: '4px' }}>
                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{a.aprovador.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{a.status}</p>
                    {a.respondidaEm && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{fmt(a.respondidaEm)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {aprovReab.length > 0 && (
            <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>
                Aprovações — Reabilitação
              </h3>
              <div className="flex flex-col gap-2">
                {aprovReab.map(a => (
                  <div key={a.id} className="p-3" style={{ background: '#F8FAFC', borderRadius: '4px' }}>
                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{a.aprovador.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{a.status}</p>
                    {a.respondidaEm && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{fmt(a.respondidaEm)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {abaAtiva === 'timeline' && (
        <div className="bg-white border p-4 mb-4 md:hidden" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#6B7280' }}>
            Linha do Tempo
          </h3>
          {s.eventos.length === 0 ? (
            <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhum evento registrado.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: '#E2E8F0' }} />
              <div className="space-y-4">
                {s.eventos.map((ev, i) => (
                  <div key={ev.id} className="flex gap-4 relative">
                    <div
                      className="w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10"
                      style={{ background: '#0038A8', color: 'white', borderRadius: '50%' }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="text-sm font-medium" style={{ color: '#0F172A' }}>
                        {ACAO_LABELS[ev.acao] ?? ev.acao}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{fmt(ev.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid detalhes */}
      <div className="hidden md:grid grid-cols-2 gap-4 mb-4">
        {/* Dados do intertravamento */}
        <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>Intertravamento</h3>
          <dl className="space-y-2">
            <DetailRow label="TAG" value={s.equipamento.tag} mono />
            <DetailRow label="Tipo" value={s.tipo ? TIPO_LABELS[s.tipo] : '—'} />
            <DetailRow label="Função" value={s.funcaoIntertravamento} />
            <DetailRow label="Motivo" value={s.motivoDesabilitacao} />
          </dl>
        </div>

        {/* Período e SLA */}
        <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>Período e SLA</h3>
          <dl className="space-y-2">
            <DetailRow label="Início previsto" value={fmt(s.periodoInicio)} />
            <DetailRow label="Fim previsto"    value={fmt(s.periodoFim)} />
            <DetailRow label="Prazo máximo"    value={s.classe?.prazoMaximoDias ? `${s.classe.prazoMaximoDias} dia(s)` : 'NÃO FORÇÁVEL'} />
            <DetailRow label="Desabilitado em" value={fmt(s.dataDesabilitacao)} />
            <DetailRow label="Reabilitado em"  value={fmt(s.dataReabilitacao)} />
            <DetailRow label="Encerrado em"    value={fmt(s.dataEncerramento)} />
          </dl>
        </div>

        {/* Responsáveis */}
        <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>Responsáveis</h3>
          <dl className="space-y-2">
            <DetailRow label="Solicitante" value={`${s.solicitante.nome} (${s.solicitante.matricula})`} />
            <DetailRow label="Executante"  value={s.executante ? `${s.executante.nome} (${s.executante.matricula})` : '—'} />
          </dl>
        </div>

        {/* Medidas contingenciais */}
        <div className="bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>Medidas Contingenciais</h3>
          <p className="text-sm" style={{ color: '#374151', lineHeight: '1.6' }}>
            {s.medidasContingenciais || <span style={{ color: '#94A3B8' }}>Não informadas</span>}
          </p>
        </div>
      </div>

      {/* Aprovações */}
      {aprovDesab.length > 0 && (
        <div className="mb-4 hidden border bg-white p-4 md:block" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>
            Aprovações — Desabilitação
          </h3>
          <div className="flex flex-col gap-2">
            {aprovDesab.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3"
                style={{ background: '#F8FAFC', borderRadius: '4px' }}
              >
                <div
                  className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full"
                  style={{
                    background: a.status === 'APROVADO' ? '#D1FAE5' : a.status === 'REJEITADO' ? '#FEE2E2' : '#FEF3C7',
                    color:      a.status === 'APROVADO' ? '#065F46' : a.status === 'REJEITADO' ? '#B91C1C' : '#B45309',
                  }}
                >
                  {a.status === 'APROVADO' ? '✓' : a.status === 'REJEITADO' ? '✕' : a.nivel}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: '#0F172A' }}>{a.aprovador.nome}</span>
                  <span className="text-xs ml-2 font-mono" style={{ color: '#94A3B8' }}>{a.aprovador.matricula}</span>
                  {a.comentario && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{a.comentario}</p>}
                  {a.motivoRejeicao && <p className="text-xs mt-0.5" style={{ color: '#B91C1C' }}>Motivo: {a.motivoRejeicao}</p>}
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 font-medium" style={{
                    borderRadius: '4px',
                    background: a.status === 'APROVADO' ? '#D1FAE5' : a.status === 'REJEITADO' ? '#FEE2E2' : '#FEF3C7',
                    color:      a.status === 'APROVADO' ? '#065F46' : a.status === 'REJEITADO' ? '#B91C1C' : '#B45309',
                  }}>
                    {a.status === 'APROVADO' ? 'Aprovado' : a.status === 'REJEITADO' ? 'Rejeitado' : 'Pendente'}
                  </span>
                  {a.respondidaEm && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{fmt(a.respondidaEm)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklists */}
      {s.checklists.length > 0 && (
        <div className="mb-4 hidden border bg-white p-4 md:block" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>
            Checklists de Campo
          </h3>
          <div className="space-y-2">
            {['DESABILITACAO', 'REABILITACAO'].map(tipo => {
              const items = s.checklists.filter(c => c.tipo === tipo)
              if (items.length === 0) return null
              return (
                <div key={tipo}>
                  <p className="text-xs font-medium mb-2" style={{ color: '#475569' }}>
                    {tipo === 'DESABILITACAO' ? 'Desabilitação' : 'Reabilitação'}
                  </p>
                  {items.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-2.5 mb-1" style={{ background: '#F8FAFC', borderRadius: '4px' }}>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5"
                        style={{
                          borderRadius: '4px',
                          background: item.resposta === 'SIM' ? '#D1FAE5' : item.resposta === 'NA' ? '#F1F5F9' : '#FEF9C3',
                          color:      item.resposta === 'SIM' ? '#065F46' : item.resposta === 'NA' ? '#64748B' : '#B45309',
                        }}
                      >
                        {item.resposta ?? '—'}
                      </span>
                      <span className="text-sm flex-1" style={{ color: '#374151' }}>{item.descricao}</span>
                      <span className="text-xs" style={{ color: '#94A3B8' }}>item {item.numero}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Linha do tempo */}
      <div className="hidden md:block bg-white border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#6B7280' }}>
          Linha do Tempo
        </h3>
        {s.eventos.length === 0 ? (
          <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhum evento registrado.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: '#E2E8F0' }} />
            <div className="space-y-4">
              {s.eventos.map((ev, i) => (
                <div key={ev.id} className="flex gap-4 relative">
                  <div
                    className="w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10"
                    style={{ background: '#0038A8', color: 'white', borderRadius: '50%' }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-sm font-medium" style={{ color: '#0F172A' }}>
                      {ACAO_LABELS[ev.acao] ?? ev.acao}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: '#475569' }}>{ev.user.nome}</span>
                      <span className="text-xs" style={{ color: '#94A3B8' }}>·</span>
                      <span className="text-xs" style={{ color: '#94A3B8' }}>{fmt(ev.createdAt)}</span>
                    </div>
                    {ev.detalhes && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{ev.detalhes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <dt className="text-xs w-28 shrink-0 font-medium" style={{ color: '#6B7280' }}>{label}</dt>
      <dd className={`text-xs flex-1 ${mono ? 'font-mono font-semibold' : ''}`} style={{ color: mono ? '#0038A8' : '#0F172A' }}>
        {value || <span style={{ color: '#94A3B8' }}>—</span>}
      </dd>
    </div>
  )
}
