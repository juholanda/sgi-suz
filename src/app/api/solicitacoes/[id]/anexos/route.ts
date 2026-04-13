import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

type Params = { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  const anexos = await prisma.anexo.findMany({
    where: { solicitacaoId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(anexos)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const userId = session.user.id as string

  const body = await req.json()
  const { nome, tipo, base64 } = body as { nome: string; tipo: string; base64: string }

  if (!nome || !tipo || !base64) {
    return NextResponse.json({ error: 'Campos obrigatórios: nome, tipo, base64' }, { status: 400 })
  }

  // Valida mime type aceito
  const mimeAccepted = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!mimeAccepted.includes(tipo)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  }

  // Calcula tamanho aproximado do base64
  const tamanho = Math.round((base64.length * 3) / 4)

  // Salva localmente como referência (sem storage externo configurado)
  const url = `local:/${nome}`

  const solicitacao = await prisma.solicitacao.findUnique({ where: { id } })
  if (!solicitacao) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

  const anexo = await prisma.anexo.create({
    data: {
      solicitacaoId: id,
      nome,
      url,
      tamanho,
      mimeType: tipo,
      uploadadoPor: userId,
    },
  })

  return NextResponse.json(anexo)
}
