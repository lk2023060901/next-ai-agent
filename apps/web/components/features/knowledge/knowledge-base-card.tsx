'use client'

import { useState, useRef, useEffect } from 'react'
import { BookOpen, FileText, MoreHorizontal, Pencil, Trash2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { KnowledgeBase } from '@/types/api'

interface KnowledgeBaseCardProps {
  kb: KnowledgeBase
  onEdit?: (kb: KnowledgeBase) => void
  onDelete?: (kb: KnowledgeBase) => void
  onClick?: (kb: KnowledgeBase) => void
}

const MODEL_LABELS: Record<string, string> = {
  'text-embedding-3-small': 'TE3 Small',
  'text-embedding-3-large': 'TE3 Large',
  'embed-english-v3.0': 'Cohere v3',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function KnowledgeBaseCard({ kb, onEdit, onDelete, onClick }: KnowledgeBaseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)]',
        'shadow-[var(--shadow-sm)] transition-shadow duration-[var(--duration-fast)] hover:shadow-[var(--shadow-md)]',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick ? () => onClick(kb) : undefined}
    >
      {/* Top color band */}
      <div className="h-1 bg-[var(--color-primary-400)]" />

      <div className="p-4">
        {/* Icon + Name row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
              <BookOpen className="h-5 w-5 text-[var(--color-primary-500)]" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {kb.name}
              </h3>
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]">
                {MODEL_LABELS[kb.embeddingModel] ?? kb.embeddingModel}
              </span>
            </div>
          </div>

          {/* Action menu */}
          {(onEdit || onDelete) && (
            <div ref={menuRef} className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen((v) => !v)
                }}
                className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 w-32 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] py-1 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEdit && (
                    <button
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); onEdit(kb) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      编辑
                    </button>
                  )}
                  {onDelete && (
                    <button
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); onDelete(kb) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--surface)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {kb.description && (
          <p className="mt-3 line-clamp-2 text-xs text-[var(--text-secondary)]">
            {kb.description}
          </p>
        )}

        {/* Footer: doc count + updated */}
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {kb.documentCount} 个文档
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(kb.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
