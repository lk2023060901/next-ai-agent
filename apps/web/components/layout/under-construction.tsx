import { Construction } from 'lucide-react'

interface UnderConstructionProps {
  title: string
  description?: string
}

export function UnderConstruction({ title, description }: UnderConstructionProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface)] text-[var(--text-tertiary)]">
          <Construction size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {description ?? '该功能正在开发中，敬请期待'}
          </p>
        </div>
        <span className="rounded-full border border-[var(--color-warning)] bg-[var(--color-warning-50)] px-3 py-1 text-xs font-medium text-[var(--color-warning-700)]">
          开发中
        </span>
      </div>
    </div>
  )
}
