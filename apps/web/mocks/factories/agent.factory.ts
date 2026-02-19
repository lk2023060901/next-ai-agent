import type { Agent, AgentRole, AgentStatus } from '@/types/api'
import { ROLE_AVATARS, ROLE_COLORS, ROLE_DESCRIPTIONS } from '@/lib/constants/agent'

let seq = 1
const id = () => `agent-${seq++}`
const now = () => new Date().toISOString()

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

export function makeAgent(overrides: Partial<Agent> = {}): Agent {
  const role: AgentRole = overrides.role ?? 'frontend'
  return {
    id: id(),
    name: ROLE_NAMES[role],
    role,
    status: 'idle',
    workspaceId: 'ws-default',
    model: 'claude-sonnet-4-6',
    tools: [],
    createdAt: now(),
    updatedAt: now(),
    avatar: ROLE_AVATARS[role],
    description: ROLE_DESCRIPTIONS[role],
    color: ROLE_COLORS[role],
    knowledgeBases: [],
    responsibilities: [],
    triggerExamples: [],
    identifier: role,
    ...overrides,
  }
}

export function makeAgentTeam(workspaceId: string): Agent[] {
  const roles: AgentRole[] = [
    'coordinator',
    'requirements',
    'architecture',
    'frontend',
    'backend',
    'testing',
    'devops',
    'review',
  ]
  const statuses: AgentStatus[] = [
    'running',
    'idle',
    'idle',
    'running',
    'idle',
    'idle',
    'idle',
    'idle',
  ]
  return roles.map((role, i) => makeAgent({ role, workspaceId, status: statuses[i] ?? 'idle' }))
}
