interface ThinkingIndicatorProps {
  agentName?: string
  agentRole?: string
}

const ROLE_NAMES: Record<string, string> = {
  coordinator: '协调者',
  frontend: '前端工程师',
  backend: '后端工程师',
  requirements: '需求分析师',
  architecture: '架构师',
  testing: '测试工程师',
  devops: 'DevOps',
  review: '代码审查',
}

export function ThinkingIndicator({ agentName, agentRole }: ThinkingIndicatorProps) {
  const name = agentName ?? (agentRole ? ROLE_NAMES[agentRole] : 'Agent')

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-bold text-[var(--text-secondary)]">
        {(name ?? 'A')[0]}
      </div>
      <div className="flex items-center gap-2 rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
        <span className="text-xs text-[var(--text-tertiary)]">{name} 正在思考</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-tertiary)]"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}
