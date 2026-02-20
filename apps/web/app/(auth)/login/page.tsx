'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { authApi } from '@/lib/api/auth-api'
import { useAuthStore } from '@/lib/store/use-auth-store'
import { ApiClientError } from '@/lib/api/client'

type LoginTab = 'email' | 'phone'

// ── OAuth icon buttons ────────────────────────────────────────────────────

function OAuthIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface)]"
    >
      {children}
    </button>
  )
}

// ── GitHub SVG ───────────────────────────────────────────────────────────

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[var(--text-primary)]">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[var(--text-primary)]">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#07C160]">
      <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1 3.58 2.56 4.74a.5.5 0 01.18.57l-.33 1.26 1.62-.95a.74.74 0 01.61-.08c.9.26 1.88.4 2.86.4.18 0 .36 0 .54-.01C9.72 15.41 9.5 14.73 9.5 14c0-3.31 3.13-6 7-6 .17 0 .33 0 .5.01C16.44 5.98 13.27 4 9.5 4zm-2 3.5a1 1 0 110 2 1 1 0 010-2zm4 0a1 1 0 110 2 1 1 0 010-2zm5 3c-3.31 0-6 2.24-6 5s2.69 5 6 5c.83 0 1.62-.16 2.33-.45l1.37.8-.28-1.07a.5.5 0 01.17-.5C21.06 18.56 22 16.86 22 15c0-2.76-2.69-5-6-5zm-2 3a.875.875 0 110 1.75A.875.875 0 0114.5 13.5zm4 0a.875.875 0 110 1.75.875.875 0 010-1.75z" />
    </svg>
  )
}

// ── Main page ────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [tab, setTab] = useState<LoginTab>('email')
  const [email, setEmail] = useState('demo@nextai.dev')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function doLogin(e?: string, p?: string) {
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email: e ?? email, password: p ?? password })
      setAuth(res.data.user, res.data.tokens)
      router.push('/org/acme/ws/default/chat')
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError('登录失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  // Auto-login with demo credentials on mount
  useEffect(() => {
    doLogin('demo@nextai.dev', 'password123')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    doLogin()
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Logo + title */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-lg"
          style={{ background: 'var(--color-accent)' }}
        >
          N
        </div>
        <div className="space-y-1">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-primary)]">
            NextAI Agent
          </h1>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: 'var(--color-accent)' }}
          >
            Multi-Agent Platform
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full rounded-2xl border border-[var(--border)] p-7"
        style={{
          background: 'var(--surface)',
          boxShadow: 'var(--auth-card-shadow)',
        }}
      >
        {/* Tab switcher */}
        <div className="mb-6 flex rounded-xl bg-[var(--surface-2)] p-1">
          {(
            [
              ['email', '邮箱登录'],
              ['phone', '手机登录'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTab(val)}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                tab === val
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'email' ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                className={cn(
                  'w-full rounded-xl border bg-[var(--surface-2)] px-4 py-3.5 text-sm text-[var(--text-primary)] outline-none transition-colors',
                  'placeholder:text-[var(--text-tertiary)]',
                  'focus:ring-[var(--color-accent)]/20 border-[var(--border)] focus:border-[var(--color-accent)] focus:ring-2',
                )}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">手机号码</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+86 138 0000 0000"
                required
                className={cn(
                  'w-full rounded-xl border bg-[var(--surface-2)] px-4 py-3.5 text-sm text-[var(--text-primary)] outline-none transition-colors',
                  'placeholder:text-[var(--text-tertiary)]',
                  'focus:ring-[var(--color-accent)]/20 border-[var(--border)] focus:border-[var(--color-accent)] focus:ring-2',
                )}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={cn(
                'w-full rounded-xl border bg-[var(--surface-2)] px-4 py-3.5 text-sm text-[var(--text-primary)] outline-none transition-colors',
                'placeholder:text-[var(--text-tertiary)]',
                'focus:ring-[var(--color-accent)]/20 border-[var(--border)] focus:border-[var(--color-accent)] focus:ring-2',
              )}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-[var(--color-danger-50)] px-4 py-3 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white transition-opacity',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
            style={{ background: 'var(--color-accent)' }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = 'var(--color-accent-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-accent)'
            }}
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>登录 →</>
            )}
          </button>
        </form>

        {/* OAuth */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-tertiary)]">第三方账号登录</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <div className="flex justify-center gap-3">
            <OAuthIcon label="GitHub 登录">
              <GitHubIcon />
            </OAuthIcon>
            <OAuthIcon label="Google 登录">
              <GoogleIcon />
            </OAuthIcon>
            <OAuthIcon label="Apple 登录">
              <AppleIcon />
            </OAuthIcon>
            <OAuthIcon label="微信登录">
              <WeChatIcon />
            </OAuthIcon>
          </div>
        </div>
      </div>

      {/* Footer links */}
      <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
        <Link
          href="/forgot-password"
          className="transition-colors hover:text-[var(--text-secondary)]"
        >
          忘记密码？
        </Link>
        <span>|</span>
        <span>
          还没有账号？{' '}
          <Link
            href="/signup"
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: 'var(--color-accent)' }}
          >
            立即注册
          </Link>
        </span>
      </div>
    </div>
  )
}
