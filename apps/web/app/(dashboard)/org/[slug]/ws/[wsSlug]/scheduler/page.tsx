'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Play,
  Pause,
  Trash2,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import {
  useScheduledTasks,
  useTaskExecutions,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useRunNow,
} from '@/hooks/use-scheduler'
import { CRON_PRESETS } from '@/mocks/factories/scheduler.factory'
import type { ScheduledTask, TaskExecution, CreateScheduledTaskBody } from '@/types/api'

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  paused: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-700',
}
const STATUS_LABEL: Record<string, string> = { active: '活跃', paused: '已暂停', error: '错误' }

const EXEC_STATUS_BADGE: Record<string, string> = {
  success: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  running: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-[var(--surface-2)] text-[var(--text-tertiary)]',
}
const EXEC_STATUS_LABEL: Record<string, string> = {
  success: '成功',
  failed: '失败',
  running: '运行中',
  cancelled: '已取消',
}

const ALLOWED_TOOLS = ['read_file', 'write_file', 'bash_exec', 'browser_screenshot', 'http_request']

function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Execution Row ─────────────────────────────────────────────────────────────

function ExecutionRows({ wsId, task }: { wsId: string; task: ScheduledTask }) {
  const runNow = useRunNow(wsId)
  const { data: executions = [], isLoading } = useTaskExecutions(wsId, task.id, true)

  if (isLoading) {
    return (
      <tr>
        <td
          colSpan={8}
          className="bg-[var(--surface)] px-4 py-3 text-xs text-[var(--text-tertiary)]"
        >
          加载执行历史...
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr>
        <td colSpan={8} className="bg-[var(--surface)] px-4 py-2">
          <p className="text-xs font-medium text-[var(--text-secondary)]">执行历史</p>
        </td>
      </tr>
      {executions.length === 0 ? (
        <tr>
          <td
            colSpan={8}
            className="bg-[var(--surface)] px-8 py-2 text-xs text-[var(--text-tertiary)]"
          >
            暂无执行记录
          </td>
        </tr>
      ) : (
        executions.map((exec: TaskExecution) => (
          <tr key={exec.id} className="border-b border-[var(--border)] bg-[var(--surface)]">
            <td className="px-8 py-2 text-xs text-[var(--text-tertiary)]">
              {formatDateTime(exec.startedAt)}
            </td>
            <td colSpan={2} className="px-3 py-2">
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${EXEC_STATUS_BADGE[exec.status] ?? ''}`}
              >
                {EXEC_STATUS_LABEL[exec.status] ?? exec.status}
              </span>
            </td>
            <td className="px-3 py-2 text-xs text-[var(--text-tertiary)]">
              {exec.durationMs != null ? `${Math.round(exec.durationMs / 1000)}s` : '—'}
            </td>
            <td
              colSpan={3}
              className="max-w-xs truncate px-3 py-2 text-xs text-[var(--text-secondary)]"
            >
              {exec.logSummary ?? '—'}
            </td>
            <td className="px-3 py-2">
              <button
                onClick={() => runNow.mutate(task.id)}
                className="text-xs text-[var(--color-primary-500)] hover:underline"
              >
                重新运行
              </button>
            </td>
          </tr>
        ))
      )}
    </>
  )
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────

interface TaskFormProps {
  open: boolean
  onClose: () => void
  wsId: string
  existing?: ScheduledTask
}

function TaskFormModal({ open, onClose, wsId, existing }: TaskFormProps) {
  const create = useCreateTask(wsId)
  const update = useUpdateTask(wsId)

  const [name, setName] = useState(existing?.name ?? '')
  const [instruction, setInstruction] = useState(existing?.instruction ?? '')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    existing ? (CRON_PRESETS.findIndex((p) => p.expr === existing.cronExpression) ?? null) : 0,
  )
  const [customCron, setCustomCron] = useState(existing?.cronExpression ?? '')
  const [selectedTools, setSelectedTools] = useState<string[]>(
    existing?.allowedTools ?? ['read_file'],
  )

  const isCustom = selectedPreset === null
  const cronExpr = isCustom ? customCron : (CRON_PRESETS[selectedPreset ?? 0]?.expr ?? '')
  const cronDesc = isCustom ? customCron : (CRON_PRESETS[selectedPreset ?? 0]?.desc ?? '')

  const isPending = create.isPending || update.isPending

  function toggleTool(tool: string) {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    )
  }

  function handleSubmit() {
    const body: CreateScheduledTaskBody = {
      name,
      instruction,
      cronExpression: cronExpr,
      allowedTools: selectedTools,
    }
    if (existing) {
      update.mutate({ taskId: existing.id, body }, { onSuccess: onClose })
    } else {
      create.mutate(body, { onSuccess: onClose })
    }
  }

  // Compute next 3 runs (rough approximation using description)
  const nextRuns = existing?.nextRunAt ? [existing.nextRunAt] : []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? '编辑任务' : '新建定时任务'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            {...(!name.trim() || !instruction.trim() || !cronExpr ? { disabled: true } : {})}
            {...(isPending ? { loading: true } : {})}
          >
            {existing ? '保存' : '创建任务'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            任务名称
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="每日代码审查"
            fullWidth
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            任务指令
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder="对过去24小时内的所有代码提交进行安全和质量审查..."
            className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            执行频率
          </label>
          <div className="flex flex-wrap gap-2">
            {CRON_PRESETS.map((preset, idx) => (
              <button
                key={preset.expr}
                onClick={() => setSelectedPreset(idx)}
                className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedPreset === idx
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-500)]'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--color-primary-300)]'
                }`}
              >
                {preset.desc}
              </button>
            ))}
            <button
              onClick={() => setSelectedPreset(null)}
              className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                isCustom
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-500)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--color-primary-300)]'
              }`}
            >
              自定义
            </button>
          </div>

          {!isCustom && cronDesc && (
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              当前：<code className="rounded bg-[var(--surface-2)] px-1">{cronExpr}</code> →{' '}
              {cronDesc}
            </p>
          )}

          {isCustom && (
            <div className="mt-2">
              <Input
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="0 9 * * 1-5"
                fullWidth
              />
            </div>
          )}

          {nextRuns.length > 0 && (
            <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
              下次执行：{formatDateTime(nextRuns[0])}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            允许工具
          </label>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_TOOLS.map((tool) => (
              <label
                key={tool}
                className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.includes(tool)}
                  onChange={() => toggleTool(tool)}
                  className="rounded"
                />
                <code>{tool}</code>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  const { wsSlug } = useParams<{ wsSlug: string }>()
  const { data: tasks = [], isLoading } = useScheduledTasks(wsSlug)
  const updateTask = useUpdateTask(wsSlug)
  const deleteTask = useDeleteTask(wsSlug)
  const runNow = useRunNow(wsSlug)

  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<ScheduledTask | undefined>()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScheduledTask | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">任务调度</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            配置定时任务，让 Agent 24/7 自主运行
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingTask(undefined)
            setShowForm(true)
          }}
        >
          <Plus size={14} className="mr-1" /> 新建任务
        </Button>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">
            暂无定时任务，点击&ldquo;新建任务&rdquo;开始
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                  任务名
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                  执行频率
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                  下次执行
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                  上次执行
                </th>
                <th className="px-4 py-3 text-center font-medium text-[var(--text-secondary)]">
                  次数
                </th>
                <th className="px-4 py-3 text-center font-medium text-[var(--text-secondary)]">
                  状态
                </th>
                <th className="px-4 py-3 text-center font-medium text-[var(--text-secondary)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <>
                  <tr
                    key={task.id}
                    className="cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--surface)]"
                    onClick={() => toggleExpand(task.id)}
                  >
                    <td className="px-4 py-3 text-[var(--text-tertiary)]">
                      {expandedId === task.id ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{task.name}</p>
                      {task.targetAgentName && (
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {task.targetAgentName}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--text-primary)]">{task.cronDescription}</p>
                      <code className="text-xs text-[var(--text-tertiary)]">
                        {task.cronExpression}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {formatDateTime(task.nextRunAt)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {formatDateTime(task.lastRunAt)}
                    </td>
                    <td className="px-4 py-3 text-center text-[var(--text-secondary)]">
                      {task.runCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status] ?? ''}`}
                      >
                        {STATUS_LABEL[task.status] ?? task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === task.id ? null : task.id)}
                          className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {openMenu === task.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] py-1 shadow-lg">
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface)]"
                              onClick={() => {
                                runNow.mutate(task.id)
                                setOpenMenu(null)
                              }}
                            >
                              <Play size={12} /> 立即运行
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface)]"
                              onClick={() => {
                                setEditingTask(task)
                                setShowForm(true)
                                setOpenMenu(null)
                              }}
                            >
                              <Pencil size={12} /> 编辑
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface)]"
                              onClick={() => {
                                updateTask.mutate({
                                  taskId: task.id,
                                  body: { enabled: !task.enabled },
                                })
                                setOpenMenu(null)
                              }}
                            >
                              {task.enabled ? (
                                <>
                                  <Pause size={12} /> 暂停
                                </>
                              ) : (
                                <>
                                  <Play size={12} /> 启用
                                </>
                              )}
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--color-danger)] hover:bg-[var(--surface)]"
                              onClick={() => {
                                setDeleteTarget(task)
                                setOpenMenu(null)
                              }}
                            >
                              <Trash2 size={12} /> 删除
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === task.id && (
                    <ExecutionRows key={`exec-${task.id}`} wsId={wsSlug} task={task} />
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <TaskFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        wsId={wsSlug}
        {...(editingTask ? { existing: editingTask } : {})}
      />

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="删除定时任务"
        description={`确认删除「${deleteTarget?.name}」？此操作不可撤销。`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (deleteTarget) {
                  deleteTask.mutate(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
              {...(deleteTask.isPending ? { loading: true } : {})}
            >
              删除
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">删除后，所有执行历史也将一并清除。</p>
      </Modal>
    </div>
  )
}
