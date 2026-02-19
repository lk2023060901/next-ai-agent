import { apiClient } from './client'
import type { ApiResponse, Session, StreamingMessage } from '@/types/api'

export const sessionApi = {
  list: (workspaceId: string) =>
    apiClient.get<ApiResponse<Session[]>>(`/workspaces/${workspaceId}/sessions`),

  create: (workspaceId: string, title: string) =>
    apiClient.post<ApiResponse<Session>>(`/workspaces/${workspaceId}/sessions`, { title }),

  messages: (sessionId: string) =>
    apiClient.get<ApiResponse<StreamingMessage[]>>(`/sessions/${sessionId}/messages`),

  sendMessage: (sessionId: string, content: string) =>
    apiClient.post<ApiResponse<StreamingMessage>>(`/sessions/${sessionId}/messages`, {
      role: 'user',
      content,
    }),
}
