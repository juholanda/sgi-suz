import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/users?perfil=EXECUTANTE&plantaId=xxx
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const perfil = searchParams.get('perfil')
  const plantaId = searchParams.get('plantaId')

  const users = await prisma.user.findMany({
    where: {
      ativo: true,
      perfis: {
        some: {
          ...(perfil ? { perfil } : {}),
          ...(plantaId ? { plantaId } : {}),
        },
      },
    },
    select: {
      id: true,
      nome: true,
      matricula: true,
      email: true,
      cargo: { select: { nome: true } },
      perfis: { select: { perfil: true, plantaId: true, areaId: true } },
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(users)
}
