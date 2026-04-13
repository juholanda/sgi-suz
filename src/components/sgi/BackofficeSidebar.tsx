'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/admin', label: 'Início', icon: '⊞' },
  { href: '/admin/plantas', label: 'Plantas / Unidades', icon: '🏭' },
  { href: '/admin/areas', label: 'Áreas Operacionais', icon: '📍' },
  { href: '/admin/equipamentos', label: 'Equipamentos', icon: '⚙' },
  { href: '/admin/classes', label: 'Classes de Risco', icon: '🔴' },
  { href: '/admin/alcadas', label: 'Alçadas de Aprovação', icon: '✓' },
  { href: '/admin/usuarios', label: 'Usuários e Perfis', icon: '👤' },
  { href: '/admin/delegacoes', label: 'Suplências', icon: '↔' },
]

interface Props {
  user: { name?: string | null; email?: string | null }
}

export default function BackofficeSidebar({ user }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex flex-col shrink-0" style={{ background: '#0F172A', minHeight: '100vh' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold"
            style={{ background: '#0038A8', borderRadius: '4px', color: 'white' }}
          >
            BO
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">SGI Backoffice</div>
            <div className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>Administração</div>
          </div>
        </div>
        {/* Link para frontoffice */}
        <Link
          href="/dashboard"
          className="mt-3 flex items-center gap-1.5 text-xs"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Ir para o sistema
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm transition-colors"
              style={{
                borderRadius: '4px',
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                background: active ? '#0038A8' : 'transparent',
                fontWeight: active ? 500 : 400,
              }}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}
          >
            {user.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Administrador</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-xs py-1.5"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
