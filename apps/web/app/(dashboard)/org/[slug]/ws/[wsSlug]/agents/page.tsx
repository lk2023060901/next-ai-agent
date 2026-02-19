'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Search, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { AgentCard } from '@/components/features/agent/agent-card'
import { AgentCreateWizard } from '@/components/features/agent/agent-create-wizard'
import { AgentConfigDrawer } from '@/components/features/agent/agent-config-drawer'
import { useAgents, useDeleteAgent } from '@/hooks/use-agents'
import { toast } from '@/components/ui/toast'
import { STATUS_TABS } from '@/lib/constants/agent'
import type { Agent } from '@/types/api'

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)]">
      <div className="h-1 bg-[var(--surface-2)]" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-[var(--surface-2)]" />
            <div className="h-3 w-16 rounded bg-[var(--surface-2)]" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-[var(--surface-2)]" />
        <div className="border-t border-[var(--border)] pt-3">
          <div className="h-3 w-32 rounded bg-[var(--surface-2)]" />
        </div>
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const params = useParams<{ wsSlug: string }>()
  const wsSlug = params.wsSlug
  const { data: agents, isLoading } = useAgents(wsSlug)
  const deleteAgent = useDeleteAgent(wsSlug)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null)

  const filtered = useMemo(() => {
    if (!agents) return []
    return agents.filter((a) => {
      const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [agents, search, statusFilter])

  function handleDeleteConfirm() {
    if (!deletingAgent) return
    deleteAgent.mutate(deletingAgent.id, {
      onSuccess: () => {
        toast.success('Agent 已删除')
        setDeletingAgent(null)
      },
      onError: () => toast.error('删除失败'),
    })
  }

  const tabsWithBadge = STATUS_TABS.map((tab) => ({
    ...tab,
    ...(agents
      ? {
          badge:
            tab.key === 'all' ? agents.length : agents.filter((a) => a.status === tab.key).length,
        }
      : {}),
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Agent 管理</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">配置和管理 AI 代理角色</p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus size={16} />
          创建 Agent
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="搜索 Agent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
          className="max-w-xs"
          aria-label="搜索 Agent"
        />
        <Tabs
          tabs={tabsWithBadge}
          activeKey={statusFilter}
          onChange={setStatusFilter}
          className="flex-1"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bot size={24} />}
          title={search || statusFilter !== 'all' ? '没有匹配的 Agent' : '还没有 Agent'}
          description={
            search || statusFilter !== 'all'
              ? '尝试调整搜索条件或筛选状态'
              : '创建你的第一个 AI Agent 来开始工作'
          }
          {...(!(search || statusFilter !== 'all')
            ? {
                action: (
                  <Button size="sm" onClick={() => setWizardOpen(true)}>
                    <Plus size={14} />
                    创建 Agent
                  </Button>
                ),
              }
            : {})}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={(a) => setEditingAgent(a)}
              onDelete={(a) => setDeletingAgent(a)}
            />
          ))}
        </div>
      )}

      {/* Create Wizard */}
      <AgentCreateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        workspaceId={wsSlug}
      />

      {/* Config Drawer */}
      {editingAgent && (
        <AgentConfigDrawer
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          workspaceId={wsSlug}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={deletingAgent !== null}
        onClose={() => setDeletingAgent(null)}
        title="删除 Agent"
        description={`确定要删除 Agent "${deletingAgent?.name ?? ''}" 吗？此操作不可撤销。`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingAgent(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleteAgent.isPending}>
              删除
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          删除后，该 Agent 的所有配置信息将被永久移除。
        </p>
      </Modal>
    </div>
  )
}
