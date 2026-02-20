'use client'

import { Star, Download } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import type { Plugin, PluginType, PluginPricingModel } from '@/types/api'

interface MarketplaceCardProps {
  plugin: Plugin
  isInstalled: boolean
  onInstall?: (plugin: Plugin) => void
  onClick?: (plugin: Plugin) => void
}

const TYPE_COLORS: Record<PluginType, string> = {
  tool: 'bg-blue-50 text-blue-600',
  channel: 'bg-purple-50 text-purple-600',
  memory: 'bg-amber-50 text-amber-600',
  hook: 'bg-red-50 text-red-600',
  skill: 'bg-green-50 text-green-600',
  'agent-template': 'bg-indigo-50 text-indigo-600',
  observability: 'bg-gray-50 text-gray-600',
}

const TYPE_LABELS: Record<PluginType, string> = {
  tool: 'Tool',
  channel: 'Channel',
  memory: 'Memory',
  hook: 'Hook',
  skill: 'Skill',
  'agent-template': 'Template',
  observability: 'Observability',
}

function formatPrice(plugin: Plugin): string {
  if (plugin.pricingModel === 'free') return '免费'
  if (plugin.pricingModel === 'one_time' && plugin.price != null)
    return `¥${(plugin.price / 100).toFixed(0)}`
  if (plugin.pricingModel === 'subscription' && plugin.monthlyPrice != null)
    return `¥${(plugin.monthlyPrice / 100).toFixed(0)}/月`
  if (plugin.pricingModel === 'usage_based') return '按量'
  return '免费'
}

function PriceBadge({ model, plugin }: { model: PluginPricingModel; plugin: Plugin }) {
  if (model === 'free')
    return (
      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600">
        免费
      </span>
    )
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
      {formatPrice(plugin)}
    </span>
  )
}

export function MarketplaceCard({ plugin, isInstalled, onInstall, onClick }: MarketplaceCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-[var(--color-primary-200)] hover:shadow-sm',
      )}
      onClick={onClick ? () => onClick(plugin) : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-xl">
          {plugin.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {plugin.displayName}
            </span>
            <PriceBadge model={plugin.pricingModel} plugin={plugin} />
          </div>
          <span
            className={cn(
              'mt-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium',
              TYPE_COLORS[plugin.type],
            )}
          >
            {TYPE_LABELS[plugin.type]}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-[var(--text-secondary)]">
        {plugin.description}
      </p>

      {/* Tags */}
      <div className="mt-2 flex flex-wrap gap-1">
        {plugin.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {plugin.rating}
          </span>
          <span className="flex items-center gap-0.5">
            <Download className="h-3.5 w-3.5" />
            {plugin.installCount >= 1000
              ? `${(plugin.installCount / 1000).toFixed(1)}k`
              : plugin.installCount}
          </span>
        </div>
        {isInstalled ? (
          <span className="text-xs font-medium text-[var(--color-success)]">已安装</span>
        ) : onInstall ? (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onInstall(plugin)
            }}
          >
            安装
          </Button>
        ) : null}
      </div>
    </div>
  )
}
