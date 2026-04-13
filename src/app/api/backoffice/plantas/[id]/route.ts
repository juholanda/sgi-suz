import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { nome, codigo, ativa } = body

  if (!nome?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  const planta = await prisma.planta.update({
    where: { id: params.id },
    data: {
      nome: nome.trim(),
      codigo: codigo?.trim() || null,
      ...(typeof ativa === 'boolean' ? { ativa } : {}),
    },
    include: { _count: { select: { areas: true } } },
  })
  return NextResponse.json(planta)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planta = await prisma.planta.update({
    where: { id: params.id },
    data: { ativa: false },
  })
  return NextResponse.json(planta)
}
