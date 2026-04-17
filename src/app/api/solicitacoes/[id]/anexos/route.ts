import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const anexos = await prisma.anexo.findMany({
    where: { solicitacaoId: id },
    select: {
      id: true,
      nome: true,
      url: true,
      tamanho: true,
      mimeType: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Ajustar URL para a rota de download
  const result = anexos.map(a => ({
    ...a,
    url: `/api/anexos/${a.id}`,
  }))

  return NextResponse.json(result)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = session.user.id as string

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const fileEntries = formData.getAll('anexos') as File[]
    const created = []

    for (const file of fileEntries) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const anexo = await prisma.anexo.create({
          data: {
            solicitacaoId: id,
            nome: file.name,
            url: '',
            tamanho: file.size,
            mimeType: file.type,
            dados: buffer,
            uploadadoPor: userId,
          },
        })
        await prisma.anexo.update({
          where: { id: anexo.id },
          data: { url: `/api/anexos/${anexo.id}` },
        })
        created.push({ ...anexo, url: `/api/anexos/${anexo.id}` })
      }
    }
    return NextResponse.json(created)
  }

  // JSON fallback (base64)
  const body = await req.json()
  const { nome, tipo, base64 } = body as { nome: string; tipo: string; base64: string }

  if (!nome || !tipo || !base64) {
    return NextResponse.json({ error: 'Campos obrigatórios: nome, tipo, base64' }, { status: 400 })
  }

  const buffer = Buffer.from(base64, 'base64')
  const tamanho = buffer.length

  const solicitacao = await prisma.solicitacao.findUnique({ where: { id } })
  if (!solicitacao) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

  const anexo = await prisma.anexo.create({
    data: {
      solicitacaoId: id,
      nome,
      url: '',
      tamanho,
      mimeType: tipo,
      dados: buffer,
      uploadadoPor: userId,
    },
  })
  await prisma.anexo.update({
    where: { id: anexo.id },
    data: { url: `/api/anexos/${anexo.id}` },
  })

  return NextResponse.json({ ...anexo, url: `/api/anexos/${anexo.id}` })
}
