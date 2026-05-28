import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const areaId = req.nextUrl.searchParams.get('areaId')

  const equipamentos = await prisma.equipamento.findMany({
    where: {
      ativo: true,
      area: { ativa: true, planta: { ativa: true } },
      ...(areaId ? { areaId } : {}),
      ...(q.length > 0 ? {
        OR: [
          { tag: { contains: q } },
          { descricao: { contains: q } },
        ],
      } : {}),
    },
    include: {
      area: { select: { nome: true } },
    },
    take: 50,
    orderBy: { tag: 'asc' },
  })

  return NextResponse.json(
    equipamentos.map(e => ({
      id: e.id,
      tag: e.tag,
      descricao: e.descricao,
      area: { nome: e.area.nome },
      areaId: e.areaId,
      // Optional fields: tipo, classeNumero, funcaoProtegida — only present if model has them
      tipo: (e as any).tipo ?? null,
      classeNumero: (e as any).classeNumero ?? null,
      funcaoProtegida: (e as any).funcaoProtegida ?? null,
    }))
  )
}
