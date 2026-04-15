import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import PerfilClient from './PerfilClient'

export default async function PerfilPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = (session.user as any)?.id as string

  const cookieStore = await cookies()
  const plantaAtiva = cookieStore.get('sgi_planta_ativa')?.value

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      matricula: true,
      cargo: { select: { nome: true } },
      perfis: {
        select: { perfil: true, plantaId: true },
        ...(plantaAtiva ? { where: { plantaId: plantaAtiva } } : {}),
      },
    },
  })

  if (!user) redirect('/login')

  // Deduplica por tipo de perfil (mesmo perfil pode aparecer em múltiplas áreas)
  const perfisUnicos = Array.from(
    new Map(user.perfis.map(p => [p.perfil, p])).values()
  )

  return <PerfilClient user={{ ...user, perfis: perfisUnicos }} />
}
