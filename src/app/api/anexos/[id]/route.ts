import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const anexo = await prisma.anexo.findUnique({
    where: { id },
    select: { nome: true, mimeType: true, dados: true, tamanho: true },
  })

  if (!anexo || !anexo.dados) {
    return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 })
  }

  return new NextResponse(anexo.dados, {
    headers: {
      'Content-Type': anexo.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(anexo.nome)}"`,
      'Content-Length': String(anexo.tamanho),
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
