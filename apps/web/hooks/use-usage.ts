'use client'

import { useQuery } from '@tanstack/react-query'
import { usageApi } from '@/lib/api/dashboard-api'
import type { UsageFilters } from '@/types/api'

export function useUsageOverview(orgSlug: string, filters: UsageFilters) {
  return useQuery({
    queryKey: ['usage', 'overview', orgSlug, filters],
    queryFn: () => usageApi.getOverview(orgSlug, filters).then((r) => r.data),
    enabled: !!orgSlug,
    staleTime: 60_000,
  })
}

export function useUsageTokenTrend(orgSlug: string, filters: UsageFilters) {
  return useQuery({
    queryKey: ['usage', 'token-trend', orgSlug, filters],
    queryFn: () => usageApi.getTokenTrend(orgSlug, filters).then((r) => r.data),
    enabled: !!orgSlug,
    staleTime: 60_000,
  })
}

export function useUsageProviders(orgSlug: string, filters: UsageFilters) {
  return useQuery({
    queryKey: ['usage', 'providers', orgSlug, filters],
    queryFn: () => usageApi.getProviders(orgSlug, filters).then((r) => r.data),
    enabled: !!orgSlug,
    staleTime: 60_000,
  })
}

export function useUsageAgentRanking(orgSlug: string, filters: UsageFilters) {
  return useQuery({
    queryKey: ['usage', 'agent-ranking', orgSlug, filters],
    queryFn: () => usageApi.getAgentRanking(orgSlug, filters).then((r) => r.data),
    enabled: !!orgSlug,
    staleTime: 60_000,
  })
}

export function useUsageRecords(orgSlug: string, filters: UsageFilters, page = 1) {
  return useQuery({
    queryKey: ['usage', 'records', orgSlug, filters, page],
    queryFn: () => usageApi.getRecords(orgSlug, filters, page),
    enabled: !!orgSlug,
    staleTime: 60_000,
  })
}
