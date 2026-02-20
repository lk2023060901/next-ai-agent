'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Bot, Activity, Clock, CheckCircle2 } from 'lucide-react'
import { SessionList } from '@/components/features/chat/session-list'
import { MessageInput } from '@/components/features/chat/message-input'
import { ThinkingIndicator } from '@/components/features/chat/thinking-indicator'
import { SkeletonCard } from '@/components/ui/skeleton'
import { sessionApi } from '@/lib/api/session-api'
import { useChatStore } from '@/lib/store/use-chat-store'
import { useStreamingChat } from '@/hooks/use-streaming-chat'
import type { Session } from '@/types/api'

// Lazy-load MessageList — brings in react-markdown, rehype-highlight, etc.
const MessageList = dynamic(
  () => import('@/components/features/chat/message-list').then((m) => ({ default: m.MessageList })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 space-y-4 overflow-auto p-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    ),
  },
)

const MOCK_AGENTS = [
  { id: 'agent-coordinator', name: '协调者', role: 'coordinator', status: 'running' as const },
  { id: 'agent-frontend', name: '前端工程师', role: 'frontend', status: 'idle' as const },
  { id: 'agent-backend', name: '后端工程师', role: 'backend', status: 'idle' as const },
  { id: 'agent-requirements', name: '需求分析师', role: 'requirements', status: 'idle' as const },
]

const ROLE_COLORS: Record<string, string> = {
  coordinator: 'var(--color-agent-coordinator)',
  frontend: 'var(--color-agent-frontend)',
  backend: 'var(--color-agent-backend)',
  requirements: 'var(--color-agent-requirements)',
}

function AgentStatusPanel() {
  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--text-primary)]">Agent 状态</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {MOCK_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: ROLE_COLORS[agent.role] ?? 'var(--color-primary-500)' }}
            >
              {agent.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {agent.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1">
                {agent.status === 'running' ? (
                  <>
                    <Activity size={11} className="text-[var(--color-success)]" />
                    <span className="text-xs text-[var(--color-success)]">运行中</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={11} className="text-[var(--text-tertiary)]" />
                    <span className="text-xs text-[var(--text-tertiary)]">待机</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="border-t border-[var(--border)] px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          最近活动
        </p>
        <div className="space-y-2">
          {[
            {
              text: '需求分析完成',
              time: '2 分钟前',
              icon: <CheckCircle2 size={12} className="text-[var(--color-success)]" />,
            },
            {
              text: '架构设计中',
              time: '5 分钟前',
              icon: <Activity size={12} className="text-[var(--color-warning)]" />,
            },
            {
              text: '会话已创建',
              time: '8 分钟前',
              icon: <Bot size={12} className="text-[var(--text-tertiary)]" />,
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.icon}
              <span className="flex-1 text-xs text-[var(--text-secondary)]">{item.text}</span>
              <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                <Clock size={10} />
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default function ChatPage() {
  const params = useParams<{ slug: string; wsSlug: string }>()
  const wsSlug = params.wsSlug

  const {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSession,
    messages,
    setMessages,
    addMessage,
    updateMessage,
    streamingId,
  } = useChatStore()

  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const { sendStream, stopStream } = useStreamingChat(activeSessionId)

  const activeMessages = useMemo(
    () => (activeSessionId ? (messages[activeSessionId] ?? []) : []),
    [activeSessionId, messages],
  )
  const isStreaming = streamingId !== null

  // Load sessions
  useEffect(() => {
    setLoadingSessions(true)
    sessionApi
      .list(wsSlug)
      .then((res) => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoadingSessions(false))
  }, [wsSlug, setSessions])

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) return
    setLoadingMessages(true)
    sessionApi
      .messages(activeSessionId)
      .then((res) => setMessages(activeSessionId, res.data))
      .catch(() => {})
      .finally(() => setLoadingMessages(false))
  }, [activeSessionId, setMessages])

  const handleNewSession = useCallback(async () => {
    const title = `新对话 ${sessions.length + 1}`
    const res = await sessionApi.create(wsSlug, title)
    const newSessions: Session[] = [res.data, ...sessions]
    setSessions(newSessions)
    setActiveSession(res.data.id)
  }, [wsSlug, sessions, setSessions, setActiveSession])

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeSessionId) {
        await handleNewSession()
        return
      }

      // Add user message optimistically
      addMessage({
        id: `temp-${Date.now()}`,
        sessionId: activeSessionId,
        role: 'user',
        content,
        status: 'sent',
        createdAt: new Date().toISOString(),
      })

      // Start SSE stream
      await sendStream(content)
    },
    [activeSessionId, addMessage, handleNewSession, sendStream],
  )

  const handleApprove = useCallback(
    (approvalId: string) => {
      for (const msg of activeMessages) {
        if (msg.approvalRequest?.id === approvalId) {
          updateMessage(msg.id, {
            approvalRequest: { ...msg.approvalRequest, status: 'approved' },
          })
          break
        }
      }
    },
    [activeMessages, updateMessage],
  )

  const handleReject = useCallback(
    (approvalId: string) => {
      for (const msg of activeMessages) {
        if (msg.approvalRequest?.id === approvalId) {
          updateMessage(msg.id, {
            approvalRequest: { ...msg.approvalRequest, status: 'rejected' },
          })
          break
        }
      }
    },
    [activeMessages, updateMessage],
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Session list */}
      <SessionList
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={setActiveSession}
        onCreate={handleNewSession}
        loading={loadingSessions}
      />

      {/* Message area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center border-b border-[var(--border)] px-6 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {sessions.find((s) => s.id === activeSessionId)?.title ?? '选择或新建对话'}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">{activeMessages.length} 条消息</p>
          </div>
        </div>

        {/* Messages — dynamically loaded */}
        <MessageList
          messages={activeMessages}
          streamingId={streamingId}
          loading={loadingMessages}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        {/* Thinking indicator — show only when stream started but no streaming message yet */}
        {isStreaming && !streamingId && <ThinkingIndicator agentRole="coordinator" />}

        {/* Input */}
        <MessageInput onSend={handleSend} onStop={stopStream} streaming={isStreaming} />
      </div>

      {/* Agent status panel */}
      <AgentStatusPanel />
    </div>
  )
}
