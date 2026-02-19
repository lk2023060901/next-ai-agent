'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface Tab {
  key: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  badge?: string | number
}

export interface TabsProps {
  tabs: Tab[]
  defaultKey?: string
  activeKey?: string
  onChange?: (key: string) => void
  children?: (activeKey: string) => ReactNode
  className?: string
}

export function Tabs({ tabs, defaultKey, activeKey: controlled, onChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultKey ?? tabs[0]?.key ?? '')
  const active = controlled ?? internal
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  function select(key: string) {
    if (controlled === undefined) setInternal(key)
    onChange?.(key)
  }

  // Sliding underline indicator
  useEffect(() => {
    if (!listRef.current || !indicatorRef.current) return
    const btn = listRef.current.querySelector<HTMLButtonElement>(`[data-key="${active}"]`)
    if (!btn) return
    const indicator = indicatorRef.current
    indicator.style.left = `${btn.offsetLeft}px`
    indicator.style.width = `${btn.offsetWidth}px`
  }, [active, tabs])

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="relative border-b border-[var(--border)]">
        <div ref={listRef} role="tablist" className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              data-key={tab.key}
              aria-selected={active === tab.key}
              disabled={tab.disabled}
              onClick={() => select(tab.key)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium',
                'transition-colors duration-[var(--duration-fast)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-inset',
                'disabled:cursor-not-allowed disabled:opacity-40',
                active === tab.key
                  ? 'text-[var(--color-primary-500)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    active === tab.key
                      ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-500)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)]',
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Sliding underline */}
        <span
          ref={indicatorRef}
          className="absolute bottom-0 h-0.5 rounded-t-full bg-[var(--color-primary-500)] transition-all duration-[var(--duration-normal)]"
          style={{ left: 0, width: 0 }}
        />
      </div>
      {children && (
        <div role="tabpanel" className="flex-1">
          {children(active)}
        </div>
      )}
    </div>
  )
}
