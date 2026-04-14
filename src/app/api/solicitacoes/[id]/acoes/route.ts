import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

type Params = { params: { id: string } }

const checklistItemSchema = z.object({
  numero: z.coerce.number().int().min(1),
  resposta: z.enum(['SIM', 'NA']),
  observacao: z.string().trim().max(500).optional(),
})

const actionSchema = z.object({
  tipo: z.string().min(1),
  motivo: z.string().trim().max(500).optional(),
  comentario: z.string().trim().max(500).optional(),
  novoPeriodoFim: z.string().optional(),
  justificativa: z.string().trim().max(1000).optional(),
  checklist: z.array(checklistItemSchema).optional(),
})

const CHECKLIST_DESABILITACAO = [
  { numero: 1, descricao: 'A desabilitação será feita com o equipamento em operação?' },
  {
    numero: 2,
    descricao:
      'Foi estabelecida uma proteção alternativa em substituição ao intertravamento/dispositivo de segurança desabilitado?',
  },
  { numero: 3, descricao: 'O cartão de advertência está instalado no equipamento ou painel?' },
  { numero: 4, descricao: 'A desabilitação será em instalação elétrica?' },
] as const

const CHECKLIST_REABILITACAO = [
  { numero: 1, descricao: 'Todos os dispositivos de bloqueio/sinalização foram removidos?' },
  {
    numero: 2,
    descricao:
      'Foram verificadas as condições de funcionamento do intertravamento/dispositivo de segurança?',
  },
] as const

function httpError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function nextPendingLevel(aprovacoes: Array<{ nivel: number; status: string }>) {
  const pendentes = aprovacoes.filter(a => a.status === 'PENDENTE')
  if (pendentes.length === 0) return null
  return Math.min(...pendentes.map(a => a.nivel))
}

async function ensureChecklist(solicitacaoId: string, tipo: 'DESABILITACAO' | 'REABILITACAO') {
  const existentes = await prisma.checklistItem.findMany({
    where: { solicitacaoId, tipo },
    select: { id: true },
  })
  if (existentes.length > 0) return

  const base = tipo === 'DESABILITACAO' ? CHECKLIST_DESABILITACAO : CHECKLIST_REABILITACAO
  await prisma.checklistItem.createMany({
    data: base.map(item => ({
      solicitacaoId,
      tipo,
      numero: item.numero,
      descricao: item.descricao,
    })),
  })
}

async function applyChecklistRespostas(
  solicitacaoId: string,
  tipo: 'DESABILITACAO' | 'REABILITACAO',
  respostas: Array<{ numero: number; resposta: 'SIM' | 'NA'; observacao?: string }> = [],
) {
  if (respostas.length === 0) return
  await Promise.all(
    respostas.map(item =>
      prisma.checklistItem.updateMany({
        where: { solicitacaoId, tipo, numero: item.numero },
        data: { resposta: item.resposta, observacao: item.observacao ?? null },
      }),
    ),
  )
}

async function checklistCompleto(solicitacaoId: string, tipo: 'DESABILITACAO' | 'REABILITACAO', isFisico: boolean) {
  const items = await prisma.checklistItem.findMany({ where: { solicitacaoId, tipo } })
  const exigidos =
    tipo === 'DESABILITACAO' && !isFisico ? items.filter(i => i.numero !== 3) : items
  return exigidos.length > 0 && exigidos.every(i => i.resposta === 'SIM' || i.resposta === 'NA')
}

async function registrarEvento(solicitacaoId: string, userId: string, acao: string, detalhes?: string) {
  await prisma.eventoAuditoria.create({
    data: { solicitacaoId, userId, acao, detalhes },
  })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return httpError('Unauthorized', 401)
  const userId = session.user.id as string
  const { id } = params

  const body = await req.json()
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) return httpError('Payload de ação inválido.', 400)

  const payload = parsed.data

  const solicitacao = await prisma.solicitacao.findUnique({
    where: { id },
    include: {
      classe: true,
      aprovacoes: { orderBy: [{ nivel: 'asc' }, { createdAt: 'asc' }] },
      extensoes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  if (!solicitacao) return httpError('Solicitação não encontrada.', 404)

  const possuiConflitoInteresse =
    solicitacao.solicitanteId === userId ||
    solicitacao.executanteId === userId ||
    solicitacao.emNomeDe === userId

  if (payload.tipo === 'APROVAR') {
    if (possuiConflitoInteresse) {
      return httpError(
        'Conflito de interesse: você não pode aprovar solicitação criada por você, em seu nome ou em que é executante.',
        403,
      )
    }

    if (solicitacao.status !== 'EM_APROVACAO') {
      return httpError('Ação inválida para o status atual.', 409)
    }

    const proximoNivel = nextPendingLevel(
      solicitacao.aprovacoes.filter(a => a.tipo === 'DESABILITACAO'),
    )
    const aprovacaoAtual = solicitacao.aprovacoes.find(
      a =>
        a.tipo === 'DESABILITACAO' &&
        a.status === 'PENDENTE' &&
        a.nivel === proximoNivel &&
        a.aprovadorId === userId,
    )

    if (!aprovacaoAtual) {
      return httpError('Sua aprovação não está disponível neste momento.', 403)
    }

    await prisma.$transaction(async tx => {
      await tx.aprovacao.update({
        where: { id: aprovacaoAtual.id },
        data: {
          status: 'APROVADO',
          comentario: payload.comentario ?? null,
          respondidaEm: new Date(),
        },
      })

      const remaining = await tx.aprovacao.count({
        where: { solicitacaoId: id, tipo: 'DESABILITACAO', status: 'PENDENTE' },
      })

      if (remaining === 0) {
        await tx.solicitacao.update({
          where: { id },
          data: { status: 'EXECUCAO_AUTORIZADA', dataAprovacaoFinal: new Date() },
        })
      }
    })

    await registrarEvento(id, userId, 'APROVACAO_REGISTRADA', payload.comentario)
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'REJEITAR') {
    if (possuiConflitoInteresse) {
      return httpError(
        'Conflito de interesse: você não pode rejeitar solicitação criada por você, em seu nome ou em que é executante.',
        403,
      )
    }

    if (solicitacao.status !== 'EM_APROVACAO') {
      return httpError('Ação inválida para o status atual.', 409)
    }
    if (!payload.motivo?.trim()) {
      return httpError('Motivo da rejeição é obrigatório.', 400)
    }

    const proximoNivel = nextPendingLevel(
      solicitacao.aprovacoes.filter(a => a.tipo === 'DESABILITACAO'),
    )
    const aprovacaoAtual = solicitacao.aprovacoes.find(
      a =>
        a.tipo === 'DESABILITACAO' &&
        a.status === 'PENDENTE' &&
        a.nivel === proximoNivel &&
        a.aprovadorId === userId,
    )

    if (!aprovacaoAtual) {
      return httpError('Sua rejeição não está disponível neste momento.', 403)
    }

    await prisma.$transaction(async tx => {
      await tx.aprovacao.update({
        where: { id: aprovacaoAtual.id },
        data: { status: 'REJEITADO', motivoRejeicao: payload.motivo, respondidaEm: new Date() },
      })
      await tx.aprovacao.updateMany({
        where: { solicitacaoId: id, tipo: 'DESABILITACAO', status: 'PENDENTE' },
        data: { status: 'REJEITADO', motivoRejeicao: 'Fila cancelada após rejeição.' },
      })
      await tx.solicitacao.update({ where: { id }, data: { status: 'REJEITADA' } })
    })

    await registrarEvento(id, userId, 'REJEICAO_REGISTRADA', payload.motivo)
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'INICIAR_EXECUCAO') {
    if (solicitacao.status !== 'EXECUCAO_AUTORIZADA') return httpError('Ação inválida para o status atual.', 409)
    if (solicitacao.executanteId !== userId) return httpError('Apenas o executante designado pode iniciar execução.', 403)

    await ensureChecklist(id, 'DESABILITACAO')
    await prisma.solicitacao.update({ where: { id }, data: { status: 'EM_EXECUCAO' } })
    await registrarEvento(id, userId, 'EXECUCAO_INICIADA')
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'CONFIRMAR_DESABILITACAO') {
    if (solicitacao.status !== 'EM_EXECUCAO') return httpError('Ação inválida para o status atual.', 409)
    if (solicitacao.executanteId !== userId) return httpError('Apenas o executante designado pode confirmar desabilitação.', 403)

    await ensureChecklist(id, 'DESABILITACAO')
    await applyChecklistRespostas(id, 'DESABILITACAO', payload.checklist)

    const ok = await checklistCompleto(id, 'DESABILITACAO', solicitacao.tipo === 'FISICO')
    if (!ok) return httpError('Checklist de desabilitação incompleto.', 400)

    await prisma.solicitacao.update({
      where: { id },
      data: { status: 'DESABILITADO', dataDesabilitacao: new Date() },
    })
    await registrarEvento(id, userId, 'DESABILITACAO_CONFIRMADA')
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'INICIAR_REABILITACAO') {
    if (solicitacao.status !== 'DESABILITADO') return httpError('Ação inválida para o status atual.', 409)
    if (solicitacao.executanteId !== userId) return httpError('Apenas o executante designado pode iniciar reabilitação.', 403)

    await ensureChecklist(id, 'REABILITACAO')
    await prisma.solicitacao.update({ where: { id }, data: { status: 'EM_REABILITACAO' } })
    await registrarEvento(id, userId, 'REABILITACAO_INICIADA')
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'CONCLUIR_REABILITACAO') {
    if (solicitacao.status !== 'EM_REABILITACAO') return httpError('Ação inválida para o status atual.', 409)
    if (solicitacao.executanteId !== userId) return httpError('Apenas o executante designado pode concluir reabilitação.', 403)

    await ensureChecklist(id, 'REABILITACAO')
    await applyChecklistRespostas(id, 'REABILITACAO', payload.checklist)

    const ok = await checklistCompleto(id, 'REABILITACAO', solicitacao.tipo === 'FISICO')
    if (!ok) return httpError('Checklist de reabilitação incompleto.', 400)

    await prisma.$transaction(async tx => {
      await tx.solicitacao.update({
        where: { id },
        data: { status: 'EM_VALIDACAO_DA_REABILITACAO', dataReabilitacao: new Date() },
      })

      const aprovadoresDesabilitacao = await tx.aprovacao.findMany({
        where: { solicitacaoId: id, tipo: 'DESABILITACAO', status: 'APROVADO' },
        orderBy: { nivel: 'desc' },
      })
      const nivelFinal = aprovadoresDesabilitacao[0]?.nivel
      if (nivelFinal != null) {
        const aprovadoresFinais = aprovadoresDesabilitacao.filter(a => a.nivel === nivelFinal)
        await tx.aprovacao.deleteMany({
          where: { solicitacaoId: id, tipo: 'REABILITACAO', status: 'PENDENTE' },
        })
        await tx.aprovacao.createMany({
          data: aprovadoresFinais.map(a => ({
            solicitacaoId: id,
            aprovadorId: a.aprovadorId,
            nivel: a.nivel,
            tipo: 'REABILITACAO',
            status: 'PENDENTE',
          })),
        })
      }
    })

    await registrarEvento(id, userId, 'REABILITACAO_ENVIADA_PARA_VALIDACAO')
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'VALIDAR_REABILITACAO') {
    if (possuiConflitoInteresse) {
      return httpError(
        'Conflito de interesse: você não pode validar reabilitação de solicitação criada por você, em seu nome ou em que é executante.',
        403,
      )
    }

    if (solicitacao.status !== 'EM_VALIDACAO_DA_REABILITACAO') return httpError('Ação inválida para o status atual.', 409)

    const pending = solicitacao.aprovacoes.find(
      a => a.tipo === 'REABILITACAO' && a.status === 'PENDENTE' && a.aprovadorId === userId,
    )
    if (!pending) return httpError('Você não possui validação pendente para esta solicitação.', 403)

    await prisma.$transaction(async tx => {
      await tx.aprovacao.update({
        where: { id: pending.id },
        data: { status: 'APROVADO', comentario: payload.comentario ?? null, respondidaEm: new Date() },
      })
      const restantes = await tx.aprovacao.count({
        where: { solicitacaoId: id, tipo: 'REABILITACAO', status: 'PENDENTE' },
      })
      if (restantes === 0) {
        await tx.solicitacao.update({
          where: { id },
          data: { status: 'ENCERRADA', dataEncerramento: new Date() },
        })
      }
    })

    await registrarEvento(id, userId, 'REABILITACAO_VALIDADA', payload.comentario)
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'REJEITAR_REABILITACAO') {
    if (possuiConflitoInteresse) {
      return httpError(
        'Conflito de interesse: você não pode rejeitar reabilitação de solicitação criada por você, em seu nome ou em que é executante.',
        403,
      )
    }

    if (solicitacao.status !== 'EM_VALIDACAO_DA_REABILITACAO') return httpError('Ação inválida para o status atual.', 409)
    if (!payload.motivo?.trim()) return httpError('Motivo da rejeição é obrigatório.', 400)

    const pending = solicitacao.aprovacoes.find(
      a => a.tipo === 'REABILITACAO' && a.status === 'PENDENTE' && a.aprovadorId === userId,
    )
    if (!pending) return httpError('Você não possui validação pendente para esta solicitação.', 403)

    await prisma.$transaction(async tx => {
      await tx.aprovacao.update({
        where: { id: pending.id },
        data: { status: 'REJEITADO', motivoRejeicao: payload.motivo, respondidaEm: new Date() },
      })
      await tx.solicitacao.update({ where: { id }, data: { status: 'EM_REABILITACAO' } })
    })

    await registrarEvento(id, userId, 'REABILITACAO_REJEITADA', payload.motivo)
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'CANCELAR') {
    if (!['RASCUNHO', 'EM_APROVACAO', 'EXECUCAO_AUTORIZADA'].includes(solicitacao.status)) {
      return httpError('Não é possível cancelar no status atual.', 409)
    }
    if (solicitacao.solicitanteId !== userId && solicitacao.emNomeDe !== userId) {
      return httpError('Apenas o solicitante titular pode cancelar.', 403)
    }
    if (!payload.motivo?.trim()) {
      return httpError('Motivo do cancelamento é obrigatório.', 400)
    }

    await prisma.$transaction(async tx => {
      await tx.solicitacao.update({ where: { id }, data: { status: 'CANCELADA' } })
      await tx.aprovacao.updateMany({
        where: { solicitacaoId: id, status: 'PENDENTE' },
        data: { status: 'REJEITADO', motivoRejeicao: `Cancelada pelo solicitante: ${payload.motivo}` },
      })
    })

    await registrarEvento(id, userId, 'CANCELADA', payload.motivo)
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'SOLICITAR_EXTENSAO') {
    if (solicitacao.prazoMaximoAtingido) {
      return httpError('Prazo máximo já foi atingido. Extensão não é permitida.', 409)
    }

    if (solicitacao.status !== 'DESABILITADO') return httpError('Extensão só pode ser solicitada em DESABILITADO.', 409)
    if (solicitacao.solicitanteId !== userId && solicitacao.emNomeDe !== userId) {
      return httpError('Apenas solicitante titular pode solicitar extensão.', 403)
    }
    if (!payload.justificativa?.trim()) return httpError('Justificativa da extensão é obrigatória.', 400)
    if (!payload.novoPeriodoFim) return httpError('Novo período de término é obrigatório.', 400)

    const novoPeriodoFim = new Date(payload.novoPeriodoFim)
    if (Number.isNaN(novoPeriodoFim.getTime())) return httpError('Novo período inválido.', 400)
    if (solicitacao.periodoFim && novoPeriodoFim <= solicitacao.periodoFim) {
      return httpError('Novo período deve ser maior que o período atual.', 400)
    }
    if (!solicitacao.dataDesabilitacao) {
      return httpError('Solicitação sem data de desabilitação registrada.', 409)
    }

    if (solicitacao.classe?.prazoMaximoDias != null) {
      const duracaoDias = (novoPeriodoFim.getTime() - solicitacao.dataDesabilitacao.getTime()) / 86_400_000
      if (duracaoDias > solicitacao.classe.prazoMaximoDias) {
        return httpError('Novo período excede o SLA máximo da classe.', 400)
      }
    }

    const aprovadoresDesabilitacao = solicitacao.aprovacoes
      .filter(a => a.tipo === 'DESABILITACAO' && a.status === 'APROVADO')
      .sort((a, b) => b.nivel - a.nivel)
    const nivelFinal = aprovadoresDesabilitacao[0]?.nivel
    if (nivelFinal == null) {
      return httpError('Não há aprovador de referência para analisar extensão.', 409)
    }
    const aprovadoresExtensao = aprovadoresDesabilitacao.filter(a => a.nivel === nivelFinal)

    await prisma.$transaction(async tx => {
      await tx.extensaoPrazo.create({
        data: {
          solicitacaoId: id,
          novoPeriodoFim,
          justificativa: payload.justificativa!,
          status: 'PENDENTE',
        },
      })
      await tx.aprovacao.deleteMany({
        where: { solicitacaoId: id, tipo: 'EXTENSAO', status: 'PENDENTE' },
      })
      await tx.aprovacao.createMany({
        data: aprovadoresExtensao.map(a => ({
          solicitacaoId: id,
          aprovadorId: a.aprovadorId,
          nivel: a.nivel,
          tipo: 'EXTENSAO',
          status: 'PENDENTE',
        })),
      })
      await tx.solicitacao.update({ where: { id }, data: { status: 'EXTENSAO_EM_ANALISE' } })
    })

    await registrarEvento(id, userId, 'EXTENSAO_SOLICITADA', payload.justificativa)
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'APROVAR_EXTENSAO') {
    if (possuiConflitoInteresse) {
      return httpError(
        'Conflito de interesse: você não pode aprovar extensão de solicitação criada por você, em seu nome ou em que é executante.',
        403,
      )
    }

    if (solicitacao.status !== 'EXTENSAO_EM_ANALISE') return httpError('Ação inválida para o status atual.', 409)
    const aprovacao = solicitacao.aprovacoes.find(
      a => a.tipo === 'EXTENSAO' && a.status === 'PENDENTE' && a.aprovadorId === userId,
    )
    if (!aprovacao) return httpError('Você não possui aprovação pendente de extensão.', 403)

    const extensao = solicitacao.extensoes[0]
    if (!extensao || extensao.status !== 'PENDENTE') {
      return httpError('Não há extensão pendente para aprovação.', 409)
    }

    await prisma.$transaction(async tx => {
      await tx.aprovacao.update({
        where: { id: aprovacao.id },
        data: { status: 'APROVADO', comentario: payload.comentario ?? null, respondidaEm: new Date() },
      })
      const restante = await tx.aprovacao.count({
        where: { solicitacaoId: id, tipo: 'EXTENSAO', status: 'PENDENTE' },
      })
      if (restante === 0) {
        await tx.extensaoPrazo.update({ where: { id: extensao.id }, data: { status: 'APROVADA' } })
        await tx.solicitacao.update({
          where: { id },
          data: { status: 'DESABILITADO', periodoFim: extensao.novoPeriodoFim },
        })
      }
    })

    await registrarEvento(id, userId, 'EXTENSAO_APROVADA', payload.comentario)
    return NextResponse.json({ ok: true })
  }

  if (payload.tipo === 'REJEITAR_EXTENSAO') {
    if (possuiConflitoInteresse) {
      return httpError(
        'Conflito de interesse: você não pode rejeitar extensão de solicitação criada por você, em seu nome ou em que é executante.',
        403,
      )
    }

    if (solicitacao.status !== 'EXTENSAO_EM_ANALISE') return httpError('Ação inválida para o status atual.', 409)
    if (!payload.motivo?.trim()) return httpError('Motivo da rejeição é obrigatório.', 400)
    const aprovacao = solicitacao.aprovacoes.find(
      a => a.tipo === 'EXTENSAO' && a.status === 'PENDENTE' && a.aprovadorId === userId,
    )
    if (!aprovacao) return httpError('Você não possui aprovação pendente de extensão.', 403)

    const extensao = solicitacao.extensoes[0]
    if (!extensao || extensao.status !== 'PENDENTE') {
      return httpError('Não há extensão pendente para rejeição.', 409)
    }

    await prisma.$transaction(async tx => {
      await tx.aprovacao.update({
        where: { id: aprovacao.id },
        data: { status: 'REJEITADO', motivoRejeicao: payload.motivo, respondidaEm: new Date() },
      })
      await tx.aprovacao.updateMany({
        where: { solicitacaoId: id, tipo: 'EXTENSAO', status: 'PENDENTE' },
        data: { status: 'REJEITADO', motivoRejeicao: 'Fila encerrada por rejeição de extensão.' },
      })
      await tx.extensaoPrazo.update({ where: { id: extensao.id }, data: { status: 'REJEITADA' } })
      await tx.solicitacao.update({ where: { id }, data: { status: 'DESABILITADO' } })
    })

    await registrarEvento(id, userId, 'EXTENSAO_REJEITADA', payload.motivo)
    return NextResponse.json({ ok: true })
  }

  return httpError('Ação desconhecida.', 400)
}
