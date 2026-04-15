import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { getAcoesPermitidas } from '@/lib/acoes'
import DetalheClient from '@/components/sgi/detalhe/DetalheClient'

// ── Data fetching ────────────────────────────────────────────────────────────

async function getSolicitacao(id: string) {
  return prisma.solicitacao.findUnique({
    where: { id },
    include: {
      equipamento: true,
      area: { include: { planta: true } },
      classe: true,
      solicitante: { select: { nome: true, matricula: true, email: true } },
      executante:  { select: { nome: true, matricula: true } },
      aprovacoes: {
        include: {
          aprovador: {
            select: {
              id: true,
              nome: true,
              matricula: true,
              perfis: {
                where: { perfil: { in: ['APROVADOR', 'GESTOR_SMS', 'ADMINISTRADOR'] } },
                select: { perfil: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { nivel: 'asc' },
      },
      checklists: { orderBy: { numero: 'asc' } },
      anexos: true,
      eventos: {
        include: { user: { select: { nome: true, cargo: { select: { nome: true } } } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

async function getUserPerfis(userId: string): Promise<string[]> {
  const perfis = await prisma.usuarioPerfil.findMany({
    where: { userId },
    select: { perfil: true },
  })
  return perfis.map(p => p.perfil)
}

// ── Serialization helper ─────────────────────────────────────────────────────

function serializeDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

// ── Page component ───────────────────────────────────────────────────────────

export default async function SolicitacaoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [s, session] = await Promise.all([
    getSolicitacao(params.id),
    auth(),
  ])
  if (!s) notFound()

  const userId = (session?.user as any)?.id as string
  if (!userId) notFound()

  // Fetch user profiles for action matrix
  const perfis = await getUserPerfis(userId)

  // Check for pending extensions
  const hasExtensaoPendente = !!(await prisma.extensaoPrazo?.count?.({
    where: {
      solicitacaoId: s.id,
      status: 'PENDENTE',
    },
  }).catch(() => 0))

  // Compute allowed actions via centralized matrix
  const { acoes, conflict } = getAcoesPermitidas({
    status: s.status,
    perfis,
    userId,
    solicitanteId: s.solicitanteId,
    executanteId: s.executanteId,
    aprovacoes: s.aprovacoes.map(a => ({
      aprovadorId: a.aprovadorId,
      status: a.status,
      tipo: a.tipo,
      nivel: a.nivel,
    })),
    hasExtensaoPendente,
  })

  // Fetch extensions if they exist
  let extensoes: any[] = []
  try {
    extensoes = await (prisma as any).extensaoPrazo?.findMany?.({
      where: { solicitacaoId: s.id },
      orderBy: { createdAt: 'desc' },
    }) ?? []
  } catch {
    // Model may not exist yet
  }

  // Serialize all data for client transport
  const solicitacao = {
    id: s.id,
    protocolo: s.protocolo,
    status: s.status,
    tipo: s.tipo,
    funcaoIntertravamento: s.funcaoIntertravamento,
    motivoDesabilitacao: s.motivoDesabilitacao,
    medidasContingenciais: s.medidasContingenciais,
    periodoInicio: serializeDate(s.periodoInicio),
    periodoFim: serializeDate(s.periodoFim),
    dataDesabilitacao: serializeDate(s.dataDesabilitacao),
    dataReabilitacao: serializeDate(s.dataReabilitacao),
    dataEncerramento: serializeDate(s.dataEncerramento),
    dataEnvioAprovacao: serializeDate(s.dataEnvio),
    prazoMaximoAtingido: s.prazoMaximoAtingido,
    prazoPrevitoAtingido: s.prazoPrevitoAtingido,
    createdAt: s.createdAt.toISOString(),
    solicitanteId: s.solicitanteId,
    executanteId: s.executanteId,
    equipamento: {
      tag: s.equipamento.tag,
      descricao: s.equipamento.descricao,
    },
    area: {
      nome: s.area.nome,
      planta: { nome: s.area.planta.nome },
    },
    classe: s.classe
      ? { numero: s.classe.numero, prazoMaximoDias: s.classe.prazoMaximoDias }
      : null,
    solicitante: {
      nome: s.solicitante.nome,
      matricula: s.solicitante.matricula,
      email: s.solicitante.email,
    },
    executante: s.executante
      ? { nome: s.executante.nome, matricula: s.executante.matricula }
      : null,
    aprovacoes: s.aprovacoes.map(a => ({
      id: a.id,
      nivel: a.nivel,
      status: a.status,
      tipo: a.tipo,
      comentario: a.comentario,
      motivoRejeicao: a.motivoRejeicao,
      respondidaEm: serializeDate(a.respondidaEm),
      aprovador: {
        id: a.aprovador.id,
        nome: a.aprovador.nome,
        matricula: a.aprovador.matricula,
        perfis: (a.aprovador as any).perfis ?? [],
      },
    })),
    checklists: s.checklists.map(c => ({
      id: c.id,
      tipo: c.tipo,
      numero: c.numero,
      descricao: c.descricao,
      resposta: c.resposta,
      observacao: c.observacao,
    })),
    anexos: s.anexos.map((a: any) => ({
      id: a.id,
      nome: a.nome ?? null,
      filename: a.nome ?? null,
      tipo: null,
      mimeType: a.mimeType ?? null,
      tamanho: a.tamanho ?? null,
      url: a.url ?? null,
    })),
    eventos: s.eventos.map(e => ({
      id: e.id,
      acao: e.acao,
      detalhes: e.detalhes,
      createdAt: e.createdAt.toISOString(),
      user: { nome: e.user.nome, cargo: (e.user as any).cargo?.nome ?? null },
    })),
    extensoes: extensoes.map((ext: any) => ({
      id: ext.id,
      novaDataFim: ext.novoPeriodoFim?.toISOString?.() ?? null,
      justificativa: ext.justificativa,
      status: ext.status,
      createdAt: ext.createdAt?.toISOString?.() ?? ext.createdAt,
    })),
  }

  return (
    <DetalheClient
      solicitacao={solicitacao}
      acoes={acoes}
      conflict={conflict}
      userId={userId}
      perfis={perfis}
    />
  )
}
