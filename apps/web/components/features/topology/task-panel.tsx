'use client'

import { useState, useMemo } from 'react'
import {
  Circle,
  UserCheck,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Lock,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import type { Agent, AgentTask, TaskStatus } from '@/types/api'
import { TASK_STATUS_MAP, ROLE_AVATARS } from '@/lib/constants/agent'
import { cn } from '@/lib/utils/cn'

interface TaskPanelProps {
  tasks: AgentTask[]
  agents: Agent[]
  collapsed: boolean
  onToggleCollapse: () => void
  selectedAgentId: string | null
}

const CURRENT_STATUSES: TaskStatus[] = ['pending', 'assigned', 'in_progress', 'review', 'blocked']
const HISTORY_STATUSES: TaskStatus[] = ['completed', 'failed']

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  pending: <Circle size={14} />,
  assigned: <UserCheck size={14} />,
  in_progress: <Loader2 size={14} className="animate-spin" />,
  review: <Eye size={14} />,
  completed: <CheckCircle2 size={14} />,
  failed: <XCircle size={14} />,
  blocked: <Lock size={14} />,
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

function TaskCard({ task, agents }: { task: AgentTask; agents: Agent[] }) {
  const agent = agents.find((a) => a.id === task.assignedAgentId)
  const statusInfo = TASK_STATUS_MAP[task.status]

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3">
      {/* Header: status icon + title */}
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0" style={{ color: statusInfo.color }}>
          {STATUS_ICONS[task.status]}
        </span>
        <span className="text-sm font-medium text-[var(--text-primary)]">{task.title}</span>
      </div>

      {/* Agent + status label */}
      <div className="flex items-center justify-between">
        {agent && (
          <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: `var(--color-agent-${agent.role})` }}
            />
            {agent.avatar ?? ROLE_AVATARS[agent.role]} {agent.name}
          </span>
        )}
        <span className="text-xs font-medium" style={{ color: statusInfo.color }}>
          {statusInfo.label}
        </span>
      </div>

      {/* Progress bar */}
      {task.progress > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${task.progress}%`,
              backgroundColor: statusInfo.color,
            }}
          />
        </div>
      )}

      {/* Duration */}
      {task.duration != null && (
        <span className="text-[10px] text-[var(--text-tertiary)]">
          耗时: {formatDuration(task.duration)}
        </span>
      )}
    </div>
  )
}

export function TaskPanel({
  tasks,
  agents,
  collapsed,
  onToggleCollapse,
  selectedAgentId,
}: TaskPanelProps) {
  const [tab, setTab] = useState<'current' | 'history'>('current')

  const filtered = useMemo(() => {
    let list = tasks
    if (selectedAgentId) {
      list = list.filter((t) => t.assignedAgentId === selectedAgentId)
    }
    const statuses = tab === 'current' ? CURRENT_STATUSES : HISTORY_STATUSES
    return list.filter((t) => statuses.includes(t.status))
  }, [tasks, selectedAgentId, tab])

  const selectedAgent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) : null

  if (collapsed) {
    return (
      <div className="flex w-10 flex-col items-center border-l border-[var(--border)] bg-[var(--surface)] pt-3">
        <button
          onClick={onToggleCollapse}
          className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          aria-label="展开任务面板"
        >
          <PanelRightClose size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-80 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--text-primary)]">任务列表</span>
          {selectedAgent && (
            <span className="text-xs text-[var(--text-secondary)]">筛选: {selectedAgent.name}</span>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          aria-label="收起任务面板"
        >
          <PanelRightOpen size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {(['current', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors',
              tab === t
                ? 'border-b-2 border-[var(--color-primary-500)] text-[var(--color-primary-500)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {t === 'current' ? '当前任务' : '历史'}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">暂无任务</div>
        ) : (
          filtered.map((task) => <TaskCard key={task.id} task={task} agents={agents} />)
        )}
      </div>
    </div>
  )
}
