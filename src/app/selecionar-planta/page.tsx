import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import SelecionarPlantaClient from './SelecionarPlantaClient'

export default async function SelecionarPlantaPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = (session.user as any)?.id as string

  const perfisReais = await prisma.usuarioPerfil.findMany({
    where: { userId },
    include: { planta: true },
  })

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

  // If only one plant, redirect directly
  if (plantas.length === 1) {
    redirect('/dashboard')
  }

  // If no plants at all, also go to dashboard (admin without plant)
  if (plantas.length === 0) {
    redirect('/dashboard')
  }

  const userName = session.user?.name ?? 'Usuário'

  return (
    <SelecionarPlantaClient
      plantas={plantas}
      userName={userName}
    />
  )
}
