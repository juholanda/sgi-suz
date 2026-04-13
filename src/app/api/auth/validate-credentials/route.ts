import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { matricula, senha } = await req.json()

  if (!matricula || !senha) {
    return NextResponse.json({ error: 'MISSING_FIELDS' })
  }

  const user = await prisma.user.findUnique({ where: { matricula } })

  if (!user || !user.ativo) {
    return NextResponse.json({ error: 'MATRICULA_NOT_FOUND' })
  }

  const valid = await bcrypt.compare(senha, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'WRONG_PASSWORD' })
  }

  return NextResponse.json({ error: null })
}
