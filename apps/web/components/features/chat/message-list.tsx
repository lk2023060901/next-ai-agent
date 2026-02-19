'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { MessageBubble } from './message-bubble'
import { AgentSwitcher } from './agent-switcher'
import type { StreamingMessage } from '@/types/api'

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

function dateSeparator(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return '今天'
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

interface MessageListProps {
  messages: StreamingMessage[]
  streamingId?: string | null
  loading?: boolean
  extra?: (msg: StreamingMessage) => ReactNode
  onApprove?: (approvalId: string) => void
  onReject?: (approvalId: string) => void
}

export function MessageList({
  messages,
  streamingId,
  loading,
  extra,
  onApprove,
  onReject,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  function checkScroll() {
    const el = containerRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Also scroll when streaming content grows
  useEffect(() => {
    if (streamingId && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  })

  const groups: { date: string; messages: StreamingMessage[] }[] = []
  for (const msg of messages) {
    const date = dateSeparator(msg.createdAt)
    const last = groups[groups.length - 1]
    if (last?.date === date) {
      last.messages.push(msg)
    } else {
      groups.push({ date, messages: [msg] })
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={checkScroll}
      className="relative flex flex-1 flex-col overflow-y-auto py-4"
    >
      {loading ? (
        <div className="space-y-4 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn('flex gap-3', i % 2 === 0 ? '' : 'flex-row-reverse')}>
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[var(--surface-2)]" />
              <div className="space-y-1.5 flex-1" style={{ maxWidth: '60%' }}>
                <div className="h-3 w-16 animate-pulse rounded bg-[var(--surface-2)]" />
                <div className="h-16 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-2)]" />
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">开始对话</p>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">发送消息，AI 团队将为你服务</p>
          </div>
        </div>
      ) : (
        groups.map((group) => {
          let prevAgentId: string | undefined

          return (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-tertiary)]">{group.date}</span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              {group.messages.map((msg) => {
                const agentRole = msg.agentId?.replace('agent-', '')

                // Show agent-switcher divider when assistant agent changes
                const showSwitcher =
                  msg.role === 'assistant' &&
                  msg.agentId !== undefined &&
                  prevAgentId !== undefined &&
                  msg.agentId !== prevAgentId

                const switcherAgentName = agentRole ? (AGENT_ROLE_NAMES[agentRole] ?? agentRole) : 'Agent'

                if (msg.role === 'assistant' && msg.agentId) {
                  prevAgentId = msg.agentId
                }

                return (
                  <div key={msg.id}>
                    {showSwitcher && agentRole && (
                      <AgentSwitcher agentRole={agentRole} agentName={switcherAgentName} />
                    )}
                    <MessageBubble
                      message={msg}
                      {...(agentRole ? { agentRole } : {})}
                      isStreaming={streamingId === msg.id}
                      extra={extra?.(msg)}
                      {...(onApprove ? { onApprove } : {})}
                      {...(onReject ? { onReject } : {})}
                    />
                  </div>
                )
              })}
            </div>
          )
        })
      )}
      <div ref={bottomRef} />

      {/* Scroll to bottom button */}
      <button
        onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
        className={cn(
          'absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] shadow-md text-[var(--text-secondary)]',
          'transition-all hover:bg-[var(--surface)] hover:text-[var(--text-primary)]',
        )}
      >
        <ArrowDown size={14} />
      </button>
    </div>
  )
}
