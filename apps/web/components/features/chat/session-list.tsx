'use client'

import { useState } from 'react'
import { Plus, Search, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Session } from '@/types/api'

interface SessionListProps {
  sessions: Session[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  loading?: boolean
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

export function SessionList({ sessions, activeId, onSelect, onCreate, loading }: SessionListProps) {
  const [search, setSearch] = useState('')

  const filtered = sessions.filter(
    (s) => !search || s.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--text-primary)]">对话</span>
        <button
          onClick={onCreate}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
          title="新建对话"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5">
          <Search size={13} className="shrink-0 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索对话..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-3 py-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--surface-2)]" />
                <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-[var(--surface-2)]" />
              </div>
            ))
          : filtered.length === 0
            ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <MessageSquare size={24} className="text-[var(--text-tertiary)]" />
                <p className="text-sm text-[var(--text-tertiary)]">{search ? '无匹配对话' : '暂无对话'}</p>
              </div>
            )
            : filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={cn(
                  'flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors',
                  s.id === activeId
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : 'hover:bg-[var(--surface-2)]',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    'truncate text-sm font-medium',
                    s.id === activeId ? 'text-white' : 'text-[var(--text-primary)]',
                  )}>
                    {s.title}
                  </span>
                  {s.lastMessageAt && (
                    <span className={cn(
                      'shrink-0 text-xs',
                      s.id === activeId ? 'text-white/70' : 'text-[var(--text-tertiary)]',
                    )}>
                      {timeAgo(s.lastMessageAt)}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-xs',
                  s.id === activeId ? 'text-white/70' : 'text-[var(--text-tertiary)]',
                )}>
                  {s.messageCount} 条消息
                </span>
              </button>
            ))}
      </div>
    </div>
  )
}
