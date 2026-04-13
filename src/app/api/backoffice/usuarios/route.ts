import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const usuarios = await prisma.user.findMany({
    include: {
      perfis: { include: { planta: true, area: true } },
      cargo: true,
    },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { matricula, nome, email, senha, cargoId, perfis } = body

  if (!matricula?.trim()) return NextResponse.json({ error: 'Matrícula é obrigatória' }, { status: 400 })
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
  if (!senha?.trim()) return NextResponse.json({ error: 'Senha é obrigatória' }, { status: 400 })

  const passwordHash = await bcrypt.hash(senha, 12)

  try {
    const usuario = await prisma.user.create({
      data: {
        matricula: matricula.trim(),
        nome: nome.trim(),
        email: email.trim(),
        passwordHash,
        cargoId: cargoId || null,
        perfis: perfis?.length
          ? {
              create: perfis.map((p: { perfil: string; plantaId?: string; areaId?: string }) => ({
                perfil: p.perfil,
                plantaId: p.plantaId || null,
                areaId: p.areaId || null,
              })),
            }
          : undefined,
      },
      include: {
        perfis: { include: { planta: true, area: true } },
        cargo: true,
      },
    })
    return NextResponse.json(usuario, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Matrícula ou e-mail já cadastrado' }, { status: 409 })
    }
    throw e
  }
}
