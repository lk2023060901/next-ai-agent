'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle,
  Hash,
  Send,
  Mail,
  MoreHorizontal,
  Settings,
  Unplug,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Channel, ChannelType, ChannelStatus } from '@/types/api'

interface ChannelCardProps {
  channel: Channel
  onConfigure?: (channel: Channel) => void
  onDisconnect?: (channel: Channel) => void
  onClick?: (channel: Channel) => void
}

const CHANNEL_ICONS: Record<ChannelType, React.ElementType> = {
  webchat: MessageCircle,
  slack: Hash,
  discord: Hash,
  telegram: Send,
  feishu: MessageCircle,
  dingtalk: MessageCircle,
  wecom: MessageCircle,
  whatsapp: MessageCircle,
  signal: MessageCircle,
  teams: Hash,
  email: Mail,
}

const CHANNEL_COLORS: Record<ChannelType, string> = {
  slack: 'bg-[#4A154B] text-white',
  discord: 'bg-[#5865F2] text-white',
  telegram: 'bg-[#229ED9] text-white',
  webchat: 'bg-[var(--color-primary-500)] text-white',
  feishu: 'bg-[#3370FF] text-white',
  dingtalk: 'bg-[#1677FF] text-white',
  wecom: 'bg-[#07C160] text-white',
  whatsapp: 'bg-[#25D366] text-white',
  signal: 'bg-[#3A76F0] text-white',
  teams: 'bg-[#6264A7] text-white',
  email: 'bg-[var(--text-secondary)] text-white',
}

const CHANNEL_LABELS: Record<ChannelType, string> = {
  webchat: 'WebChat',
  slack: 'Slack',
  discord: 'Discord',
  telegram: 'Telegram',
  feishu: '飞书',
  dingtalk: '钉钉',
  wecom: '企业微信',
  whatsapp: 'WhatsApp',
  signal: 'Signal',
  teams: 'Microsoft Teams',
  email: 'Email',
}

const STATUS_CONFIG: Record<
  ChannelStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  connected: { label: '在线', icon: CheckCircle, className: 'text-[var(--color-success)]' },
  disconnected: { label: '已断开', icon: XCircle, className: 'text-[var(--text-tertiary)]' },
  error: { label: '错误', icon: AlertCircle, className: 'text-[var(--color-danger)]' },
  pending: { label: '连接中', icon: Clock, className: 'text-[var(--color-warning)]' },
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

export function ChannelCard({ channel, onConfigure, onDisconnect, onClick }: ChannelCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const Icon = CHANNEL_ICONS[channel.type]
  const statusCfg = STATUS_CONFIG[channel.status]
  const StatusIcon = statusCfg.icon

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-4',
        'transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-primary-200)]',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick ? () => onClick(channel) : undefined}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
          CHANNEL_COLORS[channel.type],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{channel.name}</span>
          <span className={cn('flex items-center gap-1 text-xs', statusCfg.className)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusCfg.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
          {CHANNEL_LABELS[channel.type]}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
          {channel.connectedChannels ? `已连接 ${channel.connectedChannels} 个频道` : '未连接频道'}
          {channel.lastActiveAt && ` · 最近活跃: ${timeAgo(channel.lastActiveAt)}`}
        </p>
      </div>

      {/* Actions */}
      {(onConfigure || onDisconnect) && (
        <div ref={menuRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
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
              {onConfigure && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onConfigure(channel)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
                >
                  <Settings className="h-3.5 w-3.5" />
                  配置
                </button>
              )}
              {onDisconnect && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onDisconnect(channel)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--surface)]"
                >
                  <Unplug className="h-3.5 w-3.5" />
                  断开
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
