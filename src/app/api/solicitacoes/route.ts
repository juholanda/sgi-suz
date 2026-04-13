import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const dataSchema = z.object({
  areaId: z.string().min(1),
  equipamentoId: z.string().min(1),
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
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(solicitacoes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string

  const contentType = req.headers.get('content-type') ?? ''

  let parsedData: z.infer<typeof dataSchema>
  let files: { name: string; buffer: Buffer; mimeType: string; size: number }[] = []

  if (contentType.includes('multipart/form-data')) {
    // FormData com possíveis arquivos
    const formData = await req.formData()
    const dataStr = formData.get('data') as string
    const parsed = dataSchema.safeParse(JSON.parse(dataStr))
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
    parsedData = parsed.data

    // Processar arquivos
    const fileEntries = formData.getAll('anexos') as File[]
    for (const file of fileEntries) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        files.push({ name: file.name, buffer, mimeType: file.type, size: file.size })
      }
    }
  } else {
    // JSON simples (compatibilidade)
    const body = await req.json()
    const parsed = dataSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
    parsedData = parsed.data
  }

  const equipamento = await prisma.equipamento.findUnique({ where: { id: parsedData.equipamentoId } })
  if (!equipamento) return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 400 })

  let classeRecord = null
  if (parsedData.classeNumero) {
    classeRecord = await prisma.classe.findFirst({ where: { numero: parseInt(parsedData.classeNumero) } })
  }

  const solicitacao = await prisma.solicitacao.create({
    data: {
      protocolo: gerarProtocolo(),
      status: parsedData.rascunho ? 'RASCUNHO' : 'EM_APROVACAO',
      areaId: parsedData.areaId,
      equipamentoId: equipamento.id,
      classeId: classeRecord?.id,
      executanteId: parsedData.executanteId || null,
      tipo: parsedData.tipo as any,
      funcaoIntertravamento: parsedData.funcaoIntertravamento,
      motivoDesabilitacao: parsedData.motivoDesabilitacao,
      periodoInicio: parsedData.periodoInicio ? new Date(parsedData.periodoInicio) : undefined,
      periodoFim: parsedData.periodoFim ? new Date(parsedData.periodoFim) : undefined,
      medidasContingenciais: parsedData.medidasContingenciais,
      solicitanteId: userId,
      dataEnvio: parsedData.rascunho ? undefined : new Date(),
    },
  })

  // Salvar arquivos — RF-016
  if (files.length > 0) {
    const uploadDir = join(process.cwd(), 'public', 'uploads', solicitacao.id)
    await mkdir(uploadDir, { recursive: true })

    for (const f of files) {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = join(uploadDir, safeName)
      await writeFile(filePath, f.buffer)

      await prisma.anexo.create({
        data: {
          solicitacaoId: solicitacao.id,
          nome: f.name,
          url: `/uploads/${solicitacao.id}/${safeName}`,
          tamanho: f.size,
          mimeType: f.mimeType,
          uploadadoPor: userId,
        },
      })
    }
  }

  // Fila de aprovação sequencial — RF-030
  if (!parsedData.rascunho && classeRecord) {
    const area = await prisma.area.findUnique({ where: { id: parsedData.areaId } })
    if (area) {
      const alcadas = await prisma.alcadaAprovacao.findMany({
        where: { plantaId: area.plantaId, classeId: classeRecord.id },
        orderBy: { nivel: 'asc' },
      })
      for (const alcada of alcadas) {
        await prisma.aprovacao.create({
          data: {
            solicitacaoId: solicitacao.id,
            aprovadorId: alcada.userId,
            nivel: alcada.nivel,
            tipo: 'DESABILITACAO',
            status: alcada.nivel === 1 ? 'PENDENTE' : 'AGUARDANDO',
          },
        })
      }
    }
  }

  await prisma.eventoAuditoria.create({
    data: {
      solicitacaoId: solicitacao.id,
      userId,
      acao: parsedData.rascunho ? 'RASCUNHO_CRIADO' : 'SOLICITACAO_ENVIADA',
    },
  })

  return NextResponse.json(solicitacao)
}
