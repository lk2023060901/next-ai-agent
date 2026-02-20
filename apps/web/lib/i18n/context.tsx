'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { messages, type Locale, type Messages } from './messages'

interface I18nContextValue {
  locale: Locale
  t: Messages
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'nextai-locale'

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh' || stored === 'en') return stored
  // Detect browser language
  return navigator.language.startsWith('zh') ? 'zh' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh')

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
    // Update html lang attribute
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
  }, [])

  // Hydrate from localStorage on mount (client only)
  // Using a ref-based approach to avoid hydration mismatch
  const [hydrated, setHydrated] = useState(false)
  if (!hydrated && typeof window !== 'undefined') {
    const initial = getInitialLocale()
    if (initial !== locale) {
      setLocaleState(initial)
    }
    setHydrated(true)
  }

  return (
    <I18nContext.Provider value={{ locale, t: messages[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Shorthand — returns the translation object directly */
export function useT(): Messages {
  return useI18n().t
}
