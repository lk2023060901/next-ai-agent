import { apiClient } from './client'
import type {
  ApiResponse,
  Agent,
  AgentColor,
  AgentRole,
  TriggerExample,
  Tool,
  KnowledgeBase,
} from '@/types/api'

export interface CreateAgentBody {
  name: string
  role: AgentRole
  model?: string
  systemPrompt?: string
  tools?: string[]
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

export const agentApi = {
  list: (workspaceId: string) =>
    apiClient.get<ApiResponse<Agent[]>>(`/workspaces/${workspaceId}/agents`),

  get: (id: string) => apiClient.get<ApiResponse<Agent>>(`/agents/${id}`),

  create: (workspaceId: string, body: CreateAgentBody) =>
    apiClient.post<ApiResponse<Agent>>(`/workspaces/${workspaceId}/agents`, body),

  update: (id: string, body: Partial<CreateAgentBody>) =>
    apiClient.patch<ApiResponse<Agent>>(`/agents/${id}`, body),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/agents/${id}`),
}

export const toolApi = {
  list: (workspaceId: string) =>
    apiClient.get<ApiResponse<Tool[]>>(`/workspaces/${workspaceId}/tools`),

  getAuth: (workspaceId: string) =>
    apiClient.get<ApiResponse<Record<string, Record<string, boolean>>>>(
      `/workspaces/${workspaceId}/tool-auth`,
    ),

  updateAuth: (workspaceId: string, body: Record<string, Record<string, boolean>>) =>
    apiClient.post<ApiResponse<Record<string, Record<string, boolean>>>>(
      `/workspaces/${workspaceId}/tool-auth`,
      body,
    ),
}

export const knowledgeBaseApi = {
  list: (workspaceId: string) =>
    apiClient.get<ApiResponse<KnowledgeBase[]>>(`/workspaces/${workspaceId}/knowledge-bases`),
}
