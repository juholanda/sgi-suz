import { NextResponse } from 'next/server'
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
