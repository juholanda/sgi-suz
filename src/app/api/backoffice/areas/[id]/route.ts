import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { nome, codigo, plantaId, ativa } = body

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!plantaId) return NextResponse.json({ error: 'Planta é obrigatória' }, { status: 400 })

  const area = await prisma.area.update({
    where: { id: params.id },
    data: {
      nome: nome.trim(),
      codigo: codigo?.trim() || null,
      plantaId,
      ...(typeof ativa === 'boolean' ? { ativa } : {}),
    },
    include: { planta: { select: { nome: true } } },
  })
  return NextResponse.json(area)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const area = await prisma.area.update({
    where: { id: params.id },
    data: { ativa: false },
  })
  return NextResponse.json(area)
}
