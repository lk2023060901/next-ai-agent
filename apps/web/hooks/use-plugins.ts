'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pluginApi } from '@/lib/api/plugin-api'
import type {
  InstallPluginBody,
  UpdatePluginConfigBody,
  InstalledPlugin,
  PluginMarketplaceFilters,
} from '@/types/api'

// ─── Marketplace ──────────────────────────────────────────────────────────────

export function useMarketplacePlugins(filters: PluginMarketplaceFilters = {}) {
  return useQuery({
    queryKey: ['plugins-marketplace', filters],
    queryFn: () => pluginApi.listMarketplace(filters),
    staleTime: 60_000,
  })
}

export function usePlugin(pluginId: string) {
  return useQuery({
    queryKey: ['plugin', pluginId],
    queryFn: () => pluginApi.getPlugin(pluginId).then((r) => r.data),
    enabled: !!pluginId,
    staleTime: 120_000,
  })
}

export function usePluginReviews(pluginId: string) {
  return useQuery({
    queryKey: ['plugin-reviews', pluginId],
    queryFn: () => pluginApi.getReviews(pluginId).then((r) => r.data),
    enabled: !!pluginId,
    staleTime: 120_000,
  })
}

// ─── Installed ────────────────────────────────────────────────────────────────

export function useInstalledPlugins(workspaceId: string) {
  return useQuery({
    queryKey: ['installed-plugins', workspaceId],
    queryFn: () => pluginApi.listInstalled(workspaceId).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useInstallPlugin(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InstallPluginBody) =>
      pluginApi.install(workspaceId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['installed-plugins', workspaceId] })
    },
  })
}

export function useUninstallPlugin(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pluginId: string) => pluginApi.uninstall(workspaceId, pluginId),
    onMutate: async (pluginId) => {
      await qc.cancelQueries({ queryKey: ['installed-plugins', workspaceId] })
      const previous = qc.getQueryData<InstalledPlugin[]>(['installed-plugins', workspaceId])
      qc.setQueryData<InstalledPlugin[]>(['installed-plugins', workspaceId], (old) =>
        old ? old.filter((i) => i.pluginId !== pluginId && i.id !== pluginId) : [],
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(['installed-plugins', workspaceId], ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['installed-plugins', workspaceId] })
    },
  })
}

export function useTogglePlugin(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pluginId, enabled }: { pluginId: string; enabled: boolean }) =>
      pluginApi.toggle(workspaceId, pluginId, enabled).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['installed-plugins', workspaceId] })
    },
  })
}

export function useUpdatePluginConfig(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pluginId, body }: { pluginId: string; body: UpdatePluginConfigBody }) =>
      pluginApi.updateConfig(workspaceId, pluginId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['installed-plugins', workspaceId] })
    },
  })
}
