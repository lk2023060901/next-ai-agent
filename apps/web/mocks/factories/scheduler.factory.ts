import type {
  ScheduledTask,
  TaskExecution,
  ScheduledTaskStatus,
  ExecutionStatus,
} from '@/types/api'

let taskSeq = 1
let execSeq = 1

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function hoursFromNow(n: number): string {
  return new Date(Date.now() + n * 3_600_000).toISOString()
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString()
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const CRON_PRESETS = [
  { expr: '0 9 * * 1-5', desc: '每周一至周五 09:00' },
  { expr: '0 9 * * *', desc: '每天 09:00' },
  { expr: '0 */2 * * *', desc: '每2小时' },
  { expr: '0 9 1 * *', desc: '每月1号 09:00' },
  { expr: '*/30 * * * *', desc: '每30分钟' },
]

const TASK_SEEDS: Array<{
  name: string
  instruction: string
  cronIdx: number
  targetAgentName: string
  allowedTools: string[]
  status: ScheduledTaskStatus
  runCount: number
}> = [
  {
    name: '每日代码审查',
    instruction: '对过去24小时内的所有代码提交进行安全和质量审查，生成审查报告',
    cronIdx: 0,
    targetAgentName: '代码审查 Agent',
    allowedTools: ['read_file', 'bash_exec', 'http_request'],
    status: 'active',
    runCount: 42,
  },
  {
    name: '依赖漏洞扫描',
    instruction: '运行 npm audit 检查所有项目依赖的安全漏洞，高危漏洞发送告警',
    cronIdx: 1,
    targetAgentName: '测试 Agent',
    allowedTools: ['bash_exec', 'http_request'],
    status: 'active',
    runCount: 30,
  },
  {
    name: '自动化性能测试',
    instruction: '运行 Lighthouse CI 对核心页面进行性能测试，分数下降超过10分时触发告警',
    cronIdx: 2,
    targetAgentName: '测试 Agent',
    allowedTools: ['bash_exec', 'browser_screenshot', 'http_request'],
    status: 'paused',
    runCount: 15,
  },
  {
    name: '月度文档更新',
    instruction: '分析本月代码变更，更新 README 和 API 文档，提交 PR',
    cronIdx: 3,
    targetAgentName: '前端开发 Agent',
    allowedTools: ['read_file', 'write_file', 'bash_exec'],
    status: 'error',
    runCount: 3,
  },
]

export function makeScheduledTaskList(wsId: string): ScheduledTask[] {
  return TASK_SEEDS.map((seed, i) => {
    const preset = CRON_PRESETS[seed.cronIdx]!
    const task: ScheduledTask = {
      id: `task-${taskSeq++}`,
      workspaceId: wsId,
      name: seed.name,
      instruction: seed.instruction,
      cronExpression: preset.expr,
      cronDescription: preset.desc,
      targetAgentName: seed.targetAgentName,
      allowedTools: seed.allowedTools,
      enabled: seed.status !== 'paused',
      status: seed.status,
      lastRunAt: minutesAgo(rand(30, 1440)),
      nextRunAt: hoursFromNow(rand(1, 24)),
      runCount: seed.runCount,
      createdAt: daysAgo(rand(30, 90)),
      updatedAt: daysAgo(rand(0, 7)),
    }
    if (i === 0) task.targetAgentId = 'agent-review-1'
    return task
  })
}

const EXEC_STATUSES: ExecutionStatus[] = [
  'success',
  'success',
  'success',
  'failed',
  'success',
  'cancelled',
  'success',
  'success',
  'running',
  'success',
]
const LOG_SUMMARIES = [
  '审查了 12 个文件，发现 2 个低风险问题，已记录',
  '扫描完成，发现 3 个中危漏洞，已发送告警邮件',
  '性能测试通过，所有页面评分均在 85 分以上',
  '文档更新完成，已创建 PR #123',
  '发现 1 个高危漏洞，已触发紧急告警',
  '任务被手动取消',
  '所有检查通过，无异常',
  '超时（> 10分钟），任务已中止',
]

export function makeTaskExecutionList(
  taskId: string,
  taskName: string,
  count = 10,
): TaskExecution[] {
  return Array.from({ length: count }, (_, i) => {
    const status = EXEC_STATUSES[i % EXEC_STATUSES.length]!
    const startedAt = minutesAgo(rand(i * 60, (i + 1) * 60 * 24))
    const durationMs = rand(5000, 300000)
    const exec: TaskExecution = {
      id: `exec-${execSeq++}`,
      taskId,
      taskName,
      status,
      startedAt,
      ...(status !== 'running'
        ? {
            completedAt: new Date(new Date(startedAt).getTime() + durationMs).toISOString(),
            durationMs,
            logSummary: LOG_SUMMARIES[i % LOG_SUMMARIES.length],
          }
        : {}),
    }
    return exec
  })
}
