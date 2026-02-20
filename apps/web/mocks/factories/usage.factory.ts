import type {
  AgentRole,
  UsageOverview,
  StatMetric,
  DailyTokenUsage,
  ProviderUsage,
  AgentUsageRank,
  UsageRecord,
} from '@/types/api'
import { PROVIDER_COLORS } from '@/lib/constants/chart'

let recordSeq = 1
const recordId = () => `rec-${recordSeq++}`

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeSparkline(length = 7, min = 10, max = 100): number[] {
  return Array.from({ length }, () => rand(min, max))
}

function makeStatMetric(value: number, min = 5, max = 80): StatMetric {
  return {
    value,
    trend: rand(-15, 25),
    sparkline: makeSparkline(7, min, max),
  }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function randomTimestamp(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - rand(0, daysBack))
  d.setHours(rand(8, 22), rand(0, 59), rand(0, 59))
  return d.toISOString()
}

export function makeUsageOverview(): UsageOverview {
  return {
    totalTokens: makeStatMetric(8_560_000, 2_000_000, 10_000_000),
    apiCalls: makeStatMetric(3_240, 1_000, 5_000),
    avgResponseTime: makeStatMetric(1_250, 800, 2_000),
    estimatedCost: makeStatMetric(426, 100, 600),
  }
}

export function makeTokenTrend(days = 30): DailyTokenUsage[] {
  return Array.from({ length: days }, (_, i) => ({
    date: daysAgo(days - 1 - i),
    inputTokens: rand(100_000, 400_000),
    outputTokens: rand(50_000, 200_000),
  }))
}

export function makeProviderUsage(): ProviderUsage[] {
  const raw = [
    { provider: 'Anthropic', tokens: 4_280_000 },
    { provider: 'OpenAI', tokens: 2_568_000 },
    { provider: 'Google', tokens: 1_284_000 },
    { provider: 'Other', tokens: 428_000 },
  ]
  const total = raw.reduce((s, r) => s + r.tokens, 0)
  return raw.map((r) => ({
    ...r,
    percentage: Math.round((r.tokens / total) * 100),
    color: PROVIDER_COLORS[r.provider] ?? '#71717a',
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

export function makeAgentRanking(): AgentUsageRank[] {
  return ALL_ROLES.map((role, i) => ({
    agentId: `agent-${i + 1}`,
    agentName: ROLE_NAMES[role],
    role,
    tokens: rand(200_000, 2_000_000),
  })).sort((a, b) => b.tokens - a.tokens)
}

const PROVIDERS = ['Anthropic', 'OpenAI', 'Google']
const MODELS: Record<string, string[]> = {
  Anthropic: ['claude-sonnet-4-6', 'claude-haiku-4-5'],
  OpenAI: ['gpt-4o', 'gpt-4o-mini'],
  Google: ['gemini-2.0-flash', 'gemini-2.0-pro'],
}

export function makeUsageRecords(count = 200): UsageRecord[] {
  return Array.from({ length: count }, () => {
    const provider = PROVIDERS[rand(0, PROVIDERS.length - 1)]!
    const providerModels = MODELS[provider]!
    const model = providerModels[rand(0, providerModels.length - 1)]!
    const role = ALL_ROLES[rand(0, ALL_ROLES.length - 1)]!
    const inputTokens = rand(500, 50_000)
    const outputTokens = rand(200, 30_000)
    return {
      id: recordId(),
      timestamp: randomTimestamp(30),
      agentId: `agent-${rand(1, 8)}`,
      agentName: ROLE_NAMES[role],
      agentRole: role,
      provider,
      model,
      inputTokens,
      outputTokens,
      duration: rand(200, 8_000),
      cost: Number(((inputTokens * 0.003 + outputTokens * 0.015) / 1000).toFixed(4)),
      success: Math.random() > 0.05,
    }
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}
