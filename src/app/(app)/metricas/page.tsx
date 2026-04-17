import { prisma } from '@/lib/db'
import { requirePlantaAtiva, buildPlantaScope } from '@/lib/scope'
import MetricasClient from './MetricasClient'

// ─── Helpers ────────────────────────────────────────────────────────────────

function periodToDate(periodo: string): Date {
  const now = new Date()
  switch (periodo) {
    case '7d':  return new Date(now.getTime() - 7 * 86400000)
    case '1m':  return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case '3m':  return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case '6m':  return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case '1a':  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    default:    return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
  }
}

const ANDAMENTO_STATUSES = [
  'EM_APROVACAO',
  'EXECUCAO_AUTORIZADA',
  'DESABILITADO',
  'EM_VALIDACAO_DA_REABILITACAO',
  'EXTENSAO_EM_ANALISE',
]

// ─── Data fetching ──────────────────────────────────────────────────────────

async function getMetricasData(plantaId: string, periodo: string) {
  const scope = buildPlantaScope(plantaId)
  const desde = periodToDate(periodo)

  // ── 1. KPIs ────────────────────────────────────────────────────
  // Tempo real (não dependem do filtro de período)
  // + Período (dependem do filtro)
  const [
    desabilitadosAgora,
    emAprovacao,
    execucaoAutorizada,
    aguardandoValidacao,
    prazosExcedidosAgora,
    desabilitacoesPeriodo,
    extensoesPeriodo,
    reabilitadosDentroPrazo,
  ] = await Promise.all([
    prisma.solicitacao.count({ where: { status: 'DESABILITADO', ...scope } }),
    prisma.solicitacao.count({ where: { status: 'EM_APROVACAO', ...scope } }),
    prisma.solicitacao.count({ where: { status: 'EXECUCAO_AUTORIZADA', ...scope } }),
    prisma.solicitacao.count({ where: { status: 'EM_VALIDACAO_DA_REABILITACAO', ...scope } }),
    prisma.solicitacao.count({
      where: {
        prazoMaximoAtingido: true,
        status: { in: ANDAMENTO_STATUSES },
        ...scope,
      },
    }),
    prisma.solicitacao.count({
      where: {
        dataDesabilitacao: { not: null, gte: desde },
        ...scope,
      },
    }),
    prisma.extensaoPrazo.count({
      where: {
        createdAt: { gte: desde },
        solicitacao: { ...scope },
      },
    }),
    prisma.solicitacao.count({
      where: {
        status: 'ENCERRADA',
        prazoMaximoAtingido: false,
        dataEncerramento: { gte: desde },
        ...scope,
      },
    }),
  ])

  // ── 2. Top equipamentos com mais solicitações ──────────────────
  const topEquipRaw = await prisma.solicitacao.groupBy({
    by: ['equipamentoId'],
    where: { createdAt: { gte: desde }, ...scope },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  })

  const topEquipIds = topEquipRaw.map(r => r.equipamentoId)
  const equipamentos = topEquipIds.length > 0
    ? await prisma.equipamento.findMany({
        where: { id: { in: topEquipIds } },
        include: { area: { include: { planta: true } } },
      })
    : []

  // Buscar detalhes (motivo, função, classe) para cada equipamento top
  const topEquipSolicitacoes = topEquipIds.length > 0
    ? await prisma.solicitacao.findMany({
        where: {
          equipamentoId: { in: topEquipIds },
          createdAt: { gte: desde },
          ...scope,
        },
        select: {
          equipamentoId: true,
          motivoDesabilitacao: true,
          funcaoIntertravamento: true,
          classe: { select: { numero: true } },
        },
      })
    : []

  const topEquipamentos = topEquipRaw.map(r => {
    const equip = equipamentos.find(e => e.id === r.equipamentoId)
    const sols = topEquipSolicitacoes.filter(s => s.equipamentoId === r.equipamentoId)

    // Contar classes
    const classeCount: Record<number, number> = {}
    sols.forEach(s => {
      const n = s.classe?.numero ?? 0
      classeCount[n] = (classeCount[n] || 0) + 1
    })

    // Contar motivos (top 2)
    const motivoCount: Record<string, number> = {}
    sols.forEach(s => {
      const m = s.motivoDesabilitacao?.substring(0, 50) ?? 'Não informado'
      motivoCount[m] = (motivoCount[m] || 0) + 1
    })

    return {
      tag: equip?.tag ?? '—',
      descricao: equip?.descricao ?? '',
      area: equip?.area?.nome ?? '',
      total: r._count.id,
      classes: Object.entries(classeCount)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ classe: Number(k), count: v })),
      motivos: Object.entries(motivoCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([k, v]) => ({ motivo: k, count: v })),
      funcao: sols[0]?.funcaoIntertravamento ?? null,
    }
  })

  // ── 3. Solicitações por classe ─────────────────────────────────
  const porClasseRaw = await prisma.solicitacao.groupBy({
    by: ['classeId'],
    where: { createdAt: { gte: desde }, classeId: { not: null }, ...scope },
    _count: { id: true },
  })

  const classeIds = porClasseRaw.map(r => r.classeId).filter(Boolean) as string[]
  const classes = classeIds.length > 0
    ? await prisma.classe.findMany({ where: { id: { in: classeIds } } })
    : []

  const porClasse = porClasseRaw
    .map(r => {
      const cls = classes.find(c => c.id === r.classeId)
      return { classe: cls?.numero ?? 0, count: r._count.id }
    })
    .filter(r => r.classe > 0)
    .sort((a, b) => a.classe - b.classe)

  // ── 4. Compliance SLA por classe ───────────────────────────────
  const slaData = await prisma.solicitacao.findMany({
    where: {
      createdAt: { gte: desde },
      status: { in: ['ENCERRADA', 'REJEITADA', 'CANCELADA', 'DESABILITADO', 'EM_REABILITACAO', 'EM_VALIDACAO_DA_REABILITACAO'] },
      classeId: { not: null },
      ...scope,
    },
    select: {
      prazoMaximoAtingido: true,
      classe: { select: { numero: true } },
    },
  })

  const slaByClasse: Record<number, { dentro: number; excedido: number }> = {}
  slaData.forEach(s => {
    const n = s.classe?.numero ?? 0
    if (n === 0 || n === 5) return // Classe 5 não tem prazo
    if (!slaByClasse[n]) slaByClasse[n] = { dentro: 0, excedido: 0 }
    if (s.prazoMaximoAtingido) slaByClasse[n].excedido++
    else slaByClasse[n].dentro++
  })

  const complianceSla = Object.entries(slaByClasse)
    .map(([k, v]) => ({
      classe: Number(k),
      dentro: v.dentro,
      excedido: v.excedido,
      total: v.dentro + v.excedido,
      pct: v.dentro + v.excedido > 0
        ? Math.round((v.dentro / (v.dentro + v.excedido)) * 100)
        : 100,
    }))
    .sort((a, b) => a.classe - b.classe)

  // ── 5. Desabilitações por área ─────────────────────────────────
  const porAreaRaw = await prisma.solicitacao.groupBy({
    by: ['areaId'],
    where: { createdAt: { gte: desde }, ...scope },
    _count: { id: true },
  })

  const areaIds = porAreaRaw.map(r => r.areaId)
  const areas = areaIds.length > 0
    ? await prisma.area.findMany({ where: { id: { in: areaIds } } })
    : []

  // Detalhar por classe para empilhar
  const porAreaClasseRaw = await prisma.solicitacao.findMany({
    where: { createdAt: { gte: desde }, classeId: { not: null }, ...scope },
    select: {
      areaId: true,
      classe: { select: { numero: true } },
    },
  })

  const areaClasseMap: Record<string, Record<number, number>> = {}
  porAreaClasseRaw.forEach(s => {
    const n = s.classe?.numero ?? 0
    if (!areaClasseMap[s.areaId]) areaClasseMap[s.areaId] = {}
    areaClasseMap[s.areaId][n] = (areaClasseMap[s.areaId][n] || 0) + 1
  })

  const porArea = porAreaRaw
    .map(r => {
      const area = areas.find(a => a.id === r.areaId)
      return {
        area: area?.nome ?? '—',
        total: r._count.id,
        c1: areaClasseMap[r.areaId]?.[1] ?? 0,
        c2: areaClasseMap[r.areaId]?.[2] ?? 0,
        c3: areaClasseMap[r.areaId]?.[3] ?? 0,
        c4: areaClasseMap[r.areaId]?.[4] ?? 0,
        c5: areaClasseMap[r.areaId]?.[5] ?? 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  // ── 6. Áreas com prazo excedido (ranqueado) ────────────────────
  const violacaoAreaRaw = await prisma.solicitacao.findMany({
    where: {
      prazoMaximoAtingido: true,
      createdAt: { gte: desde },
      classeId: { not: null },
      ...scope,
    },
    select: {
      areaId: true,
      classe: { select: { numero: true } },
      dataDesabilitacao: true,
      dataReabilitacao: true,
      dataEncerramento: true,
    },
  })

  const violacaoAreaMap: Record<string, { count: number; excessoDias: number[]; classes: Record<number, number> }> = {}
  violacaoAreaRaw.forEach(s => {
    const areaId = s.areaId
    if (!violacaoAreaMap[areaId]) violacaoAreaMap[areaId] = { count: 0, excessoDias: [], classes: {} }
    violacaoAreaMap[areaId].count++
    const cn = s.classe?.numero ?? 0
    violacaoAreaMap[areaId].classes[cn] = (violacaoAreaMap[areaId].classes[cn] || 0) + 1

    // Calcular excesso em dias
    if (s.dataDesabilitacao) {
      const fim = s.dataReabilitacao ?? s.dataEncerramento ?? new Date()
      const dias = (new Date(fim).getTime() - new Date(s.dataDesabilitacao).getTime()) / 86400000
      violacaoAreaMap[areaId].excessoDias.push(dias)
    }
  })

  const areasViolacao = Object.entries(violacaoAreaMap)
    .map(([areaId, data]) => {
      const area = areas.find(a => a.id === areaId)
      const mediaExcesso = data.excessoDias.length > 0
        ? data.excessoDias.reduce((a, b) => a + b, 0) / data.excessoDias.length
        : 0
      const classePredominante = Object.entries(data.classes)
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => Number(k))[0] ?? 0
      return {
        area: area?.nome ?? '—',
        count: data.count,
        mediaExcessoDias: Math.round(mediaExcesso * 10) / 10,
        classePredominante,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // ── 7. Tempos médios do ciclo de vida por classe ───────────────
  const cicloData = await prisma.solicitacao.findMany({
    where: {
      status: 'ENCERRADA',
      dataEncerramento: { not: null },
      classeId: { not: null },
      createdAt: { gte: desde },
      ...scope,
    },
    select: {
      dataEnvio: true,
      dataAprovacaoFinal: true,
      dataDesabilitacao: true,
      dataReabilitacao: true,
      dataEncerramento: true,
      classe: { select: { numero: true } },
    },
  })

  // Só contabiliza solicitações com TODAS as 5 datas preenchidas — garante que
  // as médias das fases sejam comparáveis e somem exatamente o ciclo completo
  const cicloByClasse: Record<number, { aprovacao: number[]; espera: number[]; execucao: number[]; validacao: number[]; total: number[]; n: number }> = {}
  cicloData.forEach(s => {
    const cn = s.classe?.numero ?? 0
    if (cn === 0) return
    if (!s.dataEnvio || !s.dataAprovacaoFinal || !s.dataDesabilitacao || !s.dataReabilitacao || !s.dataEncerramento) return
    if (!cicloByClasse[cn]) cicloByClasse[cn] = { aprovacao: [], espera: [], execucao: [], validacao: [], total: [], n: 0 }

    const diffDays = (a: Date, b: Date) => (new Date(b).getTime() - new Date(a).getTime()) / 86400000

    // Fases do ciclo (todas não-negativas; se houver inconsistência de data, zera)
    const tAprov = Math.max(0, diffDays(s.dataEnvio, s.dataAprovacaoFinal))
    const tEspera = Math.max(0, diffDays(s.dataAprovacaoFinal, s.dataDesabilitacao))
    const tExec = Math.max(0, diffDays(s.dataDesabilitacao, s.dataReabilitacao))
    const tValid = Math.max(0, diffDays(s.dataReabilitacao, s.dataEncerramento))
    const tTotal = Math.max(0, diffDays(s.dataEnvio, s.dataEncerramento))

    cicloByClasse[cn].aprovacao.push(tAprov)
    cicloByClasse[cn].espera.push(tEspera)
    cicloByClasse[cn].execucao.push(tExec)
    cicloByClasse[cn].validacao.push(tValid)
    cicloByClasse[cn].total.push(tTotal)
    cicloByClasse[cn].n++
  })

  const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0

  const cicloVida = Object.entries(cicloByClasse)
    .map(([k, v]) => ({
      classe: Number(k),
      aprovacao: avg(v.aprovacao),
      espera: avg(v.espera),
      execucao: avg(v.execucao),
      validacao: avg(v.validacao),
      total: avg(v.total),
      n: v.n,
    }))
    .sort((a, b) => a.classe - b.classe)

  // ── 8. Tendência mensal (segue o período selecionado) ───────────
  // Calcula quantos meses o período abrange
  const now = new Date()
  const mesesPeriodo = Math.max(
    1,
    (now.getFullYear() - desde.getFullYear()) * 12 + (now.getMonth() - desde.getMonth()) + 1
  )

  const tendenciaStart = new Date(desde)
  tendenciaStart.setDate(1)
  tendenciaStart.setHours(0, 0, 0, 0)

  const tendenciaRaw = await prisma.solicitacao.findMany({
    where: { createdAt: { gte: tendenciaStart }, ...scope },
    select: {
      createdAt: true,
      prazoMaximoAtingido: true,
      status: true,
    },
  })

  const tendenciaMap: Record<string, { criadas: number; violacoes: number; encerradas: number }> = {}
  for (let i = 0; i < mesesPeriodo; i++) {
    const d = new Date(tendenciaStart)
    d.setMonth(d.getMonth() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    tendenciaMap[key] = { criadas: 0, violacoes: 0, encerradas: 0 }
  }

  tendenciaRaw.forEach(s => {
    const d = new Date(s.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (tendenciaMap[key]) {
      tendenciaMap[key].criadas++
      if (s.prazoMaximoAtingido) tendenciaMap[key].violacoes++
      if (s.status === 'ENCERRADA') tendenciaMap[key].encerradas++
    }
  })

  const MESES_PT: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  }

  const tendencia = Object.entries(tendenciaMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      mes: `${MESES_PT[key.split('-')[1]] ?? key}/${key.split('-')[0].slice(2)}`,
      ...val,
    }))

  return {
    kpis: {
      desabilitadosAgora,
      emAprovacao,
      execucaoAutorizada,
      aguardandoValidacao,
      prazosExcedidosAgora,
      desabilitacoesPeriodo,
      extensoesPeriodo,
      reabilitadosDentroPrazo,
    },
    topEquipamentos,
    porClasse,
    complianceSla,
    porArea,
    areasViolacao,
    cicloVida,
    tendencia,
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const plantaId = await requirePlantaAtiva()
  const params = await searchParams
  const periodo = params.periodo ?? '6m'
  const data = await getMetricasData(plantaId, periodo)

  return <MetricasClient data={data} periodo={periodo} />
}
