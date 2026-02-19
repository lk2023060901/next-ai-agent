'use client'

import { useCallback, useRef } from 'react'
import { useChatStore } from '@/lib/store/use-chat-store'
import type { SseEvent, StreamingMessage } from '@/types/api'

export function useStreamingChat(sessionId: string | null) {
  const { addMessage, updateMessage, setStreamingId } = useChatStore()
  const abortRef = useRef<AbortController | null>(null)

  const sendStream = useCallback(
    async (content: string) => {
      if (!sessionId) return

      abortRef.current = new AbortController()

      try {
        const res = await fetch(`/api/sessions/${sessionId}/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
          signal: abortRef.current.signal,
        })

        if (!res.ok || !res.body) throw new Error('Stream failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        // Track partial message text per messageId
        const partialText: Record<string, string> = {}

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue

            let event: SseEvent
            try {
              event = JSON.parse(raw) as SseEvent
            } catch {
              continue
            }

            switch (event.type) {
              case 'message-start': {
                const msg: StreamingMessage = {
                  id: event.messageId,
                  sessionId,
                  role: 'assistant',
                  content: '',
                  agentId: event.agentId,
                  status: 'streaming',
                  createdAt: new Date().toISOString(),
                }
                addMessage(msg)
                setStreamingId(event.messageId)
                partialText[event.messageId] = ''
                break
              }
              case 'text-delta': {
                const next = (partialText[event.messageId] ?? '') + event.delta
                partialText[event.messageId] = next
                updateMessage(event.messageId, { content: next })
                break
              }
              case 'tool-call': {
                updateMessage(event.messageId, (prev) => ({
                  toolCalls: [...(prev.toolCalls ?? []), event.toolCall],
                }))
                break
              }
              case 'tool-result': {
                updateMessage(event.messageId, (prev) => ({
                  toolCalls: (prev.toolCalls ?? []).map((tc) =>
                    tc.id === event.toolCallId
                      ? { ...tc, result: event.result, status: event.status }
                      : tc,
                  ),
                }))
                break
              }
              case 'approval-request': {
                updateMessage(event.messageId, { approvalRequest: event.approval })
                break
              }
              case 'message-end': {
                updateMessage(event.messageId, { status: 'sent' })
                setStreamingId(null)
                break
              }
              case 'done': {
                setStreamingId(null)
                break
              }
              case 'error': {
                setStreamingId(null)
                break
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setStreamingId(null)
        }
      }
    },
    [sessionId, addMessage, updateMessage, setStreamingId],
  )

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
    setStreamingId(null)
  }, [setStreamingId])

  return { sendStream, stopStream }
}
