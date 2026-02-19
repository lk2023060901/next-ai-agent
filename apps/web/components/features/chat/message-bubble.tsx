import { type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Avatar } from '@/components/ui/avatar'
import { MarkdownRenderer } from './markdown-renderer'
import { ToolCallCard } from './tool-call-card'
import { ApprovalCard } from './approval-card'
import type { StreamingMessage } from '@/types/api'

const AGENT_ROLE_COLORS: Record<string, string> = {
  coordinator: 'var(--color-agent-coordinator)',
  requirements: 'var(--color-agent-requirements)',
  architecture: 'var(--color-agent-architecture)',
  frontend: 'var(--color-agent-frontend)',
  backend: 'var(--color-agent-backend)',
  testing: 'var(--color-agent-testing)',
  devops: 'var(--color-agent-devops)',
  review: 'var(--color-agent-review)',
}

const AGENT_ROLE_NAMES: Record<string, string> = {
  coordinator: '协调者',
  requirements: '需求分析师',
  architecture: '架构师',
  frontend: '前端工程师',
  backend: '后端工程师',
  testing: '测试工程师',
  devops: 'DevOps',
  review: '代码审查',
}

interface MessageBubbleProps {
  message: StreamingMessage
  agentName?: string
  agentRole?: string
  isStreaming?: boolean
  extra?: ReactNode
  onApprove?: (approvalId: string) => void
  onReject?: (approvalId: string) => void
}

function StreamingCursor() {
  return (
    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-current align-middle" />
  )
}

export function MessageBubble({
  message,
  agentName,
  agentRole,
  isStreaming,
  extra,
  onApprove,
  onReject,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const roleColor = agentRole ? `var(--color-agent-${agentRole})` : AGENT_ROLE_COLORS['coordinator']

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 px-4 py-2">
        <div className="max-w-[70%]">
          <div className="rounded-[var(--radius-lg)] rounded-br-[var(--radius-sm)] bg-[var(--color-primary-500)] px-4 py-3 text-sm text-white">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        </div>
        <Avatar name="我" size="sm" className="shrink-0 mt-1" />
      </div>
    )
  }

  const displayName = agentName ?? (agentRole ? AGENT_ROLE_NAMES[agentRole] : 'Agent')
  const avatarColor = agentRole ? AGENT_ROLE_COLORS[agentRole] : undefined

  return (
    <div className="flex gap-3 px-4 py-2">
      <div
        className="flex h-8 w-8 shrink-0 mt-1 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: avatarColor ?? roleColor }}
      >
        {(displayName ?? 'A')[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: avatarColor ?? roleColor }}>
            {displayName}
          </span>
          {agentRole && displayName !== AGENT_ROLE_NAMES[agentRole] && (
            <span className="text-xs text-[var(--text-tertiary)]">{AGENT_ROLE_NAMES[agentRole]}</span>
          )}
        </div>

        {/* Text bubble — only render if there's text content */}
        {message.content && (
          <div
            className={cn(
              'inline-block max-w-[85%] rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-4 py-3',
              message.status === 'error' && 'border-[var(--color-danger)] bg-[var(--color-danger-50)]',
            )}
          >
            {message.status === 'error' ? (
              <p className="text-sm text-[var(--color-danger)]">{message.content}</p>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
            {isStreaming && <StreamingCursor />}
          </div>
        )}

        {/* Show streaming cursor even when content is empty (just started) */}
        {!message.content && isStreaming && (
          <div className="inline-block rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
            <StreamingCursor />
          </div>
        )}

        {/* Tool call cards */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="max-w-[85%] space-y-1">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Approval card */}
        {message.approvalRequest && (
          <div className="max-w-[85%]">
            <ApprovalCard
              approval={message.approvalRequest}
              {...(onApprove ? { onApprove } : {})}
              {...(onReject ? { onReject } : {})}
            />
          </div>
        )}

        {extra && <div className="mt-2">{extra}</div>}
      </div>
    </div>
  )
}
