'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Network,
  FolderKanban,
  BookOpen,
  Brain,
  Puzzle,
  Hash,
  Settings,
  BarChart3,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useT } from '@/lib/i18n'

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: string | number
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

interface SidebarProps {
  orgSlug: string
  wsSlug: string
}

function buildNav(
  orgSlug: string,
  wsSlug: string,
  nav: ReturnType<typeof useT>['nav'],
): NavGroup[] {
  const base = `/org/${orgSlug}/ws/${wsSlug}`
  return [
    {
      items: [
        {
          key: 'dashboard',
          label: nav.overview,
          icon: <LayoutDashboard size={18} />,
          href: `/org/${orgSlug}/dashboard`,
        },
      ],
    },
    {
      label: nav.workspace,
      items: [
        { key: 'chat', label: nav.chat, icon: <MessageSquare size={18} />, href: `${base}/chat` },
        { key: 'agents', label: nav.agents, icon: <Bot size={18} />, href: `${base}/agents` },
        {
          key: 'overview',
          label: nav.agentOverview,
          icon: <Network size={18} />,
          href: `${base}/agents/overview`,
        },
        {
          key: 'projects',
          label: nav.projects,
          icon: <FolderKanban size={18} />,
          href: `${base}/projects`,
        },
        {
          key: 'channels',
          label: nav.channels,
          icon: <Hash size={18} />,
          href: `${base}/channels`,
        },
      ],
    },
    {
      label: nav.resources,
      items: [
        {
          key: 'knowledge',
          label: nav.knowledge,
          icon: <BookOpen size={18} />,
          href: `${base}/knowledge`,
        },
        { key: 'memory', label: nav.memory, icon: <Brain size={18} />, href: `${base}/memory` },
        { key: 'plugins', label: nav.plugins, icon: <Puzzle size={18} />, href: `${base}/plugins` },
      ],
    },
    {
      label: nav.operations,
      items: [
        {
          key: 'monitoring',
          label: nav.monitoring,
          icon: <BarChart3 size={18} />,
          href: `${base}/monitoring`,
        },
        {
          key: 'scheduler',
          label: nav.scheduler,
          icon: <CalendarClock size={18} />,
          href: `${base}/scheduler`,
        },
      ],
    },
    {
      items: [
        {
          key: 'settings',
          label: nav.settings,
          icon: <Settings size={18} />,
          href: `${base}/settings`,
        },
      ],
    },
  ]
}

export function Sidebar({ orgSlug, wsSlug }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { nav } = useT()
  const groups = buildNav(orgSlug, wsSlug, nav)

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-[var(--duration-normal)]',
        collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]',
      )}
    >
      {/* Nav groups */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.label && !collapsed && (
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {group.label}
              </div>
            )}
            {group.label && !collapsed && gi > 0 && (
              <div className="mx-3 mb-1 border-t border-[var(--border)]" />
            )}
            {group.items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium',
                  'transition-colors duration-[var(--duration-fast)]',
                  isActive(item.href)
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                  collapsed && 'justify-center px-2',
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-auto rounded-full bg-[var(--color-primary-100)] px-1.5 py-0.5 text-xs font-semibold text-[var(--color-primary-600)]">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          'absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] shadow-sm',
          'transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]',
        )}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
