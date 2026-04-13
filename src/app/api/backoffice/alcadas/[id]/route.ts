import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { plantaId, classeId, nivel, userId } = body

  if (!plantaId) return NextResponse.json({ error: 'Planta é obrigatória' }, { status: 400 })
  if (!classeId) return NextResponse.json({ error: 'Classe é obrigatória' }, { status: 400 })
  if (!nivel || isNaN(Number(nivel))) return NextResponse.json({ error: 'Nível é obrigatório' }, { status: 400 })
  if (!userId) return NextResponse.json({ error: 'Usuário é obrigatório' }, { status: 400 })

  try {
    const alcada = await prisma.alcadaAprovacao.update({
      where: { id: params.id },
      data: { plantaId, classeId, nivel: Number(nivel), userId },
      include: {
        planta: true,
        classe: true,
        user: { select: { id: true, nome: true, matricula: true } },
      },
    })
    return NextResponse.json(alcada)
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Alçada já existe para essa combinação Planta/Classe/Nível/Usuário' }, { status: 409 })
    }
    throw e
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.alcadaAprovacao.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
