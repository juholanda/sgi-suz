import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const terminalStatuses = ['ENCERRADA', 'REJEITADA', 'CANCELADA'] as const
const tiposIntertravamento = ['LOGICO', 'FISICO', 'DISPOSITIVO_SEGURANCA'] as const

const createSchema = z.object({
  areaId: z.string().optional(),
  equipamentoTag: z.string().trim().min(1),
  executanteId: z.string().optional(),
  tipo: z.enum(tiposIntertravamento).optional(),
  classeNumero: z.coerce.number().int().min(1).max(4).optional(),
  funcaoIntertravamento: z.string().trim().max(300).optional(),
  motivoDesabilitacao: z.string().trim().max(2000).optional(),
  periodoInicio: z.string().optional(),
  periodoFim: z.string().optional(),
  medidasContingenciais: z.string().trim().max(1000).optional(),
  cienteRiscos: z.boolean().optional(),
  rascunho: z.boolean().default(true),
})

function parseDateOrNull(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function startOfYear(year: number) {
  return new Date(year, 0, 1, 0, 0, 0, 0)
}

function endOfYear(year: number) {
  return new Date(year + 1, 0, 1, 0, 0, 0, 0)
}

function formatValidationErrors(error: z.ZodError) {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ')
}

async function gerarProtocolo(plantaId: string) {
  const year = new Date().getFullYear()
  const sequence = (await prisma.solicitacao.count({
    where: {
      createdAt: { gte: startOfYear(year), lt: endOfYear(year) },
      area: { plantaId },
    },
  })) + 1

  const width = Math.max(4, String(sequence).length)
  return `${year}-${String(sequence).padStart(width, '0')}`
}

function durationInDays(inicio: Date, fim: Date) {
  return (fim.getTime() - inicio.getTime()) / 86_400_000
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const query = req.nextUrl.searchParams
  const page = Math.max(Number(query.get('page') ?? 1), 1)
  const pageSize = Math.min(Math.max(Number(query.get('pageSize') ?? 20), 1), 100)
  const skip = (page - 1) * pageSize

  const statusList = (query.get('status') ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const classList = (query.get('classe') ?? '')
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n) && n > 0)

  const exportFormat = (query.get('exportFormat') ?? '').toLowerCase()

  const sortBy = query.get('sortBy') ?? 'updatedAt'
  const sortOrder = query.get('sortOrder') === 'asc' ? 'asc' : 'desc'

  const where: Prisma.SolicitacaoWhereInput = {
    ...(query.get('areaId') ? { areaId: query.get('areaId')! } : {}),
    ...(query.get('solicitanteId') ? { solicitanteId: query.get('solicitanteId')! } : {}),
    ...(query.get('executanteId') ? { executanteId: query.get('executanteId')! } : {}),
    ...(statusList.length > 0 ? { status: { in: statusList } } : {}),
    ...(classList.length > 0 ? { classe: { numero: { in: classList } } } : {}),
    ...(query.get('periodoSolicitacaoInicio') || query.get('periodoSolicitacaoFim')
      ? {
          createdAt: {
            ...(query.get('periodoSolicitacaoInicio')
              ? { gte: new Date(query.get('periodoSolicitacaoInicio')!) }
              : {}),
            ...(query.get('periodoSolicitacaoFim')
              ? { lte: new Date(query.get('periodoSolicitacaoFim')!) }
              : {}),
          },
        }
      : {}),
    ...(query.get('periodoAprovacaoInicio') || query.get('periodoAprovacaoFim')
      ? {
          dataAprovacaoFinal: {
            ...(query.get('periodoAprovacaoInicio')
              ? { gte: new Date(query.get('periodoAprovacaoInicio')!) }
              : {}),
            ...(query.get('periodoAprovacaoFim')
              ? { lte: new Date(query.get('periodoAprovacaoFim')!) }
              : {}),
          },
        }
      : {}),
  }

  const orderBy: Prisma.SolicitacaoOrderByWithRelationInput =
    sortBy === 'dataAprovacaoFinal'
      ? { dataAprovacaoFinal: sortOrder }
      : sortBy === 'dataEnvio'
      ? { dataEnvio: sortOrder }
      : sortBy === 'createdAt'
      ? { createdAt: sortOrder }
      : { updatedAt: sortOrder }

  const [items, total] = await Promise.all([
    prisma.solicitacao.findMany({
      where,
      include: {
        equipamento: true,
        area: { include: { planta: true } },
        classe: true,
        solicitante: { select: { id: true, nome: true } },
        executante: { select: { id: true, nome: true } },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.solicitacao.count({ where }),
  ])

  if (exportFormat === 'csv') {
    const header = [
      'protocolo',
      'status',
      'solicitante',
      'executante',
      'tipo',
      'tag',
      'classe',
      'planta',
      'area',
      'dataSolicitacao',
      'dataAprovacaoFinal',
    ]
    const rows = items.map(item => [
      item.protocolo,
      item.status,
      item.solicitante.nome,
      item.executante?.nome ?? '',
      item.tipo ?? '',
      item.equipamento.tag,
      item.classe?.numero ?? '',
      item.area.planta.nome,
      item.area.nome,
      item.createdAt.toISOString(),
      item.dataAprovacaoFinal?.toISOString() ?? '',
    ])
    const toCsv = (value: string | number) => {
      const str = String(value)
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    const csv = [header, ...rows]
      .map(line => line.map(value => toCsv(value as string | number)).join(','))
      .join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="solicitacoes.csv"',
      },
    })
  }

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id as string

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: formatValidationErrors(parsed.error) }, { status: 400 })
  }

  const data = parsed.data
  const periodoInicio = parseDateOrNull(data.periodoInicio)
  const periodoFim = parseDateOrNull(data.periodoFim)

  const equipamento = await prisma.equipamento.findUnique({
    where: { tag: data.equipamentoTag },
    include: { area: { include: { planta: true } } },
  })

  if (!equipamento) {
    return NextResponse.json({ error: 'TAG de intertravamento não encontrada.' }, { status: 400 })
  }

  const areaSelecionada = data.areaId
    ? await prisma.area.findUnique({ where: { id: data.areaId }, include: { planta: true } })
    : null
  const areaEfetiva = areaSelecionada ?? equipamento.area

  if (!areaEfetiva.ativa) {
    return NextResponse.json({ error: 'Área inativa. Não é possível criar nova solicitação.' }, { status: 400 })
  }

  if (!areaEfetiva.planta.ativa) {
    return NextResponse.json({ error: 'Planta inativa. Não é possível criar nova solicitação.' }, { status: 400 })
  }

  if (!equipamento.ativo) {
    return NextResponse.json({ error: 'Equipamento inativo. Não é possível abrir solicitação.' }, { status: 400 })
  }

  if (data.areaId && equipamento.areaId !== data.areaId) {
    return NextResponse.json(
      { error: 'A TAG selecionada não pertence à área informada.' },
      { status: 400 },
    )
  }

  const classe = data.classeNumero
    ? await prisma.classe.findUnique({ where: { numero: data.classeNumero } })
    : null

  if (!data.rascunho) {
    if (!data.areaId) {
      return NextResponse.json({ error: 'Área é obrigatória para enviar solicitação.' }, { status: 400 })
    }

    if (!data.executanteId) {
      return NextResponse.json({ error: 'Executante é obrigatório para envio.' }, { status: 400 })
    }

    if (!data.tipo || !data.classeNumero || !classe) {
      return NextResponse.json({ error: 'Tipo e Classe são obrigatórios para envio.' }, { status: 400 })
    }

    if (!data.funcaoIntertravamento || !data.motivoDesabilitacao || !data.medidasContingenciais) {
      return NextResponse.json(
        { error: 'Função, motivo e medidas contingenciais são obrigatórios para envio.' },
        { status: 400 },
      )
    }

    if (!periodoInicio || !periodoFim || periodoFim <= periodoInicio) {
      return NextResponse.json(
        { error: 'Período previsto inválido. Informe início e fim coerentes.' },
        { status: 400 },
      )
    }

    if (!data.cienteRiscos) {
      return NextResponse.json(
        { error: 'Declaração de ciência dos riscos é obrigatória para envio.' },
        { status: 400 },
      )
    }

    if (classe?.prazoMaximoDias != null) {
      const duracaoDias = durationInDays(periodoInicio, periodoFim)
      if (duracaoDias > classe.prazoMaximoDias) {
        return NextResponse.json(
          { error: `Período previsto excede SLA da Classe ${classe.numero}.` },
          { status: 400 },
        )
      }
    }

    const executante = await prisma.user.findUnique({
      where: { id: data.executanteId },
      include: { perfis: true },
    })

    if (!executante?.ativo) {
      return NextResponse.json({ error: 'Executante inválido ou inativo.' }, { status: 400 })
    }

    const podeExecutar = executante.perfis.some(p => p.perfil === 'EXECUTANTE')
    if (!podeExecutar) {
      return NextResponse.json(
        { error: 'Usuário selecionado não possui perfil de executante.' },
        { status: 400 },
      )
    }

    const conflito = await prisma.solicitacao.findFirst({
      where: {
        equipamentoId: equipamento.id,
        status: { notIn: terminalStatuses as unknown as string[] },
        periodoInicio: { lt: periodoFim },
        periodoFim: { gt: periodoInicio },
      },
      select: { id: true, protocolo: true, status: true },
    })

    if (conflito) {
      return NextResponse.json(
        {
          error: `Já existe solicitação ativa (${conflito.protocolo}) para o mesmo equipamento no período informado.`,
        },
        { status: 409 },
      )
    }
  }

  if (!data.rascunho && !classe) {
    return NextResponse.json({ error: 'Classe inválida para envio.' }, { status: 400 })
  }

  const protocolo = await gerarProtocolo(areaEfetiva.plantaId)

  const alcadas = !data.rascunho
    ? await prisma.alcadaAprovacao.findMany({
        where: { plantaId: areaEfetiva.plantaId, classeId: classe!.id },
        include: { user: { select: { ativo: true } } },
        orderBy: [{ nivel: 'asc' }, { userId: 'asc' }],
      })
    : []

  if (!data.rascunho && alcadas.length === 0) {
    return NextResponse.json(
      { error: 'Não há alçada configurada para Planta + Classe selecionadas.' },
      { status: 400 },
    )
  }

  const solicitacao = await prisma.$transaction(async tx => {
    const created = await tx.solicitacao.create({
      data: {
        protocolo,
        status: data.rascunho ? 'RASCUNHO' : 'EM_APROVACAO',
        areaId: areaEfetiva.id,
        equipamentoId: equipamento.id,
        executanteId: data.executanteId ?? null,
        classeId: classe?.id,
        tipo: data.tipo,
        funcaoIntertravamento: data.funcaoIntertravamento,
        motivoDesabilitacao: data.motivoDesabilitacao,
        periodoInicio: periodoInicio ?? undefined,
        periodoFim: periodoFim ?? undefined,
        duracaoPrevistaDias:
          periodoInicio && periodoFim ? durationInDays(periodoInicio, periodoFim) : undefined,
        medidasContingenciais: data.medidasContingenciais,
        solicitanteId: userId,
        dataEnvio: data.rascunho ? undefined : new Date(),
      },
    })

    if (!data.rascunho) {
      const aprovadoresAtivos = alcadas.filter(a => a.user.ativo)
      if (aprovadoresAtivos.length === 0) {
        throw new Error('Nenhum aprovador ativo encontrado na alçada configurada.')
      }

      await tx.aprovacao.createMany({
        data: aprovadoresAtivos.map(a => ({
          solicitacaoId: created.id,
          aprovadorId: a.userId,
          nivel: a.nivel,
          tipo: 'DESABILITACAO',
          status: 'PENDENTE',
        })),
      })
    }

    await tx.eventoAuditoria.create({
      data: {
        solicitacaoId: created.id,
        userId,
        acao: data.rascunho ? 'RASCUNHO_CRIADO' : 'SOLICITACAO_ENVIADA',
      },
    })

    return created
  })

  return NextResponse.json(solicitacao)
}
