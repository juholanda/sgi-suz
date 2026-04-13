import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const plantaId = searchParams.get('plantaId')

  const areas = await prisma.area.findMany({
    where: {
      ativa: true,
      ...(plantaId ? { plantaId } : {}),
    },
    include: { planta: { select: { id: true, nome: true } } },
    orderBy: [{ planta: { nome: 'asc' } }, { nome: 'asc' }],
  })

  return NextResponse.json(areas)
}
