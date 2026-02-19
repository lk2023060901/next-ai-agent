'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'

export default function OrgSettingsPage() {
  const [name, setName] = useState('Acme Corp')
  const [desc, setDesc] = useState('我们是一家专注于 AI 驱动软件开发的团队。')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
    toast.success('组织信息已更新')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">组织设置</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">管理组织的基本信息</p>
      </div>

      {/* Logo */}
      <Card>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-primary-500)] text-3xl font-bold text-white">A</div>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors">
              <Camera size={12} />
            </button>
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">组织 Logo</p>
            <p className="text-sm text-[var(--text-secondary)]">建议尺寸 256×256，JPG 或 PNG</p>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card>
        <div className="space-y-4 max-w-md">
          <Input label="组织名称" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">简介</label>
            <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)}
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]" />
          </div>
          <Button loading={loading} onClick={handleSave}>保存更改</Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--color-danger)]">删除组织</p>
            <p className="text-sm text-[var(--text-secondary)]">删除后所有数据将永久丢失，无法恢复。</p>
          </div>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>删除组织</Button>
        </div>
      </Card>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="确认删除组织" size="sm"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(false)}>取消</Button><Button variant="danger" onClick={() => { toast.error('此功能暂未开放'); setConfirmDelete(false) }}>确认删除</Button></>}>
        <p className="text-sm text-[var(--text-secondary)]">此操作将永久删除该组织及其所有工作区、Agent、对话和数据，且不可撤销。请谨慎操作。</p>
      </Modal>
    </div>
  )
}
