import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import SelecionarPlantaClient from './SelecionarPlantaClient'

export default async function SelecionarPlantaPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = (session.user as any)?.id as string

  const [perfisReais, userRecord] = await Promise.all([
    prisma.usuarioPerfil.findMany({ where: { userId }, include: { planta: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { nome: true, email: true, matricula: true } }),
  ])

  // Group by plant
  const plantaMap = new Map<string, { id: string; nome: string; perfis: string[] }>()
  for (const p of perfisReais) {
    if (!p.plantaId || !p.planta) continue
    if (!plantaMap.has(p.plantaId)) {
      plantaMap.set(p.plantaId, { id: p.plantaId, nome: p.planta.nome, perfis: [] })
    }
    plantaMap.get(p.plantaId)!.perfis.push(p.perfil)
  }

  const plantas = Array.from(plantaMap.values())

  if (plantas.length === 1) redirect('/dashboard')
  if (plantas.length === 0) redirect('/dashboard')

  return (
    <SelecionarPlantaClient
      plantas={plantas}
      userName={userRecord?.nome ?? session.user?.name ?? 'Usuário'}
      userEmail={userRecord?.email ?? session.user?.email ?? ''}
      userMatricula={userRecord?.matricula ?? ''}
    />
  )
}
