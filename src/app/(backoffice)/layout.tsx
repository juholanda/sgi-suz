import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BackofficeSidebar from '@/components/sgi/BackofficeSidebar'

export default async function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  // TODO: verificar perfil ADMINISTRADOR

  return (
    <div className="flex min-h-screen" style={{ background: '#F0F4F8' }}>
      <BackofficeSidebar user={session.user ?? {}} />
      <main className="flex-1 overflow-auto pb-6">
        {children}
      </main>
    </div>
  )
}
