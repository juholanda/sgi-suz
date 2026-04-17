import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const equipamentos = await prisma.equipamento.findMany({
    include: { area: { include: { planta: true } } },
    orderBy: { tag: 'asc' },
  })
  return NextResponse.json(equipamentos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tag, descricao, funcaoProtegida, areaId } = body

  if (!tag?.trim()) return NextResponse.json({ error: 'TAG é obrigatória' }, { status: 400 })
  if (!descricao?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!areaId) return NextResponse.json({ error: 'Área é obrigatória' }, { status: 400 })

  try {
    const equipamento = await prisma.equipamento.create({
      data: {
        tag: tag.trim(),
        descricao: descricao.trim(),
        funcaoProtegida: funcaoProtegida?.trim() || null,
        areaId,
      },
      include: { area: { include: { planta: true } } },
    })
    return NextResponse.json(equipamento, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'TAG já cadastrada' }, { status: 409 })
    }
    throw e
  }
}
