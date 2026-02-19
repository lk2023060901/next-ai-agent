'use client'

import { useState } from 'react'
import { Lock, Shield, Monitor, Smartphone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'

const SESSIONS = [
  { id: '1', device: 'MacBook Pro', browser: 'Chrome 121', location: '上海, 中国', current: true, lastActive: '当前' },
  { id: '2', device: 'iPhone 15', browser: 'Safari Mobile', location: '上海, 中国', current: false, lastActive: '2 小时前' },
  { id: '3', device: 'Windows PC', browser: 'Edge 120', location: '北京, 中国', current: false, lastActive: '3 天前' },
]

export default function SecurityPage() {
  const [current, setCurrent] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [twoFA, setTwoFA] = useState(false)

  async function handleChangePassword() {
    if (newPwd !== confirm) { toast.error('两次密码不一致'); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
    setCurrent(''); setNewPwd(''); setConfirm('')
    toast.success('密码已更新')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">安全设置</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">管理密码、双因素认证和登录会话</p>
      </div>

      {/* Change password */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <Lock size={18} className="text-[var(--text-secondary)]" />
          <h3 className="font-medium text-[var(--text-primary)]">修改密码</h3>
        </div>
        <div className="space-y-4 max-w-sm">
          <Input label="当前密码" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} fullWidth />
          <Input label="新密码" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} fullWidth />
          <Input label="确认新密码" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} fullWidth />
          <Button loading={loading} onClick={handleChangePassword}>更新密码</Button>
        </div>
      </Card>

      {/* 2FA */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-[var(--text-secondary)]" />
            <div>
              <p className="font-medium text-[var(--text-primary)]">双因素认证</p>
              <p className="text-sm text-[var(--text-secondary)]">使用验证器 App 增强账号安全</p>
            </div>
          </div>
          <button
            onClick={() => { setTwoFA((v) => !v); toast.success(twoFA ? '已关闭双因素认证' : '已开启双因素认证') }}
            className={`relative h-6 w-11 rounded-full transition-colors ${twoFA ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--border)]'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${twoFA ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </Card>

      {/* Sessions */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <Monitor size={18} className="text-[var(--text-secondary)]" />
          <h3 className="font-medium text-[var(--text-primary)]">登录会话</h3>
        </div>
        <div className="space-y-3">
          {SESSIONS.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] p-3">
              <div className="flex items-center gap-3">
                {s.device.includes('iPhone') ? <Smartphone size={16} className="text-[var(--text-secondary)]" /> : <Monitor size={16} className="text-[var(--text-secondary)]" />}
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{s.device} · {s.browser}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{s.location} · {s.lastActive}</p>
                </div>
              </div>
              {s.current ? (
                <span className="rounded-full bg-[var(--color-success-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-success-700)]">当前</span>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => toast.success('会话已退出')}>退出</Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
