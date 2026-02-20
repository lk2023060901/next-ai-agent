import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse, DesktopClient, OperationLog } from '@/types/api'

export const monitoringApi = {
  listClients: (wsId: string) =>
    apiClient.get<ApiResponse<DesktopClient[]>>(`/workspaces/${wsId}/monitoring/clients`),

  getClientStatus: (clientId: string) =>
    apiClient.get<ApiResponse<DesktopClient>>(`/monitoring/clients/${clientId}/status`),

  getOperationLogs: (
    clientId: string,
    filters: {
      status?: string
      riskLevel?: string
      page?: number
      pageSize?: number
    },
  ) => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.riskLevel) params.set('riskLevel', filters.riskLevel)
    if (filters.page) params.set('page', String(filters.page))
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
    const qs = params.toString()
    return apiClient.get<PaginatedResponse<OperationLog>>(
      `/monitoring/clients/${clientId}/logs${qs ? `?${qs}` : ''}`,
    )
  },

  sendCommand: (
    clientId: string,
    body: { type: 'pause' | 'resume' | 'stop' | 'send_task'; instruction?: string },
  ) =>
    apiClient.post<ApiResponse<{ success: boolean }>>(
      `/monitoring/clients/${clientId}/commands`,
      body,
    ),
}
