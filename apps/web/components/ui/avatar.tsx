import { type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  name?: string
  size?: AvatarSize
  online?: boolean
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; indicator: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-xs', indicator: 'h-1.5 w-1.5' },
  sm: { container: 'h-8 w-8', text: 'text-sm', indicator: 'h-2 w-2' },
  md: { container: 'h-10 w-10', text: 'text-sm', indicator: 'h-2.5 w-2.5' },
  lg: { container: 'h-12 w-12', text: 'text-base', indicator: 'h-3 w-3' },
  xl: { container: 'h-16 w-16', text: 'text-lg', indicator: 'h-3.5 w-3.5' },
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function getColorFromName(name: string) {
  const colors = [
    'bg-[var(--color-primary-500)]',
    'bg-[var(--color-agent-requirements)]',
    'bg-[var(--color-agent-frontend)]',
    'bg-[var(--color-agent-backend)]',
    'bg-[var(--color-agent-review)]',
    'bg-[var(--color-agent-devops)]',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ src, name = '', size = 'md', online, className, alt, ...props }: AvatarProps) {
  const styles = sizeStyles[size]

  return (
    <div className={cn('relative inline-flex shrink-0', styles.container, className)}>
      {src ? (
        <img
          src={src}
          alt={alt ?? name}
          className="h-full w-full rounded-full object-cover"
          {...props}
        />
      ) : (
        <span
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full text-white font-medium select-none',
            styles.text,
            getColorFromName(name),
          )}
        >
          {name ? getInitials(name) : '?'}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-[var(--bg)]',
            styles.indicator,
            online ? 'bg-[var(--color-success)]' : 'bg-[var(--text-tertiary)]',
          )}
        />
      )}
    </div>
  )
}
