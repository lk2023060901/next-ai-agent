import { apiClient } from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Channel,
  CreateChannelBody,
  UpdateChannelBody,
  ChannelMessage,
  ChannelMessageFilters,
  ChannelStats,
  RoutingRule,
  CreateRoutingRuleBody,
} from '@/types/api'

export const channelApi = {
  // ─── Channels ────────────────────────────────────────────────────────────
  list: (workspaceId: string) =>
    apiClient.get<ApiResponse<Channel[]>>(`/workspaces/${workspaceId}/channels`),

  create: (workspaceId: string, body: CreateChannelBody) =>
    apiClient.post<ApiResponse<Channel>>(`/workspaces/${workspaceId}/channels`, body),

  update: (channelId: string, body: UpdateChannelBody) =>
    apiClient.patch<ApiResponse<Channel>>(`/channels/${channelId}`, body),

  delete: (channelId: string) => apiClient.delete<ApiResponse<null>>(`/channels/${channelId}`),

  testConnection: (channelId: string) =>
    apiClient.post<ApiResponse<{ success: boolean; botName?: string; error?: string }>>(
      `/channels/${channelId}/test`,
      {},
    ),

  // ─── Stats ───────────────────────────────────────────────────────────────
  getStats: (channelId: string) =>
    apiClient.get<ApiResponse<ChannelStats>>(`/channels/${channelId}/stats`),

  // ─── Messages ────────────────────────────────────────────────────────────
  listMessages: (channelId: string, filters: ChannelMessageFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.direction) params.set('direction', filters.direction)
    if (filters.status) params.set('status', filters.status)
    if (filters.sender) params.set('sender', filters.sender)
    if (filters.page) params.set('page', String(filters.page))
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
    const qs = params.toString()
    return apiClient.get<PaginatedResponse<ChannelMessage>>(
      `/channels/${channelId}/messages${qs ? `?${qs}` : ''}`,
    )
  },

  // ─── Routing Rules ────────────────────────────────────────────────────────
  listRules: (channelId: string) =>
    apiClient.get<ApiResponse<RoutingRule[]>>(`/channels/${channelId}/rules`),

  createRule: (channelId: string, body: CreateRoutingRuleBody) =>
    apiClient.post<ApiResponse<RoutingRule>>(`/channels/${channelId}/rules`, body),

  updateRule: (
    channelId: string,
    ruleId: string,
    body: Partial<CreateRoutingRuleBody & { enabled: boolean; priority: number }>,
  ) => apiClient.patch<ApiResponse<RoutingRule>>(`/channels/${channelId}/rules/${ruleId}`, body),

  deleteRule: (channelId: string, ruleId: string) =>
    apiClient.delete<ApiResponse<null>>(`/channels/${channelId}/rules/${ruleId}`),
}
