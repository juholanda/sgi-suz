import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import AppLayoutClient from '@/components/sgi/AppLayoutClient'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = (session.user as any)?.id as string

  const perfisReais = await prisma.usuarioPerfil.findMany({
    where: { userId },
    select: { perfil: true, plantaId: true, areaId: true },
  })

  // Garante que há pelo menos um perfil (caso admin não tenha perfil associado)
  const perfisUnicos = Array.from(
    new Map(perfisReais.map(p => [p.perfil, p])).values()
  )

  const plantaIds = Array.from(new Set(perfisReais.map(p => p.plantaId).filter(Boolean))) as string[]
  const plantas = plantaIds.length > 0
    ? await prisma.planta.findMany({ where: { id: { in: plantaIds } }, select: { id: true, nome: true } })
    : []

  // Lê o perfil ativo do cookie (atualizado pelo cliente ao trocar)
  const cookieStore = await cookies()
  const perfilCookie = cookieStore.get('sgi_perfil_ativo')?.value
  const perfilAtivo = perfilCookie && perfisUnicos.some(p => p.perfil === perfilCookie)
    ? perfilCookie
    : perfisUnicos[0]?.perfil ?? ''

  return (
    <AppLayoutClient
      user={session.user ?? {}}
      perfisReais={perfisUnicos}
      plantas={plantas}
      perfilInicial={perfilAtivo}
    >
      {children}
    </AppLayoutClient>
  )
}
