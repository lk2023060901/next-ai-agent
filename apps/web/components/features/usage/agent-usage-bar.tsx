'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { Card } from '@/components/ui/card'
import { AGENT_ROLE_COLORS } from '@/lib/constants/chart'
import type { AgentUsageRank } from '@/types/api'

interface AgentUsageBarProps {
  data: AgentUsageRank[]
  loading?: boolean
}

function formatTokens(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number; payload: AgentUsageRank }[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]!
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-[var(--text-primary)]">{item.payload.agentName}</p>
      <p className="text-xs text-[var(--text-tertiary)]">Token 消耗: {formatTokens(item.value)}</p>
    </div>
  )
}

export function AgentUsageBar({ data, loading }: AgentUsageBarProps) {
  const height = data.length * 40 + 60

  return (
    <Card
      header={
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Agent 用量排行</h3>
      }
      padding="md"
    >
      {loading ? (
        <div className="flex h-40 items-center justify-center text-[var(--text-tertiary)]">
          加载中...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#8a9ab5' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTokens}
            />
            <YAxis
              type="category"
              dataKey="agentName"
              tick={{ fontSize: 12, fill: '#8a9ab5' }}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="tokens" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry) => (
                <Cell key={entry.agentId} fill={AGENT_ROLE_COLORS[entry.role]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
