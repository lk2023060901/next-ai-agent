'use client'

import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(i: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[i] = v
    setCode(next)
    if (v && i < 5) inputsRef.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...code]
    for (let i = 0; i < digits.length; i++) next[i] = digits[i] ?? ''
    setCode(next)
    inputsRef.current[Math.min(digits.length, 5)]?.focus()
  }

  async function handleSubmit() {
    const full = code.join('')
    if (full.length < 6) { setError('请输入完整的 6 位验证码'); return }
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    router.push('/org/acme/ws/default/chat')
  }

  async function handleResend() {
    setResent(true)
    await new Promise((r) => setTimeout(r, 500))
    setTimeout(() => setResent(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
          <CheckCircle size={32} className="text-[var(--color-primary-500)]" />
        </div>
      </div>

      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">验证邮箱</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          我们已向你的邮箱发送了 6 位验证码，请在 10 分钟内输入。
        </p>
      </div>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'h-12 w-12 rounded-[var(--radius-md)] border text-center text-lg font-semibold',
              'border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)]',
              'focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]',
              'transition-colors',
            )}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <Button fullWidth loading={loading} onClick={handleSubmit}>
        验证
      </Button>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        没收到验证码？{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resent}
          className="text-[var(--color-primary-500)] hover:underline disabled:opacity-50"
        >
          {resent ? '已重新发送' : '重新发送'}
        </button>
      </p>
    </div>
  )
}
