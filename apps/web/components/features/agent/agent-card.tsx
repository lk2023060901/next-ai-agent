'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MoreHorizontal, Pencil, Trash2, Wrench, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { STATUS_MAP, ROLE_LABELS } from '@/lib/constants/agent'
import type { Agent } from '@/types/api'

export interface AgentCardProps {
  agent: Agent
  onEdit?: (agent: Agent) => void
  onDelete?: (agent: Agent) => void
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuItemsRef = useRef<HTMLButtonElement[]>([])

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  // Focus first menu item when menu opens
  useEffect(() => {
    if (menuOpen) {
      menuItemsRef.current[0]?.focus()
    }
  }, [menuOpen])

  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = menuItemsRef.current.filter(Boolean)
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement)

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        items[next]?.focus()
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        items[prev]?.focus()
        break
      }
      case 'Escape':
        setMenuOpen(false)
        menuButtonRef.current?.focus()
        break
    }
  }, [])

  const statusInfo = STATUS_MAP[agent.status]
  const toolCount = agent.tools.length
  const kbCount = agent.knowledgeBases?.length ?? 0

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-sm)] transition-shadow duration-[var(--duration-fast)] hover:shadow-[var(--shadow-md)]">
      {/* Role color band */}
      <div className="h-1" style={{ backgroundColor: `var(--color-agent-${agent.role})` }} />

      <div className="p-4">
        {/* Top row: avatar + name + role + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-lg">
              {agent.avatar ?? '🤖'}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {agent.name}
              </h3>
              <span
                className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: `var(--color-agent-${agent.role})` }}
              >
                {ROLE_LABELS[agent.role]}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex shrink-0 items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', statusInfo.dot)} />
            <span className="text-xs text-[var(--text-secondary)]">{statusInfo.label}</span>
          </div>
        </div>

        {/* Description */}
        {agent.description && (
          <p className="mt-3 line-clamp-2 text-xs text-[var(--text-secondary)]">
            {agent.description}
          </p>
        )}

        {/* Bottom row: model + tools + kb + menu */}
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
          <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
            <span className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[11px]">
              {agent.model}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wrench size={12} />
              {toolCount}
            </span>
            {kbCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <BookOpen size={12} />
                {kbCount}
              </span>
            )}
          </div>

          {/* Action menu */}
          {(onEdit || onDelete) && (
            <div ref={menuRef} className="relative">
              <button
                ref={menuButtonRef}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="操作菜单"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  onKeyDown={handleMenuKeyDown}
                  className="absolute right-0 top-full z-20 mt-1 w-32 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] py-1 shadow-lg"
                >
                  {onEdit && (
                    <button
                      ref={(el) => {
                        if (el) menuItemsRef.current[0] = el
                      }}
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        onEdit(agent)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
                    >
                      <Pencil size={14} />
                      编辑
                    </button>
                  )}
                  {onDelete && (
                    <button
                      ref={(el) => {
                        if (el) menuItemsRef.current[onEdit ? 1 : 0] = el
                      }}
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete(agent)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--surface)]"
                    >
                      <Trash2 size={14} />
                      删除
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
