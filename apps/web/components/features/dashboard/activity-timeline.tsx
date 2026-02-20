'use client'

import { useState } from 'react'
import { Bot, User, Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import type { ActivityEvent, ActivityType } from '@/types/api'

interface ActivityTimelineProps {
  activities: ActivityEvent[]
  loading?: boolean
}

const FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'agent', label: 'Agent 活动' },
  { value: 'member', label: '成员活动' },
  { value: 'system', label: '系统活动' },
]

const TYPE_ICONS: Record<ActivityType, typeof Bot> = {
  agent: Bot,
  member: User,
  system: Settings,
}

const TYPE_COLORS: Record<ActivityType, string> = {
  agent: 'var(--color-primary-500)',
  member: 'var(--color-success)',
  system: 'var(--text-tertiary)',
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? activities : activities.filter((a) => a.type === filter)

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">最近活动</h3>
          <div className="w-32">
            <Select
              options={FILTER_OPTIONS}
              value={filter}
              onChange={(v) => setFilter(v as string)}
            />
          </div>
        </div>
      }
      padding="none"
    >
      {loading ? (
        <div className="flex h-40 items-center justify-center text-[var(--text-tertiary)]">
          加载中...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[var(--text-tertiary)]">
          暂无活动
        </div>
      ) : (
        <div className="max-h-[400px] overflow-auto">
          {filtered.map((activity, idx) => {
            const Icon = TYPE_ICONS[activity.type]
            return (
              <div key={activity.id} className="relative flex gap-3 px-6 py-3">
                {/* Timeline line */}
                {idx < filtered.length - 1 && (
                  <div className="absolute left-[39px] top-[44px] h-[calc(100%-20px)] w-px bg-[var(--border)]" />
                )}
                {/* Icon */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${TYPE_COLORS[activity.type]} 12%, transparent)`,
                    color: TYPE_COLORS[activity.type],
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {activity.title}
                    </span>
                    <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    {activity.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
