/**
 * scope.ts — Centralized Planta/Perfil Scoping
 *
 * SOURCE OF TRUTH for multi-plant access control.
 *
 * Every query that returns Solicitação data MUST use `buildPlantaScope()`
 * so users never see data from another planta.
 *
 * Chain: Solicitacao.areaId → Area.plantaId → Planta.id
 */

import { cookies } from 'next/headers'
import { prisma } from './db'

// ─── Read active context from cookies ────────────────────────────────────────

/**
 * Returns the active planta ID from the session cookie.
 * Returns null if no planta is selected (e.g. not yet chosen).
 */
export async function getPlantaAtiva(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('sgi_planta_ativa')?.value ?? null
}

/**
 * Returns the active planta ID or throws.
 * Use in pages that REQUIRE planta context.
 */
export async function requirePlantaAtiva(): Promise<string> {
  const plantaId = await getPlantaAtiva()
  if (!plantaId) {
    throw new Error('Nenhuma planta ativa selecionada.')
  }
  return plantaId
}

// ─── Prisma where-clause builders ────────────────────────────────────────────

/**
 * Prisma `where` fragment that restricts Solicitação queries
 * to a single planta (via the area → planta join).
 *
 * Usage:
 *   prisma.solicitacao.findMany({
 *     where: { ...otherFilters, ...buildPlantaScope(plantaId) },
 *   })
 */
export function buildPlantaScope(plantaId: string) {
  return { area: { plantaId } } as const
}

/**
 * Build the full Solicitação scope considering:
 * - active planta (ALWAYS applied, except ADMINISTRADOR global)
 * - user's perfis in that planta
 *
 * Returns a Prisma `where` fragment.
 */
export async function buildUserScope(userId: string, plantaId: string) {
  const perfis = await prisma.usuarioPerfil.findMany({
    where: { userId, plantaId },
    select: { perfil: true, areaId: true },
  })

  const perfilNames = perfis.map(p => p.perfil)
  const isAdmin = perfilNames.includes('ADMINISTRADOR')
  const isGestorSms = perfilNames.includes('GESTOR_SMS')

  // Admin / Gestor SMS: see everything in the planta
  if (isAdmin || isGestorSms) {
    return buildPlantaScope(plantaId)
  }

  // Area restrictions: perfis that have specific areaId
  const restrictedAreaIds = perfis
    .filter(p => p.areaId !== null)
    .map(p => p.areaId as string)

  // If ALL perfis have area restrictions, narrow the scope
  const allRestricted = perfis.length > 0 && perfis.every(p => p.areaId !== null)
  if (allRestricted && restrictedAreaIds.length > 0) {
    return { areaId: { in: restrictedAreaIds }, ...buildPlantaScope(plantaId) }
  }

  // Otherwise: planta-wide access
  return buildPlantaScope(plantaId)
}

/**
 * Returns area list filtered to the active planta.
 */
export async function getAreasForPlanta(plantaId: string) {
  return prisma.area.findMany({
    where: { plantaId },
    include: { planta: { select: { nome: true } } },
    orderBy: { nome: 'asc' },
  })
}
