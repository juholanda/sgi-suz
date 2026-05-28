import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const updateSchema = z.object({
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

type Params = { params: { id: string } }

// ── GET — Fetch single solicitação (for edit mode) ──────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const solicitacao = await prisma.solicitacao.findUnique({
    where: { id },
    include: {
      equipamento: { include: { area: true } },
      area: { include: { planta: true } },
      classe: true,
      anexos: true,
    },
  })
  if (!solicitacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(solicitacao)
}

// ── PUT — Update draft solicitação ──────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string
  const { id } = params

  const solicitacao = await prisma.solicitacao.findUnique({ where: { id } })
  if (!solicitacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only creator can edit, and only RASCUNHO
  if (solicitacao.solicitanteId !== userId) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  if (solicitacao.status !== 'RASCUNHO') {
    return NextResponse.json({ error: 'Apenas rascunhos podem ser editados' }, { status: 400 })
  }

  const contentType = req.headers.get('content-type') ?? ''
  let parsedData: z.infer<typeof updateSchema>
  let files: { name: string; buffer: Buffer; mimeType: string; size: number }[] = []

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const dataStr = formData.get('data') as string
    const parsed = updateSchema.safeParse(JSON.parse(dataStr))
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
    parsedData = parsed.data

    const fileEntries = formData.getAll('anexos') as File[]
    for (const file of fileEntries) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        files.push({ name: file.name, buffer, mimeType: file.type, size: file.size })
      }
    }
  } else {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
    parsedData = parsed.data
  }

  const equipamento = await prisma.equipamento.findUnique({ where: { id: parsedData.equipamentoId } })
  if (!equipamento || !equipamento.ativo) return NextResponse.json({ error: 'Equipamento não encontrado ou inativo' }, { status: 400 })

  let classeRecord = null
  if (parsedData.classeNumero) {
    classeRecord = await prisma.classe.findFirst({ where: { numero: parseInt(parsedData.classeNumero) } })
  }

  const newStatus = parsedData.rascunho ? 'RASCUNHO' : 'EM_APROVACAO'

  const updated = await prisma.solicitacao.update({
    where: { id },
    data: {
      status: newStatus,
      areaId: parsedData.areaId,
      equipamentoId: equipamento.id,
      classeId: classeRecord?.id ?? null,
      executanteId: parsedData.executanteId || null,
      tipo: parsedData.tipo as any,
      funcaoIntertravamento: parsedData.funcaoIntertravamento,
      motivoDesabilitacao: parsedData.motivoDesabilitacao,
      periodoInicio: parsedData.periodoInicio ? new Date(parsedData.periodoInicio) : undefined,
      periodoFim: parsedData.periodoFim ? new Date(parsedData.periodoFim) : undefined,
      medidasContingenciais: parsedData.medidasContingenciais,
      dataEnvio: !parsedData.rascunho ? new Date() : undefined,
    },
  })

  // Save new files
  if (files.length > 0) {
    const uploadDir = join(process.cwd(), 'public', 'uploads', id)
    await mkdir(uploadDir, { recursive: true })

    for (const f of files) {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = join(uploadDir, safeName)
      await writeFile(filePath, f.buffer)

      await prisma.anexo.create({
        data: {
          solicitacaoId: id,
          nome: f.name,
          url: `/uploads/${id}/${safeName}`,
          tamanho: f.size,
          mimeType: f.mimeType,
          uploadadoPor: userId,
        },
      })
    }
  }

  // Create approval chain if submitting (not draft)
  if (!parsedData.rascunho && classeRecord) {
    // Remove any old approvals first
    await prisma.aprovacao.deleteMany({ where: { solicitacaoId: id } })

    const area = await prisma.area.findUnique({ where: { id: parsedData.areaId } })
    if (area) {
      const alcadas = await prisma.alcadaAprovacao.findMany({
        where: { plantaId: area.plantaId, classeId: classeRecord.id },
        orderBy: { nivel: 'asc' },
      })
      for (const alcada of alcadas) {
        await prisma.aprovacao.create({
          data: {
            solicitacaoId: id,
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
      solicitacaoId: id,
      userId,
      acao: parsedData.rascunho ? 'RASCUNHO_EDITADO' : 'SOLICITACAO_ENVIADA',
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id as string
  const { id } = params

  const solicitacao = await prisma.solicitacao.findUnique({ where: { id } })
  if (!solicitacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only creator can delete, and only RASCUNHO
  if (solicitacao.solicitanteId !== userId) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  if (solicitacao.status !== 'RASCUNHO') {
    return NextResponse.json({ error: 'Apenas rascunhos podem ser excluídos' }, { status: 400 })
  }

  // Delete related records first
  await prisma.checklistItem.deleteMany({ where: { solicitacaoId: id } })
  await prisma.anexo.deleteMany({ where: { solicitacaoId: id } })
  await prisma.eventoAuditoria.deleteMany({ where: { solicitacaoId: id } })
  await prisma.solicitacao.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
