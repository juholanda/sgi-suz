import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import PerfilClient from './PerfilClient'

export default async function PerfilPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = (session.user as any)?.id as string

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
      },
    },
  })

  if (!user) redirect('/login')

  return <PerfilClient user={user} />
}
