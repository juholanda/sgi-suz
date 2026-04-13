import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const alcadas = await prisma.alcadaAprovacao.findMany({
    include: {
      planta: true,
      classe: true,
      user: { select: { id: true, nome: true, matricula: true } },
    },
    orderBy: [{ plantaId: 'asc' }, { classeId: 'asc' }, { nivel: 'asc' }],
  })
  return NextResponse.json(alcadas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { plantaId, classeId, nivel, userId } = body

  if (!plantaId) return NextResponse.json({ error: 'Planta é obrigatória' }, { status: 400 })
  if (!classeId) return NextResponse.json({ error: 'Classe é obrigatória' }, { status: 400 })
  if (!nivel || isNaN(Number(nivel))) return NextResponse.json({ error: 'Nível é obrigatório' }, { status: 400 })
  if (!userId) return NextResponse.json({ error: 'Usuário é obrigatório' }, { status: 400 })

  try {
    const alcada = await prisma.alcadaAprovacao.create({
      data: { plantaId, classeId, nivel: Number(nivel), userId },
      include: {
        planta: true,
        classe: true,
        user: { select: { id: true, nome: true, matricula: true } },
      },
    })
    return NextResponse.json(alcada, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Alçada já existe para essa combinação Planta/Classe/Nível/Usuário' }, { status: 409 })
    }
    throw e
  }
}
