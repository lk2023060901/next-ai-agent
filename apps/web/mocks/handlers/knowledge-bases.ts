import { http, HttpResponse, delay } from 'msw'
import {
  makeKnowledgeBaseList,
  makeKnowledgeBase,
  makeKbDocumentList,
  makeKbDocument,
  makeSearchResults,
} from '../factories/knowledge-base.factory'
import type { KnowledgeBase, KbDocument } from '@/types/api'

// In-memory store for mutations
const KB_STORE: Record<string, KnowledgeBase[]> = {}
const DOC_STORE: Record<string, KbDocument[]> = {}

function getKbs(wsId: string): KnowledgeBase[] {
  if (!KB_STORE[wsId]) {
    KB_STORE[wsId] = makeKnowledgeBaseList(wsId)
  }
  return KB_STORE[wsId]!
}

function getDocs(kbId: string): KbDocument[] {
  if (!DOC_STORE[kbId]) {
    DOC_STORE[kbId] = makeKbDocumentList(kbId)
  }
  return DOC_STORE[kbId]!
}

export const knowledgeBaseHandlers = [
  // ─── Knowledge Bases ────────────────────────────────────────────────────

  http.get('/api/workspaces/:wsId/knowledge-bases', async ({ params }) => {
    await delay(200)
    const kbs = getKbs(params.wsId as string)
    return HttpResponse.json({ data: kbs })
  }),

  http.post('/api/workspaces/:wsId/knowledge-bases', async ({ params, request }) => {
    await delay(400)
    const body = await request.json() as { name: string; description?: string; embeddingModel: string }
    const wsId = params.wsId as string
    const kb = makeKnowledgeBase({
      name: body.name,
      ...(body.description ? { description: body.description } : {}),
      embeddingModel: body.embeddingModel as KnowledgeBase['embeddingModel'],
      workspaceId: wsId,
      documentCount: 0,
    })
    getKbs(wsId).unshift(kb)
    return HttpResponse.json({ data: kb }, { status: 201 })
  }),

  http.patch('/api/knowledge-bases/:kbId', async ({ params, request }) => {
    await delay(300)
    const body = await request.json() as { name?: string; description?: string }
    const kbId = params.kbId as string
    let updated: KnowledgeBase | undefined
    for (const wsId of Object.keys(KB_STORE)) {
      const arr = KB_STORE[wsId]!
      const idx = arr.findIndex((kb) => kb.id === kbId)
      if (idx !== -1) {
        arr[idx] = { ...arr[idx]!, ...body, updatedAt: new Date().toISOString() }
        updated = arr[idx]
        break
      }
    }
    if (!updated) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ data: updated })
  }),

  http.delete('/api/knowledge-bases/:kbId', async ({ params }) => {
    await delay(300)
    const kbId = params.kbId as string
    for (const wsId of Object.keys(KB_STORE)) {
      const arr = KB_STORE[wsId]!
      const idx = arr.findIndex((kb) => kb.id === kbId)
      if (idx !== -1) {
        arr.splice(idx, 1)
        delete DOC_STORE[kbId]
        break
      }
    }
    return HttpResponse.json({ data: null })
  }),

  // ─── Documents ──────────────────────────────────────────────────────────

  http.get('/api/knowledge-bases/:kbId/documents', async ({ params }) => {
    await delay(250)
    const docs = getDocs(params.kbId as string)
    return HttpResponse.json({ data: docs })
  }),

  http.post('/api/knowledge-bases/:kbId/documents', async ({ params }) => {
    await delay(800)
    const kbId = params.kbId as string
    const doc = makeKbDocument(kbId, { status: 'processing' })
    getDocs(kbId).unshift(doc)
    // Simulate async processing: after 2s, mark as indexed
    setTimeout(() => {
      const arr = getDocs(kbId)
      const idx = arr.findIndex((d) => d.id === doc.id)
      if (idx !== -1) {
        arr[idx] = { ...arr[idx]!, status: 'indexed', chunkCount: 42, processedAt: new Date().toISOString() }
      }
    }, 2000)
    return HttpResponse.json({ data: doc }, { status: 201 })
  }),

  http.delete('/api/knowledge-bases/:kbId/documents/:docId', async ({ params }) => {
    await delay(300)
    const { kbId, docId } = params as { kbId: string; docId: string }
    const arr = getDocs(kbId)
    const idx = arr.findIndex((d) => d.id === docId)
    if (idx !== -1) arr.splice(idx, 1)
    return HttpResponse.json({ data: null })
  }),

  // ─── Search ─────────────────────────────────────────────────────────────

  http.post('/api/knowledge-bases/:kbId/search', async ({ request }) => {
    await delay(600)
    const body = await request.json() as { query: string; topK?: number }
    const results = makeSearchResults(body.query, body.topK ?? 5)
    return HttpResponse.json({ data: results })
  }),
]
