'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

interface KPIs {
  desabilitadosAgora: number
  emAprovacao: number
  emExecucao: number
  aguardandoReab: number
  prazosExcedidosAgora: number
  desabilitacoesPeriodo: number
  encerradasPeriodo: number
  totalPeriodo: number
}

interface TopEquip {
  tag: string
  descricao: string
  area: string
  total: number
  classes: { classe: number; count: number }[]
  motivos: { motivo: string; count: number }[]
  funcao: string | null
}

interface ClasseCount { classe: number; count: number }
interface SlaCompliance { classe: number; dentro: number; excedido: number; total: number; pct: number }
interface AreaData { area: string; total: number; c1: number; c2: number; c3: number; c4: number; c5: number }
interface AreaViolacao { area: string; count: number; mediaExcessoDias: number; classePredominante: number }
interface CicloVida { classe: number; aprovacao: number; execucao: number; desabilitado: number; reabilitacao: number }
interface Tendencia { mes: string; criadas: number; violacoes: number; encerradas: number }

interface MetricasData {
  kpis: KPIs
  topEquipamentos: TopEquip[]
  porClasse: ClasseCount[]
  complianceSla: SlaCompliance[]
  porArea: AreaData[]
  areasViolacao: AreaViolacao[]
  cicloVida: CicloVida[]
  tendencia: Tendencia[]
}

interface Props {
  data: MetricasData
  periodo: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CLASSE_COLORS: Record<number, string> = {
  1: '#1D4ED8', // azul
  2: '#0D9488', // teal
  3: '#EA580C', // laranja
  4: '#DC2626', // vermelho
  5: '#7F1D1D', // marrom
}

const CLASSE_BG: Record<number, string> = {
  1: '#DBEAFE',
  2: '#CCFBF1',
  3: '#FFEDD5',
  4: '#FEE2E2',
  5: '#1C0505',
}

const PERIODOS = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1a', label: 'Último ano' },
]

// ─── Subcomponents ──────────────────────────────────────────────────────────

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

function KpiCard({ label, value, icon, color, bgColor }: {
  label: string; value: number; icon: string; color: string; bgColor: string
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={22} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

function SectionCard({ title, icon, children, className }: {
  title: string; icon: string; children: React.ReactNode; className?: string
}) {
  return (
    <div
      className={className}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 18px',
          borderBottom: '1px solid #F1F5F9',
        }}
      >
        <Icon name={icon} size={18} />
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

function ClasseBadge({ classe }: { classe: number }) {
  const color = CLASSE_COLORS[classe] ?? '#475569'
  const bg = CLASSE_BG[classe] ?? '#F1F5F9'
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: 4,
        background: bg,
        color: classe === 5 ? '#FCA5A5' : color,
      }}
    >
      C{classe}
    </span>
  )
}

// Tooltip customizado para Recharts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#64748B' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// Donut label
function renderDonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, classe }: any) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.06) return null
  return (
    <text x={x} y={y} fill="#FFFFFF" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 700 }}>
      C{classe}
    </text>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function MetricasClient({ data, periodo }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const handlePeriodoChange = (newPeriodo: string) => {
    router.push(`${pathname}?periodo=${newPeriodo}`)
  }

  const { kpis, topEquipamentos, porClasse, complianceSla, porArea, areasViolacao, cicloVida, tendencia } = data

  // Preparar dados para donut
  const donutData = porClasse.map(d => ({
    name: `Classe ${d.classe}`,
    value: d.count,
    classe: d.classe,
  }))
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)

  // Limitar áreas no bar chart a top 8
  const porAreaTop = porArea.slice(0, 8)

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-4 md:py-6">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Métricas
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>
            Panorama operacional da gestão de intertravamentos
          </p>
        </div>

        {/* ── KPIs em tempo real ──────────────────────────────────── */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
          style={{ marginBottom: 20 }}
        >
          <KpiCard label="Desabilitados agora" value={kpis.desabilitadosAgora} icon="warning" color="#EA580C" bgColor="#FFF7ED" />
          <KpiCard label="Em aprovação" value={kpis.emAprovacao} icon="hourglass_top" color="#AC6F00" bgColor="#FEF5E5" />
          <KpiCard label="Execução autorizada" value={kpis.emExecucao} icon="engineering" color="#1E40AF" bgColor="#EFF6FF" />
          <KpiCard label="Aguardando reabilitação" value={kpis.aguardandoReab} icon="replay" color="#0D9488" bgColor="#F0FDFA" />
          <KpiCard label="Prazos excedidos" value={kpis.prazosExcedidosAgora} icon="alarm" color="#DC2626" bgColor="#FEF2F2" />
        </div>

        {/* ── Filtro de período ───────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          style={{
            marginBottom: 16,
            padding: '10px 0',
            borderTop: '1px solid #E2E8F0',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>
            Dados do período
          </span>
          <select
            value={periodo}
            onChange={e => handlePeriodoChange(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: 13,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {PERIODOS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* ── KPIs do período ─────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
          style={{ marginBottom: 24 }}
        >
          <KpiCard label="Desabilitações realizadas" value={kpis.desabilitacoesPeriodo} icon="toggle_off" color="#EA580C" bgColor="#FFF7ED" />
          <KpiCard label="Encerradas" value={kpis.encerradasPeriodo} icon="check_circle" color="#16A34A" bgColor="#F0FDF4" />
          <KpiCard label="Total de solicitações" value={kpis.totalPeriodo} icon="list_alt" color="#0038A8" bgColor="#EBF0FB" />
        </div>

        {/* ── SEÇÃO 2: Top equipamentos recorrentes ───────────────── */}
        <SectionCard title="Equipamentos com maior recorrência" icon="repeat" className="mb-6">
          {topEquipamentos.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>Nenhuma solicitação no período</p>
          ) : (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {/* Bar chart */}
              <div style={{ flex: '1 1 400px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={Math.max(topEquipamentos.length * 44, 200)}>
                  <BarChart
                    data={topEquipamentos}
                    layout="vertical"
                    margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="tag"
                      width={120}
                      tick={{ fontSize: 12, fill: '#0F172A', fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Solicitações" radius={[0, 6, 6, 0]} barSize={24}>
                      {topEquipamentos.map((entry, i) => {
                        const mainClasse = entry.classes[0]?.classe ?? 1
                        return <Cell key={i} fill={CLASSE_COLORS[mainClasse] ?? '#0038A8'} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Details table */}
              <div style={{ flex: '1 1 360px', minWidth: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>TAG</th>
                      <th style={{ textAlign: 'center', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Qty</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Classes</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Motivo principal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEquipamentos.map((eq, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px' }}>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{eq.tag}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{eq.area}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#0F172A', padding: '8px' }}>{eq.total}</td>
                        <td style={{ padding: '8px' }}>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {eq.classes.map((c, j) => (
                              <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                <ClasseBadge classe={c.classe} />
                                <span style={{ fontSize: 10, color: '#94A3B8' }}>×{c.count}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '8px', fontSize: 11, color: '#475569', maxWidth: 180 }}>
                          {eq.motivos[0]?.motivo ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── SEÇÃO 3: Classe + SLA (2 colunas) ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Donut: solicitações por classe */}
          <SectionCard title="Solicitações por classe" icon="donut_small">
            {donutData.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>Sem dados no período</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      label={renderDonutLabel}
                      labelLine={false}
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={CLASSE_COLORS[entry.classe] ?? '#94A3B8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    {/* Center text */}
                    <text x="50%" y="48%" textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: '#0F172A' }}>
                      {donutTotal}
                    </text>
                    <text x="50%" y="56%" textAnchor="middle" style={{ fontSize: 11, fill: '#94A3B8' }}>
                      total
                    </text>
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                  {donutData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: CLASSE_COLORS[d.classe], flexShrink: 0 }} />
                      <span style={{ color: '#475569' }}>Classe {d.classe}</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{d.value}</span>
                      <span style={{ color: '#94A3B8', fontSize: 11 }}>
                        ({donutTotal > 0 ? Math.round((d.value / donutTotal) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Compliance SLA por classe */}
          <SectionCard title="Compliance de SLA por classe" icon="verified">
            {complianceSla.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>Sem dados no período</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={complianceSla} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="classe"
                      tickFormatter={v => `Classe ${v}`}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                    <Bar dataKey="dentro" name="Dentro do prazo" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={28} />
                    <Bar dataKey="excedido" name="Prazo excedido" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
                {/* Compliance % cards */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {complianceSla.map(s => (
                    <div
                      key={s.classe}
                      style={{
                        flex: '1 1 0',
                        minWidth: 80,
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: s.pct >= 80 ? '#F0FDF4' : s.pct >= 50 ? '#FEF5E5' : '#FEF2F2',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.pct >= 80 ? '#16A34A' : s.pct >= 50 ? '#AC6F00' : '#DC2626' }}>
                        {s.pct}%
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>Classe {s.classe}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </div>

        {/* ── SEÇÃO 4: Área (2 colunas) ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Solicitações por área (stacked) */}
          <SectionCard title="Solicitações por área" icon="location_on">
            {porAreaTop.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>Sem dados no período</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(porAreaTop.length * 44, 200)}>
                <BarChart
                  data={porAreaTop}
                  layout="vertical"
                  margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="area"
                    width={100}
                    tick={{ fontSize: 11, fill: '#374151' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="c1" name="Classe 1" stackId="a" fill={CLASSE_COLORS[1]} barSize={22} />
                  <Bar dataKey="c2" name="Classe 2" stackId="a" fill={CLASSE_COLORS[2]} />
                  <Bar dataKey="c3" name="Classe 3" stackId="a" fill={CLASSE_COLORS[3]} />
                  <Bar dataKey="c4" name="Classe 4" stackId="a" fill={CLASSE_COLORS[4]} />
                  <Bar dataKey="c5" name="Classe 5" stackId="a" fill={CLASSE_COLORS[5]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          {/* Áreas com prazo excedido */}
          <SectionCard title="Áreas com prazo de reabilitação excedido" icon="timer_off">
            {areasViolacao.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>Nenhuma violação no período</p>
            ) : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>#</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Área</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Classe</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Violações</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', color: '#64748B', fontWeight: 600 }}>Excesso médio</th>
                  </tr>
                </thead>
                <tbody>
                  {areasViolacao.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px', color: '#94A3B8', fontWeight: 500 }}>{i + 1}</td>
                      <td style={{ padding: '8px', fontWeight: 600, color: '#0F172A' }}>{v.area}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <ClasseBadge classe={v.classePredominante} />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: 10,
                            background: '#FEE2E2',
                            color: '#DC2626',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {v.count}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#DC2626', fontWeight: 600 }}>
                        +{v.mediaExcessoDias} dia{v.mediaExcessoDias !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        {/* ── SEÇÃO 5: Tempo médio do ciclo de vida ────────────────── */}
        <SectionCard title="Tempo médio por etapa do ciclo (dias)" icon="avg_pace" className="mb-6">
          {cicloVida.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>Sem dados no período</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cicloVida} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="classe"
                    tickFormatter={v => `Classe ${v}`}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    label={{ value: 'dias', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94A3B8' } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="aprovacao" name="Aprovação" fill="#AC6F00" radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="execucao" name="Execução" fill="#1E40AF" radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="desabilitado" name="Desabilitado" fill="#EA580C" radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="reabilitacao" name="Reabilitação" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
              {/* Summary table */}
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: '#64748B' }}>Classe</th>
                      <th style={{ textAlign: 'center', padding: '6px 10px', color: '#AC6F00' }}>Aprovação</th>
                      <th style={{ textAlign: 'center', padding: '6px 10px', color: '#1E40AF' }}>Execução</th>
                      <th style={{ textAlign: 'center', padding: '6px 10px', color: '#EA580C' }}>Desabilitado</th>
                      <th style={{ textAlign: 'center', padding: '6px 10px', color: '#0D9488' }}>Reabilitação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cicloVida.map(c => (
                      <tr key={c.classe} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 10px' }}><ClasseBadge classe={c.classe} /></td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 500 }}>{c.aprovacao}d</td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 500 }}>{c.execucao}d</td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, color: '#EA580C' }}>{c.desabilitado}d</td>
                        <td style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 500 }}>{c.reabilitacao}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SectionCard>

        {/* ── SEÇÃO 6: Tendência mensal ────────────────────────────── */}
        <SectionCard title="Tendência mensal (últimos 12 meses)" icon="trending_up" className="mb-6">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tendencia} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line
                type="monotone"
                dataKey="criadas"
                name="Criadas"
                stroke="#0038A8"
                strokeWidth={2}
                dot={{ r: 4, fill: '#0038A8' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="encerradas"
                name="Encerradas"
                stroke="#16A34A"
                strokeWidth={2}
                dot={{ r: 4, fill: '#16A34A' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="violacoes"
                name="Violações SLA"
                stroke="#DC2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#DC2626' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

      </div>
    </div>
  )
}
