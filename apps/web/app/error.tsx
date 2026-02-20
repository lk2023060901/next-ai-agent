'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <AlertTriangle size={48} className="text-[var(--color-danger)]" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">页面发生错误</h1>
          <p className="text-sm text-[var(--text-secondary)]">{error.message || '未知错误'}</p>
          <Button variant="primary" onClick={reset}>
            重试
          </Button>
        </div>
      </body>
    </html>
  )
}
