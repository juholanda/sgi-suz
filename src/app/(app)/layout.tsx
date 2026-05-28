import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import AppLayoutClient from '@/components/sgi/AppLayoutClient'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = ((session.user as any)?.id ?? (session.user as any)?.sub) as string | undefined
  if (!userId) redirect('/login')

  const perfisReais = await prisma.usuarioPerfil.findMany({
    where: { userId },
    select: { perfil: true, plantaId: true, areaId: true },
  })

  const plantaIds = Array.from(new Set(perfisReais.map(p => p.plantaId).filter(Boolean))) as string[]
  const plantas = plantaIds.length > 0
    ? await prisma.planta.findMany({ where: { id: { in: plantaIds }, ativa: true }, select: { id: true, nome: true } })
    : []

  const cookieStore = await cookies()
  const plantaCookie = cookieStore.get('sgi_planta_ativa')?.value
  const perfilCookie = cookieStore.get('sgi_perfil_ativo')?.value

  // Filtra perfis pela planta ativa para evitar que perfis de outras plantas
  // (ex: APROVADOR em Aracruz) apareçam ao usar uma planta diferente (ex: Limeira)
  const perfisNaPlantaAtiva = plantaCookie
    ? perfisReais.filter(p => p.plantaId === plantaCookie)
    : perfisReais

  const perfisBase = perfisNaPlantaAtiva.length > 0 ? perfisNaPlantaAtiva : perfisReais

  // Deduplica por perfil (para o switcher de perfil no sidebar)
  const perfisUnicos = Array.from(
    new Map(perfisBase.map(p => [p.perfil, p])).values()
  )

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
