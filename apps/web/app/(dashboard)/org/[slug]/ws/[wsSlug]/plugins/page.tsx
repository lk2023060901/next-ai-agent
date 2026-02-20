'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Puzzle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { PluginCard } from '@/components/features/plugins/plugin-card'
import { InstallWizard } from '@/components/features/plugins/install-wizard'
import { toast } from '@/components/ui/toast'
import {
  useInstalledPlugins,
  useInstallPlugin,
  useUninstallPlugin,
  useTogglePlugin,
  useUpdatePluginConfig,
} from '@/hooks/use-plugins'
import type { InstalledPlugin, Plugin, InstallPluginBody } from '@/types/api'

export default function PluginsPage() {
  const { wsSlug, slug } = useParams<{ wsSlug: string; slug: string }>()
  const router = useRouter()

  const { data: installed, isLoading } = useInstalledPlugins(wsSlug)
  const installPlugin = useInstallPlugin(wsSlug)
  const uninstallPlugin = useUninstallPlugin(wsSlug)
  const togglePlugin = useTogglePlugin(wsSlug)
  const updateConfig = useUpdatePluginConfig(wsSlug)

  const [uninstalling, setUninstalling] = useState<InstalledPlugin | null>(null)
  const [configuring, setConfiguring] = useState<InstalledPlugin | null>(null)
  const [wizardPlugin, setWizardPlugin] = useState<Plugin | null>(null)

  async function handleToggle(pluginId: string, enabled: boolean) {
    try {
      await togglePlugin.mutateAsync({ pluginId, enabled })
    } catch {
      toast.error('操作失败')
    }
  }

  async function handleUninstall() {
    if (!uninstalling) return
    try {
      await uninstallPlugin.mutateAsync(uninstalling.pluginId)
      toast.success('插件已卸载')
      setUninstalling(null)
    } catch {
      toast.error('卸载失败')
    }
  }

  async function handleInstall(body: InstallPluginBody) {
    try {
      await installPlugin.mutateAsync(body)
      toast.success('插件已安装')
      setWizardPlugin(null)
    } catch {
      toast.error('安装失败，请重试')
    }
  }

  async function handleUpdateConfig(body: InstallPluginBody) {
    if (!configuring) return
    try {
      await updateConfig.mutateAsync({
        pluginId: configuring.pluginId,
        body: { config: body.config },
      })
      toast.success('配置已更新')
      setConfiguring(null)
    } catch {
      toast.error('更新失败')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">已安装插件</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">管理 Workspace 中已安装的插件</p>
        </div>
        <Button onClick={() => router.push(`/org/${slug}/ws/${wsSlug}/plugins/marketplace`)}>
          <Plus className="mr-1.5 h-4 w-4" />
          浏览市场
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      ) : !installed || installed.length === 0 ? (
        <EmptyState
          icon={<Puzzle className="h-6 w-6" />}
          title="还没有安装任何插件"
          description="前往插件市场，为 Agent 扩展更多能力"
          action={
            <Button
              size="sm"
              onClick={() => router.push(`/org/${slug}/ws/${wsSlug}/plugins/marketplace`)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              浏览市场
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {installed.map((item) => (
            <PluginCard
              key={item.id}
              plugin={item}
              onToggle={handleToggle}
              onConfigure={(p) => setConfiguring(p)}
              onUninstall={(p) => setUninstalling(p)}
              {...(togglePlugin.isPending ? { toggling: true } : {})}
            />
          ))}
        </div>
      )}

      {/* Uninstall Confirm */}
      <Modal
        open={!!uninstalling}
        onClose={() => setUninstalling(null)}
        title="卸载插件"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setUninstalling(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleUninstall}
              {...(uninstallPlugin.isPending ? { loading: true } : {})}
            >
              卸载
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          确定要卸载插件 <strong>{uninstalling?.plugin.displayName}</strong> 吗？
          所有相关配置将被删除，此操作不可撤销。
        </p>
      </Modal>

      {/* Config Wizard */}
      <InstallWizard
        plugin={configuring?.plugin ?? null}
        open={!!configuring}
        onClose={() => setConfiguring(null)}
        onInstall={handleUpdateConfig}
        {...(updateConfig.isPending ? { loading: true } : {})}
      />

      {/* Install Wizard (from marketplace shortcut) */}
      <InstallWizard
        plugin={wizardPlugin}
        open={!!wizardPlugin}
        onClose={() => setWizardPlugin(null)}
        onInstall={handleInstall}
        {...(installPlugin.isPending ? { loading: true } : {})}
      />
    </div>
  )
}
