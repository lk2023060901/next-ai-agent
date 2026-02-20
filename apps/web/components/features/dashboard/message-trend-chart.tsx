'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/constants/chart'
import type { DailyMessageStats } from '@/types/api'

interface MessageTrendChartProps {
  data: DailyMessageStats[]
  loading?: boolean
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 shadow-md">
      <p className="mb-1 text-xs text-[var(--text-tertiary)]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export function MessageTrendChart({ data, loading }: MessageTrendChartProps) {
  return (
    <Card
      header={<h3 className="text-base font-semibold text-[var(--text-primary)]">消息量趋势</h3>}
      padding="md"
    >
      {loading ? (
        <div className="flex h-[280px] items-center justify-center text-[var(--text-tertiary)]">
          加载中...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: CHART_COLORS.textTertiary }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.border }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: CHART_COLORS.textTertiary }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              align="right"
              verticalAlign="top"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />
            <Area
              type="monotone"
              dataKey="inbound"
              name="入站消息"
              stroke={CHART_COLORS.primary500}
              fill={CHART_COLORS.primary50}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="outbound"
              name="出站消息"
              stroke={CHART_COLORS.success}
              fill={CHART_COLORS.success50}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
