import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const CONTEXTO_COOKIE = 'sgi_contexto'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const perfil = typeof body.perfil === 'string' ? body.perfil.trim().toUpperCase() : ''
  const plantaId = typeof body.plantaId === 'string' ? body.plantaId.trim() : ''

  const perfisPermitidos = (session.user.perfis ?? []).map(p => p.toUpperCase())
  const plantasPermitidas = session.user.plantas ?? []

  if (perfil && !perfisPermitidos.includes(perfil)) {
    return NextResponse.json({ error: 'Perfil não permitido para o usuário.' }, { status: 403 })
  }

  if (plantaId && !plantasPermitidas.some(planta => planta.id === plantaId)) {
    return NextResponse.json({ error: 'Planta não permitida para o usuário.' }, { status: 403 })
  }

  const payload = JSON.stringify({
    ...(perfil ? { perfil } : {}),
    ...(plantaId ? { plantaId } : {}),
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(CONTEXTO_COOKIE, encodeURIComponent(payload), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return res
}
