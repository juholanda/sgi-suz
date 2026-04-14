import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type Crumb = {
  label: string
  href?: string
}

interface Props {
  items: Crumb[]
  backHref?: string
}

export function PageBreadcrumb({ items, backHref }: Props) {
  return (
    <div className="mb-4 flex items-center gap-2 text-xs" style={{ color: '#64748B' }}>
      {backHref && (
        <Link
          href={backHref}
          aria-label="Voltar"
          className="flex h-6 w-6 items-center justify-center border transition-colors hover:bg-slate-50"
          style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#334155' }}
        >
          <ChevronLeft size={16} />
        </Link>
      )}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <span key={`${item.label}-${idx}`} className="flex items-center gap-1">
              {isLast || !item.href ? (
                <span style={{ color: '#0F172A', fontWeight: 600 }}>{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:underline" style={{ color: '#475569' }}>
                  {item.label}
                </Link>
              )}
              {!isLast && <span style={{ color: '#94A3B8' }}>{'>'}</span>}
            </span>
          )
        })}
      </nav>
    </div>
  )
}
