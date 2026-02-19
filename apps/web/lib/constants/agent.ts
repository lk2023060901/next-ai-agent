import type { AgentRole, AgentColor, AgentStatus, ToolRiskLevel, ToolPlatform } from '@/types/api'
import { Monitor, Cloud, Globe, type LucideIcon } from 'lucide-react'

// ─── Roles ──────────────────────────────────────────────────────────────────

export const ALL_ROLES: AgentRole[] = [
  'coordinator',
  'requirements',
  'architecture',
  'frontend',
  'backend',
  'testing',
  'devops',
  'review',
]

export const ROLE_LABELS: Record<AgentRole, string> = {
  coordinator: '协调者',
  requirements: '需求分析',
  architecture: '架构师',
  frontend: '前端',
  backend: '后端',
  testing: '测试',
  devops: 'DevOps',
  review: '审查',
}

export const ROLE_AVATARS: Record<AgentRole, string> = {
  coordinator: '🎯',
  requirements: '📋',
  architecture: '🏗️',
  frontend: '🎨',
  backend: '⚙️',
  testing: '🧪',
  devops: '🚀',
  review: '🔍',
}

export const ROLE_COLORS: Record<AgentRole, AgentColor> = {
  coordinator: 'blue',
  requirements: 'magenta',
  architecture: 'cyan',
  frontend: 'green',
  backend: 'yellow',
  testing: 'red',
  devops: 'blue',
  review: 'cyan',
}

export const ROLE_DESCRIPTIONS: Record<AgentRole, string> = {
  coordinator: '负责协调各 Agent 之间的任务分配与流程管理',
  requirements: '分析用户需求，输出结构化需求文档',
  architecture: '设计系统架构，把控技术选型与模块划分',
  frontend: '实现前端界面与交互逻辑',
  backend: '实现后端 API、业务逻辑与数据层',
  testing: '编写和执行测试用例，保障代码质量',
  devops: '管理 CI/CD、部署流程与基础设施',
  review: '进行代码审查，确保代码质量与规范一致性',
}

export const ROLES: Array<{ role: AgentRole; label: string; emoji: string; color: AgentColor }> =
  ALL_ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    emoji: ROLE_AVATARS[role],
    color: ROLE_COLORS[role],
  }))

// ─── Models ─────────────────────────────────────────────────────────────────

export const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet', desc: '均衡性能与成本' },
  { id: 'claude-opus-4-6', label: 'Claude Opus', desc: '最强推理能力' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku', desc: '低延迟轻量任务' },
] as const

// ─── Agent Colors ───────────────────────────────────────────────────────────

export const AGENT_COLORS: AgentColor[] = ['blue', 'cyan', 'green', 'yellow', 'red', 'magenta']

export const COLOR_LABELS: Record<AgentColor, string> = {
  blue: '蓝色',
  cyan: '青色',
  green: '绿色',
  yellow: '黄色',
  red: '红色',
  magenta: '品红',
}

// ─── Status ─────────────────────────────────────────────────────────────────

export const STATUS_MAP: Record<AgentStatus, { label: string; dot: string }> = {
  idle: { label: '空闲', dot: 'bg-gray-400' },
  running: { label: '运行中', dot: 'bg-[var(--color-success)] animate-pulse' },
  paused: { label: '已暂停', dot: 'bg-[var(--color-warning)]' },
  error: { label: '错误', dot: 'bg-[var(--color-danger)]' },
  completed: { label: '已完成', dot: 'bg-[var(--color-primary-400)]' },
}

export const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'running', label: '运行中' },
  { key: 'idle', label: '空闲' },
  { key: 'error', label: '错误' },
]

// ─── Tool Risk + Platform ───────────────────────────────────────────────────

export const RISK_STYLES: Record<ToolRiskLevel, { label: string; className: string }> = {
  low: { label: '低', className: 'bg-[var(--color-success-50)] text-[var(--color-success-700)]' },
  medium: {
    label: '中',
    className: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)]',
  },
  high: { label: '高', className: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]' },
}

export const RISK_TABS = [
  { key: 'all', label: '全部' },
  { key: 'low', label: '低风险' },
  { key: 'medium', label: '中风险' },
  { key: 'high', label: '高风险' },
]

export const PLATFORM_ICONS: Record<ToolPlatform, { icon: LucideIcon; label: string }> = {
  local: { icon: Monitor, label: '本地' },
  cloud: { icon: Cloud, label: '云端' },
  both: { icon: Globe, label: '混合' },
}
