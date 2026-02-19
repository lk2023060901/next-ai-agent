import type { ReactNode } from 'react'
import Link from 'next/link'
import { User, Shield, Palette, Bell, Key, ArrowLeft } from 'lucide-react'

const NAV = [
  { href: '/settings/profile', label: '个人资料', icon: <User size={16} /> },
  { href: '/settings/security', label: '安全设置', icon: <Shield size={16} /> },
  { href: '/settings/appearance', label: '外观', icon: <Palette size={16} /> },
  { href: '/settings/notifications', label: '通知', icon: <Bell size={16} /> },
  { href: '/settings/api-keys', label: 'API 密钥', icon: <Key size={16} /> },
]

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link
            href="/org/acme/ws/default/chat"
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
            返回
          </Link>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">账号设置</h1>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-8 px-6 py-8">
        {/* Sidebar nav */}
        <nav className="w-52 shrink-0">
          <ul className="space-y-0.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
