import type { ReactNode } from 'react'
import Link from 'next/link'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-[var(--text-primary)]">
            NextAI Agent
          </Link>
          <Link
            href="/login"
            className="rounded-[var(--radius-md)] bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-600)]"
          >
            登录
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
