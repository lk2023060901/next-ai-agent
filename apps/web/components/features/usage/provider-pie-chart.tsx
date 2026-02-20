'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import type { ProviderUsage } from '@/types/api'

interface ProviderPieChartProps {
  data: ProviderUsage[]
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
  payload?: { name: string; value: number; payload: ProviderUsage }[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]!
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-[var(--text-primary)]">{item.payload.provider}</p>
      <p className="text-xs text-[var(--text-tertiary)]">
        Token: {formatTokens(item.payload.tokens)} ({item.payload.percentage}%)
      </p>
    </div>
  )
}

export function ProviderPieChart({ data, loading }: ProviderPieChartProps) {
  return (
    <Card
      header={<h3 className="text-base font-semibold text-[var(--text-primary)]">Provider 分布</h3>}
      padding="md"
    >
      {loading ? (
        <div className="flex h-[300px] items-center justify-center text-[var(--text-tertiary)]">
          加载中...
        </div>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="tokens"
                nameKey="provider"
                cx="50%"
                cy="50%"
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.provider} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-col gap-2 px-2">
            {data.map((item) => (
              <div key={item.provider} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[var(--text-secondary)]">{item.provider}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-tertiary)]">{formatTokens(item.tokens)}</span>
                  <span className="w-10 text-right font-medium text-[var(--text-primary)]">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
