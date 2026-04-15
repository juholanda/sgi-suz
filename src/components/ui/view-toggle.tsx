'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ViewMode = 'table' | 'cards'

interface ViewToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn('inline-flex -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse', className)}>
      <Button
        className={cn(
          'rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10',
          value === 'cards'
            ? 'bg-[#EBF0FB] text-[#0038A8] border-[#0038A8] hover:bg-[#D6E2F7]'
            : '',
        )}
        variant="outline"
        size="icon"
        aria-label="Visualização em cards"
        aria-pressed={value === 'cards'}
        onClick={() => onChange('cards')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true">
          view_agenda
        </span>
      </Button>
      <Button
        className={cn(
          'rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10',
          value === 'table'
            ? 'bg-[#EBF0FB] text-[#0038A8] border-[#0038A8] hover:bg-[#D6E2F7]'
            : '',
        )}
        variant="outline"
        size="icon"
        aria-label="Visualização em tabela"
        aria-pressed={value === 'table'}
        onClick={() => onChange('table')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true">
          reorder
        </span>
      </Button>
    </div>
  )
}
