'use client'

import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type KeyboardEvent,
} from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface SelectOption {
  value: string
  label: string
  group?: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  placeholder?: string
  label?: string
  error?: string
  hint?: string
  searchable?: boolean
  multiple?: boolean
  disabled?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
}

export function Select({
  options,
  value,
  onChange,
  placeholder = '请选择',
  label,
  error,
  hint,
  searchable = false,
  multiple = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = multiple
    ? Array.isArray(value)
      ? value
      : value
        ? [value]
        : []
    : value ?? ''

  const filtered = options.filter(
    (o) =>
      !search || o.label.toLowerCase().includes(search.toLowerCase()),
  )

  const groups = Array.from(new Set(filtered.map((o) => o.group ?? '')))

  const getLabel = (v: string) => options.find((o) => o.value === v)?.label ?? v

  function toggle(v: string) {
    if (multiple) {
      const arr = selected as string[]
      const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
      onChange?.(next)
    } else {
      onChange?.(v)
      setOpen(false)
    }
  }

  function isSelected(v: string) {
    return multiple ? (selected as string[]).includes(v) : selected === v
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const triggerText = multiple
    ? (selected as string[]).length > 0
      ? (selected as string[]).map(getLabel).join(', ')
      : placeholder
    : selected
      ? getLabel(selected as string)
      : placeholder

  return (
    <div
      ref={containerRef}
      className={cn('relative flex flex-col gap-1.5', fullWidth && 'w-full')}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border bg-[var(--bg)] px-3 text-sm',
          'border-[var(--border)] transition-colors duration-[var(--duration-fast)]',
          'hover:border-[var(--border-hover)]',
          'focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]',
          'disabled:cursor-not-allowed disabled:bg-[var(--surface)] disabled:opacity-50',
          error && 'border-[var(--color-danger)]',
          open && 'border-[var(--color-primary-500)] ring-1 ring-[var(--color-primary-500)]',
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {leftIcon && <span className="text-[var(--text-tertiary)]">{leftIcon}</span>}
          <span className={cn('truncate', !selected || (Array.isArray(selected) && selected.length === 0) ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]')}>
            {triggerText}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-[var(--text-tertiary)] transition-transform duration-[var(--duration-fast)]', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] shadow-lg">
          {searchable && (
            <div className="relative border-b border-[var(--border)] px-3 py-2">
              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索..."
                className="w-full bg-transparent pl-6 text-sm outline-none placeholder:text-[var(--text-tertiary)]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          <ul className="max-h-60 overflow-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--text-tertiary)]">无匹配选项</li>
            ) : (
              groups.map((group) => (
                <li key={group}>
                  {group && (
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      {group}
                    </div>
                  )}
                  {filtered
                    .filter((o) => (o.group ?? '') === group)
                    .map((option) => (
                      <button
                        key={option.value}
                        role="option"
                        aria-selected={isSelected(option.value)}
                        disabled={option.disabled}
                        onClick={() => toggle(option.value)}
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-2 text-sm',
                          'transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface)]',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                          isSelected(option.value) && 'text-[var(--color-primary-500)]',
                        )}
                      >
                        <span>{option.label}</span>
                        {isSelected(option.value) && <Check size={14} />}
                      </button>
                    ))}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>}
    </div>
  )
}
