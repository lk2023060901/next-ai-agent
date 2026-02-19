import { cn } from '@/lib/utils/cn'

const ROLE_COLORS: Record<string, string> = {
  coordinator: 'var(--color-agent-coordinator)',
  frontend: 'var(--color-agent-frontend)',
  backend: 'var(--color-agent-backend)',
  requirements: 'var(--color-agent-requirements)',
  architecture: 'var(--color-agent-architecture)',
  testing: 'var(--color-agent-testing)',
  devops: 'var(--color-agent-devops)',
  review: 'var(--color-agent-review)',
}

interface AgentSwitcherProps {
  agentName: string
  agentRole: string
  className?: string
}

export function AgentSwitcher({ agentName, agentRole, className }: AgentSwitcherProps) {
  const color = ROLE_COLORS[agentRole] ?? 'var(--color-primary-500)'

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2', className)}>
      <div className="h-px flex-1 bg-[var(--border)]" />
      <div className="flex items-center gap-1.5">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-[var(--text-tertiary)]">
          切换到 <span className="font-medium text-[var(--text-secondary)]">{agentName}</span>
        </span>
      </div>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  )
}
