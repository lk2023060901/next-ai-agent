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
