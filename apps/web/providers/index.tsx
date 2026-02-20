'use client'

import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider } from 'next-themes'
import { useRouter } from 'next/navigation'
import { QueryProvider } from './query-provider'
import { MSWProvider } from './msw-provider'
import { I18nProvider } from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <MSWProvider>
      <QueryProvider>
        <HeroUIProvider navigate={router.push}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="nextai-theme"
          >
            <I18nProvider>{children}</I18nProvider>
          </ThemeProvider>
        </HeroUIProvider>
      </QueryProvider>
    </MSWProvider>
  )
}
