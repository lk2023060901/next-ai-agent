'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Workspace {
  slug: string
  name: string
  emoji?: string
}

// Placeholder data — replaced by API/store in M2
const MOCK_WORKSPACES: Workspace[] = [
  { slug: 'default', name: '默认工作区', emoji: '🏠' },
  { slug: 'dev', name: '开发团队', emoji: '💻' },
  { slug: 'ops', name: '运维组', emoji: '🔧' },
]

interface WorkspaceSwitcherProps {
  orgSlug: string
  wsSlug: string
}

export function WorkspaceSwitcher({ orgSlug, wsSlug }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const current = MOCK_WORKSPACES.find((w) => w.slug === wsSlug) ?? {
    slug: wsSlug,
    name: wsSlug,
    emoji: '📁',
  }

  function select(ws: Workspace) {
    router.push(`/org/${orgSlug}/ws/${ws.slug}/chat`)
    setOpen(false)
  }

  return (
    <div className="relative px-2 py-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm',
          'hover:bg-[var(--surface-2)] transition-colors',
          open && 'bg-[var(--surface-2)]',
        )}
      >
        <span className="text-base">{current.emoji}</span>
        <span className="flex-1 truncate text-left font-medium text-[var(--text-primary)]">
          {current.name}
        </span>
        <ChevronDown
          size={14}
          className={cn('shrink-0 text-[var(--text-tertiary)] transition-transform duration-[var(--duration-fast)]', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] py-1 shadow-lg">
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              工作区
            </div>
            {MOCK_WORKSPACES.map((ws) => (
              <button
                key={ws.slug}
                onClick={() => select(ws)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--surface)] transition-colors"
              >
                <span>{ws.emoji}</span>
                <span className="flex-1 truncate text-[var(--text-primary)]">{ws.name}</span>
                {ws.slug === wsSlug && <Check size={14} className="text-[var(--color-primary-500)]" />}
              </button>
            ))}
            <div className="border-t border-[var(--border)] mt-1 pt-1">
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">
                <Plus size={14} />
                新建工作区
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
