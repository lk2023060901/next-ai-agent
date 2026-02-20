'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { channelApi } from '@/lib/api/channel-api'
import type {
  CreateChannelBody,
  UpdateChannelBody,
  Channel,
  ChannelMessageFilters,
  CreateRoutingRuleBody,
  RoutingRule,
} from '@/types/api'

// ─── Channels ────────────────────────────────────────────────────────────────

export function useChannels(workspaceId: string) {
  return useQuery({
    queryKey: ['channels', workspaceId],
    queryFn: () => channelApi.list(workspaceId).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useCreateChannel(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateChannelBody) =>
      channelApi.create(workspaceId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['channels', workspaceId] })
    },
  })
}

export function useUpdateChannel(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateChannelBody }) =>
      channelApi.update(id, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['channels', workspaceId] })
    },
  })
}

export function useDeleteChannel(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) => channelApi.delete(channelId),
    onMutate: async (channelId) => {
      await qc.cancelQueries({ queryKey: ['channels', workspaceId] })
      const previous = qc.getQueryData<Channel[]>(['channels', workspaceId])
      qc.setQueryData<Channel[]>(['channels', workspaceId], (old) =>
        old ? old.filter((c) => c.id !== channelId) : [],
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(['channels', workspaceId], ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['channels', workspaceId] })
    },
  })
}

export function useTestConnection(channelId: string) {
  return useMutation({
    mutationFn: () => channelApi.testConnection(channelId).then((r) => r.data),
  })
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useChannelStats(channelId: string) {
  return useQuery({
    queryKey: ['channel-stats', channelId],
    queryFn: () => channelApi.getStats(channelId).then((r) => r.data),
    enabled: !!channelId,
    staleTime: 60_000,
  })
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useChannelMessages(channelId: string, filters: ChannelMessageFilters = {}) {
  return useQuery({
    queryKey: ['channel-messages', channelId, filters],
    queryFn: () => channelApi.listMessages(channelId, filters),
    enabled: !!channelId,
    staleTime: 30_000,
  })
}

// ─── Routing Rules ────────────────────────────────────────────────────────────

export function useRoutingRules(channelId: string) {
  return useQuery({
    queryKey: ['channel-rules', channelId],
    queryFn: () => channelApi.listRules(channelId).then((r) => r.data),
    enabled: !!channelId,
    staleTime: 30_000,
  })
}

export function useCreateRoutingRule(channelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateRoutingRuleBody) =>
      channelApi.createRule(channelId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['channel-rules', channelId] })
    },
  })
}

export function useUpdateRoutingRule(channelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, body }: { ruleId: string; body: Partial<RoutingRule> }) =>
      channelApi.updateRule(channelId, ruleId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['channel-rules', channelId] })
    },
  })
}

export function useDeleteRoutingRule(channelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => channelApi.deleteRule(channelId, ruleId),
    onMutate: async (ruleId) => {
      await qc.cancelQueries({ queryKey: ['channel-rules', channelId] })
      const previous = qc.getQueryData<RoutingRule[]>(['channel-rules', channelId])
      qc.setQueryData<RoutingRule[]>(['channel-rules', channelId], (old) =>
        old ? old.filter((r) => r.id !== ruleId) : [],
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(['channel-rules', channelId], ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['channel-rules', channelId] })
    },
  })
}
