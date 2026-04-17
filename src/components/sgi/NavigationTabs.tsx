'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Tab {
  key: string
  label: string
  icon: string
  count?: number
}

interface NavigationTabsProps {
  tabs: Tab[]
  activeTab: string
  paramName?: string
  defaultTab?: string
}

export function NavigationTabs({ tabs, activeTab, paramName = 'tab', defaultTab }: NavigationTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === defaultTab) {
      params.delete(paramName)
    } else {
      params.set(paramName, value)
    }
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  return (
    <>
      {/* ── Desktop: traditional underlined tabs ── */}
      <div className="hidden sm:block">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            {tabs.map(t => (
              <TabsTrigger key={t.key} value={t.key}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                >
                  {t.icon}
                </span>
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: activeTab === t.key ? '#EBF0FB' : '#F1F5F9',
                      color: activeTab === t.key ? '#0038A8' : '#94A3B8',
                      lineHeight: '16px',
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* ── Mobile: rounded chips ── */}
      <div
        className="sm:hidden flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {tabs.map(t => {
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#FFFFFF' : '#475569',
                background: isActive ? '#0038A8' : '#FFFFFF',
                border: isActive ? '1px solid #0038A8' : '1px solid #E2E8F0',
                borderRadius: 999,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                    color: isActive ? '#FFFFFF' : '#64748B',
                    lineHeight: '16px',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
