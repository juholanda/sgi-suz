import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { delegadoPorId, delegadoParaId, dataInicio, dataFim, ativa } = body

  const delegacao = await prisma.delegacao.update({
    where: { id: params.id },
    data: {
      ...(delegadoPorId ? { delegadoPorId } : {}),
      ...(delegadoParaId ? { delegadoParaId } : {}),
      ...(dataInicio ? { dataInicio: new Date(dataInicio) } : {}),
      ...(dataFim ? { dataFim: new Date(dataFim) } : {}),
      ...(typeof ativa === 'boolean' ? { ativa } : {}),
    },
    include: {
      delegadoPor:  { select: { id: true, nome: true, matricula: true } },
      delegadoPara: { select: { id: true, nome: true, matricula: true } },
    },
  })
  return NextResponse.json(delegacao)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.delegacao.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
