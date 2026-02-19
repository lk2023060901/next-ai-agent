'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
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

function buildNav(orgSlug: string, wsSlug: string): NavGroup[] {
  const base = `/org/${orgSlug}/ws/${wsSlug}`
  return [
    {
      items: [
        { key: 'dashboard', label: '概览', icon: <LayoutDashboard size={18} />, href: `/org/${orgSlug}/dashboard` },
      ],
    },
    {
      label: '工作区',
      items: [
        { key: 'chat', label: '对话', icon: <MessageSquare size={18} />, href: `${base}/chat` },
        { key: 'agents', label: 'Agent', icon: <Bot size={18} />, href: `${base}/agents` },
        { key: 'projects', label: '项目', icon: <FolderKanban size={18} />, href: `${base}/projects` },
        { key: 'channels', label: '频道', icon: <Hash size={18} />, href: `${base}/channels` },
      ],
    },
    {
      label: '资源',
      items: [
        { key: 'knowledge', label: '知识库', icon: <BookOpen size={18} />, href: `${base}/knowledge` },
        { key: 'memory', label: '记忆', icon: <Brain size={18} />, href: `${base}/memory` },
        { key: 'plugins', label: '插件', icon: <Puzzle size={18} />, href: `${base}/plugins` },
      ],
    },
    {
      label: '运维',
      items: [
        { key: 'monitoring', label: '监控', icon: <BarChart3 size={18} />, href: `${base}/monitoring` },
        { key: 'scheduler', label: '调度', icon: <CalendarClock size={18} />, href: `${base}/scheduler` },
      ],
    },
    {
      items: [
        { key: 'settings', label: '设置', icon: <Settings size={18} />, href: `${base}/settings` },
      ],
    },
  ]
}

export function Sidebar({ orgSlug, wsSlug }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const groups = buildNav(orgSlug, wsSlug)

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
          'hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-colors',
        )}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
