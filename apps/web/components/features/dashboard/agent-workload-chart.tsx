'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import { AGENT_ROLE_COLORS } from '@/lib/constants/chart'
import type { AgentWorkload } from '@/types/api'

interface AgentWorkloadChartProps {
  data: AgentWorkload[]
  loading?: boolean
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name: string; value: number; payload: AgentWorkload }[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]!
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-[var(--text-primary)]">{item.payload.agentName}</p>
      <p className="text-xs text-[var(--text-tertiary)]">
        任务数: <span className="font-medium">{item.value}</span>
      </p>
    </div>
  )
}

export function AgentWorkloadChart({ data, loading }: AgentWorkloadChartProps) {
  const total = data.reduce((sum, d) => sum + d.taskCount, 0)

  return (
    <Card
      header={
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Agent 工作负载</h3>
      }
      padding="md"
    >
      {loading ? (
        <div className="flex h-[280px] items-center justify-center text-[var(--text-tertiary)]">
          加载中...
        </div>
      ) : (
        <div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="taskCount"
                  nameKey="agentName"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.agentId} fill={AGENT_ROLE_COLORS[entry.role]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{total}</div>
                <div className="text-xs text-[var(--text-tertiary)]">总任务</div>
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 px-2">
            {data.map((item) => (
              <div key={item.agentId} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: AGENT_ROLE_COLORS[item.role] }}
                />
                <span className="truncate text-[var(--text-secondary)]">{item.agentName}</span>
                <span className="ml-auto font-medium text-[var(--text-primary)]">
                  {item.taskCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
