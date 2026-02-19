import { create } from 'zustand'
import type { Session, StreamingMessage } from '@/types/api'

interface ChatState {
  activeSessionId: string | null
  sessions: Session[]
  // messages keyed by sessionId
  messages: Record<string, StreamingMessage[]>
  // id of the message currently being streamed
  streamingId: string | null

  setActiveSession: (id: string | null) => void
  setSessions: (sessions: Session[]) => void
  addSession: (session: Session) => void
  setMessages: (sessionId: string, messages: StreamingMessage[]) => void
  addMessage: (message: StreamingMessage) => void
  updateMessage: (
    id: string,
    update: Partial<StreamingMessage> | ((prev: StreamingMessage) => Partial<StreamingMessage>),
  ) => void
  setStreamingId: (id: string | null) => void
}

export const useChatStore = create<ChatState>()((set) => ({
  activeSessionId: null,
  sessions: [],
  messages: {},
  streamingId: null,

  setActiveSession: (id) => set({ activeSessionId: id }),

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((s) => ({ sessions: [session, ...s.sessions] })),

  setMessages: (sessionId, messages) =>
    set((s) => ({ messages: { ...s.messages, [sessionId]: messages } })),

  addMessage: (message) =>
    set((s) => {
      const prev = s.messages[message.sessionId] ?? []
      return { messages: { ...s.messages, [message.sessionId]: [...prev, message] } }
    }),

  updateMessage: (id, update) =>
    set((s) => {
      const next = { ...s.messages }
      for (const [sid, msgs] of Object.entries(next)) {
        const idx = msgs.findIndex((m) => m.id === id)
        if (idx !== -1) {
          const prev = msgs[idx]!
          const patch = typeof update === 'function' ? update(prev) : update
          const updated = [...msgs]
          updated[idx] = { ...prev, ...patch }
          next[sid] = updated
          break
        }
      }
      return { messages: next }
    }),

  setStreamingId: (id) => set({ streamingId: id }),
}))
