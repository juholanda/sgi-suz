import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const perfil = req.nextUrl.searchParams.get('perfil') ?? ''

  if (q.length < 1) return NextResponse.json([])

  const usuarios = await prisma.user.findMany({
    where: {
      ativo: true,
      OR: [
        { nome: { contains: q } },
        { matricula: { contains: q } },
      ],
      ...(perfil
        ? { perfis: { some: { perfil: perfil } } }
        : {}),
    },
    select: {
      id: true,
      nome: true,
      matricula: true,
      email: true,
    },
    take: 8,
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(usuarios)
}
