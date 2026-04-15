import { PrismaClient } from '@prisma/client'

/**
 * Resolve DATABASE_URL from process.env or .env files.
 * Some launch environments (MCP Preview sandbox) don't load .env.local
 * and process.cwd() may throw, so we try multiple strategies.
 */
function resolveDatabaseUrl(): string | undefined {
  // 1. Already available in process.env
  if (process.env.DATABASE_URL?.startsWith('postgres')) {
    return process.env.DATABASE_URL
  }

  // 2. Try loading from .env files using multiple root-finding strategies
  try {
    const fs = require('fs')
    const path = require('path')

    const roots: string[] = []

    // Strategy A: __dirname (webpack sets this to the module's source dir)
    try { roots.push(path.resolve(__dirname, '..', '..')) } catch {}

    // Strategy B: process.cwd()
    try { roots.push(process.cwd()) } catch {}

    // Strategy C: find package.json via require.resolve
    try { roots.push(path.dirname(require.resolve('../../package.json'))) } catch {}

    for (const root of roots) {
      for (const envFile of ['.env.local', '.env']) {
        try {
          const fp = path.join(root, envFile)
          if (fs.existsSync(fp)) {
            const content = fs.readFileSync(fp, 'utf8')
            const match = content.match(/^DATABASE_URL=["']?(postgres[^\s"']+)/m)
            if (match?.[1]) {
              // Populate process.env so other modules can use it
              process.env.DATABASE_URL = match[1]
              return match[1]
            }
          }
        } catch {}
      }
    }
  } catch {}

  return undefined
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const databaseUrl = resolveDatabaseUrl()

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(databaseUrl ? { datasourceUrl: databaseUrl } : undefined)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
