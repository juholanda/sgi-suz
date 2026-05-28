import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const plantaIdParam = searchParams.get('plantaId')

  // Use explicit query param if provided; otherwise fall back to active planta cookie
  const cookieStore = await cookies()
  const plantaId = plantaIdParam ?? cookieStore.get('sgi_planta_ativa')?.value ?? null

  const areas = await prisma.area.findMany({
    where: {
      ativa: true,
      planta: { ativa: true },
      ...(plantaId ? { plantaId } : {}),
    },
    include: { planta: { select: { id: true, nome: true } } },
    orderBy: [{ planta: { nome: 'asc' } }, { nome: 'asc' }],
  })

  return NextResponse.json(areas)
}
