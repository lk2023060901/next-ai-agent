'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { WorkspaceSwitcher } from '@/components/features/workspace/workspace-switcher'
import { Breadcrumb } from './breadcrumb'
import { cn } from '@/lib/utils/cn'

interface WsLayoutClientProps {
  orgSlug: string
  wsSlug: string
  children: ReactNode
}

export function WsLayoutClient({ orgSlug, wsSlug, children }: WsLayoutClientProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: static; mobile: fixed overlay */}
      <div
        className={cn(
          'flex h-full flex-col',
          // Mobile: fixed overlay drawer
          'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:transition-transform max-md:duration-300',
          mobileSidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        )}
      >
        <WorkspaceSwitcher orgSlug={orgSlug} wsSlug={wsSlug} />
        <div className="flex-1 overflow-hidden">
          <Sidebar orgSlug={orgSlug} wsSlug={wsSlug} />
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          {/* Hamburger — mobile only */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface)] md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="打开菜单"
          >
            <Menu size={18} />
          </button>
          <Breadcrumb />
        </div>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
