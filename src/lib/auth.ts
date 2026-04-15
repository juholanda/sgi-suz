import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  matricula: z.string().min(1),
  senha: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        try {
          const parsed = loginSchema.safeParse(credentials)
          if (!parsed.success) return null

          const user = await prisma.user.findUnique({
            where: { matricula: parsed.data.matricula },
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
        } catch (err) {
          console.error('[auth] authorize error:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist custom fields into the JWT
        token.id = user.id
        token.sub = user.id  // ensure sub is always the DB user ID
        token.matricula = (user as any).matricula
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        // Use token.id or token.sub (NextAuth v5 auto-sets sub = user.id)
        session.user.id = (token.id ?? token.sub) as string
        ;(session.user as any).matricula = token.matricula
      }
      return session
    },
  },
})
