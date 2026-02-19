'use client'

import { useState } from 'react'
import { Plus, Zap, Sliders, Lock, Eye, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { ApprovalPolicyEditor } from '@/components/features/project/approval-policy-editor'
import { ToolOverrideTable } from '@/components/features/project/tool-override-table'
import type { Project } from '@/types/api'
import type { ProjectApprovalPolicy } from '@/types/project'
import { DEFAULT_POLICY } from '@/types/project'
import { cn } from '@/lib/utils/cn'

type ProjectWithPolicy = Project & { policy: ProjectApprovalPolicy }

const MODE_ICONS = {
  auto: <Zap size={12} />,
  supervised: <Sliders size={12} />,
  locked: <Lock size={12} />,
}
const MODE_COLORS = {
  auto: 'bg-[var(--color-success-50)] text-[var(--color-success-700)]',
  supervised: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)]',
  locked: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]',
}
const MODE_LABELS = { auto: '全自动', supervised: '监督模式', locked: '锁定' }

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-[var(--surface-2)] text-[var(--text-secondary)]',
  active: 'bg-[var(--color-success-50)] text-[var(--color-success-700)]',
  paused: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)]',
  completed: 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]',
  cancelled: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]',
}
const STATUS_LABELS: Record<string, string> = {
  planning: '规划中', active: '进行中', paused: '已暂停', completed: '已完成', cancelled: '已取消',
}

const INIT_PROJECTS: ProjectWithPolicy[] = [
  { id: '1', name: 'NextAI Agent 前端', description: '前端 UI 开发项目', status: 'active', workspaceId: 'ws-1', progress: 35, agentCount: 4, createdAt: '2025-12-01', updatedAt: '2025-12-20', policy: { ...DEFAULT_POLICY, mode: 'supervised' } },
  { id: '2', name: 'API 服务开发', description: '后端 REST API 实现', status: 'planning', workspaceId: 'ws-1', progress: 0, agentCount: 3, createdAt: '2025-12-10', updatedAt: '2025-12-18', policy: { ...DEFAULT_POLICY, mode: 'auto' } },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState(INIT_PROJECTS)
  const [creating, setCreating] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<ProjectWithPolicy | null>(null)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPolicy, setNewPolicy] = useState<ProjectApprovalPolicy>(DEFAULT_POLICY)
  const [createTab, setCreateTab] = useState('basic')

  function handleCreate() {
    const proj: ProjectWithPolicy = {
      id: String(Date.now()), name: newName, description: newDesc,
      status: 'planning', workspaceId: 'ws-1', progress: 0, agentCount: 0,
      createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10),
      policy: newPolicy,
    }
    setProjects((prev) => [proj, ...prev])
    toast.success(`项目 "${newName}" 已创建`)
    setCreating(false); setNewName(''); setNewDesc(''); setNewPolicy(DEFAULT_POLICY)
  }

  function handleSavePolicy() {
    if (!editingPolicy) return
    setProjects((prev) => prev.map((p) => p.id === editingPolicy.id ? editingPolicy : p))
    toast.success('审批策略已保存')
    setEditingPolicy(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">项目</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{projects.length} 个项目</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={16} />新建项目</Button>
      </div>

      <div className="space-y-3">
        {projects.map((proj) => (
          <div key={proj.id} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg)] p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[var(--text-primary)]">{proj.name}</h3>
                  <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[proj.status])}>
                    {STATUS_LABELS[proj.status]}
                  </span>
                  <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', MODE_COLORS[proj.policy.mode])}>
                    {MODE_ICONS[proj.policy.mode]}
                    {MODE_LABELS[proj.policy.mode]}
                  </span>
                </div>
                {proj.description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{proj.description}</p>}
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-xs text-[var(--text-tertiary)] mb-1">
                      <span>进度</span><span>{proj.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface-2)]">
                      <div className="h-full rounded-full bg-[var(--color-primary-500)] transition-all" style={{ width: `${proj.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)]">{proj.agentCount} Agent</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => setEditingPolicy(proj)}>
                  <Eye size={14} />审批策略
                </Button>
                <button className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="新建项目" size="lg"
        footer={<><Button variant="secondary" onClick={() => setCreating(false)}>取消</Button><Button onClick={handleCreate} disabled={!newName.trim()}>创建项目</Button></>}>
        <Tabs
          tabs={[{ key: 'basic', label: '基本信息' }, { key: 'policy', label: '审批策略' }, { key: 'tools', label: '工具覆盖' }]}
          activeKey={createTab}
          onChange={setCreateTab}
        >
          {(key) => (
            <div className="pt-4">
              {key === 'basic' && (
                <div className="space-y-4">
                  <Input label="项目名称" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="如：API 服务开发" fullWidth />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-primary)]">描述</label>
                    <textarea rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="项目简介..."
                      className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]" />
                  </div>
                </div>
              )}
              {key === 'policy' && <ApprovalPolicyEditor value={newPolicy} onChange={setNewPolicy} />}
              {key === 'tools' && <ToolOverrideTable overrides={newPolicy.toolOverrides} onChange={(o) => setNewPolicy((p) => ({ ...p, toolOverrides: o }))} />}
            </div>
          )}
        </Tabs>
      </Modal>

      {/* Edit policy modal */}
      {editingPolicy && (
        <Modal open onClose={() => setEditingPolicy(null)} title={`审批策略 — ${editingPolicy.name}`} size="lg"
          footer={<><Button variant="secondary" onClick={() => setEditingPolicy(null)}>取消</Button><Button onClick={handleSavePolicy}>保存策略</Button></>}>
          <Tabs
            tabs={[{ key: 'policy', label: '审批策略' }, { key: 'tools', label: '工具覆盖' }]}
          >
            {(key) => (
              <div className="pt-4">
                {key === 'policy' && <ApprovalPolicyEditor value={editingPolicy.policy} onChange={(p) => setEditingPolicy({ ...editingPolicy, policy: p })} />}
                {key === 'tools' && <ToolOverrideTable overrides={editingPolicy.policy.toolOverrides} onChange={(o) => setEditingPolicy({ ...editingPolicy, policy: { ...editingPolicy.policy, toolOverrides: o } })} />}
              </div>
            )}
          </Tabs>
        </Modal>
      )}
    </div>
  )
}
