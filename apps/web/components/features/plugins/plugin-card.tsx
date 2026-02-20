'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MoreHorizontal,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { InstalledPlugin, PluginStatus, PluginType } from '@/types/api'

interface PluginCardProps {
  plugin: InstalledPlugin
  onToggle?: (pluginId: string, enabled: boolean) => void
  onConfigure?: (plugin: InstalledPlugin) => void
  onUninstall?: (plugin: InstalledPlugin) => void
  toggling?: boolean
}

const STATUS_CONFIG: Record<
  PluginStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  enabled: { label: '运行中', icon: CheckCircle, className: 'text-[var(--color-success)]' },
  disabled: { label: '已禁用', icon: XCircle, className: 'text-[var(--text-tertiary)]' },
  error: { label: '错误', icon: AlertCircle, className: 'text-[var(--color-danger)]' },
  updating: { label: '更新中', icon: RefreshCw, className: 'text-[var(--color-warning)]' },
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

export function PluginCard({
  plugin: installed,
  onToggle,
  onConfigure,
  onUninstall,
  toggling,
}: PluginCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { plugin } = installed
  const statusCfg = STATUS_CONFIG[installed.status]
  const StatusIcon = statusCfg.icon

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-4 transition-colors hover:border-[var(--color-primary-200)]">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-xl">
        {plugin.icon}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {plugin.displayName}
          </span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[11px] font-medium',
              TYPE_COLORS[plugin.type],
            )}
          >
            {TYPE_LABELS[plugin.type]}
          </span>
          <span className={cn('flex items-center gap-1 text-xs', statusCfg.className)}>
            <StatusIcon
              className={cn('h-3.5 w-3.5', installed.status === 'updating' && 'animate-spin')}
            />
            {statusCfg.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{plugin.description}</p>
        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
          v{plugin.version} · by {plugin.author}
        </p>
      </div>

      {/* Toggle */}
      {onToggle && (
        <button
          role="switch"
          aria-checked={installed.status === 'enabled'}
          disabled={toggling || installed.status === 'updating'}
          onClick={() => onToggle(installed.pluginId, installed.status !== 'enabled')}
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none disabled:opacity-50',
            installed.status === 'enabled' ? 'bg-[var(--color-success)]' : 'bg-[var(--surface-2)]',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
              installed.status === 'enabled' ? 'left-[18px]' : 'left-0.5',
            )}
          />
        </button>
      )}

      {/* Menu */}
      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] opacity-0 transition-opacity hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] group-hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-32 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] py-1 shadow-lg"
          >
            {onConfigure && plugin.configSchema.length > 0 && (
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onConfigure(installed)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
              >
                <Settings className="h-3.5 w-3.5" />
                配置
              </button>
            )}
            {onUninstall && (
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onUninstall(installed)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--surface)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                卸载
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
