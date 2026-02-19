'use client'

import { useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from './empty-state'

export interface Column<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  width?: string
  render?: (row: T, index: number) => ReactNode
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  loading?: boolean
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

type SortDir = 'asc' | 'desc' | null

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  loading = false,
  pageSize = 10,
  emptyTitle = '暂无数据',
  emptyDescription,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page, setPage] = useState(1)

  function handleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir(null)
    }
    setPage(1)
  }

  const sorted = sortKey && sortDir
    ? [...data].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        const cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'zh-CN', { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    : data

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  function SortIcon({ col }: { col: Column<T> }) {
    if (!col.sortable) return null
    const key = String(col.key)
    if (sortKey !== key) return <ChevronsUpDown size={14} className="opacity-40" />
    if (sortDir === 'asc') return <ChevronUp size={14} />
    return <ChevronDown size={14} />
  }

  return (
    <div className={cn('flex flex-col gap-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]',
                    col.sortable && 'cursor-pointer select-none hover:text-[var(--text-primary)]',
                  )}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)] last:border-0">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-[var(--surface-2)]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState
                    title={emptyTitle}
                    {...(emptyDescription ? { description: emptyDescription } : {})}
                  />
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr
                  key={String(row[keyField])}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors duration-[var(--duration-fast)]"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-[var(--text-primary)]">
                      {col.render
                        ? col.render(row, (page - 1) * pageSize + idx)
                        : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <span className="text-sm text-[var(--text-secondary)]">
            共 {sorted.length} 条，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.min(Math.max(page - 2 + i, 1 + i), totalPages - (Math.min(5, totalPages) - 1 - i))
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'rounded-[var(--radius-sm)] px-3 py-1 text-sm transition-colors',
                    p === page
                      ? 'bg-[var(--color-primary-500)] text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]',
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
