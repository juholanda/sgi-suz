import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sgi/Sidebar'
import MobileNav from '@/components/sgi/MobileNav'
import { AppToastProvider } from '@/components/sgi/AppToastProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const perfis = ((session.user as any)?.perfis as string[]) ?? ['SOLICITANTE']
  const plantas = ((session.user as any)?.plantas as Array<{ id: string; nome: string }>) ?? [
    { id: 'planta-default', nome: 'Planta 1' },
  ]
  const contextoAtivo = {
    plantaId: ((session.user as any)?.plantaAtivaId as string) ?? plantas[0].id,
    perfil: ((session.user as any)?.perfilAtivo as string) ?? perfis[0],
  }
  const canSeeBackoffice = perfis.includes('ADMINISTRADOR')
  const canSwitchPerfil = process.env.NODE_ENV !== 'production'
  const isDevelopment = process.env.NODE_ENV !== 'production'

  return (
    <AppToastProvider>
      <div className="flex min-h-screen" style={{ background: '#F0F4F8' }}>
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar
            user={{
              ...(session.user ?? {}),
              perfis,
              plantaAtivaNome:
                plantas.find(p => p.id === contextoAtivo.plantaId)?.nome ?? plantas[0]?.nome ?? 'Planta 1',
              perfilAtivoNome: contextoAtivo.perfil,
            }}
          />
        </div>

        {/* Main content — padding-bottom on mobile for bottom nav */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav — hidden on desktop */}
        <MobileNav />
      </div>
    </AppToastProvider>
  )
}
