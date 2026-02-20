'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
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
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6">
      <AlertTriangle size={40} className="text-[var(--color-danger)]" />
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">页面加载失败</h2>
      <p className="max-w-md text-center text-sm text-[var(--text-secondary)]">
        {error.message || '发生未知错误，请重试或返回主页'}
      </p>
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={reset}>
          重试
        </Button>
        <Link href="/">
          <Button variant="secondary">返回主页</Button>
        </Link>
      </div>
    </div>
  )
}
