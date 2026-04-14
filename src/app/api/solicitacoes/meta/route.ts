import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

type ScopedArea = {
  id: string
  nome: string
  plantaId: string
  plantaNome: string
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id as string

  const [perfilSolicitante, areasAtivas, equipamentosAtivos, classes, executantes] =
    await Promise.all([
      prisma.usuarioPerfil.findMany({
        where: { userId, perfil: 'SOLICITANTE' },
        select: { areaId: true, plantaId: true },
      }),
      prisma.area.findMany({
        where: { ativa: true, planta: { ativa: true } },
        include: { planta: { select: { id: true, nome: true } } },
        orderBy: [{ planta: { nome: 'asc' } }, { nome: 'asc' }],
      }),
      prisma.equipamento.findMany({
        where: { ativo: true, area: { ativa: true, planta: { ativa: true } } },
        include: {
          area: { select: { id: true, plantaId: true } },
          solicitacoes: {
            select: {
              tipo: true,
              funcaoIntertravamento: true,
              classe: { select: { numero: true } },
            },
            where: { status: { in: ['EM_APROVACAO', 'EXECUCAO_AUTORIZADA', 'EM_EXECUCAO', 'DESABILITADO', 'ENCERRADA'] } },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { tag: 'asc' },
      }),
      prisma.classe.findMany({
        where: { ativa: true, numero: { in: [1, 2, 3, 4] } },
        orderBy: { numero: 'asc' },
      }),
      prisma.user.findMany({
        where: {
          ativo: true,
          perfis: { some: { perfil: 'EXECUTANTE' } },
        },
        select: { id: true, nome: true, matricula: true, perfis: { select: { areaId: true, plantaId: true } } },
        orderBy: { nome: 'asc' },
      }),
    ])

  const scopedAreas: ScopedArea[] =
    perfilSolicitante.length === 0
      ? areasAtivas.map(a => ({ id: a.id, nome: a.nome, plantaId: a.plantaId, plantaNome: a.planta.nome }))
      : areasAtivas
          .filter(a =>
            perfilSolicitante.some(
              p =>
                (p.areaId ? p.areaId === a.id : true) &&
                (p.plantaId ? p.plantaId === a.plantaId : true),
            ),
          )
          .map(a => ({ id: a.id, nome: a.nome, plantaId: a.plantaId, plantaNome: a.planta.nome }))

  const areaIds = new Set(scopedAreas.map(a => a.id))
  const plantaIds = new Set(scopedAreas.map(a => a.plantaId))

  const equipments = equipamentosAtivos
    .filter(eq => areaIds.has(eq.area.id))
    .map(eq => {
      const snapshot = eq.solicitacoes[0]
      return {
        id: eq.id,
        tag: eq.tag,
        descricao: eq.descricao,
        areaId: eq.area.id,
        plantaId: eq.area.plantaId,
        tipoSugerido: snapshot?.tipo ?? null,
        funcaoSugerida: snapshot?.funcaoIntertravamento ?? eq.descricao,
        classeSugerida: snapshot?.classe?.numero ?? null,
      }
    })

  const scopedExecutantes = executantes
    .filter(user =>
      user.perfis.some(
        p =>
          (p.areaId ? areaIds.has(p.areaId) : true) &&
          (p.plantaId ? plantaIds.has(p.plantaId) : true),
      ),
    )
    .map(user => ({ id: user.id, nome: user.nome, matricula: user.matricula }))

  return NextResponse.json({
    areas: scopedAreas,
    equipamentos: equipments,
    executantes: scopedExecutantes,
    classes: classes.map(c => ({
      id: c.id,
      numero: c.numero,
      descricao: c.descricao,
      prazoMaximoDias: c.prazoMaximoDias,
      cor: c.cor,
    })),
  })
}

