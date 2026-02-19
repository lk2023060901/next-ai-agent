'use client'

import { useState } from 'react'
import { Search, UserPlus, Settings, Trash2, LogIn, Key } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type AuditAction = 'member_invite' | 'member_remove' | 'settings_update' | 'login' | 'api_key_create' | 'api_key_delete'

interface AuditEntry {
  id: string
  action: AuditAction
  actor: string
  target?: string
  createdAt: string
  ip: string
}

const ACTION_META: Record<AuditAction, { label: string; icon: React.ReactNode; color: string }> = {
  member_invite: { label: '邀请成员', icon: <UserPlus size={14} />, color: 'text-[var(--color-primary-500)]' },
  member_remove: { label: '移除成员', icon: <Trash2 size={14} />, color: 'text-[var(--color-danger)]' },
  settings_update: { label: '更新设置', icon: <Settings size={14} />, color: 'text-[var(--text-secondary)]' },
  login: { label: '登录', icon: <LogIn size={14} />, color: 'text-[var(--color-success)]' },
  api_key_create: { label: '创建 API 密钥', icon: <Key size={14} />, color: 'text-[var(--color-primary-500)]' },
  api_key_delete: { label: '删除 API 密钥', icon: <Trash2 size={14} />, color: 'text-[var(--color-danger)]' },
}

const MOCK_LOGS: AuditEntry[] = [
  { id: '1', action: 'login', actor: '张三', createdAt: '2025-12-20 14:32', ip: '192.168.1.1' },
  { id: '2', action: 'member_invite', actor: '张三', target: 'newuser@example.com', createdAt: '2025-12-20 11:15', ip: '192.168.1.1' },
  { id: '3', action: 'settings_update', actor: '张三', target: '组织名称', createdAt: '2025-12-19 16:44', ip: '192.168.1.2' },
  { id: '4', action: 'api_key_create', actor: '李四', target: '生产环境密钥', createdAt: '2025-12-18 09:00', ip: '10.0.0.5' },
  { id: '5', action: 'member_remove', actor: '张三', target: '前员工', createdAt: '2025-12-17 17:22', ip: '192.168.1.1' },
  { id: '6', action: 'api_key_delete', actor: '张三', target: '旧密钥', createdAt: '2025-12-16 10:05', ip: '192.168.1.1' },
]

const ACTION_FILTER = [
  { value: '', label: '全部操作' },
  ...Object.entries(ACTION_META).map(([k, v]) => ({ value: k, label: v.label })),
]

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const filtered = MOCK_LOGS.filter((log) => {
    const matchSearch = !search || log.actor.includes(search) || (log.target ?? '').includes(search)
    const matchAction = !actionFilter || log.action === actionFilter
    return matchSearch && matchAction
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">审计日志</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">组织内的所有重要操作记录</p>
      </div>

      <div className="flex gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索操作人或目标..." leftIcon={<Search size={14} />} fullWidth />
        <div className="w-48 shrink-0">
          <Select options={ACTION_FILTER} value={actionFilter} onChange={(v) => setActionFilter(String(v))} fullWidth />
        </div>
      </div>

      <div className="relative space-y-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">无匹配记录</p>
        ) : (
          filtered.map((log, i) => {
            const meta = ACTION_META[log.action]
            return (
              <div key={log.id} className={`flex items-start gap-4 px-4 py-3 ${i < filtered.length - 1 ? 'border-b border-[var(--border)]' : ''} hover:bg-[var(--surface)] transition-colors`}>
                <div className={`mt-0.5 shrink-0 ${meta.color}`}>{meta.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="font-medium">{log.actor}</span>
                    {' '}{meta.label}
                    {log.target && <span className="text-[var(--text-secondary)]">：{log.target}</span>}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">{log.createdAt} · IP {log.ip}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
