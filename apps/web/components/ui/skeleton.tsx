import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  const style =
    width || height ? { ...(width ? { width } : {}), ...(height ? { height } : {}) } : undefined
  return (
    <div
      className={cn('animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-2)]', className)}
      {...(style ? { style } : {})}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'space-y-3 rounded-[var(--radius-lg)] border border-[var(--border)] p-4',
        className,
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  )
}
