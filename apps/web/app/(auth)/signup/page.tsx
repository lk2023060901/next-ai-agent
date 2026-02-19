'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { OAuthButtons } from '@/components/features/auth/oauth-buttons'
import { authApi } from '@/lib/api/auth-api'
import { useAuthStore } from '@/lib/store/use-auth-store'
import { ApiClientError } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels = ['', '弱', '一般', '较强', '强']
  const colors = ['', 'bg-[var(--color-danger)]', 'bg-[var(--color-warning)]', 'bg-[var(--color-primary-400)]', 'bg-[var(--color-success)]']

  if (!password) return null

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= score ? (colors[score] ?? 'bg-[var(--border)]') : 'bg-[var(--border)]',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">
        密码强度：<span className="font-medium">{labels[score]}</span>
      </p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('请阅读并同意服务条款'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.signup({ name, email, password })
      setAuth(res.data.user, res.data.tokens)
      router.push('/org/acme/ws/default/chat')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">创建账号</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          已有账号？{' '}
          <Link href="/login" className="text-[var(--color-primary-500)] hover:underline">
            立即登录
          </Link>
        </p>
      </div>

      <OAuthButtons mode="signup" />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-tertiary)]">或使用邮箱</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="你的名字"
          leftIcon={<User size={16} />}
          required
          fullWidth
        />
        <Input
          label="邮箱"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          leftIcon={<Mail size={16} />}
          required
          fullWidth
        />
        <div className="space-y-2">
          <Input
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 8 位"
            leftIcon={<Lock size={16} />}
            required
            fullWidth
          />
          <PasswordStrength password={password} />
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--border)] accent-[var(--color-primary-500)]"
          />
          <span>
            我已阅读并同意{' '}
            <a href="#" className="text-[var(--color-primary-500)] hover:underline">服务条款</a>
            {' '}和{' '}
            <a href="#" className="text-[var(--color-primary-500)] hover:underline">隐私政策</a>
          </span>
        </label>

        {error && (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading}>
          创建账号
        </Button>
      </form>
    </div>
  )
}
