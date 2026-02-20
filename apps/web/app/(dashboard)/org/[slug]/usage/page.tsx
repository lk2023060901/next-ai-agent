'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Database, Activity, Clock, DollarSign, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { StatCard } from '@/components/features/dashboard/stat-card'
import { TokenTrendChart } from '@/components/features/usage/token-trend-chart'
import { ProviderPieChart } from '@/components/features/usage/provider-pie-chart'
import { AgentUsageBar } from '@/components/features/usage/agent-usage-bar'
import { UsageDetailTable } from '@/components/features/usage/usage-detail-table'
import {
  useUsageOverview,
  useUsageTokenTrend,
  useUsageProviders,
  useUsageAgentRanking,
  useUsageRecords,
} from '@/hooks/use-usage'
import type { UsageFilters } from '@/types/api'

function defaultFilters(): UsageFilters {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const WORKSPACE_OPTIONS = [
  { value: '', label: '全部工作区' },
  { value: 'ws-default', label: '默认工作区' },
  { value: 'ws-dev', label: '开发工作区' },
]

const AGENT_OPTIONS = [
  { value: '', label: '全部 Agent' },
  { value: 'agent-1', label: '协调者' },
  { value: 'agent-2', label: '需求分析师' },
  { value: 'agent-3', label: '架构师' },
  { value: 'agent-4', label: '前端工程师' },
  { value: 'agent-5', label: '后端工程师' },
  { value: 'agent-6', label: '测试工程师' },
  { value: 'agent-7', label: 'DevOps 工程师' },
  { value: 'agent-8', label: '代码审查员' },
]

export default function UsagePage() {
  const { slug } = useParams<{ slug: string }>()
  const [filters, setFilters] = useState<UsageFilters>(defaultFilters)

  const { data: overview, isLoading: overviewLoading } = useUsageOverview(slug, filters)
  const { data: tokenTrend, isLoading: trendLoading } = useUsageTokenTrend(slug, filters)
  const { data: providers, isLoading: providersLoading } = useUsageProviders(slug, filters)
  const { data: ranking, isLoading: rankingLoading } = useUsageAgentRanking(slug, filters)
  const { data: recordsData, isLoading: recordsLoading } = useUsageRecords(slug, filters)

  const handleExportCsv = useCallback(() => {
    const records = recordsData?.data
    if (!records?.length) return

    const headers = [
      '时间',
      'Agent',
      '角色',
      'Provider',
      '模型',
      '输入Token',
      '输出Token',
      '耗时(ms)',
      '费用',
      '状态',
    ]
    const rows = records.map((r) =>
      [
        r.timestamp,
        r.agentName,
        r.agentRole,
        r.provider,
        r.model,
        r.inputTokens,
        r.outputTokens,
        r.duration,
        r.cost,
        r.success ? '成功' : '失败',
      ].join(','),
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage-${filters.startDate}-${filters.endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [recordsData, filters.startDate, filters.endDate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">用量统计</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">API 用量与费用统计</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3">
        <Input
          type="date"
          label="开始日期"
          value={filters.startDate}
          onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
        />
        <Input
          type="date"
          label="结束日期"
          value={filters.endDate}
          onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
        />
        <div className="w-40">
          <Select
            label="工作区"
            options={WORKSPACE_OPTIONS}
            value={filters.workspaceId ?? ''}
            onChange={(v) =>
              setFilters((f) => {
                const val = v as string
                return val
                  ? { ...f, workspaceId: val }
                  : {
                      startDate: f.startDate,
                      endDate: f.endDate,
                      ...(f.agentId ? { agentId: f.agentId } : {}),
                    }
              })
            }
          />
        </div>
        <div className="w-40">
          <Select
            label="Agent"
            options={AGENT_OPTIONS}
            value={filters.agentId ?? ''}
            onChange={(v) =>
              setFilters((f) => {
                const val = v as string
                return val
                  ? { ...f, agentId: val }
                  : {
                      startDate: f.startDate,
                      endDate: f.endDate,
                      ...(f.workspaceId ? { workspaceId: f.workspaceId } : {}),
                    }
              })
            }
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="mr-1.5 h-4 w-4" />
          导出 CSV
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {overviewLoading || !overview ? (
          Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-[180px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
            />
          ))
        ) : (
          <>
            <StatCard
              icon={<Database className="h-5 w-5" />}
              iconColor="#173f78"
              label="总 Token"
              value={overview.totalTokens.value}
              trend={overview.totalTokens.trend}
              sparklineData={overview.totalTokens.sparkline}
              sparklineType="area"
            />
            <StatCard
              icon={<Activity className="h-5 w-5" />}
              iconColor="#17c964"
              label="API 调用"
              value={overview.apiCalls.value}
              trend={overview.apiCalls.trend}
              sparklineData={overview.apiCalls.sparkline}
              sparklineType="bar"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              iconColor="#f5a524"
              label="平均响应时间"
              value={`${overview.avgResponseTime.value}ms`}
              trend={overview.avgResponseTime.trend}
              sparklineData={overview.avgResponseTime.sparkline}
              sparklineType="line"
            />
            <StatCard
              icon={<DollarSign className="h-5 w-5" />}
              iconColor="#f31260"
              label="预估费用"
              value={`$${overview.estimatedCost.value}`}
              trend={overview.estimatedCost.trend}
              sparklineData={overview.estimatedCost.sparkline}
              sparklineType="line"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <TokenTrendChart data={tokenTrend ?? []} loading={trendLoading} />
        </div>
        <div className="col-span-4">
          <ProviderPieChart data={providers ?? []} loading={providersLoading} />
        </div>
      </div>

      {/* Agent Ranking */}
      <AgentUsageBar data={ranking ?? []} loading={rankingLoading} />

      {/* Detail Table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">调用明细</h2>
        <UsageDetailTable data={recordsData?.data ?? []} loading={recordsLoading} />
      </div>
    </div>
  )
}
