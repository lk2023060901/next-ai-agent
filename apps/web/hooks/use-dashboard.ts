'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard-api'

export function useDashboardStats(orgSlug: string) {
  return useQuery({
    queryKey: ['dashboard', 'stats', orgSlug],
    queryFn: () => dashboardApi.getStats(orgSlug).then((r) => r.data),
    enabled: !!orgSlug,
    staleTime: 60_000,
  })
}

export function useMessageTrend(orgSlug: string) {
  return useQuery({
    queryKey: ['dashboard', 'message-trend', orgSlug],
    queryFn: () => dashboardApi.getMessageTrend(orgSlug).then((r) => r.data),
    enabled: !!orgSlug,
    staleTime: 60_000,
  })
}

export function useAgentWorkload(orgSlug: string) {
  return useQuery({
    queryKey: ['dashboard', 'workload', orgSlug],
    queryFn: () => dashboardApi.getWorkload(orgSlug).then((r) => r.data),
    enabled: !!orgSlug,
    staleTime: 60_000,
  })
}

export function useActivities(orgSlug: string) {
  return useQuery({
    queryKey: ['dashboard', 'activities', orgSlug],
    queryFn: () => dashboardApi.getActivities(orgSlug).then((r) => r.data),
    enabled: !!orgSlug,
    staleTime: 60_000,
  })
}
