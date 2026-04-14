import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      matricula?: string
      name?: string | null
      email?: string | null
      perfis?: string[]
      plantas?: Array<{ id: string; nome: string }>
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    matricula?: string
    perfis?: string[]
    plantas?: Array<{ id: string; nome: string }>
  }
}
