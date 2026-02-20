'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Monitor, Wifi, WifiOff, Clock, Send, Pause, Play, Square, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useDesktopClients, useOperationLogs, useSendCommand } from '@/hooks/use-monitoring'
import type { DesktopClient, OperationLogStatus, ApprovalResult } from '@/types/api'

const STATUS_DOT: Record<string, string> = {
  running: 'bg-[var(--color-success)]',
  idle: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-danger)]',
  offline: 'bg-[var(--text-tertiary)]',
}

const STATUS_LABEL: Record<string, string> = {
  running: '运行中',
  idle: '空闲',
  error: '错误',
  offline: '离线',
}

const RISK_BADGE: Record<string, string> = {
  low: 'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
}

const RISK_LABEL: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '极高' }

const OP_STATUS_BADGE: Record<string, string> = {
  running: 'bg-blue-50 text-blue-700',
  success: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  blocked: 'bg-[var(--surface-2)] text-[var(--text-tertiary)]',
}

const OP_STATUS_LABEL: Record<string, string> = {
  running: '运行中',
  success: '成功',
  failed: '失败',
  blocked: '已阻断',
}

const APPROVAL_BADGE: Record<string, string> = {
  auto: 'bg-[var(--surface-2)] text-[var(--text-tertiary)]',
  approved: 'bg-green-50 text-green-700',
  denied: 'bg-red-50 text-red-700',
  blocked: 'bg-red-50 text-red-700',
}

const APPROVAL_LABEL: Record<string, string> = {
  auto: '自动',
  approved: '已批准',
  denied: '已拒绝',
  blocked: '已阻断',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}小时前`
  return `${Math.floor(hrs / 24)}天前`
}

// ─── Client Card ──────────────────────────────────────────────────────────────

function ClientCard({ client }: { client: DesktopClient }) {
  const [expanded, setExpanded] = useState(false)
  const [taskInput, setTaskInput] = useState('')
  const send = useSendCommand(client.id)
  const isOffline = client.status === 'offline'

  function sendCmd(type: 'pause' | 'resume' | 'stop' | 'send_task') {
    const body = type === 'send_task' ? { type, instruction: taskInput } : { type }
    send.mutate(body, {
      onSuccess: () => {
        if (type === 'send_task') setTaskInput('')
      },
    })
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex-shrink-0">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT[client.status]}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Monitor size={14} className="text-[var(--text-tertiary)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{client.name}</h3>
              <span className="text-xs text-[var(--text-tertiary)]">
                {STATUS_LABEL[client.status]}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{client.hostname}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{client.platform}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          {...(isOffline ? { disabled: true } : {})}
        >
          远程控制
        </Button>
      </div>

      {client.status === 'running' && client.currentTaskSummary && (
        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--surface)] p-3">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            {client.currentAgentName ?? '当前 Agent'}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-[var(--text-primary)]">
            {client.currentTaskSummary}
          </p>
        </div>
      )}

      {client.status !== 'running' && (
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          {isOffline ? '设备离线' : '当前无活跃任务'}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
        <Clock size={11} />
        {isOffline ? <WifiOff size={11} /> : <Wifi size={11} />}
        <span>{timeAgo(client.lastSeenAt)}</span>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendCmd('pause')}
              {...(send.isPending ? { loading: true } : {})}
            >
              <Pause size={12} className="mr-1" /> 暂停
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendCmd('resume')}
              {...(send.isPending ? { loading: true } : {})}
            >
              <Play size={12} className="mr-1" /> 恢复
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => sendCmd('stop')}
              {...(send.isPending ? { loading: true } : {})}
            >
              <Square size={12} className="mr-1" /> 停止
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="发送任务指令..."
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                fullWidth
              />
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => sendCmd('send_task')}
              {...(!taskInput.trim() ? { disabled: true } : {})}
              {...(send.isPending ? { loading: true } : {})}
            >
              <Send size={12} />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Logs Table ───────────────────────────────────────────────────────────────

function LogsSection({ clients }: { clients: DesktopClient[] }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [statusFilter, setStatusFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [search, setSearch] = useState('')
  const [lastUpdatedSecs, setLastUpdatedSecs] = useState(0)
  const lastFetchRef = useRef(Date.now())

  const { data } = useOperationLogs(
    selectedClientId,
    {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(riskFilter ? { riskLevel: riskFilter } : {}),
    },
    !!selectedClientId,
  )

  // Track last refetch
  useEffect(() => {
    lastFetchRef.current = Date.now()
    setLastUpdatedSecs(0)
  }, [data])

  useEffect(() => {
    const id = setInterval(() => {
      setLastUpdatedSecs(Math.floor((Date.now() - lastFetchRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const logs = (data?.data ?? []).filter((l) => {
    if (!search) return true
    return (
      l.agentName.includes(search) ||
      l.toolName.includes(search) ||
      l.paramsSummary.includes(search)
    )
  })

  const clientOptions = [
    { value: '', label: '全部客户端' },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ]

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'running', label: '运行中' },
    { value: 'success', label: '成功' },
    { value: 'failed', label: '失败' },
    { value: 'blocked', label: '已阻断' },
  ]

  const riskOptions = [
    { value: '', label: '全部风险' },
    { value: 'low', label: '低风险' },
    { value: 'medium', label: '中风险' },
    { value: 'high', label: '高风险' },
    { value: 'critical', label: '极高风险' },
  ]

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">操作日志</h3>
          <span className="text-xs text-[var(--text-tertiary)]">
            最后更新 {lastUpdatedSecs} 秒前（自动刷新）
          </span>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-40">
          <Select
            options={clientOptions}
            value={selectedClientId}
            onChange={(v) => setSelectedClientId(v as string)}
            fullWidth
          />
        </div>
        <div className="w-32">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string)}
            fullWidth
          />
        </div>
        <div className="w-32">
          <Select
            options={riskOptions}
            value={riskFilter}
            onChange={(v) => setRiskFilter(v as string)}
            fullWidth
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="搜索 Agent、工具..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={13} />}
            fullWidth
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['时间', 'Agent', '工具', '参数摘要', '风险', '状态', '审批', '耗时'].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[var(--text-tertiary)]">
                  暂无日志
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr
                  key={log.id}
                  className={`${i < logs.length - 1 ? 'border-b border-[var(--border)]' : ''} transition-colors hover:bg-[var(--surface)]`}
                >
                  <td className="whitespace-nowrap px-3 py-2 text-[var(--text-tertiary)]">
                    {timeAgo(log.startedAt)}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-primary)]">{log.agentName}</td>
                  <td className="px-3 py-2">
                    <code className="rounded bg-[var(--surface-2)] px-1 py-0.5 text-xs text-[var(--text-primary)]">
                      {log.toolName}
                    </code>
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-[var(--text-secondary)]">
                    {log.paramsSummary}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${RISK_BADGE[log.riskLevel] ?? ''}`}
                    >
                      {RISK_LABEL[log.riskLevel] ?? log.riskLevel}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${OP_STATUS_BADGE[log.status as OperationLogStatus] ?? ''}`}
                    >
                      {OP_STATUS_LABEL[log.status as OperationLogStatus] ?? log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {log.approvalResult && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${APPROVAL_BADGE[log.approvalResult as ApprovalResult] ?? ''}`}
                      >
                        {APPROVAL_LABEL[log.approvalResult as ApprovalResult] ?? log.approvalResult}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-[var(--text-tertiary)]">
                    {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const { wsSlug } = useParams<{ wsSlug: string }>()
  const { data: clients = [], isLoading } = useDesktopClients(wsSlug)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">远程监控</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          查看本地桌面端 Agent 运行状态与操作日志
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>

          {clients.length > 0 && <LogsSection clients={clients} />}
        </>
      )}
    </div>
  )
}
