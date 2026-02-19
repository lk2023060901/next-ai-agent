import { http, HttpResponse, delay } from 'msw'
import { makeToolRegistry } from '../factories/tool.factory'
import type { AgentRole } from '@/types/api'

const TOOLS = makeToolRegistry()

// Tool auth matrix: role -> tool category -> enabled
const TOOL_AUTH: Record<string, Record<string, boolean>> = {}

const ALL_ROLES: AgentRole[] = [
  'coordinator',
  'requirements',
  'architecture',
  'frontend',
  'backend',
  'testing',
  'devops',
  'review',
]
const categories = Array.from(new Set(TOOLS.map((t) => t.category)))

// Seed default auth: all roles can use all categories
for (const role of ALL_ROLES) {
  TOOL_AUTH[role] = {}
  for (const cat of categories) {
    TOOL_AUTH[role]![cat] = true
  }
}

export const toolHandlers = [
  // GET /api/workspaces/:wsId/tools
  http.get('/api/workspaces/:wsId/tools', async () => {
    await delay(200)
    return HttpResponse.json({ data: TOOLS })
  }),

  // GET /api/workspaces/:wsId/tool-auth
  http.get('/api/workspaces/:wsId/tool-auth', async () => {
    await delay(150)
    return HttpResponse.json({ data: TOOL_AUTH })
  }),

  // POST /api/workspaces/:wsId/tool-auth
  http.post('/api/workspaces/:wsId/tool-auth', async ({ request }) => {
    await delay(200)
    const body = (await request.json()) as Record<string, Record<string, boolean>>
    for (const [role, cats] of Object.entries(body)) {
      if (!TOOL_AUTH[role]) TOOL_AUTH[role] = {}
      for (const [cat, enabled] of Object.entries(cats)) {
        TOOL_AUTH[role]![cat] = enabled
      }
    }
    return HttpResponse.json({ data: TOOL_AUTH })
  }),
]
