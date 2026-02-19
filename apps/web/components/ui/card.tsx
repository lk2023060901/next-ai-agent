import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  clickable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  header?: ReactNode
  footer?: ReactNode
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  hoverable = false,
  clickable = false,
  padding = 'md',
  header,
  footer,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)]',
        'shadow-[var(--shadow-sm)] transition-shadow duration-[var(--duration-fast)]',
        hoverable && 'hover:shadow-[var(--shadow-md)]',
        clickable && 'cursor-pointer hover:shadow-[var(--shadow-md)] active:shadow-[var(--shadow-sm)]',
        className,
      )}
      {...props}
    >
      {header && (
        <div className="border-b border-[var(--border)] px-6 py-4">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="border-t border-[var(--border)] px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  )
}
