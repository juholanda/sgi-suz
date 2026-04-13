import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cargos = await prisma.cargo.findMany({ orderBy: { nome: 'asc' } })
  return NextResponse.json(cargos)
}
