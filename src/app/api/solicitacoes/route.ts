import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  areaId: z.string().min(1),
  equipamentoTag: z.string().min(1),
  executanteId: z.string().optional(),
  tipo: z.string().optional(),
  classeNumero: z.string().optional(),
  funcaoIntertravamento: z.string().optional(),
  motivoDesabilitacao: z.string().optional(),
  periodoInicio: z.string().optional(),
  periodoFim: z.string().optional(),
  medidasContingenciais: z.string().optional(),
  rascunho: z.boolean().default(true),
})

function gerarProtocolo() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const r = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `SGI-${y}${m}${d}-${r}`
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const solicitacoes = await prisma.solicitacao.findMany({
    include: { equipamento: true, area: true, classe: true, solicitante: { select: { nome: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(solicitacoes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id as string

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const data = parsed.data

  // Busca ou cria equipamento por TAG
  let equipamento = await prisma.equipamento.findUnique({ where: { tag: data.equipamentoTag } })
  if (!equipamento) {
    // Cria equipamento placeholder se não existir
    const area = await prisma.area.findFirst()
    if (!area) return NextResponse.json({ error: 'Nenhuma área cadastrada' }, { status: 400 })
    equipamento = await prisma.equipamento.create({
      data: { tag: data.equipamentoTag, descricao: data.equipamentoTag, areaId: area.id },
    })
  }

  let classeRecord = null
  if (data.classeNumero) {
    classeRecord = await prisma.classe.findFirst({ where: { numero: parseInt(data.classeNumero) } })
  }

  const solicitacao = await prisma.solicitacao.create({
    data: {
      protocolo: gerarProtocolo(),
      status: data.rascunho ? 'RASCUNHO' : 'EM_APROVACAO',
      areaId: data.areaId || equipamento.areaId,
      equipamentoId: equipamento.id,
      classeId: classeRecord?.id,
      tipo: data.tipo as any,
      funcaoIntertravamento: data.funcaoIntertravamento,
      motivoDesabilitacao: data.motivoDesabilitacao,
      periodoInicio: data.periodoInicio ? new Date(data.periodoInicio) : undefined,
      periodoFim: data.periodoFim ? new Date(data.periodoFim) : undefined,
      medidasContingenciais: data.medidasContingenciais,
      solicitanteId: userId,
      dataEnvio: data.rascunho ? undefined : new Date(),
    },
  })

  // Registra evento de auditoria
  await prisma.eventoAuditoria.create({
    data: {
      solicitacaoId: solicitacao.id,
      userId,
      acao: data.rascunho ? 'RASCUNHO_CRIADO' : 'SOLICITACAO_ENVIADA',
    },
  })

  return NextResponse.json(solicitacao)
}
