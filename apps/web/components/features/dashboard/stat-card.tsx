'use client'

import { type ReactNode } from 'react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/constants/chart'
import type { SparklineType } from '@/lib/constants/chart'

interface StatCardProps {
  icon: ReactNode
  iconColor: string
  label: string
  value: string | number
  trend: number
  sparklineData: number[]
  sparklineType: SparklineType
}

function formatNumber(value: string | number): string {
  if (typeof value === 'string') return value
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function Sparkline({ data, type }: { data: number[]; type: SparklineType }) {
  const chartData = data.map((v, i) => ({ i, v }))
  const color = CHART_COLORS.primary500

  return (
    <ResponsiveContainer width="100%" height={40}>
      {type === 'bar' ? (
        <BarChart data={chartData}>
          <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      ) : type === 'area' ? (
        <AreaChart data={chartData}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={CHART_COLORS.primary50}
            strokeWidth={1.5}
          />
        </AreaChart>
      ) : (
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}

export function StatCard({
  icon,
  iconColor,
  label,
  value,
  trend,
  sparklineData,
  sparklineType,
}: StatCardProps) {
  const isPositive = trend >= 0

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${iconColor}14`, color: iconColor }}
        >
          {icon}
        </div>
        <div
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: isPositive ? CHART_COLORS.success : CHART_COLORS.danger }}
        >
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {trend}%
          </span>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(value)}</div>
        <div className="mt-0.5 text-sm text-[var(--text-tertiary)]">{label}</div>
      </div>
      <div className="mt-3">
        <Sparkline data={sparklineData} type={sparklineType} />
      </div>
    </Card>
  )
}
