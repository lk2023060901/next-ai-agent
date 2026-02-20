'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Radio, MessageSquare, Settings, GitBranch, BarChart2 } from 'lucide-react'
import { Tabs } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { MessageLogTable } from '@/components/features/channels/message-log-table'
import { RoutingRulesEditor } from '@/components/features/channels/routing-rules-editor'
import { useChannels, useChannelStats } from '@/hooks/use-channels'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card padding="md">
      <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{sub}</p>}
    </Card>
  )
}

const TABS = [
  { key: 'overview', label: '概览', icon: <BarChart2 className="h-4 w-4" /> },
  { key: 'messages', label: '消息日志', icon: <MessageSquare className="h-4 w-4" /> },
  { key: 'rules', label: '路由规则', icon: <GitBranch className="h-4 w-4" /> },
  { key: 'settings', label: '设置', icon: <Settings className="h-4 w-4" /> },
]

export default function ChannelDetailPage() {
  const { wsSlug, slug, channelId } = useParams<{
    wsSlug: string
    slug: string
    channelId: string
  }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: channels } = useChannels(wsSlug)
  const channel = channels?.find((c) => c.id === channelId)
  const { data: stats } = useChannelStats(channelId)

  return (
    <div className="space-y-6 p-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push(`/org/${slug}/ws/${wsSlug}/channels`)}
          className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回渠道列表
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
            <Radio className="h-5 w-5 text-[var(--color-primary-500)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {channel?.name ?? channelId}
            </h1>
            {channel && (
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                {channel.type} · {channel.connectedChannels ?? 0} 个频道
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="今日入站" value={stats?.todayInbound ?? '—'} />
            <StatCard label="今日出站" value={stats?.todayOutbound ?? '—'} />
            <StatCard label="平均响应" value={stats ? `${stats.avgResponseMs}ms` : '—'} />
            <StatCard label="活跃用户" value={stats?.activeUsers ?? '—'} />
          </div>
          {stats && (
            <Card
              padding="md"
              header={
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">24h 消息量</h3>
              }
            >
              <div className="flex h-24 items-end gap-px">
                {stats.hourlyTrend.map((pt) => (
                  <div key={pt.hour} className="flex flex-1 flex-col items-center gap-px">
                    <div
                      className="w-full rounded-sm bg-[var(--color-primary-400)]"
                      style={{
                        height: `${Math.round((pt.inbound / 30) * 100)}%`,
                        minHeight: 2,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-[var(--text-tertiary)]">
                <span>0:00</span>
                <span>6:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Messages */}
      {activeTab === 'messages' && <MessageLogTable channelId={channelId} />}

      {/* Rules */}
      {activeTab === 'rules' && <RoutingRulesEditor channelId={channelId} />}

      {/* Settings */}
      {activeTab === 'settings' && (
        <Card padding="md">
          <p className="text-sm text-[var(--text-secondary)]">渠道设置功能开发中...</p>
        </Card>
      )}
    </div>
  )
}
