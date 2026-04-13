import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plantas = await prisma.planta.findMany({
    include: { _count: { select: { areas: true } } },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(plantas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { nome, codigo } = body

  if (!nome?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  const planta = await prisma.planta.create({
    data: { nome: nome.trim(), codigo: codigo?.trim() || null },
    include: { _count: { select: { areas: true } } },
  })
  return NextResponse.json(planta, { status: 201 })
}
