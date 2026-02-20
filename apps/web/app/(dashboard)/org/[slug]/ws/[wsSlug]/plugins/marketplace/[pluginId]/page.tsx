'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Star, Download, CheckCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { InstallWizard } from '@/components/features/plugins/install-wizard'
import { toast } from '@/components/ui/toast'
import {
  usePlugin,
  usePluginReviews,
  useInstalledPlugins,
  useInstallPlugin,
  useUninstallPlugin,
} from '@/hooks/use-plugins'
import type { InstallPluginBody, PluginType } from '@/types/api'

const TYPE_LABELS: Record<PluginType, string> = {
  tool: 'Tool',
  channel: 'Channel',
  memory: 'Memory',
  hook: 'Hook',
  skill: 'Skill',
  'agent-template': 'Agent 模板',
  observability: 'Observability',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-[var(--border)]'}`}
        />
      ))}
      <span className="ml-1 text-sm text-[var(--text-secondary)]">{rating}</span>
    </div>
  )
}

const DETAIL_TABS = [
  { key: 'overview', label: '概览' },
  { key: 'permissions', label: '权限' },
  { key: 'reviews', label: '评价' },
]

export default function PluginDetailPage() {
  const { wsSlug, pluginId } = useParams<{ wsSlug: string; pluginId: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [installing, setInstalling] = useState(false)

  const { data: plugin, isLoading } = usePlugin(pluginId)
  const { data: reviews } = usePluginReviews(pluginId)
  const { data: installed } = useInstalledPlugins(wsSlug)
  const installPlugin = useInstallPlugin(wsSlug)
  const uninstallPlugin = useUninstallPlugin(wsSlug)

  const isInstalled = installed?.some((i) => i.pluginId === pluginId) ?? false

  async function handleInstall(body: InstallPluginBody) {
    try {
      await installPlugin.mutateAsync(body)
      toast.success('插件已安装')
      setInstalling(false)
    } catch {
      toast.error('安装失败，请重试')
    }
  }

  async function handleUninstall() {
    try {
      await uninstallPlugin.mutateAsync(pluginId)
      toast.success('插件已卸载')
    } catch {
      toast.error('卸载失败')
    }
  }

  function formatPrice(): string {
    if (!plugin) return ''
    if (plugin.pricingModel === 'free') return '免费'
    if (plugin.pricingModel === 'one_time' && plugin.price != null)
      return `¥${(plugin.price / 100).toFixed(2)} 一次性买断`
    if (plugin.pricingModel === 'subscription' && plugin.monthlyPrice != null)
      return `¥${(plugin.monthlyPrice / 100).toFixed(2)}/月${plugin.trialDays ? `（${plugin.trialDays}天免费试用）` : ''}`
    if (plugin.pricingModel === 'usage_based') return '按用量计费'
    return '免费'
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-40 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]" />
      </div>
    )
  }

  if (!plugin) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--text-tertiary)]">
        插件不存在
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        返回市场
      </button>

      {/* Hero */}
      <div className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-2)] text-3xl">
          {plugin.icon}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {plugin.displayName}
              </h1>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">by {plugin.author}</p>
            </div>
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <>
                  <span className="flex items-center gap-1 text-sm text-[var(--color-success)]">
                    <CheckCircle className="h-4 w-4" />
                    已安装
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUninstall}
                    {...(uninstallPlugin.isPending ? { loading: true } : {})}
                  >
                    卸载
                  </Button>
                </>
              ) : (
                <Button onClick={() => setInstalling(true)}>安装插件</Button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
            <StarRating rating={plugin.rating} />
            <span className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {plugin.installCount.toLocaleString()} 次安装
            </span>
            <span className="rounded bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
              {TYPE_LABELS[plugin.type]}
            </span>
            <span className="font-medium text-[var(--color-primary-500)]">{formatPrice()}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {plugin.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-tertiary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={DETAIL_TABS} activeKey={activeTab} onChange={setActiveTab} />

      {/* Overview */}
      {activeTab === 'overview' && (
        <Card padding="md">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">插件介绍</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
            {plugin.longDescription ?? plugin.description}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-secondary)] sm:grid-cols-4">
            <div>
              <span className="text-[var(--text-tertiary)]">版本</span>
              <p className="mt-0.5 font-medium">v{plugin.version}</p>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">评分</span>
              <p className="mt-0.5 font-medium">{plugin.rating} / 5</p>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">发布时间</span>
              <p className="mt-0.5 font-medium">
                {new Date(plugin.publishedAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">最后更新</span>
              <p className="mt-0.5 font-medium">
                {new Date(plugin.updatedAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Permissions */}
      {activeTab === 'permissions' && (
        <Card padding="md">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">所需权限</h3>
          </div>
          {plugin.permissions.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">此插件不需要任何特殊权限</p>
          ) : (
            <ul className="space-y-2">
              {plugin.permissions.map((perm) => (
                <li key={perm} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
                  <code className="rounded bg-[var(--surface-2)] px-2 py-0.5 font-mono text-xs">
                    {perm}
                  </code>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {!reviews || reviews.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-[var(--text-tertiary)]">
              暂无评价
            </div>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} padding="md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {review.authorName}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--border)]'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{review.content}</p>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Install Wizard */}
      <InstallWizard
        plugin={installing ? plugin : null}
        open={installing}
        onClose={() => setInstalling(false)}
        onInstall={handleInstall}
        {...(installPlugin.isPending ? { loading: true } : {})}
      />
    </div>
  )
}
