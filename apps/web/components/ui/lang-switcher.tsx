'use client'

import { useI18n } from '@/lib/i18n'

export function LangSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <button
      onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
      className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
      aria-label={locale === 'zh' ? 'Switch to English' : '切换为中文'}
      title={locale === 'zh' ? 'Switch to English' : '切换为中文'}
    >
      {locale === 'zh' ? 'EN' : '中'}
    </button>
  )
}
