import { http, HttpResponse, delay } from 'msw'
import { makeAgentTeam, makeAgent } from '../factories/agent.factory'

const AGENTS = makeAgentTeam('ws-default')

export const agentHandlers = [
  // GET /api/workspaces/:wsId/agents
  http.get('/api/workspaces/:wsId/agents', async () => {
    await delay(250)
    return HttpResponse.json({ data: AGENTS })
  }),

  // GET /api/agents/:id
  http.get('/api/agents/:id', async ({ params }) => {
    await delay(150)
    const agent = AGENTS.find((a) => a.id === params['id'])
    if (!agent) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Agent 不存在' }, { status: 404 })
    return HttpResponse.json({ data: agent })
  }),

  // POST /api/workspaces/:wsId/agents
  http.post('/api/workspaces/:wsId/agents', async ({ request, params }) => {
    await delay(300)
    const body = (await request.json()) as Record<string, unknown>
    const agent = makeAgent({ workspaceId: String(params['wsId']), ...body })
    AGENTS.push(agent)
    return HttpResponse.json({ data: agent }, { status: 201 })
  }),

  // PATCH /api/agents/:id
  http.patch('/api/agents/:id', async ({ request, params }) => {
    await delay(200)
    const idx = AGENTS.findIndex((a) => a.id === params['id'])
    if (idx === -1) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Agent 不存在' }, { status: 404 })
    const body = (await request.json()) as Record<string, unknown>
    const updated = { ...AGENTS[idx]!, ...body, updatedAt: new Date().toISOString() }
    AGENTS[idx] = updated
    return HttpResponse.json({ data: updated })
  }),
]
