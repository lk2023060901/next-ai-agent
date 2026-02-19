'use client'

import { useState } from 'react'
import { Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'

interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  expiresAt: string | null
  lastUsed: string | null
}

const INITIAL_KEYS: ApiKey[] = [
  { id: '1', name: '开发环境', prefix: 'sk-dev-xxxx', createdAt: '2025-12-01', expiresAt: null, lastUsed: '1 小时前' },
  { id: '2', name: '生产环境', prefix: 'sk-prod-xxxx', createdAt: '2025-11-15', expiresAt: '2026-11-15', lastUsed: '昨天' },
]

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(INITIAL_KEYS)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showNewKey, setShowNewKey] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleCreate() {
    const key = `sk-nextai-${Math.random().toString(36).slice(2, 18)}`
    setKeys((prev) => [
      {
        id: String(Date.now()),
        name: newName,
        prefix: key.slice(0, 14) + '...',
        createdAt: new Date().toISOString().slice(0, 10),
        expiresAt: null,
        lastUsed: null,
      },
      ...prev,
    ])
    setNewKey(key)
    setCreating(false)
    setNewName('')
  }

  function handleDelete() {
    setKeys((prev) => prev.filter((k) => k.id !== deleteId))
    setDeleteId(null)
    toast.success('API 密钥已删除')
  }

  function copyKey(text: string) {
    void navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">API 密钥</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">用于访问 NextAI Agent API 的密钥</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} />
          新建密钥
        </Button>
      </div>

      {/* New key reveal */}
      {newKey && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-success)] bg-[var(--color-success-50)] p-4">
          <p className="mb-2 text-sm font-medium text-[var(--color-success-700)]">
            密钥已创建。请立即复制，此后无法再次查看。
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-sm">
              {showNewKey ? newKey : newKey.replace(/./g, '•')}
            </code>
            <button onClick={() => setShowNewKey((v) => !v)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              {showNewKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button onClick={() => copyKey(newKey)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <Copy size={16} />
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
            我已复制，关闭提示
          </button>
        </div>
      )}

      {/* Keys list */}
      <div className="divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--border)]">
        {keys.map((key) => (
          <div key={key.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{key.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {key.prefix} · 创建于 {key.createdAt}
                {key.expiresAt ? ` · 到期 ${key.expiresAt}` : ''}
                {key.lastUsed ? ` · 最近使用：${key.lastUsed}` : ' · 未使用'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => copyKey(key.prefix)} className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
                <Copy size={14} />
              </button>
              <button onClick={() => setDeleteId(key.id)} className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger)]">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {keys.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">暂无 API 密钥</div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="新建 API 密钥" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreating(false)}>取消</Button><Button onClick={handleCreate} disabled={!newName.trim()}>创建</Button></>}>
        <Input label="密钥名称" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="如：开发环境" fullWidth />
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="删除 API 密钥" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>取消</Button><Button variant="danger" onClick={handleDelete}>确认删除</Button></>}>
        <p className="text-sm text-[var(--text-secondary)]">删除后使用该密钥的服务将无法访问 API，此操作不可撤销。</p>
      </Modal>
    </div>
  )
}
