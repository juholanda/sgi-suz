'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface NavItem {
  href: string
  label: string
  icon: string // Material Symbol name
}

const navItems: NavItem[] = [
  { href: '/admin',             label: 'Início',               icon: 'space_dashboard' },
  { href: '/admin/plantas',     label: 'Plantas / Unidades',   icon: 'factory' },
  { href: '/admin/areas',       label: 'Áreas Operacionais',   icon: 'location_on' },
  { href: '/admin/equipamentos',label: 'Equipamentos',          icon: 'settings' },
  { href: '/admin/classes',     label: 'Classes de Risco',     icon: 'warning' },
  { href: '/admin/alcadas',     label: 'Alçadas de Aprovação', icon: 'account_tree' },
  { href: '/admin/usuarios',    label: 'Usuários e Perfis',    icon: 'manage_accounts' },
  { href: '/admin/delegacoes',  label: 'Suplências',           icon: 'swap_horiz' },
]

interface Props {
  user: { name?: string | null; email?: string | null }
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, flexShrink: 0 }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

export default function BackofficeSidebar({ user }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className="w-64 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{ background: '#0F172A' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#0038A8', borderRadius: '6px' }}
          >
            <Icon name="admin_panel_settings" size={16} />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">SGI Backoffice</div>
            <div className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>Administração</div>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="backoffice-nav-item mt-3"
          style={{ fontSize: 12, padding: '4px 6px', gap: 6 }}
        >
          <Icon name="arrow_back" size={14} />
          Ir para o sistema
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
              className={`backoffice-nav-item${active ? ' active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
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
          className="backoffice-nav-item w-full justify-center"
          style={{ fontSize: 12 }}
        >
          <Icon name="logout" size={14} />
          Sair
        </button>
      </div>
    </aside>
  )
}
