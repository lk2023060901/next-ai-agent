import { http, HttpResponse, delay } from 'msw'
import {
  makeChannelList,
  makeChannel,
  makeChannelMessageList,
  makeChannelMessage,
  makeRoutingRuleList,
  makeRoutingRule,
  makeChannelStats,
} from '../factories/channel.factory'
import type { Channel, ChannelMessage, RoutingRule } from '@/types/api'

// In-memory stores
const CHANNEL_STORE: Record<string, Channel[]> = {}
const MESSAGE_STORE: Record<string, ChannelMessage[]> = {}
const RULE_STORE: Record<string, RoutingRule[]> = {}

function getChannels(wsId: string): Channel[] {
  if (!CHANNEL_STORE[wsId]) CHANNEL_STORE[wsId] = makeChannelList(wsId)
  return CHANNEL_STORE[wsId]!
}

function getMessages(channelId: string): ChannelMessage[] {
  if (!MESSAGE_STORE[channelId]) MESSAGE_STORE[channelId] = makeChannelMessageList(channelId)
  return MESSAGE_STORE[channelId]!
}

function getRules(channelId: string): RoutingRule[] {
  if (!RULE_STORE[channelId]) RULE_STORE[channelId] = makeRoutingRuleList(channelId)
  return RULE_STORE[channelId]!
}

export const channelHandlers = [
  // ─── Channels ─────────────────────────────────────────────────────────────

  http.get('/api/workspaces/:wsId/channels', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: getChannels(params.wsId as string) })
  }),

  http.post('/api/workspaces/:wsId/channels', async ({ params, request }) => {
    await delay(400)
    const body = (await request.json()) as {
      type: string
      name: string
      config: Record<string, string>
      defaultAgentId?: string
    }
    const wsId = params.wsId as string
    const channel = makeChannel(wsId, {
      type: body.type as Channel['type'],
      name: body.name,
      config: body.config,
      status: 'connected',
      connectedChannels: 1,
      ...(body.defaultAgentId ? { defaultAgentId: body.defaultAgentId } : {}),
    })
    getChannels(wsId).unshift(channel)
    return HttpResponse.json({ data: channel }, { status: 201 })
  }),

  http.patch('/api/channels/:channelId', async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as Partial<Channel>
    const channelId = params.channelId as string
    let updated: Channel | undefined
    for (const wsId of Object.keys(CHANNEL_STORE)) {
      const arr = CHANNEL_STORE[wsId]!
      const idx = arr.findIndex((c) => c.id === channelId)
      if (idx !== -1) {
        arr[idx] = { ...arr[idx]!, ...body, updatedAt: new Date().toISOString() }
        updated = arr[idx]
        break
      }
    }
    if (!updated) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ data: updated })
  }),

  http.delete('/api/channels/:channelId', async ({ params }) => {
    await delay(300)
    const channelId = params.channelId as string
    for (const wsId of Object.keys(CHANNEL_STORE)) {
      const arr = CHANNEL_STORE[wsId]!
      const idx = arr.findIndex((c) => c.id === channelId)
      if (idx !== -1) {
        arr.splice(idx, 1)
        delete MESSAGE_STORE[channelId]
        delete RULE_STORE[channelId]
        break
      }
    }
    return HttpResponse.json({ data: null })
  }),

  // ─── Test Connection ───────────────────────────────────────────────────────

  http.post('/api/channels/:channelId/test', async () => {
    await delay(800)
    const success = Math.random() > 0.1
    return HttpResponse.json({
      data: success
        ? { success: true, botName: 'NextAI Bot' }
        : { success: false, error: 'Invalid token or network error' },
    })
  }),

  // ─── Stats ────────────────────────────────────────────────────────────────

  http.get('/api/channels/:channelId/stats', async () => {
    await delay(250)
    return HttpResponse.json({ data: makeChannelStats() })
  }),

  // ─── Messages ─────────────────────────────────────────────────────────────

  http.get('/api/channels/:channelId/messages', async ({ params, request }) => {
    await delay(300)
    const channelId = params.channelId as string
    const url = new URL(request.url)
    const direction = url.searchParams.get('direction')
    const status = url.searchParams.get('status')
    const sender = url.searchParams.get('sender')
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 50)

    let msgs = getMessages(channelId)
    if (direction) msgs = msgs.filter((m) => m.direction === direction)
    if (status) msgs = msgs.filter((m) => m.status === status)
    if (sender) msgs = msgs.filter((m) => m.senderName.toLowerCase().includes(sender.toLowerCase()))

    const total = msgs.length
    const slice = msgs.slice((page - 1) * pageSize, page * pageSize)
    return HttpResponse.json({
      data: slice,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  }),

  // ─── Routing Rules ─────────────────────────────────────────────────────────

  http.get('/api/channels/:channelId/rules', async ({ params }) => {
    await delay(200)
    const rules = getRules(params.channelId as string)
    return HttpResponse.json({ data: rules })
  }),

  http.post('/api/channels/:channelId/rules', async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as {
      field: string
      operator: string
      value: string
      targetAgentId: string
      priority: number
    }
    const channelId = params.channelId as string
    const rule = makeRoutingRule(channelId, {
      field: body.field as RoutingRule['field'],
      operator: body.operator as RoutingRule['operator'],
      value: body.value,
      targetAgentId: body.targetAgentId,
      priority: body.priority,
    })
    getRules(channelId).push(rule)
    getRules(channelId).sort((a, b) => a.priority - b.priority)
    return HttpResponse.json({ data: rule }, { status: 201 })
  }),

  http.patch('/api/channels/:channelId/rules/:ruleId', async ({ params, request }) => {
    await delay(200)
    const body = (await request.json()) as Partial<RoutingRule>
    const { channelId, ruleId } = params as { channelId: string; ruleId: string }
    const arr = getRules(channelId)
    const idx = arr.findIndex((r) => r.id === ruleId)
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    arr[idx] = { ...arr[idx]!, ...body }
    return HttpResponse.json({ data: arr[idx] })
  }),

  http.delete('/api/channels/:channelId/rules/:ruleId', async ({ params }) => {
    await delay(200)
    const { channelId, ruleId } = params as { channelId: string; ruleId: string }
    const arr = getRules(channelId)
    const idx = arr.findIndex((r) => r.id === ruleId)
    if (idx !== -1) arr.splice(idx, 1)
    return HttpResponse.json({ data: null })
  }),

  // ─── Seed messages for new channels (needed if navigating from list) ────────

  http.post('/api/channels/:channelId/messages/seed', async ({ params }) => {
    const channelId = params.channelId as string
    if (!MESSAGE_STORE[channelId]) {
      MESSAGE_STORE[channelId] = makeChannelMessageList(channelId)
    }
    return HttpResponse.json({ data: null })
  }),
]

// Re-export for use in MSW browser mock
export { makeChannel, makeChannelMessage }
