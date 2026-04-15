import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

type Params = { params: { id: string } }

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id as string
  const { id } = params

  const solicitacao = await prisma.solicitacao.findUnique({ where: { id } })
  if (!solicitacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only creator can delete, and only RASCUNHO
  if (solicitacao.solicitanteId !== userId) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  if (solicitacao.status !== 'RASCUNHO') {
    return NextResponse.json({ error: 'Apenas rascunhos podem ser excluídos' }, { status: 400 })
  }

  // Delete related records first
  await prisma.checklistItem.deleteMany({ where: { solicitacaoId: id } })
  await prisma.anexo.deleteMany({ where: { solicitacaoId: id } })
  await prisma.eventoAuditoria.deleteMany({ where: { solicitacaoId: id } })
  await prisma.solicitacao.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
