import { apiClient } from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Plugin,
  InstalledPlugin,
  PluginReview,
  InstallPluginBody,
  UpdatePluginConfigBody,
  PluginMarketplaceFilters,
} from '@/types/api'

export const pluginApi = {
  // ─── Marketplace ──────────────────────────────────────────────────────────
  listMarketplace: (filters: PluginMarketplaceFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.type) params.set('type', filters.type)
    if (filters.pricingModel) params.set('pricingModel', filters.pricingModel)
    if (filters.search) params.set('search', filters.search)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.page) params.set('page', String(filters.page))
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
    const qs = params.toString()
    return apiClient.get<PaginatedResponse<Plugin>>(`/plugins/marketplace${qs ? `?${qs}` : ''}`)
  },

  getPlugin: (pluginId: string) =>
    apiClient.get<ApiResponse<Plugin>>(`/plugins/marketplace/${pluginId}`),

  getReviews: (pluginId: string) =>
    apiClient.get<ApiResponse<PluginReview[]>>(`/plugins/marketplace/${pluginId}/reviews`),

  // ─── Installed ────────────────────────────────────────────────────────────
  listInstalled: (workspaceId: string) =>
    apiClient.get<ApiResponse<InstalledPlugin[]>>(`/workspaces/${workspaceId}/plugins`),

  install: (workspaceId: string, body: InstallPluginBody) =>
    apiClient.post<ApiResponse<InstalledPlugin>>(`/workspaces/${workspaceId}/plugins`, body),

  uninstall: (workspaceId: string, pluginId: string) =>
    apiClient.delete<ApiResponse<null>>(`/workspaces/${workspaceId}/plugins/${pluginId}`),

  toggle: (workspaceId: string, pluginId: string, enabled: boolean) =>
    apiClient.patch<ApiResponse<InstalledPlugin>>(
      `/workspaces/${workspaceId}/plugins/${pluginId}`,
      { status: enabled ? 'enabled' : 'disabled' },
    ),

  updateConfig: (workspaceId: string, pluginId: string, body: UpdatePluginConfigBody) =>
    apiClient.patch<ApiResponse<InstalledPlugin>>(
      `/workspaces/${workspaceId}/plugins/${pluginId}/config`,
      body,
    ),
}
