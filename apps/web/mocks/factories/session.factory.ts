import type { Session, Message, MessageRole } from '@/types/api'

let seq = 1
const id = (prefix: string) => `${prefix}-${seq++}`
const now = () => new Date().toISOString()

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: id('session'),
    title: `对话 ${seq}`,
    workspaceId: 'ws-default',
    status: 'active',
    messageCount: 0,
    createdAt: now(),
    ...overrides,
  }
}

export function makeMessage(
  overrides: Partial<Message> & { sessionId: string },
): Message {
  const { sessionId, ...rest } = overrides
  return {
    id: id('msg'),
    sessionId,
    role: 'user' as MessageRole,
    content: '这是一条消息',
    status: 'sent',
    createdAt: now(),
    ...rest,
  }
}

export function makeSeedMessages(sessionId: string): Message[] {
  return [
    makeMessage({ sessionId, role: 'user', content: '请帮我创建一个 Todo 应用' }),
    makeMessage({
      sessionId,
      role: 'assistant',
      content: '好的，我来帮你创建一个 Todo 应用。我会先分析需求，然后搭建前后端架构。',
      agentId: 'agent-coordinator',
    }),
    makeMessage({
      sessionId,
      role: 'assistant',
      content: '需求分析完成：\n1. 用户可以添加、编辑、删除任务\n2. 支持任务分类和优先级\n3. 支持截止日期提醒',
      agentId: 'agent-requirements',
    }),
  ]
}
