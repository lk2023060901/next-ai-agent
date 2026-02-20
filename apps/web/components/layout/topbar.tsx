'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { LangSwitcher } from '@/components/ui/lang-switcher'
import { useT } from '@/lib/i18n'

interface TopbarProps {
  orgSlug: string
}

export function Topbar({ orgSlug }: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { topbar } = useT()

  return (
    <header className="flex h-[var(--topbar-height)] items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-4">
      {/* Logo */}
      <Link href={`/org/${orgSlug}/dashboard`} className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-500)] text-sm font-bold text-white">
          N
        </span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">NextAI Agent</span>
      </Link>

      {/* Global search */}
      <div className="flex max-w-md flex-1 items-center gap-2 px-8">
        <label className="flex flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 transition-colors focus-within:border-[var(--color-primary-500)] focus-within:ring-1 focus-within:ring-[var(--color-primary-500)] hover:border-[var(--border-hover)]">
          <Search size={14} className="shrink-0 text-[var(--text-tertiary)]" />
          <input
            type="search"
            placeholder={topbar.searchPlaceholder}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
        </label>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Language switcher */}
        <LangSwitcher />

        {/* Theme switcher */}
        <ThemeSwitcher />

        {/* Notifications */}
        <button
          aria-label={topbar.notifications}
          className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
        </button>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-sm transition-colors hover:bg-[var(--surface)]"
          >
            <Avatar name="用户" size="sm" />
            <ChevronDown size={14} className="text-[var(--text-tertiary)]" />
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] py-1 shadow-lg">
                <div className="border-b border-[var(--border)] px-3 py-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">用户名</p>
                  <p className="text-xs text-[var(--text-tertiary)]">user@example.com</p>
                </div>
                <Link
                  href="/settings/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)]"
                >
                  <User size={14} />
                  {topbar.profile}
                </Link>
                <Link
                  href={`/org/${orgSlug}/settings`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)]"
                >
                  <Settings size={14} />
                  {topbar.orgSettings}
                </Link>
                <div className="mt-1 border-t border-[var(--border)] pt-1">
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] transition-colors hover:bg-[var(--surface)]">
                    <LogOut size={14} />
                    {topbar.logout}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
