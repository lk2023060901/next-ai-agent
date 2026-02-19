'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 8) { setError('密码至少 8 位'); return }
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-50)]">
            <CheckCircle size={32} className="text-[var(--color-success)]" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">密码已重置</h1>
          <p className="text-sm text-[var(--text-secondary)]">正在跳转到登录页…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">重置密码</h1>
        <p className="text-sm text-[var(--text-secondary)]">请设置新密码。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="新密码"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="至少 8 位"
          leftIcon={<Lock size={16} />}
          required
          fullWidth
        />
        <Input
          label="确认密码"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="再次输入密码"
          leftIcon={<Lock size={16} />}
          required
          fullWidth
          error={error}
        />
        <Button type="submit" fullWidth loading={loading}>
          确认重置
        </Button>
      </form>

      <Link
        href="/login"
        className="block text-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        返回登录
      </Link>
    </div>
  )
}
