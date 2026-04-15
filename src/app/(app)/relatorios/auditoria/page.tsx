import { prisma } from '@/lib/db'
import { buildPlantaScope } from '@/lib/scope'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cookies } from 'next/headers'

async function getSolicitacoesAuditoria() {
  const cookieStore = await cookies()
  const plantaId = cookieStore.get('sgi_planta_ativa')?.value ?? ''
  return prisma.solicitacao.findMany({
    where: { status: { in: ['ENCERRADA', 'REJEITADA', 'CANCELADA'] }, ...buildPlantaScope(plantaId) },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
      executante: { select: { nome: true } },
      aprovacoes: { include: { aprovador: { select: { nome: true } } }, orderBy: { nivel: 'asc' } },
      eventos: { include: { user: { select: { nome: true } } }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

function fmt(d: Date | null | undefined) {
  if (!d) return '—'
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

function duracao(inicio: Date | null, fim: Date | null): string {
  if (!inicio || !fim) return '—'
  const ms = fim.getTime() - inicio.getTime()
  const h = Math.floor(ms / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ${h % 24}h`
  return `${h}h`
}

export default async function AuditoriaPage() {
  const solicitacoes = await getSolicitacoesAuditoria()

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/relatorios" className="text-xs" style={{ color: '#6B7280' }}>← Relatórios</Link>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Auditoria End-to-End</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            Linha do tempo completa. "Documento ouro" para auditorias formais.
          </p>
        </div>
        <button className="px-4 py-2 text-sm border hidden md:block" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
          Exportar XLSX
        </button>
      </div>

      <div className="space-y-4">
        {solicitacoes.length === 0 ? (
          <div className="bg-white border text-center py-12" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação encerrada para auditoria.</p>
          </div>
        ) : solicitacoes.map(s => (
          <details key={s.id} className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
            <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-bold" style={{ color: '#0038A8' }}>{s.protocolo}</span>
                <StatusBadge status={s.status as StatusSolicitacao} size="sm" />
                {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} size="sm" />}
                <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>{s.equipamento.tag}</span>
                <span className="text-xs" style={{ color: '#6B7280' }}>{s.area.planta.nome} · {s.area.nome}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                {s.dataDesabilitacao && s.dataEncerramento && (
                  <span className="text-xs" style={{ color: '#475569' }}>
                    Duração: {duracao(s.dataDesabilitacao, s.dataEncerramento)}
                  </span>
                )}
                <span className="text-xs" style={{ color: '#94A3B8' }}>▼</span>
              </div>
            </summary>

            <div className="px-5 pb-5 border-t" style={{ borderColor: '#F1F5F9' }}>
              {/* Info geral */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
                <InfoBox label="Solicitante" value={s.solicitante.nome} />
                <InfoBox label="Executante" value={s.executante?.nome ?? '—'} />
                <InfoBox label="Desabilitado em" value={fmt(s.dataDesabilitacao)} />
                <InfoBox label="Encerrado em" value={fmt(s.dataEncerramento)} />
              </div>

              {/* Linha do tempo */}
              <div className="mt-2">
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>Linha do Tempo</p>
                <div className="space-y-2">
                  {s.eventos.map((ev, i) => (
                    <div key={ev.id} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full flex-shrink-0 mt-0.5"
                        style={{ background: '#0038A8', color: 'white', fontSize: '10px' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm" style={{ color: '#0F172A' }}>{ev.acao.replace(/_/g, ' ')}</span>
                        <span className="text-xs ml-2" style={{ color: '#6B7280' }}>por {ev.user.nome}</span>
                        <span className="text-xs ml-2" style={{ color: '#94A3B8' }}>{fmt(ev.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{label}</p>
      <p className="text-sm mt-0.5" style={{ color: '#0F172A' }}>{value}</p>
    </div>
  )
}
