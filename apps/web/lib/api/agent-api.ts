import { apiClient } from './client'
import type { ApiResponse, Agent, AgentRole } from '@/types/api'

interface CreateAgentBody {
  name: string
  role: AgentRole
  model?: string
  systemPrompt?: string
  tools?: string[]
}

export const agentApi = {
  list: (workspaceId: string) =>
    apiClient.get<ApiResponse<Agent[]>>(`/workspaces/${workspaceId}/agents`),

  get: (id: string) =>
    apiClient.get<ApiResponse<Agent>>(`/agents/${id}`),

  create: (workspaceId: string, body: CreateAgentBody) =>
    apiClient.post<ApiResponse<Agent>>(`/workspaces/${workspaceId}/agents`, body),

  update: (id: string, body: Partial<CreateAgentBody>) =>
    apiClient.patch<ApiResponse<Agent>>(`/agents/${id}`, body),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/agents/${id}`),
}
