import type { AgentRole } from '@/types/api'

// Mirrors CSS variable hex values for Recharts (SVG needs literal colors)
export const CHART_COLORS = {
  primary50: '#e8eef8',
  primary100: '#c5d5ef',
  primary300: '#749ad6',
  primary500: '#173f78',
  primary600: '#133369',
  success: '#17c964',
  success50: '#e8faf0',
  warning: '#f5a524',
  danger: '#f31260',
  textTertiary: '#8a9ab5',
  border: '#d2dceb',
} as const

export const AGENT_ROLE_COLORS: Record<AgentRole, string> = {
  coordinator: '#11181c',
  requirements: '#9353d3',
  architecture: '#006fee',
  frontend: '#17c964',
  backend: '#f5a524',
  testing: '#f31260',
  devops: '#71717a',
  review: '#0e8aaa',
}

export const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: '#d4a27f',
  OpenAI: '#10a37f',
  Google: '#4285f4',
  Other: '#71717a',
}

export type SparklineType = 'line' | 'bar' | 'area'
