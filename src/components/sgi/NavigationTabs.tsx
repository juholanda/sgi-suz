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
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  return (
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
  )
}
