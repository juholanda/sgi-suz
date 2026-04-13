import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { perfilId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { perfilId } = params

  try {
    await prisma.usuarioPerfil.delete({ where: { id: perfilId } })
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }
    throw e
  }
}
