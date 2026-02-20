import type { Agent, AgentConnection, AgentTask, TaskStatus } from '@/types/api'
import { makeAgentTeam } from './agent.factory'

let connSeq = 1
let taskSeq = 1
const connId = () => `conn-${connSeq++}`
const taskId = () => `task-${taskSeq++}`

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString()
}

export function makeConnections(agents: Agent[]): AgentConnection[] {
  const byRole = (role: string) => agents.find((a) => a.role === role)!

  const coordinator = byRole('coordinator')
  const requirements = byRole('requirements')
  const architecture = byRole('architecture')
  const frontend = byRole('frontend')
  const backend = byRole('backend')
  const testing = byRole('testing')
  const devops = byRole('devops')
  const review = byRole('review')

  return [
    // Coordinator → all specialists
    {
      id: connId(),
      sourceAgentId: coordinator.id,
      targetAgentId: requirements.id,
      messageCount: 12,
      label: '需求下发',
      active: true,
    },
    {
      id: connId(),
      sourceAgentId: coordinator.id,
      targetAgentId: architecture.id,
      messageCount: 8,
      label: '架构指令',
      active: true,
    },
    {
      id: connId(),
      sourceAgentId: coordinator.id,
      targetAgentId: frontend.id,
      messageCount: 15,
      active: true,
    },
    {
      id: connId(),
      sourceAgentId: coordinator.id,
      targetAgentId: backend.id,
      messageCount: 10,
      active: false,
    },
    {
      id: connId(),
      sourceAgentId: coordinator.id,
      targetAgentId: devops.id,
      messageCount: 5,
      active: false,
    },

    // Requirements → Architecture
    {
      id: connId(),
      sourceAgentId: requirements.id,
      targetAgentId: architecture.id,
      messageCount: 6,
      label: '需求文档',
      active: false,
    },

    // Architecture → Frontend / Backend
    {
      id: connId(),
      sourceAgentId: architecture.id,
      targetAgentId: frontend.id,
      messageCount: 9,
      label: '前端设计',
      active: true,
    },
    {
      id: connId(),
      sourceAgentId: architecture.id,
      targetAgentId: backend.id,
      messageCount: 7,
      label: '后端设计',
      active: false,
    },

    // Frontend / Backend → Testing
    {
      id: connId(),
      sourceAgentId: frontend.id,
      targetAgentId: testing.id,
      messageCount: 4,
      label: '提交测试',
      active: false,
    },
    {
      id: connId(),
      sourceAgentId: backend.id,
      targetAgentId: testing.id,
      messageCount: 3,
      active: false,
    },

    // Testing → Review
    {
      id: connId(),
      sourceAgentId: testing.id,
      targetAgentId: review.id,
      messageCount: 2,
      label: '测试报告',
      active: false,
    },

    // DevOps → Review (deployment review)
    {
      id: connId(),
      sourceAgentId: devops.id,
      targetAgentId: review.id,
      messageCount: 1,
      active: false,
    },
  ]
}

const TASK_TITLES: Record<string, string[]> = {
  coordinator: ['协调团队任务分配', '制定项目里程碑'],
  requirements: ['分析用户登录需求', '整理 API 接口文档'],
  architecture: ['设计微服务架构', '评审数据库方案'],
  frontend: ['实现拓扑可视化页面', '优化组件渲染性能'],
  backend: ['实现 REST API 端点', '编写数据迁移脚本'],
  testing: ['编写集成测试用例', '执行性能压力测试'],
  devops: ['配置 CI/CD 流水线', '设置监控告警规则'],
  review: ['审查前端代码质量', '审查后端安全性'],
}

function pickStatus(index: number): TaskStatus {
  // Distribute statuses predictably for demo variety
  const pattern: TaskStatus[] = [
    'in_progress',
    'completed',
    'pending',
    'review',
    'assigned',
    'failed',
    'blocked',
    'completed',
  ]
  return pattern[index % pattern.length]!
}

export function makeTasksForTeam(agents: Agent[]): AgentTask[] {
  const tasks: AgentTask[] = []
  let idx = 0

  for (const agent of agents) {
    const titles = TASK_TITLES[agent.role] ?? ['通用任务 A', '通用任务 B']
    for (const title of titles) {
      const status = pickStatus(idx)
      const progress =
        status === 'completed'
          ? 100
          : status === 'failed'
            ? 45
            : status === 'in_progress'
              ? 30 + ((idx * 13) % 60)
              : status === 'review'
                ? 85
                : status === 'assigned'
                  ? 10
                  : status === 'blocked'
                    ? 20
                    : 0

      const createdAt = minutesAgo(120 - idx * 7)
      const isStarted = status !== 'pending'
      const isDone = status === 'completed' || status === 'failed'

      tasks.push({
        id: taskId(),
        title,
        description: `${title}的详细描述`,
        status,
        assignedAgentId: agent.id,
        progress,
        createdAt,
        ...(isStarted ? { startedAt: minutesAgo(100 - idx * 5) } : {}),
        ...(isDone ? { completedAt: minutesAgo(10 + idx * 2) } : {}),
        ...(isDone ? { duration: (30 + idx * 8) * 60_000 } : {}),
      })
      idx++
    }
  }

  return tasks
}

export function makeTopologyData(workspaceId: string) {
  const agents = makeAgentTeam(workspaceId)
  const connections = makeConnections(agents)
  const tasks = makeTasksForTeam(agents)
  return { agents, connections, tasks }
}
