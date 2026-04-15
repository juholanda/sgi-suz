import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const medidas = await prisma.medidaContingencial.findMany({
    where: { ativa: true },
    orderBy: { ordem: 'asc' },
  })

  return NextResponse.json(medidas)
}
