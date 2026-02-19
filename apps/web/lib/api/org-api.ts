import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse, Org, OrgMember, Workspace } from '@/types/api'

export const orgApi = {
  list: () =>
    apiClient.get<ApiResponse<Org[]>>('/orgs'),

  get: (slug: string) =>
    apiClient.get<ApiResponse<Org>>(`/orgs/${slug}`),

  members: (slug: string, page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<OrgMember>>(
      `/orgs/${slug}/members?page=${page}&pageSize=${pageSize}`,
    ),

  workspaces: (slug: string) =>
    apiClient.get<ApiResponse<Workspace[]>>(`/orgs/${slug}/workspaces`),

  update: (slug: string, body: Partial<Pick<Org, 'name' | 'avatarUrl'>>) =>
    apiClient.patch<ApiResponse<Org>>(`/orgs/${slug}`, body),
}
