'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'

const MOCK_ORGS = [
  { slug: 'acme', name: 'Acme Corp', plan: 'pro', members: 12, workspaces: 3 },
  { slug: 'personal', name: '个人空间', plan: 'free', members: 1, workspaces: 1 },
]

export default function OrgListPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  function handleCreate() {
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    toast.success(`组织 "${name}" 创建成功`)
    setCreating(false)
    setName('')
    router.push(`/org/${slug}/dashboard`)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">我的组织</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">选择或创建一个组织</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} />
          新建组织
        </Button>
      </div>

      <div className="space-y-3">
        {MOCK_ORGS.map((org) => (
          <button
            key={org.slug}
            onClick={() => router.push(`/org/${org.slug}/ws/default/chat`)}
            className="flex w-full items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-4 text-left transition-shadow hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] text-lg font-bold text-white">
              {org.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[var(--text-primary)]">{org.name}</p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1"><Users size={12} />{org.members} 成员</span>
                <span className="flex items-center gap-1"><Building2 size={12} />{org.workspaces} 工作区</span>
                <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 capitalize">{org.plan}</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-[var(--text-tertiary)]" />
          </button>
        ))}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="新建组织" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreating(false)}>取消</Button><Button onClick={handleCreate} disabled={!name.trim()}>创建</Button></>}>
        <Input label="组织名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：Acme Corp" fullWidth />
      </Modal>
    </div>
  )
}
