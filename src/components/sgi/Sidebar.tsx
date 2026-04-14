'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Início', icon: '⌂' },
  { href: '/solicitacoes', label: 'Solicitações', icon: '☰' },
  { href: '/relatorios', label: 'Métricas', icon: '◔' },
  { href: '/perfil', label: 'Perfil', icon: '◉' },
]

const adminLink: NavItem = { href: '/admin', label: 'Backoffice', icon: '⚙' }

interface Props {
  user: {
    name?: string | null
    email?: string | null
    perfis?: string[]
    plantaAtivaNome?: string
    perfilAtivoNome?: string
  }
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const isNonProd = process.env.NODE_ENV !== 'production'
  const canAccessBackoffice = (user.perfis ?? []).includes('ADMINISTRADOR')

  return (
    <aside
      className="w-60 flex flex-col shrink-0"
      style={{ background: '#0038A8', minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', color: 'white' }}
          >
            S
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">SGI</div>
            <div className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Suzano
            </div>
          </div>
        </div>
      </div>

      {/* Context switchers */}
      <div className="px-4 py-4 border-b space-y-2" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div>
          <label className="block text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Planta ativa
          </label>
          <button
            type="button"
            className="w-full text-left text-xs px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {user.plantaAtivaNome ?? 'Planta 1'} ▼
          </button>
        </div>
        {isNonProd && (
          <div>
            <label className="block text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Perfil ativo
            </label>
            <button
              type="button"
              className="w-full text-left text-xs px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {user.perfilAtivoNome ?? 'Solicitante'} ▼
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const active =
            item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
              style={{
                borderRadius: '4px',
                color: active ? 'white' : 'rgba(255,255,255,0.7)',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: active ? 500 : 400,
              }}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        {canAccessBackoffice && (
          <div className="pt-3 mt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 text-sm transition-colors"
              style={{
                borderRadius: '4px',
                color: pathname.startsWith('/admin') ? 'white' : 'rgba(255,255,255,0.7)',
                background: pathname.startsWith('/admin') ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: pathname.startsWith('/admin') ? 500 : 400,
              }}
            >
              <span className="text-base w-5 text-center">{adminLink.icon}</span>
              {adminLink.label}
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}
          >
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {user.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-xs py-1.5 text-center transition-colors"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
