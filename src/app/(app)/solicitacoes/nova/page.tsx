import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import NovaSolicitacaoClient from './NovaSolicitacaoClient'

/**
 * Server Component — pré-busca áreas, medidas e userId no servidor antes de
 * renderizar o formulário client-side. Elimina 3 round-trips de rede no mount.
 */
export default async function NovaSolicitacaoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = ((session.user as any)?.id ?? (session.user as any)?.sub) as string

  const cookieStore = await cookies()
  const plantaId = cookieStore.get('sgi_planta_ativa')?.value ?? null

  const [areas, medidas] = await Promise.all([
    prisma.area.findMany({
      where: {
        ativa: true,
        planta: { ativa: true },
        ...(plantaId ? { plantaId } : {}),
      },
      select: {
        id: true,
        nome: true,
        codigo: true,
        planta: { select: { id: true, nome: true } },
      },
      orderBy: [{ planta: { nome: 'asc' } }, { nome: 'asc' }],
    }),
    prisma.medidaContingencial.findMany({
      where: { ativa: true },
      orderBy: { ordem: 'asc' },
    }),
  ])

  return (
    <Suspense>
      <NovaSolicitacaoClient
        initialAreas={areas}
        initialMedidas={medidas}
        initialUserId={userId}
      />
    </Suspense>
  )
}
