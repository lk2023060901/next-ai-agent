'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { monitoringApi } from '@/lib/api/monitoring-api'

export function useDesktopClients(wsId: string) {
  return useQuery({
    queryKey: ['monitoring', 'clients', wsId],
    queryFn: () => monitoringApi.listClients(wsId).then((r) => r.data),
    enabled: !!wsId,
    staleTime: 5_000,
    refetchInterval: 15_000,
  })
}

export function useOperationLogs(
  clientId: string,
  filters: { status?: string; riskLevel?: string; page?: number; pageSize?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ['monitoring', 'logs', clientId, filters],
    queryFn: () => monitoringApi.getOperationLogs(clientId, filters),
    enabled: enabled && !!clientId,
    staleTime: 3_000,
    refetchInterval: 10_000,
  })
}

export function useSendCommand(clientId: string) {
  return useMutation({
    mutationFn: (body: Parameters<typeof monitoringApi.sendCommand>[1]) =>
      monitoringApi.sendCommand(clientId, body).then((r) => r.data),
  })
}
