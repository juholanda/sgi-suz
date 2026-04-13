import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const PERFIS_VALIDOS = ['SOLICITANTE', 'EXECUTANTE', 'APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { userId, perfil, plantaId, areaId } = body

  if (!userId) return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
  if (!perfil || !PERFIS_VALIDOS.includes(perfil)) {
    return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
  }

  try {
    const usuarioPerfil = await prisma.usuarioPerfil.create({
      data: {
        userId,
        perfil,
        plantaId: plantaId || null,
        areaId: areaId || null,
      },
      include: { planta: true, area: true },
    })
    return NextResponse.json(usuarioPerfil, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Esta associação já existe' }, { status: 409 })
    }
    throw e
  }
}
