'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { RISK_STYLES, PLATFORM_ICONS } from '@/lib/constants/agent'
import type { Tool } from '@/types/api'

export interface ToolSelectorProps {
  tools: Tool[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function ToolSelector({ tools, selected, onChange }: ToolSelectorProps) {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const filtered = useMemo(
    () =>
      tools.filter(
        (t) =>
          !search ||
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()),
      ),
    [tools, search],
  )

  const categories = useMemo(() => {
    const cats = Array.from(new Set(filtered.map((t) => t.category)))
    return cats.sort()
  }, [filtered])

  function toggleTool(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  function toggleCategory(cat: string) {
    const catToolIds = filtered.filter((t) => t.category === cat).map((t) => t.id)
    const allSelected = catToolIds.every((id) => selected.includes(id))
    if (allSelected) {
      onChange(selected.filter((s) => !catToolIds.includes(s)))
    } else {
      const newSelected = new Set([...selected, ...catToolIds])
      onChange(Array.from(newSelected))
    }
  }

  function isCategorySelected(cat: string): 'all' | 'some' | 'none' {
    const catToolIds = filtered.filter((t) => t.category === cat).map((t) => t.id)
    const count = catToolIds.filter((id) => selected.includes(id)).length
    if (count === 0) return 'none'
    if (count === catToolIds.length) return 'all'
    return 'some'
  }

  function toggleCollapse(cat: string) {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div className="flex flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <div className="relative max-w-xs flex-1">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工具..."
            aria-label="搜索工具"
            className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent pl-8 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none"
          />
        </div>
        <span className="ml-3 text-xs text-[var(--text-secondary)]">
          已选 {selected.length} / {tools.length}
        </span>
      </div>

      {/* Category list */}
      <div className="max-h-80 overflow-auto">
        {categories.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">
            无匹配工具
          </div>
        ) : (
          categories.map((cat) => {
            const isCollapsed = collapsed[cat] ?? false
            const catState = isCategorySelected(cat)
            const catTools = filtered.filter((t) => t.category === cat)

            return (
              <div key={cat} className="border-b border-[var(--border)] last:border-b-0">
                {/* Category header */}
                <button
                  onClick={() => toggleCollapse(cat)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--surface)]"
                >
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <input
                    type="checkbox"
                    checked={catState === 'all'}
                    ref={(el) => {
                      if (el) el.indeterminate = catState === 'some'
                    }}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleCategory(cat)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`全选 ${cat} 分类`}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--color-primary-500)]"
                  />
                  <span className="font-medium capitalize text-[var(--text-primary)]">{cat}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">({catTools.length})</span>
                </button>

                {/* Tools */}
                {!isCollapsed && (
                  <div>
                    {catTools.map((tool) => {
                      const risk = RISK_STYLES[tool.riskLevel]
                      const platform = PLATFORM_ICONS[tool.platform]
                      const PlatformIcon = platform.icon
                      return (
                        <label
                          key={tool.id}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2 pl-10 hover:bg-[var(--surface)]"
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(tool.id)}
                            onChange={() => toggleTool(tool.id)}
                            className="h-4 w-4 shrink-0 rounded border-[var(--border)] accent-[var(--color-primary-500)]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <code className="font-mono text-sm text-[var(--text-primary)]">
                                {tool.name}
                              </code>
                              <span
                                className={cn(
                                  'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                  risk.className,
                                )}
                              >
                                {risk.label}
                              </span>
                              <span title={platform.label}>
                                <PlatformIcon size={12} className="text-[var(--text-tertiary)]" />
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">
                              {tool.description}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
