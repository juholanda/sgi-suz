'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface Props {
  isAprovador?: boolean
  isSolicitante?: boolean
}

function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">
      {name}
    </span>
  )
}

export default function MobileNav({ isAprovador = false, isSolicitante = false }: Props) {
  const pathname = usePathname()

  const items: NavItem[] = [
    { href: '/dashboard', label: 'Início',   icon: 'home' },
    { href: '/metricas',  label: 'Métricas', icon: 'insights' },
    { href: '/perfil',    label: 'Perfil',   icon: 'manage_accounts' },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center"
      style={{
        background: 'white',
        borderTop: '1px solid #E2E8F0',
        height: '60px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item${active ? ' active' : ''}`}
          >
            <Icon name={item.icon} />
            <span className="text-xs font-medium leading-none">{item.label}</span>
            {active && (
              <span
                className="absolute bottom-0 w-6 h-0.5"
                style={{ background: '#0038A8', borderRadius: '4px 4px 0 0' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
