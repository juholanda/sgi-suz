import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import SelecionarPlantaClient from './SelecionarPlantaClient'

export default async function SelecionarPlantaPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = (session.user as any)?.id as string | undefined
  if (!userId) redirect('/login')

  const [perfisReais, userRecord] = await Promise.all([
    prisma.usuarioPerfil.findMany({
      where: { userId, planta: { ativa: true } },
      include: { planta: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { nome: true, email: true, matricula: true } }),
  ])

  // Group by plant and deduplicate perfis
  const plantaMap = new Map<string, { id: string; nome: string; perfis: Set<string> }>()
  for (const p of perfisReais) {
    if (!p.plantaId || !p.planta) continue
    if (!plantaMap.has(p.plantaId)) {
      plantaMap.set(p.plantaId, { id: p.plantaId, nome: p.planta.nome, perfis: new Set() })
    }
    plantaMap.get(p.plantaId)!.perfis.add(p.perfil)
  }

  const plantas = Array.from(plantaMap.values()).map(p => ({
    id: p.id,
    nome: p.nome,
    perfis: Array.from(p.perfis),
  }))

  // No active plants — go to dashboard (will handle no-plant state there)
  if (plantas.length === 0) redirect('/dashboard')

  // 1 or more plants — always render client so cookies get set correctly
  return (
    <SelecionarPlantaClient
      plantas={plantas}
      userName={userRecord?.nome ?? session.user?.name ?? 'Usuário'}
      userEmail={userRecord?.email ?? session.user?.email ?? ''}
      userMatricula={userRecord?.matricula ?? ''}
    />
  )
}
