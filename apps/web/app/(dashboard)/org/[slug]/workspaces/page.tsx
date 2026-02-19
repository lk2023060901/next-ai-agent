'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'

const EMOJIS = ['🏠', '💻', '🔧', '🚀', '📊', '🎯', '🌐', '⚙️', '🧪', '🎨']

interface Workspace {
  id: string; slug: string; name: string; emoji: string; desc: string
  agentCount: number; memberCount: number; updatedAt: string
}

const INIT_WS: Workspace[] = [
  { id: '1', slug: 'default', name: '默认工作区', emoji: '🏠', desc: '通用 AI 代理协作空间', agentCount: 8, memberCount: 5, updatedAt: '1 小时前' },
  { id: '2', slug: 'dev', name: '开发团队', emoji: '💻', desc: '前后端全栈开发专用', agentCount: 6, memberCount: 3, updatedAt: '3 天前' },
  { id: '3', slug: 'ops', name: '运维组', emoji: '🔧', desc: 'DevOps 与监控', agentCount: 4, memberCount: 2, updatedAt: '1 周前' },
]

export default function WorkspacesPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const orgSlug = params.slug

  const [workspaces, setWorkspaces] = useState(INIT_WS)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [emoji, setEmoji] = useState('🚀')

  const filtered = workspaces.filter(
    (w) => !search || w.name.includes(search) || w.desc.includes(search),
  )

  function handleCreate() {
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    setWorkspaces((prev) => [
      { id: String(Date.now()), slug, name, emoji, desc, agentCount: 0, memberCount: 1, updatedAt: '刚刚' },
      ...prev,
    ])
    toast.success(`工作区 "${name}" 已创建`)
    setCreating(false); setName(''); setDesc('')
    router.push(`/org/${orgSlug}/ws/${slug}/chat`)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">工作区</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{workspaces.length} 个工作区</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={16} />新建工作区</Button>
      </div>

      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索工作区..." leftIcon={<Search size={14} />} className="mb-6 max-w-sm" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ws) => (
          <button
            key={ws.id}
            onClick={() => router.push(`/org/${orgSlug}/ws/${ws.slug}/chat`)}
            className="group flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg)] p-5 text-left shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl">{ws.emoji}</span>
              <button onClick={(e) => { e.stopPropagation(); router.push(`/org/${orgSlug}/ws/${ws.slug}/settings`) }}
                className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
                <Settings size={14} />
              </button>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{ws.name}</p>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{ws.desc}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
              <span>{ws.agentCount} Agent</span>
              <span>·</span>
              <span>{ws.memberCount} 成员</span>
              <span>·</span>
              <span>{ws.updatedAt}</span>
            </div>
          </button>
        ))}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="新建工作区"
        footer={<><Button variant="secondary" onClick={() => setCreating(false)}>取消</Button><Button onClick={handleCreate} disabled={!name.trim()}>创建</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">图标</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`h-9 w-9 rounded-[var(--radius-md)] text-xl transition-colors ${emoji === e ? 'bg-[var(--color-primary-50)] ring-2 ring-[var(--color-primary-500)]' : 'hover:bg-[var(--surface)]'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input label="名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：开发团队" fullWidth />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">描述</label>
            <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="简短描述工作区用途"
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
