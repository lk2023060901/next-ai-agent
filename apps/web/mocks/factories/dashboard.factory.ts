import type {
  AgentRole,
  DashboardStats,
  StatMetric,
  DailyMessageStats,
  AgentWorkload,
  ActivityEvent,
  ActivityType,
} from '@/types/api'

let eventSeq = 1
const eventId = () => `evt-${eventSeq++}`

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeSparkline(length = 7, min = 10, max = 100): number[] {
  return Array.from({ length }, () => rand(min, max))
}

function makeStatMetric(value: number, min = 5, max = 80): StatMetric {
  return {
    value,
    trend: rand(-20, 30),
    sparkline: makeSparkline(7, min, max),
  }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function minutesAgo(n: number): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - n)
  return d.toISOString()
}

export function makeDashboardStats(): DashboardStats {
  return {
    activeAgents: makeStatMetric(6, 3, 8),
    todaySessions: makeStatMetric(128, 50, 200),
    tokenUsage: makeStatMetric(1_420_000, 500_000, 2_000_000),
    completedTasks: makeStatMetric(47, 20, 60),
  }
}

export function makeMessageTrend(days = 7): DailyMessageStats[] {
  return Array.from({ length: days }, (_, i) => ({
    date: daysAgo(days - 1 - i),
    inbound: rand(80, 200),
    outbound: rand(120, 300),
  }))
}

const ROLE_NAMES: Record<AgentRole, string> = {
  coordinator: '协调者',
  requirements: '需求分析师',
  architecture: '架构师',
  frontend: '前端工程师',
  backend: '后端工程师',
  testing: '测试工程师',
  devops: 'DevOps 工程师',
  review: '代码审查员',
}

const ALL_ROLES: AgentRole[] = [
  'coordinator',
  'requirements',
  'architecture',
  'frontend',
  'backend',
  'testing',
  'devops',
  'review',
]

export function makeAgentWorkload(): AgentWorkload[] {
  return ALL_ROLES.map((role, i) => ({
    agentId: `agent-${i + 1}`,
    agentName: ROLE_NAMES[role],
    role,
    taskCount: rand(5, 25),
  }))
}

const ACTIVITY_TEMPLATES: { type: ActivityType; title: string; description: string }[] = [
  { type: 'agent', title: '前端工程师完成任务', description: '组件开发任务已完成，通过代码审查' },
  { type: 'member', title: '张三发起新对话', description: '关于登录页面优化的讨论' },
  { type: 'system', title: '系统自动备份', description: '工作区数据已备份至云端' },
  { type: 'agent', title: '架构师提交设计方案', description: '微服务拆分方案 v2 已提交审核' },
  { type: 'member', title: '李四邀请新成员', description: '王五已加入开发工作区' },
  {
    type: 'agent',
    title: '测试工程师发现缺陷',
    description: 'API 接口返回格式不一致，已创建修复任务',
  },
  {
    type: 'system',
    title: 'Agent 模型升级',
    description: '后端工程师模型已升级至 Claude Sonnet 4',
  },
  { type: 'member', title: '赵六更新知识库', description: '上传了 API 接口文档 v3.2' },
  { type: 'agent', title: '协调者分配新任务', description: '性能优化任务已分配给后端工程师' },
  { type: 'agent', title: 'DevOps 完成部署', description: '生产环境 v2.1.0 部署成功' },
  { type: 'member', title: '孙七提交审批', description: '数据库迁移脚本需要高权限审批' },
  { type: 'system', title: 'Token 配额预警', description: '本月 Token 用量已达 80%' },
]

const AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=a1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=b2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=c3',
]

const ACTOR_NAMES = [
  '前端工程师',
  '张三',
  '系统',
  '架构师',
  '李四',
  '测试工程师',
  '系统',
  '赵六',
  '协调者',
  'DevOps 工程师',
  '孙七',
  '系统',
]

export function makeActivities(count = 12): ActivityEvent[] {
  return Array.from({ length: count }, (_, i) => {
    const tpl = ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length]!
    return {
      id: eventId(),
      type: tpl.type,
      title: tpl.title,
      description: tpl.description,
      timestamp: minutesAgo(i * 15 + rand(1, 10)),
      actorName: ACTOR_NAMES[i % ACTOR_NAMES.length]!,
      actorAvatar: AVATARS[i % AVATARS.length]!,
    }
  })
}
