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

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          matricula: user.matricula,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.matricula = (user as any).matricula
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).matricula = token.matricula
      }
      return session
    },
  },
})
