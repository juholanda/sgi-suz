import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

type Params = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tipo, motivo, comentario } = body
  const { id } = params
  const userId = session.user.id as string

  const solicitacao = await prisma.solicitacao.findUnique({ where: { id } })
  if (!solicitacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const transicoes: Record<string, { status: string; campo?: object; acao: string }> = {
    INICIAR_EXECUCAO:       { status: 'EM_EXECUCAO',                       acao: 'EXECUCAO_INICIADA' },
    CONFIRMAR_DESABILITACAO:{ status: 'DESABILITADO', campo: { dataDesabilitacao: new Date() }, acao: 'DESABILITACAO_CONFIRMADA' },
    INICIAR_REABILITACAO:   { status: 'EM_REABILITACAO',                   acao: 'REABILITACAO_INICIADA' },
    CONCLUIR_REABILITACAO:  { status: 'EM_VALIDACAO_DA_REABILITACAO', campo: { dataReabilitacao: new Date() }, acao: 'REABILITACAO_INICIADA' },
    VALIDAR_REABILITACAO:   { status: 'ENCERRADA', campo: { dataEncerramento: new Date() }, acao: 'REABILITACAO_VALIDADA' },
    CANCELAR:               { status: 'CANCELADA',                         acao: 'CANCELADA' },
  }

  if (tipo === 'APROVAR') {
    // Registra aprovação e avança fila ou muda status para EXECUCAO_AUTORIZADA
    await prisma.aprovacao.create({
      data: {
        solicitacaoId: id,
        aprovadorId: userId,
        nivel: 1,
        tipo: 'DESABILITACAO',
        status: 'APROVADO',
        comentario,
        respondidaEm: new Date(),
      },
    })
    // Simplificado: se único aprovador, muda para EXECUCAO_AUTORIZADA
    await prisma.solicitacao.update({ where: { id }, data: { status: 'EXECUCAO_AUTORIZADA', dataAprovacaoFinal: new Date() } })
    await registrarEvento(id, userId, 'APROVACAO_REGISTRADA', comentario)
    return NextResponse.json({ ok: true })
  }

  if (tipo === 'REJEITAR') {
    await prisma.aprovacao.create({
      data: {
        solicitacaoId: id,
        aprovadorId: userId,
        nivel: 1,
        tipo: 'DESABILITACAO',
        status: 'REJEITADO',
        motivoRejeicao: motivo,
        respondidaEm: new Date(),
      },
    })
    await prisma.solicitacao.update({ where: { id }, data: { status: 'REJEITADA' } })
    await registrarEvento(id, userId, 'REJEICAO_REGISTRADA', motivo)
    return NextResponse.json({ ok: true })
  }

  const t = transicoes[tipo]
  if (!t) return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })

  await prisma.solicitacao.update({ where: { id }, data: { status: t.status as any, ...(t.campo ?? {}) } })
  await registrarEvento(id, userId, t.acao, motivo)

  return NextResponse.json({ ok: true })
}

async function registrarEvento(solicitacaoId: string, userId: string, acao: string, detalhes?: string) {
  await prisma.eventoAuditoria.create({
    data: { solicitacaoId, userId, acao, detalhes },
  })
}
