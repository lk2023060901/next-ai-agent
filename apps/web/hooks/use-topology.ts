'use client'

import { useQuery } from '@tanstack/react-query'
import { topologyApi } from '@/lib/api/agent-api'

export function useTopology(workspaceId: string) {
  return useQuery({
    queryKey: ['topology', workspaceId],
    queryFn: () => topologyApi.get(workspaceId).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}
