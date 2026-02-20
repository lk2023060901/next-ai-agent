'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { AGENT_ROLE_COLORS } from '@/lib/constants/chart'
import type { UsageRecord } from '@/types/api'

interface UsageDetailTableProps {
  data: UsageRecord[]
  loading?: boolean
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

const columns: Column<UsageRecord>[] = [
  {
    key: 'timestamp',
    header: '时间',
    sortable: true,
    width: '12%',
    render: (row) => (
      <span className="text-xs text-[var(--text-secondary)]">{formatTimestamp(row.timestamp)}</span>
    ),
  },
  {
    key: 'agentName',
    header: 'Agent',
    sortable: true,
    width: '14%',
    render: (row) => (
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: AGENT_ROLE_COLORS[row.agentRole] }}
        />
        <span className="truncate text-sm">{row.agentName}</span>
      </div>
    ),
  },
  {
    key: 'provider',
    header: 'Provider',
    sortable: true,
    width: '10%',
  },
  {
    key: 'model',
    header: '模型',
    sortable: true,
    width: '14%',
    render: (row) => <span className="text-xs">{row.model}</span>,
  },
  {
    key: 'inputTokens',
    header: '输入 Token',
    sortable: true,
    width: '10%',
    render: (row) => <span className="tabular-nums">{row.inputTokens.toLocaleString()}</span>,
  },
  {
    key: 'outputTokens',
    header: '输出 Token',
    sortable: true,
    width: '10%',
    render: (row) => <span className="tabular-nums">{row.outputTokens.toLocaleString()}</span>,
  },
  {
    key: 'duration',
    header: '耗时',
    sortable: true,
    width: '8%',
    render: (row) => <span className="tabular-nums">{row.duration.toLocaleString()}ms</span>,
  },
  {
    key: 'cost',
    header: '费用',
    sortable: true,
    width: '8%',
    render: (row) => <span className="tabular-nums">${row.cost.toFixed(4)}</span>,
  },
  {
    key: 'success',
    header: '状态',
    width: '6%',
    render: (row) =>
      row.success ? (
        <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
      ) : (
        <XCircle className="h-4 w-4 text-[var(--color-danger)]" />
      ),
  },
]

export function UsageDetailTable({ data, loading }: UsageDetailTableProps) {
  return (
    <DataTable<UsageRecord>
      columns={columns}
      data={data}
      keyField="id"
      {...(loading != null ? { loading } : {})}
      pageSize={100}
      emptyTitle="暂无用量记录"
      emptyDescription="选择的时间范围内没有 API 调用记录"
    />
  )
}
