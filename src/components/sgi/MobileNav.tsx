'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const mobileNavItems = [
  { href: '/dashboard',    label: 'Início',       icon: '⊞' },
  { href: '/solicitacoes', label: 'Solicitações',  icon: '📋' },
  { href: '/aprovacoes',   label: 'Aprovações',    icon: '✓' },
  { href: '/execucao',     label: 'Execução',      icon: '⚙' },
  { href: '/relatorios',   label: 'Relatórios',    icon: '📊' },
]

export default function MobileNav() {
  const pathname = usePathname()

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
      {mobileNavItems.map(item => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1"
            style={{ color: active ? '#0038A8' : '#94A3B8' }}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
            {active && (
              <span className="absolute bottom-0 w-6 h-0.5" style={{ background: '#0038A8', borderRadius: '4px 4px 0 0' }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
