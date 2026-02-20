# M4 W15: Knowledge Base Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full knowledge base management experience — list page with CRUD, detail page with document upload + search test panel — all backed by MSW mocks.

**Architecture:** Two pages under `ws/[wsSlug]/knowledge` (list) and `ws/[wsSlug]/knowledge/[kbId]` (detail). Extend `KnowledgeBase` type with `description` / `embeddingModel` / `updatedAt`; add new `KbDocument` and `SearchResult` types. Create dedicated `knowledge-base-api.ts`. React Query hooks in `use-knowledge-bases.ts`. Four new feature components: `knowledge-base-card`, `knowledge-base-create-modal`, `upload-zone`, `document-table`, `search-test-panel`. Re-use existing `Card`, `Modal`, `DataTable`, `Tabs`, `Input`, `Select`, `Button`, `Toast`, `EmptyState` UI primitives. All MSW handlers in extended `mocks/handlers/knowledge-bases.ts`.

**Tech Stack:** Next.js 15 App Router, TanStack Query v5, MSW v2, Tailwind CSS v4, Lucide icons. No new packages needed.

---

## File Map

```
新建 (9):
  apps/web/lib/api/knowledge-base-api.ts                          # Full CRUD + docs + search API
  apps/web/hooks/use-knowledge-bases.ts                           # React Query hooks (8 hooks)
  apps/web/components/features/knowledge/knowledge-base-card.tsx  # KB list card
  apps/web/components/features/knowledge/knowledge-base-create-modal.tsx  # Create/edit modal
  apps/web/components/features/knowledge/upload-zone.tsx          # Drag-and-drop upload area
  apps/web/components/features/knowledge/document-table.tsx       # Documents list with status
  apps/web/components/features/knowledge/search-test-panel.tsx   # Query test + results
  apps/web/app/(dashboard)/org/[slug]/ws/[wsSlug]/knowledge/[kbId]/page.tsx  # Detail page
  (no new pages — knowledge/page.tsx already exists as placeholder)

修改 (5):
  apps/web/types/api.ts                                           # Extend KnowledgeBase; add KbDocument, SearchResult
  apps/web/lib/api/index.ts                                       # Export knowledgeBaseApi
  apps/web/mocks/factories/knowledge-base.factory.ts              # Add document + search factories
  apps/web/mocks/handlers/knowledge-bases.ts                      # Add CRUD + docs + search endpoints
  apps/web/app/(dashboard)/org/[slug]/ws/[wsSlug]/knowledge/page.tsx  # Replace placeholder
```

## Dependency Graph

```
Task 1 (Types + API)
  ├→ Task 2 (Mocks)                 ──────────────────────────────┐
  ├→ Task 3 (Hooks)                 ───────────┐                  │
  ├→ Task 4 (KbCard + CreateModal)  ──────┐    ├→ Task 5 (List)  │
  └→ Task 6 (UploadZone + DocTable) ──────┼────┘                  │
                                          └→ Task 7 (Detail Page) ┘
                                                    ↓
                                          Task 8 (Build Verify)
```

Execution order: 1 → [2, 3, 4, 6] parallel → [5, 7] parallel → 8

---

## Task 1: Types + API Client

**Files:**

- Modify: `apps/web/types/api.ts` (append after `UsageFilters`)
- Create: `apps/web/lib/api/knowledge-base-api.ts`
- Modify: `apps/web/lib/api/index.ts`

### Step 1: Extend types in `api.ts`

Append after the `UsageFilters` interface (end of file):

```typescript
// ─── Knowledge Base ───────────────────────────────────────────────────────

export type EmbeddingModel =
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'embed-english-v3.0'

// Overwrite the minimal KnowledgeBase defined above (lines 148-154)
// The new interface is fully backwards-compatible (adds optional fields)
// Note: the existing interface at line 148 must be replaced with this one:
export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  workspaceId: string
  documentCount: number
  embeddingModel: EmbeddingModel
  createdAt: string
  updatedAt: string
}

export type DocumentStatus = 'pending' | 'processing' | 'indexed' | 'failed'

export interface KbDocument {
  id: string
  kbId: string
  name: string
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'csv'
  fileSize: number // bytes
  status: DocumentStatus
  chunkCount?: number
  uploadedAt: string
  processedAt?: string
  [key: string]: unknown // needed for DataTable constraint
}

export interface SearchResult {
  id: string
  documentId: string
  documentName: string
  content: string // chunk text
  score: number // 0–1 relevance score
  chunkIndex: number
}

export interface CreateKnowledgeBaseBody {
  name: string
  description?: string
  embeddingModel: EmbeddingModel
}

export interface UpdateKnowledgeBaseBody {
  name?: string
  description?: string
}
```

**Important:** The existing `KnowledgeBase` interface at line 148-154 of `api.ts` must be **replaced** (not appended) with the new one above. The new interface is a superset — all existing usages stay valid.

### Step 2: Create `lib/api/knowledge-base-api.ts`

```typescript
import { apiClient } from './client'
import type {
  ApiResponse,
  KnowledgeBase,
  CreateKnowledgeBaseBody,
  UpdateKnowledgeBaseBody,
  KbDocument,
  SearchResult,
} from '@/types/api'

export const knowledgeBaseApi = {
  // ─── Knowledge Bases ────────────────────────────────────────────────────
  list: (workspaceId: string) =>
    apiClient.get<ApiResponse<KnowledgeBase[]>>(`/workspaces/${workspaceId}/knowledge-bases`),

  create: (workspaceId: string, body: CreateKnowledgeBaseBody) =>
    apiClient.post<ApiResponse<KnowledgeBase>>(`/workspaces/${workspaceId}/knowledge-bases`, body),

  update: (kbId: string, body: UpdateKnowledgeBaseBody) =>
    apiClient.patch<ApiResponse<KnowledgeBase>>(`/knowledge-bases/${kbId}`, body),

  delete: (kbId: string) => apiClient.delete<ApiResponse<null>>(`/knowledge-bases/${kbId}`),

  // ─── Documents ──────────────────────────────────────────────────────────
  listDocuments: (kbId: string) =>
    apiClient.get<ApiResponse<KbDocument[]>>(`/knowledge-bases/${kbId}/documents`),

  uploadDocument: (kbId: string, formData: FormData) =>
    apiClient.post<ApiResponse<KbDocument>>(`/knowledge-bases/${kbId}/documents`, formData),

  deleteDocument: (kbId: string, docId: string) =>
    apiClient.delete<ApiResponse<null>>(`/knowledge-bases/${kbId}/documents/${docId}`),

  // ─── Search ─────────────────────────────────────────────────────────────
  search: (kbId: string, query: string, topK = 5) =>
    apiClient.post<ApiResponse<SearchResult[]>>(`/knowledge-bases/${kbId}/search`, { query, topK }),
}
```

### Step 3: Update `lib/api/index.ts`

Add after the last export line:

```typescript
export { knowledgeBaseApi } from './knowledge-base-api'
```

### Step 4: Verify

```bash
pnpm --filter web typecheck
```

Expected: no errors.

---

## Task 2: Mock Factories + MSW Handlers

**Files:**

- Modify: `apps/web/mocks/factories/knowledge-base.factory.ts`
- Modify: `apps/web/mocks/handlers/knowledge-bases.ts`

### Step 1: Rewrite `knowledge-base.factory.ts`

Replace the entire file with:

```typescript
import type {
  KnowledgeBase,
  KbDocument,
  DocumentStatus,
  EmbeddingModel,
  SearchResult,
} from '@/types/api'

let kbSeq = 1
let docSeq = 1
const now = () => new Date().toISOString()

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const KB_SEEDS: Array<{
  name: string
  description: string
  documentCount: number
  embeddingModel: EmbeddingModel
}> = [
  {
    name: '产品文档',
    description: '产品功能说明、用户手册和 FAQ',
    documentCount: 42,
    embeddingModel: 'text-embedding-3-small',
  },
  {
    name: '技术规范',
    description: '系统架构、接口规范和开发规范',
    documentCount: 18,
    embeddingModel: 'text-embedding-3-large',
  },
  {
    name: 'API 参考',
    description: 'REST API 接口文档和 SDK 使用指南',
    documentCount: 35,
    embeddingModel: 'text-embedding-3-small',
  },
  {
    name: '用户指南',
    description: '新手入门教程和最佳实践',
    documentCount: 27,
    embeddingModel: 'embed-english-v3.0',
  },
]

export function makeKnowledgeBase(overrides: Partial<KnowledgeBase> = {}): KnowledgeBase {
  const seed = KB_SEEDS[(kbSeq - 1) % KB_SEEDS.length]!
  return {
    id: `kb-${kbSeq++}`,
    name: seed.name,
    description: seed.description,
    workspaceId: 'ws-default',
    documentCount: seed.documentCount,
    embeddingModel: seed.embeddingModel,
    createdAt: daysAgo(rand(10, 60)),
    updatedAt: daysAgo(rand(0, 9)),
    ...overrides,
  }
}

export function makeKnowledgeBaseList(workspaceId: string): KnowledgeBase[] {
  return KB_SEEDS.map((seed) => makeKnowledgeBase({ ...seed, workspaceId }))
}

const DOC_NAMES = [
  '快速入门指南.pdf',
  '系统架构设计.docx',
  'API接口规范v2.md',
  '数据库设计方案.pdf',
  '前端开发规范.md',
  '测试用例说明.docx',
  '部署运维手册.pdf',
  '用户反馈汇总.csv',
  '性能优化报告.pdf',
  '安全审计记录.txt',
]

const DOC_STATUSES: DocumentStatus[] = [
  'indexed',
  'indexed',
  'indexed',
  'processing',
  'pending',
  'failed',
]

const FILE_TYPES = ['pdf', 'docx', 'md', 'txt', 'csv'] as const

export function makeKbDocument(kbId: string, overrides: Partial<KbDocument> = {}): KbDocument {
  const name = DOC_NAMES[(docSeq - 1) % DOC_NAMES.length]!
  const ext = name.split('.').pop() as KbDocument['fileType']
  const status = DOC_STATUSES[rand(0, DOC_STATUSES.length - 1)]!
  return {
    id: `doc-${docSeq++}`,
    kbId,
    name,
    fileType: ext ?? 'pdf',
    fileSize: rand(50_000, 5_000_000),
    status,
    ...(status === 'indexed' ? { chunkCount: rand(10, 200) } : {}),
    uploadedAt: daysAgo(rand(1, 30)),
    ...(status === 'indexed' || status === 'failed' ? { processedAt: daysAgo(rand(0, 1)) } : {}),
    ...overrides,
  }
}

export function makeKbDocumentList(kbId: string, count = 8): KbDocument[] {
  return Array.from({ length: count }, () => makeKbDocument(kbId))
}

const CHUNK_TEMPLATES = [
  '本系统采用微服务架构，各服务通过 REST API 进行通信。核心服务包括用户服务、Agent 服务、知识库服务和任务调度服务。',
  '用户认证采用 JWT Token 机制，AccessToken 有效期为 1 小时，RefreshToken 有效期为 7 天。Token 需存储在 HttpOnly Cookie 中以防止 XSS 攻击。',
  '知识库的向量检索基于 Milvus 实现，支持余弦相似度和内积两种距离度量方式。查询时默认返回相关性最高的 5 个文档片段。',
  'Agent 工作流采用有向无环图（DAG）进行任务编排。协调者 Agent 负责分析任务并分配给专业 Agent，各 Agent 完成后汇报结果。',
  '数据库采用 PostgreSQL 作为主存储，Redis 用于缓存热点数据。所有写操作通过事务保证一致性，读操作可路由到只读副本。',
]

export function makeSearchResults(query: string, count = 5): SearchResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `sr-${i + 1}`,
    documentId: `doc-${rand(1, 8)}`,
    documentName: DOC_NAMES[rand(0, DOC_NAMES.length - 1)]!,
    content: CHUNK_TEMPLATES[i % CHUNK_TEMPLATES.length]!,
    score: Number((1 - i * 0.12 - Math.random() * 0.05).toFixed(3)),
    chunkIndex: rand(0, 50),
  }))
}
```

### Step 2: Rewrite `mocks/handlers/knowledge-bases.ts`

Replace the entire file with:

```typescript
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
    const body = (await request.json()) as {
      name: string
      description?: string
      embeddingModel: string
    }
    const wsId = params.wsId as string
    const kb = makeKnowledgeBase({
      name: body.name,
      description: body.description,
      embeddingModel: body.embeddingModel as KnowledgeBase['embeddingModel'],
      workspaceId: wsId,
      documentCount: 0,
    })
    getKbs(wsId).unshift(kb)
    return HttpResponse.json({ data: kb }, { status: 201 })
  }),

  http.patch('/api/knowledge-bases/:kbId', async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as { name?: string; description?: string }
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
    await delay(800) // simulate upload time
    const kbId = params.kbId as string
    const doc = makeKbDocument(kbId, { status: 'processing' })
    getDocs(kbId).unshift(doc)
    // Simulate async processing: after 2s, mark as indexed
    setTimeout(() => {
      const arr = getDocs(kbId)
      const idx = arr.findIndex((d) => d.id === doc.id)
      if (idx !== -1) {
        arr[idx] = {
          ...arr[idx]!,
          status: 'indexed',
          chunkCount: 42,
          processedAt: new Date().toISOString(),
        }
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
    await delay(600) // simulate vector search latency
    const body = (await request.json()) as { query: string; topK?: number }
    const results = makeSearchResults(body.query, body.topK ?? 5)
    return HttpResponse.json({ data: results })
  }),
]
```

### Step 3: Verify

```bash
pnpm --filter web typecheck
```

Expected: no errors.

---

## Task 3: React Query Hooks

**File:** Create `apps/web/hooks/use-knowledge-bases.ts`

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { knowledgeBaseApi } from '@/lib/api/knowledge-base-api'
import type { CreateKnowledgeBaseBody, UpdateKnowledgeBaseBody, KnowledgeBase } from '@/types/api'

// ─── Knowledge Bases ────────────────────────────────────────────────────────

export function useKnowledgeBases(workspaceId: string) {
  return useQuery({
    queryKey: ['knowledge-bases', workspaceId],
    queryFn: () => knowledgeBaseApi.list(workspaceId).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useCreateKnowledgeBase(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateKnowledgeBaseBody) =>
      knowledgeBaseApi.create(workspaceId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-bases', workspaceId] })
    },
  })
}

export function useUpdateKnowledgeBase(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateKnowledgeBaseBody }) =>
      knowledgeBaseApi.update(id, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-bases', workspaceId] })
    },
  })
}

export function useDeleteKnowledgeBase(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (kbId: string) => knowledgeBaseApi.delete(kbId),
    onMutate: async (kbId) => {
      await qc.cancelQueries({ queryKey: ['knowledge-bases', workspaceId] })
      const previous = qc.getQueryData<KnowledgeBase[]>(['knowledge-bases', workspaceId])
      qc.setQueryData<KnowledgeBase[]>(['knowledge-bases', workspaceId], (old) =>
        old ? old.filter((kb) => kb.id !== kbId) : [],
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['knowledge-bases', workspaceId], ctx.previous)
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-bases', workspaceId] })
    },
  })
}

// ─── Documents ──────────────────────────────────────────────────────────────

export function useKbDocuments(kbId: string) {
  return useQuery({
    queryKey: ['kb-documents', kbId],
    queryFn: () => knowledgeBaseApi.listDocuments(kbId).then((r) => r.data),
    enabled: !!kbId,
    staleTime: 30_000,
    refetchInterval: (query) => {
      // Poll while any document is still processing
      const docs = query.state.data
      const hasProcessing = docs?.some((d) => d.status === 'pending' || d.status === 'processing')
      return hasProcessing ? 3_000 : false
    },
  })
}

export function useUploadDocument(kbId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return knowledgeBaseApi.uploadDocument(kbId, fd).then((r) => r.data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['kb-documents', kbId] })
    },
  })
}

export function useDeleteDocument(kbId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (docId: string) => knowledgeBaseApi.deleteDocument(kbId, docId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['kb-documents', kbId] })
    },
  })
}

// ─── Search ─────────────────────────────────────────────────────────────────

export function useSearchKb(kbId: string) {
  return useMutation({
    mutationFn: ({ query, topK }: { query: string; topK?: number }) =>
      knowledgeBaseApi.search(kbId, query, topK).then((r) => r.data),
  })
}
```

### Verify

```bash
pnpm --filter web typecheck
```

Expected: no errors.

---

## Task 4: KnowledgeBaseCard + CreateModal

**Files:**

- Create: `apps/web/components/features/knowledge/knowledge-base-card.tsx`
- Create: `apps/web/components/features/knowledge/knowledge-base-create-modal.tsx`

### Step 1: Create `knowledge-base-card.tsx`

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { BookOpen, FileText, MoreHorizontal, Pencil, Trash2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { KnowledgeBase } from '@/types/api'

interface KnowledgeBaseCardProps {
  kb: KnowledgeBase
  onEdit?: (kb: KnowledgeBase) => void
  onDelete?: (kb: KnowledgeBase) => void
  onClick?: (kb: KnowledgeBase) => void
}

const MODEL_LABELS: Record<string, string> = {
  'text-embedding-3-small': 'TE3 Small',
  'text-embedding-3-large': 'TE3 Large',
  'embed-english-v3.0': 'Cohere v3',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function KnowledgeBaseCard({ kb, onEdit, onDelete, onClick }: KnowledgeBaseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)]',
        'shadow-[var(--shadow-sm)] transition-shadow duration-[var(--duration-fast)] hover:shadow-[var(--shadow-md)]',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick ? () => onClick(kb) : undefined}
    >
      {/* Top color band */}
      <div className="h-1 bg-[var(--color-primary-400)]" />

      <div className="p-4">
        {/* Icon + Name row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
              <BookOpen className="h-5 w-5 text-[var(--color-primary-500)]" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {kb.name}
              </h3>
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]">
                {MODEL_LABELS[kb.embeddingModel] ?? kb.embeddingModel}
              </span>
            </div>
          </div>

          {/* Action menu */}
          {(onEdit || onDelete) && (
            <div ref={menuRef} className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen((v) => !v)
                }}
                className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 w-32 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] py-1 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEdit && (
                    <button
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); onEdit(kb) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      编辑
                    </button>
                  )}
                  {onDelete && (
                    <button
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); onDelete(kb) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--surface)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {kb.description && (
          <p className="mt-3 line-clamp-2 text-xs text-[var(--text-secondary)]">
            {kb.description}
          </p>
        )}

        {/* Footer: doc count + updated */}
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {kb.documentCount} 个文档
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(kb.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Create `knowledge-base-create-modal.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { KnowledgeBase, EmbeddingModel } from '@/types/api'

interface KnowledgeBaseCreateModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description?: string; embeddingModel: EmbeddingModel }) => void
  loading?: boolean
  /** Pass existing KB to enable edit mode */
  editing?: KnowledgeBase | null
}

const EMBEDDING_OPTIONS = [
  { value: 'text-embedding-3-small', label: 'OpenAI text-embedding-3-small（均衡）' },
  { value: 'text-embedding-3-large', label: 'OpenAI text-embedding-3-large（高精度）' },
  { value: 'embed-english-v3.0', label: 'Cohere embed-english-v3.0（英文优化）' },
]

export function KnowledgeBaseCreateModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  editing = null,
}: KnowledgeBaseCreateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [embeddingModel, setEmbeddingModel] = useState<EmbeddingModel>('text-embedding-3-small')
  const [nameError, setNameError] = useState('')

  const isEdit = !!editing

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setDescription(editing.description ?? '')
      setEmbeddingModel(editing.embeddingModel)
    } else {
      setName('')
      setDescription('')
      setEmbeddingModel('text-embedding-3-small')
    }
    setNameError('')
  }, [editing, open])

  function handleSubmit() {
    if (!name.trim()) {
      setNameError('名称不能为空')
      return
    }
    onSubmit({
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      embeddingModel,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? '编辑知识库' : '创建知识库'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEdit ? '保存' : '创建'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="名称"
          placeholder="例：产品文档、技术规范"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError('') }}
          error={nameError}
          fullWidth
        />
        <Input
          label="描述（可选）"
          placeholder="简要说明该知识库的内容和用途"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
        />
        {!isEdit && (
          <Select
            label="嵌入模型"
            options={EMBEDDING_OPTIONS}
            value={embeddingModel}
            onChange={(v) => setEmbeddingModel(v as EmbeddingModel)}
          />
        )}
        {!isEdit && (
          <p className="text-xs text-[var(--text-tertiary)]">
            嵌入模型创建后不可更改，请根据文档语言和精度要求选择。
          </p>
        )}
      </div>
    </Modal>
  )
}
```

### Verify

```bash
pnpm --filter web typecheck
```

Expected: no errors.

---

## Task 5: Knowledge Base List Page

**File:** Modify `apps/web/app/(dashboard)/org/[slug]/ws/[wsSlug]/knowledge/page.tsx`

Replace the entire file with:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Search, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { KnowledgeBaseCard } from '@/components/features/knowledge/knowledge-base-card'
import { KnowledgeBaseCreateModal } from '@/components/features/knowledge/knowledge-base-create-modal'
import { toast } from '@/components/ui/toast'
import {
  useKnowledgeBases,
  useCreateKnowledgeBase,
  useUpdateKnowledgeBase,
  useDeleteKnowledgeBase,
} from '@/hooks/use-knowledge-bases'
import type { KnowledgeBase, EmbeddingModel } from '@/types/api'

export default function KnowledgePage() {
  const { wsSlug, slug } = useParams<{ wsSlug: string; slug: string }>()
  const router = useRouter()

  const { data: kbs, isLoading } = useKnowledgeBases(wsSlug)
  const createKb = useCreateKnowledgeBase(wsSlug)
  const updateKb = useUpdateKnowledgeBase(wsSlug)
  const deleteKb = useDeleteKnowledgeBase(wsSlug)

  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null)
  const [deletingKb, setDeletingKb] = useState<KnowledgeBase | null>(null)

  const filtered = useMemo(() => {
    if (!kbs) return []
    if (!search) return kbs
    return kbs.filter((kb) => kb.name.toLowerCase().includes(search.toLowerCase()))
  }, [kbs, search])

  async function handleCreate(data: {
    name: string
    description?: string
    embeddingModel: EmbeddingModel
  }) {
    try {
      await createKb.mutateAsync(data)
      toast.success('知识库已创建')
      setCreateOpen(false)
    } catch {
      toast.error('创建失败，请重试')
    }
  }

  async function handleUpdate(data: {
    name: string
    description?: string
    embeddingModel: EmbeddingModel
  }) {
    if (!editingKb) return
    try {
      await updateKb.mutateAsync({ id: editingKb.id, body: { name: data.name, description: data.description } })
      toast.success('已保存')
      setEditingKb(null)
    } catch {
      toast.error('保存失败，请重试')
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingKb) return
    try {
      await deleteKb.mutateAsync(deletingKb.id)
      toast.success('知识库已删除')
      setDeletingKb(null)
    } catch {
      toast.error('删除失败，请重试')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">知识库</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">上传文档，为 Agent 提供领域知识</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          创建知识库
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="搜索知识库..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
        className="max-w-xs"
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={search ? '未找到匹配的知识库' : '还没有知识库'}
          description={search ? '尝试其他关键词' : '创建知识库，为 Agent 提供专业领域知识'}
          {...(!search
            ? {
                action: (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    创建知识库
                  </Button>
                ),
              }
            : {})}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((kb) => (
            <KnowledgeBaseCard
              key={kb.id}
              kb={kb}
              onEdit={(k) => setEditingKb(k)}
              onDelete={(k) => setDeletingKb(k)}
              onClick={(k) =>
                router.push(`/org/${slug}/ws/${wsSlug}/knowledge/${k.id}`)
              }
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <KnowledgeBaseCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        loading={createKb.isPending}
      />

      {/* Edit Modal */}
      <KnowledgeBaseCreateModal
        open={!!editingKb}
        onClose={() => setEditingKb(null)}
        onSubmit={handleUpdate}
        loading={updateKb.isPending}
        {...(editingKb ? { editing: editingKb } : {})}
      />

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deletingKb}
        onClose={() => setDeletingKb(null)}
        title="删除知识库"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletingKb(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleteKb.isPending}
            >
              删除
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          确定要删除知识库 <strong>{deletingKb?.name}</strong> 吗？
          该知识库下的所有文档将被永久删除，此操作不可撤销。
        </p>
      </Modal>
    </div>
  )
}
```

### Verify

```bash
pnpm --filter web typecheck
```

Expected: no errors.

---

## Task 6: UploadZone + DocumentTable

**Files:**

- Create: `apps/web/components/features/knowledge/upload-zone.tsx`
- Create: `apps/web/components/features/knowledge/document-table.tsx`

### Step 1: Create `upload-zone.tsx`

```typescript
'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>
  loading?: boolean
}

const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'text/csv']
const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.md,.csv'
const MAX_FILE_SIZE_MB = 50

interface FileItem {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  errorMsg?: string
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`
  return `${bytes} B`
}

export function UploadZone({ onUpload, loading }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [queue, setQueue] = useState<FileItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.split(',').some((ext) => file.name.endsWith(ext.slice(1)))) {
      return `不支持的文件类型，请上传 PDF/DOCX/TXT/MD/CSV`
    }
    if (file.size > MAX_FILE_SIZE_MB * 1_048_576) {
      return `文件大小超过 ${MAX_FILE_SIZE_MB}MB 限制`
    }
    return null
  }

  function addFiles(files: File[]) {
    const items: FileItem[] = files.map((file) => {
      const err = validateFile(file)
      return { file, status: err ? 'error' : 'pending', ...(err ? { errorMsg: err } : {}) }
    })
    setQueue((q) => [...q, ...items])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handleUpload = useCallback(async () => {
    const pending = queue.filter((item) => item.status === 'pending')
    if (!pending.length) return

    setQueue((q) =>
      q.map((item) => (item.status === 'pending' ? { ...item, status: 'uploading' } : item)),
    )

    for (const item of pending) {
      try {
        await onUpload([item.file])
        setQueue((q) =>
          q.map((i) => (i.file === item.file ? { ...i, status: 'done' } : i)),
        )
      } catch {
        setQueue((q) =>
          q.map((i) =>
            i.file === item.file ? { ...i, status: 'error', errorMsg: '上传失败，请重试' } : i,
          ),
        )
      }
    }
  }, [queue, onUpload])

  function removeItem(file: File) {
    setQueue((q) => q.filter((i) => i.file !== file))
  }

  const hasPending = queue.some((i) => i.status === 'pending')

  const StatusIcon = ({ status }: { status: FileItem['status'] }) => {
    if (status === 'uploading') return <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary-400)]" />
    if (status === 'done') return <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-[var(--color-danger)]" />
    return <File className="h-4 w-4 text-[var(--text-tertiary)]" />
  }

  return (
    <div className="space-y-3">
      {/* Drop area */}
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed p-8 text-center transition-colors duration-[var(--duration-fast)]',
          dragging
            ? 'border-[var(--color-primary-400)] bg-[var(--color-primary-50)]'
            : 'border-[var(--border)] hover:border-[var(--color-primary-300)] hover:bg-[var(--surface)]',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-[var(--text-tertiary)]" />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">拖拽文件至此处，或点击选择</p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            支持 PDF、DOCX、TXT、MD、CSV，单文件最大 {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* File queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            >
              <StatusIcon status={item.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--text-primary)]">{item.file.name}</p>
                {item.errorMsg ? (
                  <p className="text-xs text-[var(--color-danger)]">{item.errorMsg}</p>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)]">{formatFileSize(item.file.size)}</p>
                )}
              </div>
              {item.status === 'pending' && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.file) }}
                  className="text-[var(--text-tertiary)] hover:text-[var(--color-danger)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {hasPending && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleUpload} loading={loading}>
                上传 {queue.filter((i) => i.status === 'pending').length} 个文件
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### Step 2: Create `document-table.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Trash2, FileText, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { KbDocument, DocumentStatus } from '@/types/api'

interface DocumentTableProps {
  documents: KbDocument[]
  loading?: boolean
  onDelete?: (docId: string) => void
  deleting?: boolean
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: '等待处理', icon: Clock, className: 'text-[var(--text-tertiary)]' },
  processing: { label: '处理中', icon: Loader2, className: 'text-[var(--color-primary-400)]' },
  indexed: { label: '已索引', icon: CheckCircle, className: 'text-[var(--color-success)]' },
  failed: { label: '处理失败', icon: AlertCircle, className: 'text-[var(--color-danger)]' },
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-red-50 text-red-600',
  docx: 'bg-blue-50 text-blue-600',
  txt: 'bg-gray-50 text-gray-600',
  md: 'bg-purple-50 text-purple-600',
  csv: 'bg-green-50 text-green-600',
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`
  return `${bytes} B`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function DocumentTable({ documents, loading, onDelete, deleting }: DocumentTableProps) {
  const [deletingDoc, setDeletingDoc] = useState<KbDocument | null>(null)

  async function handleDeleteConfirm() {
    if (!deletingDoc || !onDelete) return
    onDelete(deletingDoc.id)
    setDeletingDoc(null)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]"
          />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[var(--text-tertiary)]">
        暂无文档，请上传文件
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface)]">
            <tr>
              <th className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">文件名</th>
              <th className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)] w-16">类型</th>
              <th className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)] w-24">大小</th>
              <th className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)] w-28">状态</th>
              <th className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)] w-20">分块数</th>
              <th className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)] w-28">上传时间</th>
              <th className="border-b border-[var(--border)] px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const statusCfg = STATUS_CONFIG[doc.status]
              const StatusIcon = statusCfg.icon
              return (
                <tr
                  key={doc.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                      <span className="truncate max-w-xs text-[var(--text-primary)]">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium uppercase', FILE_TYPE_COLORS[doc.fileType] ?? 'bg-gray-50 text-gray-600')}>
                      {doc.fileType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{formatFileSize(doc.fileSize)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('flex items-center gap-1.5', statusCfg.className)}>
                      <StatusIcon className={cn('h-3.5 w-3.5', doc.status === 'processing' && 'animate-spin')} />
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {doc.chunkCount != null ? doc.chunkCount : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(doc.uploadedAt)}</td>
                  <td className="px-4 py-3">
                    {onDelete && (
                      <button
                        onClick={() => setDeletingDoc(doc)}
                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--color-danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        title="删除文档"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletingDoc(null)}>取消</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting}>删除</Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          确定要删除文档 <strong>{deletingDoc?.name}</strong> 吗？此操作不可撤销。
        </p>
      </Modal>
    </>
  )
}
```

### Verify

```bash
pnpm --filter web typecheck
```

Expected: no errors.

---

## Task 7: SearchTestPanel + Detail Page

**Files:**

- Create: `apps/web/components/features/knowledge/search-test-panel.tsx`
- Create: `apps/web/app/(dashboard)/org/[slug]/ws/[wsSlug]/knowledge/[kbId]/page.tsx`

### Step 1: Create `search-test-panel.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSearchKb } from '@/hooks/use-knowledge-bases'
import type { SearchResult } from '@/types/api'

interface SearchTestPanelProps {
  kbId: string
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score >= 0.8 ? 'var(--color-success)' : score >= 0.6 ? 'var(--color-warning)' : 'var(--text-tertiary)'
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {pct}%
    </span>
  )
}

function ResultCard({ result }: { result: SearchResult }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ScoreBadge score={result.score} />
            <span className="truncate text-xs text-[var(--text-tertiary)]">
              {result.documentName} · 第 {result.chunkIndex + 1} 块
            </span>
          </div>
          <p className={expanded ? 'mt-2 text-sm text-[var(--text-primary)]' : 'mt-2 line-clamp-2 text-sm text-[var(--text-primary)]'}>
            {result.content}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export function SearchTestPanel({ kbId }: SearchTestPanelProps) {
  const [query, setQuery] = useState('')
  const search = useSearchKb(kbId)

  function handleSearch() {
    if (!query.trim()) return
    search.mutate({ query: query.trim(), topK: 5 })
  }

  return (
    <Card
      header={<h3 className="text-base font-semibold text-[var(--text-primary)]">搜索测试</h3>}
      padding="md"
    >
      <div className="space-y-4">
        {/* Query input */}
        <div className="flex gap-2">
          <Input
            placeholder="输入查询语句，测试知识库检索效果..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            leftIcon={<Search className="h-4 w-4" />}
            fullWidth
          />
          <Button onClick={handleSearch} loading={search.isPending} className="shrink-0">
            检索
          </Button>
        </div>

        {/* Results */}
        {search.data && search.data.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-tertiary)]">
              找到 {search.data.length} 个相关片段
            </p>
            {search.data.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        )}

        {search.data && search.data.length === 0 && (
          <p className="text-center text-sm text-[var(--text-tertiary)]">未找到相关内容</p>
        )}
      </div>
    </Card>
  )
}
```

### Step 2: Create detail page `knowledge/[kbId]/page.tsx`

First create the directory, then create the file:

**File path:** `apps/web/app/(dashboard)/org/[slug]/ws/[wsSlug]/knowledge/[kbId]/page.tsx`

```typescript
'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { useState } from 'react'
import { UploadZone } from '@/components/features/knowledge/upload-zone'
import { DocumentTable } from '@/components/features/knowledge/document-table'
import { SearchTestPanel } from '@/components/features/knowledge/search-test-panel'
import { toast } from '@/components/ui/toast'
import {
  useKnowledgeBases,
  useKbDocuments,
  useUploadDocument,
  useDeleteDocument,
} from '@/hooks/use-knowledge-bases'

const TABS = [
  { key: 'documents', label: '文档管理', icon: <FileText className="h-4 w-4" /> },
  { key: 'search', label: '搜索测试', icon: <BookOpen className="h-4 w-4" /> },
]

export default function KnowledgeDetailPage() {
  const { wsSlug, slug, kbId } = useParams<{ wsSlug: string; slug: string; kbId: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('documents')

  const { data: kbs } = useKnowledgeBases(wsSlug)
  const kb = kbs?.find((k) => k.id === kbId)

  const { data: documents, isLoading: docsLoading } = useKbDocuments(kbId)
  const uploadDoc = useUploadDocument(kbId)
  const deleteDoc = useDeleteDocument(kbId)

  async function handleUpload(files: File[]) {
    for (const file of files) {
      try {
        await uploadDoc.mutateAsync(file)
        toast.success(`${file.name} 已开始处理`)
      } catch {
        toast.error(`${file.name} 上传失败`)
      }
    }
  }

  async function handleDeleteDoc(docId: string) {
    try {
      await deleteDoc.mutateAsync(docId)
      toast.success('文档已删除')
    } catch {
      toast.error('删除失败，请重试')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push(`/org/${slug}/ws/${wsSlug}/knowledge`)}
          className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回知识库列表
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
            <BookOpen className="h-5 w-5 text-[var(--color-primary-500)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {kb?.name ?? kbId}
            </h1>
            {kb?.description && (
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{kb.description}</p>
            )}
            {kb && (
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                {kb.documentCount} 个文档 · {kb.embeddingModel}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <UploadZone onUpload={handleUpload} loading={uploadDoc.isPending} />
          <DocumentTable
            documents={documents ?? []}
            {...(docsLoading ? { loading: true } : {})}
            onDelete={handleDeleteDoc}
            deleting={deleteDoc.isPending}
          />
        </div>
      )}

      {activeTab === 'search' && <SearchTestPanel kbId={kbId} />}
    </div>
  )
}
```

### Verify

```bash
pnpm --filter web typecheck
```

Expected: no errors.

---

## Task 8: Full Build Verify

```bash
pnpm --filter web build 2>&1 | grep -E "knowledge|error|Error"
```

Expected:

```
├ ƒ /org/[slug]/ws/[wsSlug]/knowledge            X.XX kB      XXX kB
├ ƒ /org/[slug]/ws/[wsSlug]/knowledge/[kbId]     X.XX kB      XXX kB
```

No TypeScript errors, no build errors.

---

## Verification Checklist

After implementation, manually verify in dev server:

1. `/org/acme/ws/default/knowledge`
   - [ ] Shows 4 KB cards (产品文档/技术规范/API参考/用户指南)
   - [ ] Each card: name, model badge, doc count, last updated
   - [ ] Search filters cards correctly
   - [ ] "创建知识库" button opens modal with name/description/model fields
   - [ ] Create form validation: empty name shows error
   - [ ] Creating KB adds card to grid
   - [ ] Hover card shows ⋯ menu; edit opens modal pre-filled; delete shows confirm
   - [ ] Clicking card navigates to detail page
   - [ ] Empty state shows when search finds nothing

2. `/org/acme/ws/default/knowledge/kb-1`
   - [ ] Back button returns to list
   - [ ] KB name, description, model shown in header
   - [ ] Documents tab: table with 8 docs, status icons (indexed/processing/pending/failed)
   - [ ] Upload zone: drag-and-drop or click to select files
   - [ ] File validation: wrong types show error in queue
   - [ ] "上传 N 个文件" button uploads files
   - [ ] Uploaded doc appears with "处理中" status → transitions to "已索引" after 2s
   - [ ] Delete doc row shows confirm modal
   - [ ] Search tab: type query + Enter or click 检索
   - [ ] Results show score badge (green/yellow/gray), document name, chunk content
   - [ ] Click chevron to expand/collapse result content

3. Breadcrumb
   - [ ] `知识库` shows correctly when on list page
   - [ ] `知识库 > kb-1` shows on detail page
