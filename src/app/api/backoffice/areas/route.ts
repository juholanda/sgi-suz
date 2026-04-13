import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const areas = await prisma.area.findMany({
    include: { planta: { select: { nome: true } } },
    orderBy: [{ planta: { nome: 'asc' } }, { nome: 'asc' }],
  })
  return NextResponse.json(areas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { nome, codigo, plantaId } = body

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!plantaId) return NextResponse.json({ error: 'Planta é obrigatória' }, { status: 400 })

  const area = await prisma.area.create({
    data: { nome: nome.trim(), codigo: codigo?.trim() || null, plantaId },
    include: { planta: { select: { nome: true } } },
  })
  return NextResponse.json(area, { status: 201 })
}
