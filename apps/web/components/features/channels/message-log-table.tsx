'use client'

import { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useChannelMessages } from '@/hooks/use-channels'
import type { ChannelMessageFilters, MessageDirection, ChannelMessageStatus } from '@/types/api'

interface MessageLogTableProps {
  channelId: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

export function MessageLogTable({ channelId }: MessageLogTableProps) {
  const [filters, setFilters] = useState<ChannelMessageFilters>({ page: 1, pageSize: 50 })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useChannelMessages(channelId, filters)

  function setFilter<K extends keyof ChannelMessageFilters>(
    key: K,
    value: ChannelMessageFilters[K],
  ) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }))
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-36">
          <Select
            placeholder="方向"
            options={[
              { value: '', label: '全部方向' },
              { value: 'inbound', label: '入站' },
              { value: 'outbound', label: '出站' },
            ]}
            value={filters.direction ?? ''}
            onChange={(v) =>
              setFilter('direction', ((v as string) || undefined) as MessageDirection | undefined)
            }
            fullWidth
          />
        </div>
        <div className="w-32">
          <Select
            placeholder="状态"
            options={[
              { value: '', label: '全部状态' },
              { value: 'success', label: '成功' },
              { value: 'failed', label: '失败' },
            ]}
            value={filters.status ?? ''}
            onChange={(v) =>
              setFilter('status', ((v as string) || undefined) as ChannelMessageStatus | undefined)
            }
            fullWidth
          />
        </div>
        <Input
          placeholder="搜索发送者..."
          value={filters.sender ?? ''}
          onChange={(e) => setFilter('sender', e.target.value || undefined)}
          className="w-48"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-[var(--text-tertiary)]">
          暂无消息记录
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface)]">
                <tr>
                  <th className="w-8 border-b border-[var(--border)] px-3 py-3" />
                  <th className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                    时间
                  </th>
                  <th className="w-10 border-b border-[var(--border)] px-2 py-3 text-center font-semibold text-[var(--text-secondary)]">
                    方向
                  </th>
                  <th className="w-32 border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                    发送者
                  </th>
                  <th className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                    内容
                  </th>
                  <th className="w-32 border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                    Agent
                  </th>
                  <th className="w-20 border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((msg) => (
                  <>
                    <tr
                      key={msg.id}
                      className="cursor-pointer border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--surface)]"
                      onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                    >
                      <td className="px-3 py-3 text-[var(--text-tertiary)]">
                        {expandedId === msg.id ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                        {formatTime(msg.createdAt)}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {msg.direction === 'outbound' ? (
                          <ArrowUpRight className="mx-auto h-4 w-4 text-[var(--color-primary-400)]" />
                        ) : (
                          <ArrowDownLeft className="mx-auto h-4 w-4 text-[var(--color-success)]" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-primary)]">{msg.senderName}</td>
                      <td className="max-w-0 px-4 py-3">
                        <p className="truncate text-[var(--text-primary)]">{msg.content}</p>
                      </td>
                      <td className="px-4 py-3">
                        {msg.agentName && (
                          <span className="truncate text-xs text-[var(--text-secondary)]">
                            {msg.agentName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {msg.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[var(--color-danger)]" />
                        )}
                      </td>
                    </tr>
                    {expandedId === msg.id && (
                      <tr key={`${msg.id}-detail`} className="bg-[var(--surface)]">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                            <p>
                              <strong className="text-[var(--text-primary)]">完整内容:</strong>{' '}
                              {msg.content}
                            </p>
                            {msg.processingMs != null && (
                              <p>
                                <strong className="text-[var(--text-primary)]">处理耗时:</strong>{' '}
                                {msg.processingMs}ms
                              </p>
                            )}
                            {msg.errorDetail && (
                              <p className="text-[var(--color-danger)]">
                                <strong>错误详情:</strong> {msg.errorDetail}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>共 {data.total} 条</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={filters.page === 1}
                  onClick={() => setFilter('page', (filters.page ?? 1) - 1)}
                >
                  上一页
                </Button>
                <span className="flex items-center px-2">
                  {filters.page} / {data.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={filters.page === data.totalPages}
                  onClick={() => setFilter('page', (filters.page ?? 1) + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
