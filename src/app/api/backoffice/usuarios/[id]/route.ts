import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { matricula, nome, email, senha, cargoId, ativo } = body

  if (!matricula?.trim()) return NextResponse.json({ error: 'Matrícula é obrigatória' }, { status: 400 })
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })

  const updateData: Record<string, unknown> = {
    matricula: matricula.trim(),
    nome: nome.trim(),
    email: email.trim(),
    cargoId: cargoId || null,
    ...(typeof ativo === 'boolean' ? { ativo } : {}),
  }

  if (senha?.trim()) {
    updateData.passwordHash = await bcrypt.hash(senha, 12)
  }

  try {
    const usuario = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        perfis: { include: { planta: true, area: true } },
        cargo: true,
      },
    })
    return NextResponse.json(usuario)
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Matrícula ou e-mail já cadastrado' }, { status: 409 })
    }
    throw e
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const usuario = await prisma.user.update({
    where: { id: params.id },
    data: { ativo: false },
  })
  return NextResponse.json(usuario)
}
