import type { ReactNode } from 'react'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div
        className="hidden w-1/2 flex-col justify-between p-12 lg:flex"
        style={{
          background: 'linear-gradient(115deg, #173f78 0%, #1f5f99 45%, #0c7b78 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-white/20 text-lg font-bold text-white">
            N
          </span>
          <span className="text-xl font-bold text-white">NextAI Agent</span>
        </div>
        <div className="space-y-4">
          <blockquote className="text-2xl font-medium leading-relaxed text-white">
            &ldquo;让 AI 代理团队为您完成复杂的软件工程任务&rdquo;
          </blockquote>
          <p className="text-white/70">多智能体协作平台 · 24/7 自主运行 · 企业级安全</p>
        </div>
        <div className="flex gap-6 text-sm text-white/60">
          <span>© 2025 NextAI Agent</span>
          <a href="#" className="hover:text-white transition-colors">隐私政策</a>
          <a href="#" className="hover:text-white transition-colors">服务条款</a>
        </div>
      </div>

      {/* Form panel */}
      <div
        className="relative flex flex-1 flex-col items-center justify-center p-8"
        style={{ background: 'var(--auth-panel-bg)' }}
      >
        {/* Theme switcher — top right */}
        <div className="absolute right-6 top-5">
          <ThemeSwitcher />
        </div>

        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  )
}
