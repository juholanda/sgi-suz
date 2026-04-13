import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const delegacoes = await prisma.delegacao.findMany({
    include: {
      delegadoPor:  { select: { id: true, nome: true, matricula: true } },
      delegadoPara: { select: { id: true, nome: true, matricula: true } },
    },
    orderBy: { dataInicio: 'desc' },
  })
  return NextResponse.json(delegacoes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { delegadoPorId, delegadoParaId, dataInicio, dataFim } = body

  if (!delegadoPorId) return NextResponse.json({ error: 'Delegado Por é obrigatório' }, { status: 400 })
  if (!delegadoParaId) return NextResponse.json({ error: 'Delegado Para é obrigatório' }, { status: 400 })
  if (!dataInicio) return NextResponse.json({ error: 'Data de início é obrigatória' }, { status: 400 })
  if (!dataFim) return NextResponse.json({ error: 'Data de fim é obrigatória' }, { status: 400 })

  const delegacao = await prisma.delegacao.create({
    data: {
      delegadoPorId,
      delegadoParaId,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
    },
    include: {
      delegadoPor:  { select: { id: true, nome: true, matricula: true } },
      delegadoPara: { select: { id: true, nome: true, matricula: true } },
    },
  })
  return NextResponse.json(delegacao, { status: 201 })
}
