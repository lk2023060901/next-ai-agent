import { http, HttpResponse, delay } from 'msw'
import { makeKnowledgeBaseList } from '../factories/knowledge-base.factory'

const KNOWLEDGE_BASES = makeKnowledgeBaseList('ws-default')

export const knowledgeBaseHandlers = [
  // GET /api/workspaces/:wsId/knowledge-bases
  http.get('/api/workspaces/:wsId/knowledge-bases', async () => {
    await delay(200)
    return HttpResponse.json({ data: KNOWLEDGE_BASES })
  }),
]
