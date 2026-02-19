'use client'

import { useState } from 'react'
import { UserPlus, MoreHorizontal, Crown, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { toast } from '@/components/ui/toast'

type Role = 'owner' | 'admin' | 'member' | 'viewer'

interface Member {
  id: string
  name: string
  email: string
  role: Role
  joinedAt: string
}

const ROLE_LABELS: Record<Role, string> = { owner: '所有者', admin: '管理员', member: '成员', viewer: '观察者' }
const ROLE_ICONS: Record<Role, React.ReactNode> = {
  owner: <Crown size={12} className="text-[var(--color-warning)]" />,
  admin: <Shield size={12} className="text-[var(--color-primary-500)]" />,
  member: <User size={12} className="text-[var(--text-secondary)]" />,
  viewer: <User size={12} className="text-[var(--text-tertiary)]" />,
}
const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'member', label: '成员' },
  { value: 'viewer', label: '观察者' },
]

const INIT_MEMBERS: Member[] = [
  { id: '1', name: '张三', email: 'demo@nextai.dev', role: 'owner', joinedAt: '2025-11-01' },
  { id: '2', name: '李四', email: 'lisi@example.com', role: 'admin', joinedAt: '2025-11-10' },
  { id: '3', name: '王五', email: 'wangwu@example.com', role: 'member', joinedAt: '2025-12-01' },
]

export default function MembersPage() {
  const [members, setMembers] = useState(INIT_MEMBERS)
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [menuId, setMenuId] = useState<string | null>(null)

  function handleInvite() {
    toast.success(`邀请已发送至 ${inviteEmail}`)
    setInviting(false)
    setInviteEmail('')
  }

  function handleChangeRole(id: string, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
    setMenuId(null)
    toast.success('角色已更新')
  }

  function handleRemove(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id))
    setMenuId(null)
    toast.success('成员已移除')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">成员管理</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{members.length} 位成员</p>
        </div>
        <Button onClick={() => setInviting(true)}>
          <UserPlus size={16} />
          邀请成员
        </Button>
      </div>

      <div className="divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--border)]">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-4 px-4 py-3">
            <Avatar name={m.name} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{m.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{m.email}</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs">
              {ROLE_ICONS[m.role]}
              {ROLE_LABELS[m.role]}
            </span>
            {m.role !== 'owner' && (
              <div className="relative">
                <button onClick={() => setMenuId(menuId === m.id ? null : m.id)}
                  className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
                  <MoreHorizontal size={16} />
                </button>
                {menuId === m.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] py-1 shadow-lg">
                      {ROLE_OPTIONS.filter((r) => r.value !== m.role).map((r) => (
                        <button key={r.value} onClick={() => handleChangeRole(m.id, r.value as Role)}
                          className="flex w-full items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]">
                          改为{r.label}
                        </button>
                      ))}
                      <button onClick={() => handleRemove(m.id)}
                        className="flex w-full items-center px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-50)]">
                        移除成员
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={inviting} onClose={() => setInviting(false)} title="邀请成员" size="sm"
        footer={<><Button variant="secondary" onClick={() => setInviting(false)}>取消</Button><Button onClick={handleInvite} disabled={!inviteEmail.trim()}>发送邀请</Button></>}>
        <div className="space-y-4">
          <Input label="邮箱地址" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" fullWidth />
          <Select label="角色" options={ROLE_OPTIONS} value={inviteRole} onChange={(v) => setInviteRole(String(v))} fullWidth />
        </div>
      </Modal>
    </div>
  )
}
