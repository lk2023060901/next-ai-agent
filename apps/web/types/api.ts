// ─── Shared API types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupRequest {
  name: string
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// ─── User ──────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

// ─── Organization ──────────────────────────────────────────────────────────

export interface Org {
  id: string
  slug: string
  name: string
  avatarUrl?: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: string
}

export interface OrgMember {
  id: string
  userId: string
  orgId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  user: User
  joinedAt: string
}

// ─── Workspace ─────────────────────────────────────────────────────────────

export interface Workspace {
  id: string
  slug: string
  name: string
  emoji: string
  orgId: string
  description?: string
  createdAt: string
}

// ─── Agent ─────────────────────────────────────────────────────────────────

export type AgentRole =
  | 'coordinator'
  | 'requirements'
  | 'architecture'
  | 'frontend'
  | 'backend'
  | 'testing'
  | 'devops'
  | 'review'

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed'

export type AgentColor = 'blue' | 'cyan' | 'green' | 'yellow' | 'red' | 'magenta'

export interface TriggerExample {
  user: string
  assistant: string
}

export interface Agent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  workspaceId: string
  model: string
  systemPrompt?: string
  tools: string[]
  createdAt: string
  updatedAt: string
  avatar?: string
  description?: string
  color?: AgentColor
  knowledgeBases?: string[]
  temperature?: number
  responsibilities?: string[]
  qualityStandards?: string[]
  outputFormat?: string
  edgeCases?: string[]
  triggerExamples?: TriggerExample[]
  identifier?: string
  constraints?: string[]
}

// ─── Tool ──────────────────────────────────────────────────────────────────

export type ToolRiskLevel = 'low' | 'medium' | 'high'
export type ToolPlatform = 'local' | 'cloud' | 'both'

export interface Tool {
  id: string
  name: string
  category: string
  description: string
  riskLevel: ToolRiskLevel
  platform: ToolPlatform
  requiresApproval: boolean
}

// ─── Knowledge Base ────────────────────────────────────────────────────────

export interface KnowledgeBase {
  id: string
  name: string
  workspaceId: string
  documentCount: number
  createdAt: string
}

// ─── Session / Chat ─────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export type MessageStatus = 'sending' | 'sent' | 'error' | 'streaming'

export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  agentId?: string
  status: MessageStatus
  createdAt: string
}

export interface Session {
  id: string
  title: string
  workspaceId: string
  status: 'active' | 'archived'
  messageCount: number
  lastMessageAt?: string
  createdAt: string
}

// ─── Streaming / SSE ────────────────────────────────────────────────────────

export interface ToolCall {
  id: string
  name: string
  category: 'file' | 'browser' | 'terminal' | 'system' | 'api'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  isLocal: boolean
  params: Record<string, unknown>
  status: 'running' | 'success' | 'error'
  result?: string
  errorMessage?: string
}

export interface ApprovalRequest {
  id: string
  toolName: string
  reason: string
  riskLevel: 'medium' | 'high' | 'critical'
  policySource: string
  params: Record<string, unknown>
  expiresAt: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
}

export type SseEvent =
  | { type: 'agent-switch'; agentId: string; agentRole: string; agentName: string }
  | { type: 'message-start'; messageId: string; agentId: string }
  | { type: 'text-delta'; messageId: string; delta: string }
  | { type: 'tool-call'; messageId: string; toolCall: ToolCall }
  | {
      type: 'tool-result'
      messageId: string
      toolCallId: string
      result: string
      status: 'success' | 'error'
    }
  | { type: 'approval-request'; messageId: string; approval: ApprovalRequest }
  | { type: 'message-end'; messageId: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

// Extended message with streaming artifacts
export interface StreamingMessage extends Message {
  toolCalls?: ToolCall[]
  approvalRequest?: ApprovalRequest
}

// ─── Project ───────────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  workspaceId: string
  progress: number
  agentCount: number
  createdAt: string
  updatedAt: string
}

// ─── Task (Agent Collaboration) ──────────────────────────────────────────

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'failed'
  | 'blocked'

export interface AgentTask {
  id: string
  title: string
  description: string
  status: TaskStatus
  assignedAgentId: string
  progress: number // 0-100
  createdAt: string
  startedAt?: string
  completedAt?: string
  duration?: number // milliseconds
  dependencies?: string[] // task ids
}

// ─── Topology ────────────────────────────────────────────────────────────

export interface AgentConnection {
  id: string
  sourceAgentId: string
  targetAgentId: string
  messageCount: number
  label?: string
  active: boolean
}

export interface TopologyData {
  agents: Agent[]
  connections: AgentConnection[]
  tasks: AgentTask[]
}

// ─── Dashboard ───────────────────────────────────────────────────────────

export interface StatMetric {
  value: number
  trend: number // percentage, e.g. 12 means +12%
  sparkline: number[] // 7 data points
}

export interface DashboardStats {
  activeAgents: StatMetric
  todaySessions: StatMetric
  tokenUsage: StatMetric
  completedTasks: StatMetric
}

export interface DailyMessageStats {
  date: string
  inbound: number
  outbound: number
}

export interface AgentWorkload {
  agentId: string
  agentName: string
  role: AgentRole
  taskCount: number
}

export type ActivityType = 'agent' | 'member' | 'system'

export interface ActivityEvent {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  actorName: string
  actorAvatar: string
}

// ─── Usage ───────────────────────────────────────────────────────────────

export interface UsageOverview {
  totalTokens: StatMetric
  apiCalls: StatMetric
  avgResponseTime: StatMetric
  estimatedCost: StatMetric
}

export interface DailyTokenUsage {
  date: string
  inputTokens: number
  outputTokens: number
}

export interface ProviderUsage {
  provider: string
  tokens: number
  percentage: number
  color: string
}

export interface AgentUsageRank {
  agentId: string
  agentName: string
  role: AgentRole
  tokens: number
}

export interface UsageRecord {
  id: string
  timestamp: string
  agentId: string
  agentName: string
  agentRole: AgentRole
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  duration: number // ms
  cost: number // currency amount
  success: boolean
  [key: string]: unknown // needed for DataTable constraint
}

export interface UsageFilters {
  startDate: string
  endDate: string
  workspaceId?: string
  agentId?: string
}
