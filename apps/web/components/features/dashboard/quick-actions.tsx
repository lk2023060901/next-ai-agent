'use client'

import Link from 'next/link'
import { Plus, Upload, Settings, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface QuickActionsProps {
  orgSlug: string
  workspaceSlug?: string
}

export function QuickActions({ orgSlug, workspaceSlug = 'default' }: QuickActionsProps) {
  const wsBase = `/org/${orgSlug}/ws/${workspaceSlug}`

  const actions = [
    {
      icon: Plus,
      title: '新建对话',
      description: '发起新的 Agent 对话',
      href: `${wsBase}/chat`,
    },
    {
      icon: Upload,
      title: '上传知识',
      description: '为 Agent 添加知识库文档',
      href: `${wsBase}/knowledge`,
    },
    {
      icon: Settings,
      title: '管理 Agent',
      description: '配置和管理 Agent 团队',
      href: `${wsBase}/agents`,
    },
    {
      icon: Users,
      title: '邀请成员',
      description: '邀请团队成员加入组织',
      href: `/org/${orgSlug}/settings/members`,
    },
  ]

  return (
    <Card
      header={<h3 className="text-base font-semibold text-[var(--text-primary)]">快捷操作</h3>}
      padding="md"
    >
      <div className="flex flex-col gap-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-[var(--color-primary-200)] hover:bg-[var(--color-primary-50)]"
          >
            <action.icon className="h-5 w-5 shrink-0 text-[var(--color-primary-400)]" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)]">{action.title}</div>
              <div className="text-xs text-[var(--text-tertiary)]">{action.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
