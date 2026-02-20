'use client'

import { useParams } from 'next/navigation'
import { Bot, MessageSquare, Zap, CheckSquare } from 'lucide-react'
import {
  useDashboardStats,
  useMessageTrend,
  useAgentWorkload,
  useActivities,
} from '@/hooks/use-dashboard'
import { StatCard } from '@/components/features/dashboard/stat-card'
import { MessageTrendChart } from '@/components/features/dashboard/message-trend-chart'
import { AgentWorkloadChart } from '@/components/features/dashboard/agent-workload-chart'
import { ActivityTimeline } from '@/components/features/dashboard/activity-timeline'
import { QuickActions } from '@/components/features/dashboard/quick-actions'

function formatDate(): string {
  const d = new Date()
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

export default function OrgDashboardPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: stats, isLoading: statsLoading } = useDashboardStats(slug)
  const { data: trend, isLoading: trendLoading } = useMessageTrend(slug)
  const { data: workload, isLoading: workloadLoading } = useAgentWorkload(slug)
  const { data: activities, isLoading: activitiesLoading } = useActivities(slug)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">欢迎回来</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">{formatDate()}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statsLoading || !stats ? (
          Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-[180px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
            />
          ))
        ) : (
          <>
            <StatCard
              icon={<Bot className="h-5 w-5" />}
              iconColor="#006fee"
              label="活跃 Agent"
              value={stats.activeAgents.value}
              trend={stats.activeAgents.trend}
              sparklineData={stats.activeAgents.sparkline}
              sparklineType="line"
            />
            <StatCard
              icon={<MessageSquare className="h-5 w-5" />}
              iconColor="#173f78"
              label="今日会话"
              value={stats.todaySessions.value}
              trend={stats.todaySessions.trend}
              sparklineData={stats.todaySessions.sparkline}
              sparklineType="bar"
            />
            <StatCard
              icon={<Zap className="h-5 w-5" />}
              iconColor="#f5a524"
              label="Token 用量"
              value={stats.tokenUsage.value}
              trend={stats.tokenUsage.trend}
              sparklineData={stats.tokenUsage.sparkline}
              sparklineType="area"
            />
            <StatCard
              icon={<CheckSquare className="h-5 w-5" />}
              iconColor="#17c964"
              label="已完成任务"
              value={stats.completedTasks.value}
              trend={stats.completedTasks.trend}
              sparklineData={stats.completedTasks.sparkline}
              sparklineType="line"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <MessageTrendChart data={trend ?? []} loading={trendLoading} />
        </div>
        <div className="col-span-4">
          <AgentWorkloadChart data={workload ?? []} loading={workloadLoading} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <ActivityTimeline activities={activities ?? []} loading={activitiesLoading} />
        </div>
        <div className="col-span-4">
          <QuickActions orgSlug={slug} />
        </div>
      </div>
    </div>
  )
}
