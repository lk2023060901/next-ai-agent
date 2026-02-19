'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentApi, type CreateAgentBody } from '@/lib/api/agent-api'
import type { Agent, ApiResponse } from '@/types/api'

export function useAgents(workspaceId: string) {
  return useQuery({
    queryKey: ['agents', workspaceId],
    queryFn: () => agentApi.list(workspaceId).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentApi.get(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateAgent(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAgentBody) => agentApi.create(workspaceId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agents', workspaceId] })
    },
  })
}

export function useUpdateAgent(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateAgentBody> }) =>
      agentApi.update(id, body),
    onSuccess: (data: ApiResponse<Agent>) => {
      queryClient.setQueryData(['agent', data.data.id], data.data)
      void queryClient.invalidateQueries({ queryKey: ['agents', workspaceId] })
    },
  })
}

export function useDeleteAgent(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => agentApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['agents', workspaceId] })
      const previous = queryClient.getQueryData<Agent[]>(['agents', workspaceId])
      queryClient.setQueryData<Agent[]>(['agents', workspaceId], (old) =>
        old ? old.filter((a) => a.id !== id) : [],
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['agents', workspaceId], context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['agents', workspaceId] })
    },
  })
}
