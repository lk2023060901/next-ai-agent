'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/constants/chart'
import type { DailyTokenUsage } from '@/types/api'

interface TokenTrendChartProps {
  data: DailyTokenUsage[]
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
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + p.value, 0)
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 shadow-md">
      <p className="mb-1 text-xs text-[var(--text-tertiary)]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-medium">{formatTokens(entry.value)}</span>
        </p>
      ))}
      <p className="mt-1 border-t border-[var(--border)] pt-1 text-sm font-medium text-[var(--text-primary)]">
        合计: {formatTokens(total)}
      </p>
    </div>
  )
}

export function TokenTrendChart({ data, loading }: TokenTrendChartProps) {
  return (
    <Card
      header={
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Token 消耗趋势</h3>
      }
      padding="md"
    >
      {loading ? (
        <div className="flex h-[300px] items-center justify-center text-[var(--text-tertiary)]">
          加载中...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: CHART_COLORS.textTertiary }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.border }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12, fill: CHART_COLORS.textTertiary }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTokens}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              align="right"
              verticalAlign="top"
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />
            <Bar
              dataKey="inputTokens"
              name="输入 Token"
              stackId="tokens"
              fill={CHART_COLORS.primary300}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="outputTokens"
              name="输出 Token"
              stackId="tokens"
              fill={CHART_COLORS.primary600}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
