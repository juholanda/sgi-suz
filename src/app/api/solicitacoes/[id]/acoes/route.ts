import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

type Params = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tipo, motivo, comentario, checklistItems, executanteReabilitacaoId } = body
  const { id } = params
  const userId = session.user.id as string

  const solicitacao = await prisma.solicitacao.findUnique({
    where: { id },
    include: {
      aprovacoes: { orderBy: { nivel: 'asc' } },
      classe: true,
    },
  })
  if (!solicitacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── APROVAR (sequencial) ─── RF-031 ────────────────────────────────────────
  if (tipo === 'APROVAR') {
    // Encontra a aprovação PENDENTE deste aprovador nesta solicitação
    const aprovPendente = solicitacao.aprovacoes.find(
      a => a.aprovadorId === userId && a.status === 'PENDENTE' && a.tipo === 'DESABILITACAO'
    )
    if (!aprovPendente) {
      return NextResponse.json({ error: 'Você não tem aprovação pendente nesta solicitação' }, { status: 403 })
    }

    // Marca como APROVADO
    await prisma.aprovacao.update({
      where: { id: aprovPendente.id },
      data: { status: 'APROVADO', comentario, respondidaEm: new Date() },
    })

    await registrarEvento(id, userId, 'APROVACAO_REGISTRADA',
      `Nível ${aprovPendente.nivel} aprovado${comentario ? `: ${comentario}` : ''}`)

    // Verifica se há próximo nível aguardando — RF-031
    const proximoNivel = solicitacao.aprovacoes.find(
      a => a.status === 'AGUARDANDO' && a.tipo === 'DESABILITACAO' && a.nivel > aprovPendente.nivel
    )

    if (proximoNivel) {
      // Ativa o próximo aprovador
      await prisma.aprovacao.update({
        where: { id: proximoNivel.id },
        data: { status: 'PENDENTE' },
      })
      await registrarEvento(id, userId, 'PROXIMO_APROVADOR_NOTIFICADO',
        `Aprovação de nível ${proximoNivel.nivel} liberada`)
    } else {
      // Todos aprovaram — avança para execução autorizada — RF-037
      await prisma.solicitacao.update({
        where: { id },
        data: { status: 'EXECUCAO_AUTORIZADA', dataAprovacaoFinal: new Date() },
      })
      await registrarEvento(id, userId, 'APROVACAO_COMPLETA', 'Todos os aprovadores concluíram — execução autorizada')
    }

    return NextResponse.json({ ok: true })
  }

  // ── REJEITAR ─── RF-033, RF-044 ────────────────────────────────────────────
  if (tipo === 'REJEITAR') {
    const aprovPendente = solicitacao.aprovacoes.find(
      a => a.aprovadorId === userId && a.status === 'PENDENTE'
    )
    if (!aprovPendente) {
      return NextResponse.json({ error: 'Você não tem aprovação pendente nesta solicitação' }, { status: 403 })
    }

    // Marca esta aprovação como REJEITADO
    await prisma.aprovacao.update({
      where: { id: aprovPendente.id },
      data: { status: 'REJEITADO', motivoRejeicao: motivo, respondidaEm: new Date() },
    })

    // Cancela todas as aprovações AGUARDANDO — RF-044
    await prisma.aprovacao.updateMany({
      where: { solicitacaoId: id, status: 'AGUARDANDO' },
      data: { status: 'CANCELADO' },
    })

    await prisma.solicitacao.update({ where: { id }, data: { status: 'REJEITADA' } })
    await registrarEvento(id, userId, 'REJEICAO_REGISTRADA', motivo)
    return NextResponse.json({ ok: true })
  }

  // ── CANCELAR ─── RF-019 ────────────────────────────────────────────────────
  if (tipo === 'CANCELAR') {
    const statusPermitidos = ['RASCUNHO', 'EM_APROVACAO', 'EXECUCAO_AUTORIZADA']
    if (!statusPermitidos.includes(solicitacao.status)) {
      return NextResponse.json({ error: 'Não é possível cancelar neste status' }, { status: 400 })
    }
    // Cancela aprovações pendentes
    await prisma.aprovacao.updateMany({
      where: { solicitacaoId: id, status: { in: ['PENDENTE', 'AGUARDANDO'] } },
      data: { status: 'CANCELADO' },
    })
    await prisma.solicitacao.update({ where: { id }, data: { status: 'CANCELADA' } })
    await registrarEvento(id, userId, 'CANCELADA', motivo)
    return NextResponse.json({ ok: true })
  }

  // ── INICIAR EXECUÇÃO ─── RF-052 ────────────────────────────────────────────
  if (tipo === 'INICIAR_EXECUCAO') {
    await prisma.solicitacao.update({ where: { id }, data: { status: 'EM_EXECUCAO' } })
    await registrarEvento(id, userId, 'EXECUCAO_INICIADA', '')
    return NextResponse.json({ ok: true })
  }

  // ── CONFIRMAR DESABILITAÇÃO (com checklist) ─── RF-058 ────────────────────
  if (tipo === 'CONFIRMAR_DESABILITACAO') {
    const items: { numero: number; descricao: string; resposta: string; observacao?: string }[] = checklistItems ?? []

    // Salva checklist
    await prisma.checklistItem.deleteMany({ where: { solicitacaoId: id, tipo: 'DESABILITACAO' } })
    for (const item of items) {
      await prisma.checklistItem.create({
        data: {
          solicitacaoId: id,
          numero: item.numero,
          descricao: item.descricao,
          resposta: item.resposta,
          tipo: 'DESABILITACAO',
          observacao: item.observacao,
        },
      })
    }

    await prisma.solicitacao.update({
      where: { id },
      data: { status: 'DESABILITADO', dataDesabilitacao: new Date() },
    })
    await registrarEvento(id, userId, 'DESABILITACAO_CONFIRMADA', 'Checklist preenchido e desabilitação confirmada')
    return NextResponse.json({ ok: true })
  }

  // ── INICIAR REABILITAÇÃO ─── RF-070 ───────────────────────────────────────
  if (tipo === 'INICIAR_REABILITACAO') {
    await prisma.solicitacao.update({
      where: { id },
      data: {
        status: 'EM_REABILITACAO',
        executanteId: executanteReabilitacaoId || solicitacao.executanteId,
      },
    })
    await registrarEvento(id, userId, 'REABILITACAO_INICIADA', '')
    return NextResponse.json({ ok: true })
  }

  // ── CONFIRMAR REABILITAÇÃO (com checklist) ─── RF-079 ────────────────────
  if (tipo === 'CONCLUIR_REABILITACAO') {
    const items: { numero: number; descricao: string; resposta: string; observacao?: string }[] = checklistItems ?? []

    await prisma.checklistItem.deleteMany({ where: { solicitacaoId: id, tipo: 'REABILITACAO' } })
    for (const item of items) {
      await prisma.checklistItem.create({
        data: {
          solicitacaoId: id,
          numero: item.numero,
          descricao: item.descricao,
          resposta: item.resposta,
          tipo: 'REABILITACAO',
          observacao: item.observacao,
        },
      })
    }

    await prisma.solicitacao.update({
      where: { id },
      data: { status: 'EM_VALIDACAO_DA_REABILITACAO', dataReabilitacao: new Date() },
    })
    await registrarEvento(id, userId, 'REABILITACAO_CONCLUIDA_EXECUTANTE', 'Checklist de reabilitação concluído — aguardando validação')
    return NextResponse.json({ ok: true })
  }

  // ── VALIDAR REABILITAÇÃO (aprovador de maior nível) ─── RF-081 ────────────
  if (tipo === 'VALIDAR_REABILITACAO') {
    await prisma.solicitacao.update({
      where: { id },
      data: { status: 'ENCERRADA', dataEncerramento: new Date() },
    })
    await registrarEvento(id, userId, 'REABILITACAO_VALIDADA', `Reabilitação validada — solicitação encerrada${comentario ? `: ${comentario}` : ''}`)
    return NextResponse.json({ ok: true })
  }

  // ── REJEITAR REABILITAÇÃO ─── RF-082 ──────────────────────────────────────
  if (tipo === 'REJEITAR_REABILITACAO') {
    await prisma.solicitacao.update({ where: { id }, data: { status: 'EM_REABILITACAO' } })
    await registrarEvento(id, userId, 'REABILITACAO_REJEITADA', motivo)
    return NextResponse.json({ ok: true })
  }

  // ── SOLICITAR EXTENSÃO ─── UC008 ──────────────────────────────────────────
  if (tipo === 'SOLICITAR_EXTENSAO') {
    const { novaDataFim, justificativa } = body
    if (!novaDataFim || !justificativa) {
      return NextResponse.json({ error: 'Nova data fim e justificativa são obrigatórios' }, { status: 400 })
    }
    if (solicitacao.status !== 'DESABILITADO') {
      return NextResponse.json({ error: 'Só é possível solicitar extensão quando DESABILITADO' }, { status: 400 })
    }
    // Valida que novo fim não ultrapassa prazo máximo da classe
    if (solicitacao.classe?.prazoMaximoDias && solicitacao.dataDesabilitacao) {
      const maxFim = new Date(solicitacao.dataDesabilitacao)
      maxFim.setDate(maxFim.getDate() + solicitacao.classe.prazoMaximoDias)
      if (new Date(novaDataFim) > maxFim) {
        return NextResponse.json({ error: 'Nova data ultrapassa o prazo máximo da classe' }, { status: 400 })
      }
    }
    await prisma.solicitacao.update({
      where: { id },
      data: { periodoFim: new Date(novaDataFim) },
    })
    await registrarEvento(id, userId, 'EXTENSAO_REGISTRADA', `Nova data fim: ${novaDataFim}. Justificativa: ${justificativa}`)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
}

async function registrarEvento(solicitacaoId: string, userId: string, acao: string, detalhes?: string) {
  await prisma.eventoAuditoria.create({
    data: { solicitacaoId, userId, acao, detalhes },
  })
}
