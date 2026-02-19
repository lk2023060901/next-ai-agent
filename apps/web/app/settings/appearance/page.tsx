'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/ui/toast'

const THEMES = [
  { value: 'light', label: '浅色', icon: <Sun size={20} /> },
  { value: 'dark', label: '深色', icon: <Moon size={20} /> },
  { value: 'system', label: '跟随系统', icon: <Monitor size={20} /> },
] as const

const DENSITIES = [
  { value: 'comfortable', label: '舒适', desc: '默认间距' },
  { value: 'compact', label: '紧凑', desc: '减少间距，显示更多内容' },
] as const

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">外观</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">自定义界面主题和显示密度</p>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <h3 className="font-medium text-[var(--text-primary)]">主题</h3>
        <div className="flex gap-3">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTheme(t.value); toast.success(`已切换至${t.label}模式`) }}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 text-sm transition-colors',
                theme === t.value
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-500)]'
                  : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]',
              )}
            >
              {t.icon}
              <span className="font-medium">{t.label}</span>
              {theme === t.value && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-white">
                  <Check size={10} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div className="space-y-3">
        <h3 className="font-medium text-[var(--text-primary)]">显示密度</h3>
        <div className="flex gap-3">
          {DENSITIES.map((d) => (
            <button
              key={d.value}
              onClick={() => toast.info(`紧凑模式将在后续版本中开放`)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-[var(--radius-lg)] border-2 p-4 text-left transition-colors',
                d.value === 'comfortable'
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-hover)]',
              )}
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">{d.label}</span>
              <span className="text-xs text-[var(--text-secondary)]">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
