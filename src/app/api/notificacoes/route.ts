import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface NotifItem {
  id: string
  tipo: string
  titulo: string
  descricao: string
  href: string
  urgente: boolean
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any)?.id as string
  const perfil = req.nextUrl.searchParams.get('perfil') ?? ''

  const items: NotifItem[] = []

  if (perfil === 'APROVADOR' || perfil === 'GESTOR_SMS') {
    const aprovacoes = await prisma.aprovacao.findMany({
      where: { aprovadorId: userId, status: 'PENDENTE' },
      include: {
        solicitacao: {
          include: {
            equipamento: { select: { tag: true } },
            classe: { select: { numero: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    for (const ap of aprovacoes) {
      const sol = ap.solicitacao
      items.push({
        id: ap.id,
        tipo: 'APROVACAO_PENDENTE',
        titulo: 'Aprovação pendente',
        descricao: `${sol.protocolo} — ${sol.equipamento.tag} (Classe ${sol.classe?.numero ?? '?'})`,
        href: `/aprovacoes/${sol.id}`,
        urgente: false,
      })
    }
  } else if (perfil === 'ADMINISTRADOR') {
    const pendentes = await prisma.aprovacao.findMany({
      where: { status: 'PENDENTE' },
      include: {
        solicitacao: {
          include: {
            equipamento: { select: { tag: true } },
            classe: { select: { numero: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    for (const ap of pendentes) {
      const sol = ap.solicitacao
      items.push({
        id: ap.id,
        tipo: 'APROVACAO_PENDENTE',
        titulo: 'Aprovação pendente',
        descricao: `${sol.protocolo} — ${sol.equipamento.tag} (Classe ${sol.classe?.numero ?? '?'})`,
        href: `/aprovacoes/${sol.id}`,
        urgente: false,
      })
    }
  } else if (perfil === 'SOLICITANTE') {
    const solicitacoes = await prisma.solicitacao.findMany({
      where: {
        solicitanteId: userId,
        status: { in: ['EXECUCAO_AUTORIZADA', 'RASCUNHO'] },
      },
      include: {
        equipamento: { select: { tag: true } },
        classe: { select: { numero: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    for (const sol of solicitacoes) {
      const isUrgente = sol.status === 'EXECUCAO_AUTORIZADA'
      items.push({
        id: sol.id,
        tipo: sol.status,
        titulo: isUrgente ? 'Execução autorizada' : 'Rascunho pendente',
        descricao: `${sol.protocolo} — ${sol.equipamento.tag}${sol.classe ? ` (Classe ${sol.classe.numero})` : ''}`,
        href: `/solicitacoes/${sol.id}`,
        urgente: isUrgente,
      })
    }
  } else if (perfil === 'EXECUTANTE') {
    const solicitacoes = await prisma.solicitacao.findMany({
      where: {
        executanteId: userId,
        status: { in: ['EXECUCAO_AUTORIZADA', 'EM_EXECUCAO'] },
      },
      include: {
        equipamento: { select: { tag: true } },
        classe: { select: { numero: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    for (const sol of solicitacoes) {
      const isUrgente = sol.status === 'EXECUCAO_AUTORIZADA'
      items.push({
        id: sol.id,
        tipo: sol.status,
        titulo: isUrgente ? 'Execução autorizada' : 'Em execução',
        descricao: `${sol.protocolo} — ${sol.equipamento.tag}${sol.classe ? ` (Classe ${sol.classe.numero})` : ''}`,
        href: `/solicitacoes/${sol.id}`,
        urgente: isUrgente,
      })
    }
  }

  return NextResponse.json({ count: items.length, items })
}
