'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { MarketplaceCard } from '@/components/features/plugins/marketplace-card'
import { InstallWizard } from '@/components/features/plugins/install-wizard'
import { toast } from '@/components/ui/toast'
import { useMarketplacePlugins, useInstalledPlugins, useInstallPlugin } from '@/hooks/use-plugins'
import type {
  Plugin,
  PluginType,
  PluginPricingModel,
  PluginMarketplaceFilters,
  InstallPluginBody,
} from '@/types/api'

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'tool', label: 'Tool' },
  { value: 'channel', label: 'Channel' },
  { value: 'memory', label: 'Memory' },
  { value: 'hook', label: 'Hook' },
  { value: 'skill', label: 'Skill' },
  { value: 'agent-template', label: 'Agent 模板' },
  { value: 'observability', label: 'Observability' },
]

const PRICING_OPTIONS = [
  { value: '', label: '全部价格' },
  { value: 'free', label: '免费' },
  { value: 'one_time', label: '买断' },
  { value: 'subscription', label: '订阅' },
  { value: 'usage_based', label: '按量' },
]

const SORT_OPTIONS = [
  { value: 'popular', label: '最受欢迎' },
  { value: 'rating', label: '评分最高' },
  { value: 'newest', label: '最新发布' },
]

export default function MarketplacePage() {
  const { wsSlug } = useParams<{ wsSlug: string }>()
  const router = useRouter()

  const [filters, setFilters] = useState<PluginMarketplaceFilters>({
    sort: 'popular',
    pageSize: 12,
  })
  const [installing, setInstalling] = useState<Plugin | null>(null)

  const { data, isLoading } = useMarketplacePlugins(filters)
  const { data: installed } = useInstalledPlugins(wsSlug)
  const installPlugin = useInstallPlugin(wsSlug)

  const installedIds = new Set(installed?.map((i) => i.pluginId) ?? [])

  function setFilter<K extends keyof PluginMarketplaceFilters>(
    key: K,
    value: PluginMarketplaceFilters[K],
  ) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  async function handleInstall(body: InstallPluginBody) {
    try {
      await installPlugin.mutateAsync(body)
      toast.success('插件已安装')
      setInstalling(null)
    } catch {
      toast.error('安装失败，请重试')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">插件市场</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">发现并安装扩展 Agent 能力的插件</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-48 max-w-72 flex-1">
          <Input
            placeholder="搜索插件..."
            value={filters.search ?? ''}
            onChange={(e) => setFilter('search', e.target.value || undefined)}
            leftIcon={<Search className="h-4 w-4" />}
            fullWidth
          />
        </div>
        <div className="w-36">
          <Select
            options={TYPE_OPTIONS}
            value={filters.type ?? ''}
            onChange={(v) =>
              setFilter('type', ((v as string) || undefined) as PluginType | undefined)
            }
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
            fullWidth
          />
        </div>
        <div className="w-32">
          <Select
            options={PRICING_OPTIONS}
            value={filters.pricingModel ?? ''}
            onChange={(v) =>
              setFilter(
                'pricingModel',
                ((v as string) || undefined) as PluginPricingModel | undefined,
              )
            }
            fullWidth
          />
        </div>
        <div className="w-32">
          <Select
            options={SORT_OPTIONS}
            value={filters.sort ?? 'popular'}
            onChange={(v) => setFilter('sort', v as PluginMarketplaceFilters['sort'])}
            fullWidth
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="没有找到匹配的插件"
          description="尝试调整筛选条件"
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters({ sort: 'popular', pageSize: 12 })}
            >
              清除筛选
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.data.map((plugin) => (
              <MarketplaceCard
                key={plugin.id}
                plugin={plugin}
                isInstalled={installedIds.has(plugin.id)}
                onInstall={(p) => setInstalling(p)}
                onClick={(p) => router.push(`${p.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
              <Button
                size="sm"
                variant="ghost"
                disabled={!filters.page || filters.page <= 1}
                onClick={() => setFilter('page', (filters.page ?? 1) - 1)}
              >
                上一页
              </Button>
              <span>
                第 {filters.page ?? 1} / {data.totalPages} 页
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={filters.page === data.totalPages}
                onClick={() => setFilter('page', (filters.page ?? 1) + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}

      {/* Install Wizard */}
      <InstallWizard
        plugin={installing}
        open={!!installing}
        onClose={() => setInstalling(null)}
        onInstall={handleInstall}
        {...(installPlugin.isPending ? { loading: true } : {})}
      />
    </div>
  )
}
