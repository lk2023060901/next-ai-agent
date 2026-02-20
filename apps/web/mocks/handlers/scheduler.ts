import { http, HttpResponse, delay } from 'msw'
import {
  makeScheduledTaskList,
  makeTaskExecutionList,
  CRON_PRESETS,
} from '../factories/scheduler.factory'
import type {
  ScheduledTask,
  TaskExecution,
  CreateScheduledTaskBody,
  UpdateScheduledTaskBody,
} from '@/types/api'

const TASK_STORE: Record<string, ScheduledTask[]> = {}
const EXEC_STORE: Record<string, TaskExecution[]> = {}
let taskSeq = 100
let execSeq = 100

function getTasks(wsId: string): ScheduledTask[] {
  if (!TASK_STORE[wsId]) TASK_STORE[wsId] = makeScheduledTaskList(wsId)
  return TASK_STORE[wsId]!
}

function getExecutions(taskId: string, taskName: string): TaskExecution[] {
  if (!EXEC_STORE[taskId]) EXEC_STORE[taskId] = makeTaskExecutionList(taskId, taskName)
  return EXEC_STORE[taskId]!
}

function cronToDesc(expr: string): string {
  const preset = CRON_PRESETS.find((p) => p.expr === expr)
  return preset?.desc ?? expr
}

export const schedulerHandlers = [
  http.get('/api/workspaces/:wsId/scheduler/tasks', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: getTasks(params.wsId as string) })
  }),

  http.post('/api/workspaces/:wsId/scheduler/tasks', async ({ params, request }) => {
    await delay(400)
    const body = (await request.json()) as CreateScheduledTaskBody
    const wsId = params.wsId as string
    const task: ScheduledTask = {
      id: `task-${taskSeq++}`,
      workspaceId: wsId,
      name: body.name,
      instruction: body.instruction,
      cronExpression: body.cronExpression,
      cronDescription: cronToDesc(body.cronExpression),
      allowedTools: body.allowedTools,
      enabled: true,
      status: 'active',
      runCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    if (body.targetAgentId) task.targetAgentId = body.targetAgentId
    getTasks(wsId).unshift(task)
    return HttpResponse.json({ data: task }, { status: 201 })
  }),

  http.patch('/api/workspaces/:wsId/scheduler/tasks/:taskId', async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as UpdateScheduledTaskBody
    const wsId = params.wsId as string
    const taskId = params.taskId as string
    const tasks = getTasks(wsId)
    const idx = tasks.findIndex((t) => t.id === taskId)
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    const updated = { ...tasks[idx]!, ...body, updatedAt: new Date().toISOString() }
    if (body.cronExpression) updated.cronDescription = cronToDesc(body.cronExpression)
    if (body.enabled !== undefined) updated.status = body.enabled ? 'active' : 'paused'
    tasks[idx] = updated
    return HttpResponse.json({ data: updated })
  }),

  http.delete('/api/workspaces/:wsId/scheduler/tasks/:taskId', async ({ params }) => {
    await delay(300)
    const wsId = params.wsId as string
    const taskId = params.taskId as string
    const tasks = getTasks(wsId)
    const idx = tasks.findIndex((t) => t.id === taskId)
    if (idx !== -1) tasks.splice(idx, 1)
    return HttpResponse.json({ data: null })
  }),

  http.get('/api/workspaces/:wsId/scheduler/tasks/:taskId/executions', async ({ params }) => {
    await delay(200)
    const taskId = params.taskId as string
    const wsId = params.wsId as string
    const tasks = getTasks(wsId)
    const task = tasks.find((t) => t.id === taskId)
    const taskName = task?.name ?? 'Unknown Task'
    return HttpResponse.json({ data: getExecutions(taskId, taskName) })
  }),

  http.post('/api/workspaces/:wsId/scheduler/tasks/:taskId/run', async ({ params }) => {
    await delay(400)
    const taskId = params.taskId as string
    const wsId = params.wsId as string
    const tasks = getTasks(wsId)
    const taskIdx = tasks.findIndex((t) => t.id === taskId)
    const task = tasks[taskIdx]
    const taskName = task?.name ?? 'Unknown Task'

    const newExec: TaskExecution = {
      id: `exec-${execSeq++}`,
      taskId,
      taskName,
      status: 'running',
      startedAt: new Date().toISOString(),
    }

    if (task) {
      tasks[taskIdx] = { ...task, lastRunAt: new Date().toISOString(), runCount: task.runCount + 1 }
    }

    getExecutions(taskId, taskName).unshift(newExec)
    return HttpResponse.json({ data: newExec }, { status: 201 })
  }),
]
