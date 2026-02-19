'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-50)]">
            <CheckCircle size={32} className="text-[var(--color-success)]" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">邮件已发送</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            我们已向 <span className="font-medium text-[var(--text-primary)]">{email}</span> 发送了重置链接，请查收邮件。
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-primary-500)] hover:underline"
        >
          <ArrowLeft size={14} />
          返回登录
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">忘记密码</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          输入注册邮箱，我们会发送重置链接。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button type="submit" fullWidth loading={loading}>
          发送重置链接
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={14} />
        返回登录
      </Link>
    </div>
  )
}
