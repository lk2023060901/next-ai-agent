'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toolApi, knowledgeBaseApi } from '@/lib/api/agent-api'

export function useTools(workspaceId: string) {
  return useQuery({
    queryKey: ['tools', workspaceId],
    queryFn: () => toolApi.list(workspaceId).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useKnowledgeBases(workspaceId: string) {
  return useQuery({
    queryKey: ['knowledge-bases', workspaceId],
    queryFn: () => knowledgeBaseApi.list(workspaceId).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useToolAuth(workspaceId: string) {
  return useQuery({
    queryKey: ['tool-auth', workspaceId],
    queryFn: () => toolApi.getAuth(workspaceId).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useUpdateToolAuth(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, Record<string, boolean>>) =>
      toolApi.updateAuth(workspaceId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tool-auth', workspaceId] })
    },
  })
}
