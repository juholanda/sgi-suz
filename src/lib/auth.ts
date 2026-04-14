import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  matricula: z.string().min(1),
  senha: z.string().min(1),
})

function toSessionContext(
  perfis: Array<{ perfil: string; plantaId: string | null; planta: { id: string; nome: string } | null }>,
) {
  const perfilList = Array.from(new Set(perfis.map(p => p.perfil)))
  const plantaMap = new Map<string, { id: string; nome: string }>()
  for (const perfil of perfis) {
    if (perfil.planta?.id) {
      plantaMap.set(perfil.planta.id, { id: perfil.planta.id, nome: perfil.planta.nome })
    }
  }
  return {
    perfis: perfilList,
    plantas: Array.from(plantaMap.values()),
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Matrícula e Senha',
      credentials: {
        matricula: { label: 'Matrícula', type: 'text' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { matricula: parsed.data.matricula },
          include: { perfis: { include: { planta: true, area: true } } },
        })
        if (!user || !user.ativo) return null

        const valid = await bcrypt.compare(parsed.data.senha, user.passwordHash)
        if (!valid) return null

        const sessionContext = toSessionContext(
          user.perfis.map(perfil => ({
            perfil: perfil.perfil,
            plantaId: perfil.plantaId,
            planta: perfil.planta ? { id: perfil.planta.id, nome: perfil.planta.nome } : null,
          })),
        )

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          matricula: user.matricula,
          perfis: sessionContext.perfis,
          plantas: sessionContext.plantas,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.matricula = (user as any).matricula
        ;(token as any).perfis = (user as any).perfis ?? []
        ;(token as any).plantas = (user as any).plantas ?? []
      }

      if (
        token.id &&
        (
          !Array.isArray((token as any).perfis) ||
          (token as any).perfis.length === 0
        )
      ) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { perfis: { include: { planta: true } } },
        })
        if (currentUser) {
          const sessionContext = toSessionContext(
            currentUser.perfis.map(perfil => ({
              perfil: perfil.perfil,
              plantaId: perfil.plantaId,
              planta: perfil.planta ? { id: perfil.planta.id, nome: perfil.planta.nome } : null,
            })),
          )
          ;(token as any).perfis = sessionContext.perfis
          ;(token as any).plantas = sessionContext.plantas
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).matricula = token.matricula
        ;(session.user as any).perfis = (token as any).perfis ?? []
        ;(session.user as any).plantas = (token as any).plantas ?? []
      }
      return session
    },
  },
})
