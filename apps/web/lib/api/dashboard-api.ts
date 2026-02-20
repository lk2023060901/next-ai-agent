import { apiClient } from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  DailyMessageStats,
  AgentWorkload,
  ActivityEvent,
  UsageOverview,
  DailyTokenUsage,
  ProviderUsage,
  AgentUsageRank,
  UsageRecord,
  UsageFilters,
} from '@/types/api'

export const dashboardApi = {
  getStats: (orgId: string) =>
    apiClient.get<ApiResponse<DashboardStats>>(`/orgs/${orgId}/dashboard/stats`),

  getMessageTrend: (orgId: string) =>
    apiClient.get<ApiResponse<DailyMessageStats[]>>(`/orgs/${orgId}/dashboard/message-trend`),

  getWorkload: (orgId: string) =>
    apiClient.get<ApiResponse<AgentWorkload[]>>(`/orgs/${orgId}/dashboard/workload`),

  getActivities: (orgId: string) =>
    apiClient.get<ApiResponse<ActivityEvent[]>>(`/orgs/${orgId}/dashboard/activities`),
}

function buildQuery(filters: UsageFilters): string {
  const params = new URLSearchParams()
  params.set('startDate', filters.startDate)
  params.set('endDate', filters.endDate)
  if (filters.workspaceId) params.set('workspaceId', filters.workspaceId)
  if (filters.agentId) params.set('agentId', filters.agentId)
  return params.toString()
}

export const usageApi = {
  getOverview: (orgId: string, filters: UsageFilters) =>
    apiClient.get<ApiResponse<UsageOverview>>(
      `/orgs/${orgId}/usage/overview?${buildQuery(filters)}`,
    ),

  getTokenTrend: (orgId: string, filters: UsageFilters) =>
    apiClient.get<ApiResponse<DailyTokenUsage[]>>(
      `/orgs/${orgId}/usage/token-trend?${buildQuery(filters)}`,
    ),

  getProviders: (orgId: string, filters: UsageFilters) =>
    apiClient.get<ApiResponse<ProviderUsage[]>>(
      `/orgs/${orgId}/usage/providers?${buildQuery(filters)}`,
    ),

  getAgentRanking: (orgId: string, filters: UsageFilters) =>
    apiClient.get<ApiResponse<AgentUsageRank[]>>(
      `/orgs/${orgId}/usage/agent-ranking?${buildQuery(filters)}`,
    ),

  getRecords: (orgId: string, filters: UsageFilters, page = 1, pageSize = 100) =>
    apiClient.get<PaginatedResponse<UsageRecord>>(
      `/orgs/${orgId}/usage/records?${buildQuery(filters)}&page=${page}&pageSize=${pageSize}`,
    ),
}
