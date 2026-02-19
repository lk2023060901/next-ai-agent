'use client'

import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider } from 'next-themes'
import { useRouter } from 'next/navigation'
import { QueryProvider } from './query-provider'
import { MSWProvider } from './msw-provider'

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
            {children}
          </ThemeProvider>
        </HeroUIProvider>
      </QueryProvider>
    </MSWProvider>
  )
}
