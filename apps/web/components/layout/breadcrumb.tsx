'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const SEGMENT_LABELS: Record<string, string> = {
  org: '组织',
  ws: '工作区',
  dashboard: '概览',
  chat: '对话',
  agents: 'Agent',
  overview: '协作概览',
  tools: '工具注册表',
  projects: '项目',
  channels: '频道',
  knowledge: '知识库',
  memory: '记忆',
  plugins: '插件',
  monitoring: '监控',
  scheduler: '调度',
  settings: '设置',
  members: '成员',
  billing: '账单',
  audit: '审计',
  workspaces: '工作区列表',
  usage: '用量',
  profile: '个人信息',
  appearance: '外观',
  notifications: '通知',
  security: '安全',
  'api-keys': 'API 密钥',
}

function getLabel(segment: string) {
  return SEGMENT_LABELS[segment] ?? segment
}

export function Breadcrumb({ className }: { className?: string }) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Build crumbs: each crumb = { label, href }
  const crumbs: { label: string; href: string }[] = []
  let href = ''

  for (const seg of segments) {
    href += `/${seg}`
    // Skip route group indicators that look like "(auth)" — won't appear in pathname
    const label = getLabel(seg)
    crumbs.push({ label, href })
  }

  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="面包屑" className={cn('flex items-center gap-1 text-sm', className)}>
      <Link
        href="/"
        className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <Home size={14} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-[var(--text-tertiary)]" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-[var(--text-primary)]">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
