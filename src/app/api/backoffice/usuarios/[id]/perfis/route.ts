import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { perfil, plantaId, areaId } = await req.json()
  if (!perfil) return NextResponse.json({ error: 'Perfil é obrigatório' }, { status: 400 })

  try {
    const p = await prisma.usuarioPerfil.create({
      data: {
        userId: params.id,
        perfil,
        plantaId: plantaId || null,
        areaId: areaId || null,
      },
      include: { planta: true, area: true },
    })
    return NextResponse.json(p, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este perfil já está cadastrado para esta planta/área' },
        { status: 409 }
      )
    }
    throw e
  }
}

export async function DELETE(
  req: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { perfilId } = await req.json()
  if (!perfilId) return NextResponse.json({ error: 'ID do perfil é obrigatório' }, { status: 400 })

  await prisma.usuarioPerfil.delete({ where: { id: perfilId } })
  return NextResponse.json({ ok: true })
}
