'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Wrench, Monitor, Cloud, ChevronDown, ChevronRight, Search, Shield } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Tabs } from '@/components/ui/tabs'
import { ToolAuthMatrix } from '@/components/features/agent/tool-auth-matrix'
import { useTools } from '@/hooks/use-tools'
import { RISK_TABS, RISK_STYLES, PLATFORM_ICONS } from '@/lib/constants/agent'
import type { Tool } from '@/types/api'

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-tertiary)]">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      </div>
    </div>
  )
}

export default function ToolRegistryPage() {
  const params = useParams<{ wsSlug: string }>()
  const wsSlug = params.wsSlug
  const { data: tools, isLoading } = useTools(wsSlug)

  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [showMatrix, setShowMatrix] = useState(false)

  const filtered = useMemo(() => {
    if (!tools) return []
    return tools.filter((t) => {
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      const matchesRisk = riskFilter === 'all' || t.riskLevel === riskFilter
      return matchesSearch && matchesRisk
    })
  }, [tools, search, riskFilter])

  const categories = useMemo(
    () => Array.from(new Set(filtered.map((t) => t.category))).sort(),
    [filtered],
  )

  const stats = useMemo(() => {
    if (!tools) return { total: 0, local: 0, cloud: 0 }
    return {
      total: tools.length,
      local: tools.filter((t) => t.platform === 'local').length,
      cloud: tools.filter((t) => t.platform === 'cloud' || t.platform === 'both').length,
    }
  }, [tools])

  function toggleCollapse(cat: string) {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-2)]"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">工具注册表</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">查看和管理可用工具</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="总工具数" value={stats.total} icon={<Wrench size={20} />} />
        <StatCard label="本地工具" value={stats.local} icon={<Monitor size={20} />} />
        <StatCard label="云端工具" value={stats.cloud} icon={<Cloud size={20} />} />
      </div>

      {/* Auth Matrix toggle */}
      <div>
        <button
          onClick={() => setShowMatrix((v) => !v)}
          aria-expanded={showMatrix}
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)]"
        >
          <Shield size={16} />
          {showMatrix ? '收起权限矩阵' : '展开权限矩阵'}
        </button>
        {showMatrix && tools && (
          <div className="mt-3">
            <ToolAuthMatrix workspaceId={wsSlug} tools={tools} />
          </div>
        )}
      </div>

      {/* Search + Risk filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工具..."
            aria-label="搜索工具"
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none"
          />
        </div>
        <Tabs
          tabs={RISK_TABS.map((t) => ({
            ...t,
            ...(tools
              ? {
                  badge:
                    t.key === 'all'
                      ? tools.length
                      : tools.filter((tool) => tool.riskLevel === t.key).length,
                }
              : {}),
          }))}
          activeKey={riskFilter}
          onChange={setRiskFilter}
          className="flex-1"
        />
      </div>

      {/* Category accordion */}
      {categories.length === 0 ? (
        <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">无匹配工具</div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => {
            const isCollapsed = collapsed[cat] ?? false
            const catTools = filtered.filter((t) => t.category === cat)

            return (
              <div
                key={cat}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)]"
              >
                <button
                  onClick={() => toggleCollapse(cat)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[var(--surface)]"
                >
                  {isCollapsed ? (
                    <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronDown size={16} className="text-[var(--text-tertiary)]" />
                  )}
                  <span className="text-sm font-semibold capitalize text-[var(--text-primary)]">
                    {cat}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">({catTools.length})</span>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-[var(--border)]">
                    {catTools.map((tool) => (
                      <ToolItem key={tool.id} tool={tool} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ToolItem({ tool }: { tool: Tool }) {
  const risk = RISK_STYLES[tool.riskLevel]
  const platform = PLATFORM_ICONS[tool.platform]
  const PlatformIcon = platform.icon

  return (
    <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-3 first:border-t-0 hover:bg-[var(--surface)]">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm font-medium text-[var(--text-primary)]">
            {tool.name}
          </code>
          <span
            className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', risk.className)}
          >
            {risk.label}
          </span>
          <span
            className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]"
            title={platform.label}
          >
            <PlatformIcon size={12} />
            {platform.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{tool.description}</p>
      </div>
      {tool.requiresApproval && (
        <span className="shrink-0 rounded-full bg-[var(--color-warning-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-warning-700)]">
          需审批
        </span>
      )}
    </div>
  )
}
