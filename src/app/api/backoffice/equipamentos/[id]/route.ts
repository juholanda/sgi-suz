import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tag, descricao, areaId, ativo } = body

  if (!tag?.trim()) return NextResponse.json({ error: 'TAG é obrigatória' }, { status: 400 })
  if (!descricao?.trim()) return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
  if (!areaId) return NextResponse.json({ error: 'Área é obrigatória' }, { status: 400 })

  try {
    const equipamento = await prisma.equipamento.update({
      where: { id: params.id },
      data: {
        tag: tag.trim(),
        descricao: descricao.trim(),
        areaId,
        ...(typeof ativo === 'boolean' ? { ativo } : {}),
      },
      include: { area: { include: { planta: true } } },
    })
    return NextResponse.json(equipamento)
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'TAG já cadastrada' }, { status: 409 })
    }
    throw e
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const equipamento = await prisma.equipamento.update({
    where: { id: params.id },
    data: { ativo: false },
  })
  return NextResponse.json(equipamento)
}
