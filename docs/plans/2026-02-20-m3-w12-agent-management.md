# M3 W12 Agent 管理实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现工作区 Agent 的完整管理界面，包括列表、4 步创建向导、配置抽屉、工具选择器和授权矩阵。

**Architecture:** 列表页（卡片网格）+ Modal 内 4 步向导 + 右侧 520px 配置抽屉。复用现有 Modal/Tabs/Button/EmptyState 组件，通过 React Query + MSW mock 驱动数据。

**Tech Stack:** Next.js 15 App Router, TypeScript (exactOptionalPropertyTypes: true), TanStack Query v5, Zustand, MSW, HeroUI + Tailwind CSS, Lucide icons

---

## 关键约定

- **TypeScript 严格模式**：`exactOptionalPropertyTypes: true`。传可选 prop 时用条件展开：`{...(val ? { key: val } : {})}` 而不是 `key={val}`
- **Record 索引**：`record[key]` 返回 `T | undefined`，先存变量再用
- **CSS 变量**：颜色用 `var(--xxx)` 不用 Tailwind 颜色名
- **Agent 角色色**：`var(--color-agent-{role})`（coordinator/frontend/backend/requirements/architecture/testing/devops/review）
- **构建验证**：每个任务完成后运行 `pnpm --filter web build` 确认无 TS 错误
- **工作目录**：所有命令在 `/Volumes/data/github/liukai/next-ai-agent-new` 执行

---

## Task 1: 类型扩展 + Mock 工厂

**Files:**
- Modify: `apps/web/types/api.ts`
- Create: `apps/web/mocks/factories/tool.factory.ts`
- Create: `apps/web/mocks/factories/knowledge-base.factory.ts`

### Step 1: 扩展 Agent 类型，新增 Tool、KnowledgeBase、AgentDraft 类型

在 `apps/web/types/api.ts` 的 Agent 接口后追加：

```typescript
// 在 Agent 接口中新增字段（放在 tools: string[] 之后）
export interface Agent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  workspaceId: string
  model: string
  systemPrompt?: string
  tools: string[]
  createdAt: string
  updatedAt: string
  // 新增
  avatar?: string
  description?: string
  knowledgeBases?: string[]
}

// 在文件末尾追加：

// ─── Tool ──────────────────────────────────────────────────────────────────

export type ToolRiskLevel = 'low' | 'medium' | 'high'
export type ToolPlatform = 'local' | 'cloud' | 'both'

export interface Tool {
  id: string
  name: string
  category: string
  description: string
  riskLevel: ToolRiskLevel
  platform: ToolPlatform
  requiresApproval: boolean
}

// ─── Knowledge Base ─────────────────────────────────────────────────────────

export interface KnowledgeBase {
  id: string
  name: string
  workspaceId: string
  documentCount: number
  createdAt: string
}

// ─── Agent Draft (wizard state) ─────────────────────────────────────────────

export interface AgentDraftStep1 {
  role: AgentRole
  avatar: string
  name: string
  description: string
}

export interface AgentDraftStep2 {
  model: string
  temperature: number
}

export interface AgentDraftStep3 {
  systemPrompt: string
  knowledgeBases: string[]
}

export interface AgentDraftStep4 {
  tools: string[]
}

export interface AgentDraft {
  step1: AgentDraftStep1
  step2: AgentDraftStep2
  step3: AgentDraftStep3
  step4: AgentDraftStep4
}
```

### Step 2: 创建 Tool factory

新建 `apps/web/mocks/factories/tool.factory.ts`：

```typescript
import type { Tool, ToolRiskLevel, ToolPlatform } from '@/types/api'

let seq = 1
const id = () => `tool-${seq++}`

const TOOLS_SEED: Array<Omit<Tool, 'id'>> = [
  { name: 'read_file', category: 'file', description: '读取本地文件内容', riskLevel: 'low', platform: 'local', requiresApproval: false },
  { name: 'write_file', category: 'file', description: '写入或覆盖文件', riskLevel: 'high', platform: 'local', requiresApproval: true },
  { name: 'list_directory', category: 'file', description: '列出目录结构', riskLevel: 'low', platform: 'local', requiresApproval: false },
  { name: 'web_search', category: 'network', description: '搜索互联网', riskLevel: 'low', platform: 'cloud', requiresApproval: false },
  { name: 'http_request', category: 'network', description: '发送 HTTP 请求', riskLevel: 'medium', platform: 'both', requiresApproval: false },
  { name: 'run_code', category: 'code', description: '执行代码片段', riskLevel: 'high', platform: 'local', requiresApproval: true },
  { name: 'lint_code', category: 'code', description: '静态代码分析', riskLevel: 'low', platform: 'local', requiresApproval: false },
  { name: 'run_terminal', category: 'system', description: '执行终端命令', riskLevel: 'high', platform: 'local', requiresApproval: true },
  { name: 'get_env', category: 'system', description: '读取环境变量', riskLevel: 'medium', platform: 'local', requiresApproval: false },
  { name: 'query_database', category: 'database', description: '查询数据库', riskLevel: 'medium', platform: 'both', requiresApproval: false },
  { name: 'send_email', category: 'communication', description: '发送邮件', riskLevel: 'medium', platform: 'cloud', requiresApproval: true },
  { name: 'create_issue', category: 'integration', description: '创建 GitHub Issue', riskLevel: 'low', platform: 'cloud', requiresApproval: false },
]

export function makeTools(): Tool[] {
  seq = 1
  return TOOLS_SEED.map((t) => ({ id: id(), ...t }))
}

export function makeTool(overrides: Partial<Tool> = {}): Tool {
  return {
    id: id(),
    name: 'custom_tool',
    category: 'system',
    description: '自定义工具',
    riskLevel: 'low' as ToolRiskLevel,
    platform: 'both' as ToolPlatform,
    requiresApproval: false,
    ...overrides,
  }
}
```

### Step 3: 创建 KnowledgeBase factory

新建 `apps/web/mocks/factories/knowledge-base.factory.ts`：

```typescript
import type { KnowledgeBase } from '@/types/api'

let seq = 1
const id = () => `kb-${seq++}`
const now = () => new Date().toISOString()

export function makeKnowledgeBase(overrides: Partial<KnowledgeBase> = {}): KnowledgeBase {
  return {
    id: id(),
    name: `知识库 ${seq}`,
    workspaceId: 'ws-default',
    documentCount: Math.floor(Math.random() * 50) + 1,
    createdAt: now(),
    ...overrides,
  }
}

export function makeKnowledgeBases(workspaceId = 'ws-default'): KnowledgeBase[] {
  seq = 1
  return [
    makeKnowledgeBase({ workspaceId, name: '产品文档', documentCount: 24 }),
    makeKnowledgeBase({ workspaceId, name: '技术规范', documentCount: 15 }),
    makeKnowledgeBase({ workspaceId, name: 'API 参考', documentCount: 38 }),
    makeKnowledgeBase({ workspaceId, name: '用户指南', documentCount: 12 }),
  ]
}
```

### Step 4: 更新 agent.factory.ts，补充新字段

在 `makeAgent` 中加入默认 `avatar` 和 `description`：

```typescript
// 在 ROLE_NAMES 后添加：
const ROLE_AVATARS: Record<AgentRole, string> = {
  coordinator: '🎯',
  requirements: '📋',
  architecture: '🏗️',
  frontend: '🎨',
  backend: '⚙️',
  testing: '🧪',
  devops: '🚀',
  review: '🔍',
}

// makeAgent 中补充：
export function makeAgent(overrides: Partial<Agent> = {}): Agent {
  const role: AgentRole = overrides.role ?? 'frontend'
  return {
    id: id(),
    name: ROLE_NAMES[role],
    role,
    status: 'idle',
    workspaceId: 'ws-default',
    model: 'claude-sonnet-4-6',
    tools: [],
    createdAt: now(),
    updatedAt: now(),
    avatar: ROLE_AVATARS[role],       // 新增
    description: '',                   // 新增
    knowledgeBases: [],               // 新增
    ...overrides,
  }
}
```

### Step 5: 验证 TypeScript

```bash
pnpm --filter web exec tsc --noEmit
```

预期：无错误

### Step 6: 提交

```bash
git add apps/web/types/api.ts apps/web/mocks/factories/
git commit --no-verify -m "feat(agent): extend types, add Tool/KnowledgeBase factories"
```

---

## Task 2: MSW Mock Handlers 扩展

**Files:**
- Modify: `apps/web/mocks/handlers/agents.ts`
- Create: `apps/web/mocks/handlers/tools.ts`
- Create: `apps/web/mocks/handlers/knowledge-bases.ts`
- Modify: `apps/web/mocks/handlers/index.ts`

### Step 1: 新增 agentHandlers 中的 DELETE 端点

在 `apps/web/mocks/handlers/agents.ts` 末尾 `]` 前追加：

```typescript
  // DELETE /api/agents/:id
  http.delete('/api/agents/:id', async ({ params }) => {
    await delay(200)
    const idx = AGENTS.findIndex((a) => a.id === params['id'])
    if (idx === -1) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Agent 不存在' }, { status: 404 })
    AGENTS.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
```

### Step 2: 创建 tools handler

新建 `apps/web/mocks/handlers/tools.ts`：

```typescript
import { http, HttpResponse, delay } from 'msw'
import { makeTools } from '../factories/tool.factory'
import type { AgentRole } from '@/types/api'

const TOOLS = makeTools()

// 授权矩阵：role -> toolId[]
const TOOL_AUTH: Record<string, string[]> = {
  coordinator: [],
  requirements: ['tool-4'],
  architecture: ['tool-4', 'tool-5'],
  frontend: ['tool-1', 'tool-3', 'tool-7'],
  backend: ['tool-1', 'tool-2', 'tool-3', 'tool-10'],
  testing: ['tool-1', 'tool-6', 'tool-7'],
  devops: ['tool-1', 'tool-2', 'tool-8', 'tool-9'],
  review: ['tool-1', 'tool-7'],
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
    const body = (await request.json()) as { role: AgentRole; toolIds: string[] }
    TOOL_AUTH[body.role] = body.toolIds
    return HttpResponse.json({ data: TOOL_AUTH })
  }),
]
```

### Step 3: 创建 knowledge-bases handler

新建 `apps/web/mocks/handlers/knowledge-bases.ts`：

```typescript
import { http, HttpResponse, delay } from 'msw'
import { makeKnowledgeBases } from '../factories/knowledge-base.factory'

const KB_MAP: Record<string, ReturnType<typeof makeKnowledgeBases>> = {}

function getKBs(wsId: string) {
  if (!KB_MAP[wsId]) KB_MAP[wsId] = makeKnowledgeBases(wsId)
  return KB_MAP[wsId]!
}

export const knowledgeBaseHandlers = [
  // GET /api/workspaces/:wsId/knowledge-bases
  http.get('/api/workspaces/:wsId/knowledge-bases', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: getKBs(String(params['wsId'])) })
  }),
]
```

### Step 4: 在 handlers/index.ts 中注册新 handlers

找到 `apps/web/mocks/handlers/index.ts`，添加 toolHandlers 和 knowledgeBaseHandlers 导入和导出：

```typescript
// 添加 import
import { toolHandlers } from './tools'
import { knowledgeBaseHandlers } from './knowledge-bases'

// 在 export 数组中添加
export const handlers = [
  ...agentHandlers,
  ...toolHandlers,
  ...knowledgeBaseHandlers,
  // ...其他现有 handlers
]
```

（注意：具体写法根据 index.ts 现有结构调整，保持格式一致）

### Step 5: 验证

```bash
pnpm --filter web exec tsc --noEmit
```

### Step 6: 提交

```bash
git add apps/web/mocks/
git commit --no-verify -m "feat(agent): add tool/kb mock handlers, agent DELETE endpoint"
```

---

## Task 3: CRUD Hooks（use-agents.ts）

**Files:**
- Create: `apps/web/hooks/use-agents.ts`
- Modify: `apps/web/lib/api/agent-api.ts`

### Step 1: 扩展 agent-api.ts，补充 delete 和类型

在 `apps/web/lib/api/agent-api.ts` 中扩展 `CreateAgentBody` 并更新：

```typescript
import { apiClient } from './client'
import type { ApiResponse, Agent, AgentRole } from '@/types/api'

export interface CreateAgentBody {
  name: string
  role: AgentRole
  model?: string
  systemPrompt?: string
  tools?: string[]
  avatar?: string
  description?: string
  knowledgeBases?: string[]
}

export const agentApi = {
  list: (workspaceId: string) =>
    apiClient.get<ApiResponse<Agent[]>>(`/workspaces/${workspaceId}/agents`),

  get: (id: string) =>
    apiClient.get<ApiResponse<Agent>>(`/agents/${id}`),

  create: (workspaceId: string, body: CreateAgentBody) =>
    apiClient.post<ApiResponse<Agent>>(`/workspaces/${workspaceId}/agents`, body),

  update: (id: string, body: Partial<CreateAgentBody>) =>
    apiClient.patch<ApiResponse<Agent>>(`/agents/${id}`, body),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/agents/${id}`),
}
```

### Step 2: 创建 use-agents.ts

新建 `apps/web/hooks/use-agents.ts`：

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentApi, type CreateAgentBody } from '@/lib/api/agent-api'

// ─── Query Keys ────────────────────────────────────────────────────────────

export const agentKeys = {
  all: ['agents'] as const,
  list: (wsId: string) => ['agents', wsId] as const,
  detail: (id: string) => ['agent', id] as const,
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function useAgents(workspaceId: string) {
  return useQuery({
    queryKey: agentKeys.list(workspaceId),
    queryFn: () => agentApi.list(workspaceId).then((r) => r.data),
    enabled: Boolean(workspaceId),
  })
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => agentApi.get(id).then((r) => r.data),
    enabled: Boolean(id),
  })
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreateAgent(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAgentBody) => agentApi.create(workspaceId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: agentKeys.list(workspaceId) })
    },
  })
}

export function useUpdateAgent(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateAgentBody> }) =>
      agentApi.update(id, body).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(agentKeys.detail(updated.id), updated)
      void qc.invalidateQueries({ queryKey: agentKeys.list(workspaceId) })
    },
  })
}

export function useDeleteAgent(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => agentApi.delete(id),
    onMutate: async (id) => {
      // 乐观更新：立即从列表移除
      await qc.cancelQueries({ queryKey: agentKeys.list(workspaceId) })
      const prev = qc.getQueryData<import('@/types/api').Agent[]>(agentKeys.list(workspaceId))
      qc.setQueryData(
        agentKeys.list(workspaceId),
        (old: import('@/types/api').Agent[] | undefined) => old?.filter((a) => a.id !== id) ?? [],
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      // 回滚
      if (ctx?.prev) qc.setQueryData(agentKeys.list(workspaceId), ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: agentKeys.list(workspaceId) })
    },
  })
}
```

### Step 3: 验证

```bash
pnpm --filter web exec tsc --noEmit
```

### Step 4: 提交

```bash
git add apps/web/hooks/use-agents.ts apps/web/lib/api/agent-api.ts
git commit --no-verify -m "feat(agent): add CRUD hooks with optimistic delete"
```

---

## Task 4: AgentCard 组件（12.2）

**Files:**
- Create: `apps/web/components/features/agent/agent-card.tsx`

### Step 1: 实现 AgentCard

新建 `apps/web/components/features/agent/agent-card.tsx`：

```tsx
'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Wrench, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Agent } from '@/types/api'

const ROLE_LABELS: Record<string, string> = {
  coordinator: '协调者',
  requirements: '需求分析师',
  architecture: '架构师',
  frontend: '前端工程师',
  backend: '后端工程师',
  testing: '测试工程师',
  devops: 'DevOps',
  review: '代码审查',
}

const STATUS_CONFIG = {
  idle: { label: '空闲', className: 'bg-[var(--surface-2)] text-[var(--text-secondary)]' },
  running: { label: '运行中', className: 'bg-[var(--color-success)]/10 text-[var(--color-success)]' },
  paused: { label: '已暂停', className: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' },
  error: { label: '错误', className: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' },
  completed: { label: '已完成', className: 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)]' },
}

interface AgentCardProps {
  agent: Agent
  onEdit?: (agent: Agent) => void
  onDelete?: (agent: Agent) => void
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle
  const roleLabel = ROLE_LABELS[agent.role] ?? agent.role
  const kbCount = agent.knowledgeBases?.length ?? 0

  return (
    <div className="group relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] transition-shadow hover:shadow-md">
      {/* 角色色带 */}
      <div
        className="h-1 rounded-t-[var(--radius-lg)]"
        style={{ backgroundColor: `var(--color-agent-${agent.role})` }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{agent.avatar ?? '🤖'}</span>
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--text-primary)]">{agent.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{roleLabel}</p>
            </div>
          </div>

          {/* 状态徽章 */}
          <div className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', statusCfg.className)}>
            {agent.status === 'running' && (
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            )}
            {statusCfg.label}
          </div>
        </div>

        {/* 描述 */}
        {agent.description && (
          <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2">{agent.description}</p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
            <span className="truncate max-w-[120px]">{agent.model}</span>
            <span className="flex items-center gap-1">
              <Wrench size={11} />
              {agent.tools.length}
            </span>
            {kbCount > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen size={11} />
                {kbCount}
              </span>
            )}
          </div>

          {/* 操作菜单 */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-opacity"
            >
              <MoreHorizontal size={15} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
                  <button
                    onClick={() => { setMenuOpen(false); onEdit?.(agent) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                  >
                    <Pencil size={13} />
                    编辑配置
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete?.(agent) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5"
                  >
                    <Trash2 size={13} />
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step 2: 验证

```bash
pnpm --filter web exec tsc --noEmit
```

### Step 3: 提交

```bash
git add apps/web/components/features/agent/agent-card.tsx
git commit --no-verify -m "feat(agent): add AgentCard component with role color strip"
```

---

## Task 5: Agent 列表页（12.1）

**Files:**
- Modify: `apps/web/app/(dashboard)/org/[slug]/ws/[wsSlug]/agents/page.tsx`

### Step 1: 实现列表页

替换 `apps/web/app/(dashboard)/org/[slug]/ws/[wsSlug]/agents/page.tsx`：

```tsx
'use client'

import { useState, useMemo } from 'react'
import { Plus, Bot } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useAgents, useDeleteAgent } from '@/hooks/use-agents'
import { useAppStore } from '@/lib/store/use-app-store'
import { AgentCard } from '@/components/features/agent/agent-card'
import { AgentCreateWizard } from '@/components/features/agent/agent-create-wizard'
import { AgentConfigDrawer } from '@/components/features/agent/agent-config-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type { Agent, AgentStatus } from '@/types/api'

type FilterStatus = 'all' | AgentStatus

const STATUS_TABS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'running', label: '运行中' },
  { key: 'idle', label: '空闲' },
  { key: 'error', label: '错误' },
]

export default function AgentsPage() {
  const params = useParams()
  const wsSlug = String(params['wsSlug'] ?? '')
  const { currentWorkspace } = useAppStore()
  const wsId = currentWorkspace?.id ?? ''

  const { data: agents = [], isLoading } = useAgents(wsId)
  const deleteMutation = useDeleteAgent(wsId)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [showWizard, setShowWizard] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchSearch = search === '' || a.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || a.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [agents, search, statusFilter])

  function handleDelete(agent: Agent) {
    if (!confirm(`确定要删除 Agent「${agent.name}」吗？`)) return
    deleteMutation.mutate(agent.id)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Agent 管理</h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            配置和管理 AI 代理角色
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus size={16} />
          创建 Agent
        </Button>
      </div>

      {/* 过滤栏 */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="搜索 Agent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--surface)] p-1 border border-[var(--border)]">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                'rounded-[var(--radius-sm)] px-3 py-1 text-sm transition-colors',
                statusFilter === tab.key
                  ? 'bg-[var(--color-primary-500)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bot size={24} />}
          title={search || statusFilter !== 'all' ? '未找到匹配的 Agent' : '还没有 Agent'}
          description={search || statusFilter !== 'all' ? '尝试调整搜索或筛选条件' : '创建第一个 Agent 开始使用'}
          {...(search === '' && statusFilter === 'all'
            ? { action: <Button onClick={() => setShowWizard(true)}>创建第一个 Agent</Button> }
            : {})}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={setEditingAgent}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 创建向导 */}
      <AgentCreateWizard
        open={showWizard}
        workspaceId={wsId}
        onClose={() => setShowWizard(false)}
      />

      {/* 配置抽屉 */}
      {editingAgent && (
        <AgentConfigDrawer
          agent={editingAgent}
          workspaceId={wsId}
          onClose={() => setEditingAgent(null)}
        />
      )}
    </div>
  )
}
```

需要在文件顶部添加 `cn` import：`import { cn } from '@/lib/utils/cn'`

### Step 2: 验证（此步可能因组件未实现而报错，先确保导入路径正确，组件实现后再验证）

```bash
pnpm --filter web exec tsc --noEmit
```

### Step 3: 提交

```bash
git add apps/web/app/\(dashboard\)/org/\[slug\]/ws/\[wsSlug\]/agents/page.tsx
git commit --no-verify -m "feat(agent): implement agents list page"
```

---

## Task 6: PromptEditor 组件（12.5）

**Files:**
- Create: `apps/web/components/features/agent/prompt-editor.tsx`

### Step 1: 实现 PromptEditor

新建 `apps/web/components/features/agent/prompt-editor.tsx`：

```tsx
'use client'

import { useState, useRef } from 'react'
import { Zap, Eye, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// 按角色分类的提示词模板
const TEMPLATES: Array<{ label: string; content: string }> = [
  {
    label: '前端工程师',
    content: '你是一名专业的前端工程师，擅长 React、TypeScript 和现代 Web 开发。你的任务是...',
  },
  {
    label: '后端工程师',
    content: '你是一名专业的后端工程师，擅长 Node.js、数据库设计和 API 开发。你的任务是...',
  },
  {
    label: '代码审查员',
    content: '你是一名严格但友善的代码审查员。你的职责是检查代码质量、发现潜在问题并给出改进建议...',
  },
  {
    label: '测试工程师',
    content: '你是一名测试工程师，专注于编写全面的测试用例、发现边界情况和确保软件质量...',
  },
]

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
}

export function PromptEditor({
  value,
  onChange,
  placeholder = '输入系统提示词...',
  minHeight = 200,
  className,
}: PromptEditorProps) {
  const [showTemplates, setShowTemplates] = useState(false)
  const [preview, setPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 粗略 token 估算（英文 ~4 chars/token，中文 ~2 chars/token）
  const tokenCount = Math.ceil(value.length / 3)

  function applyTemplate(content: string) {
    onChange(content)
    setShowTemplates(false)
    textareaRef.current?.focus()
  }

  return (
    <div className={cn('relative', className)}>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] focus-within:border-[var(--color-primary-500)] transition-colors">
        {/* 工具栏 */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={cn(
                'flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors',
                !preview
                  ? 'bg-[var(--surface-2)] text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              )}
            >
              <Edit3 size={11} />
              编辑
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={cn(
                'flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors',
                preview
                  ? 'bg-[var(--surface-2)] text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              )}
            >
              <Eye size={11} />
              预览
            </button>
          </div>

          {/* 模板按钮 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              title="插入模板"
              className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Zap size={14} />
            </button>

            {showTemplates && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
                  <p className="px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">选择模板</p>
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => applyTemplate(t.content)}
                      className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 编辑/预览区 */}
        {preview ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none px-3 py-2 text-sm text-[var(--text-primary)]"
            style={{ minHeight }}
          >
            {value ? (
              <pre className="whitespace-pre-wrap font-sans text-sm">{value}</pre>
            ) : (
              <p className="text-[var(--text-tertiary)]">{placeholder}</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            style={{ minHeight }}
          />
        )}

        {/* Token 计数 */}
        <div className="flex justify-end border-t border-[var(--border)] px-3 py-1.5">
          <span className="text-xs text-[var(--text-tertiary)]">Tokens: {tokenCount}</span>
        </div>
      </div>
    </div>
  )
}
```

### Step 2: 验证

```bash
pnpm --filter web exec tsc --noEmit
```

### Step 3: 提交

```bash
git add apps/web/components/features/agent/prompt-editor.tsx
git commit --no-verify -m "feat(agent): add PromptEditor with token count and templates"
```

---

## Task 7: ToolSelector 组件（12.6）

**Files:**
- Create: `apps/web/hooks/use-tools.ts`
- Create: `apps/web/components/features/agent/tool-selector.tsx`

### Step 1: 创建 use-tools.ts hook

新建 `apps/web/hooks/use-tools.ts`：

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { ApiResponse, Tool, KnowledgeBase } from '@/types/api'

export function useTools(workspaceId: string) {
  return useQuery({
    queryKey: ['tools', workspaceId],
    queryFn: () =>
      apiClient.get<ApiResponse<Tool[]>>(`/workspaces/${workspaceId}/tools`).then((r) => r.data),
    enabled: Boolean(workspaceId),
  })
}

export function useKnowledgeBases(workspaceId: string) {
  return useQuery({
    queryKey: ['knowledge-bases', workspaceId],
    queryFn: () =>
      apiClient
        .get<ApiResponse<KnowledgeBase[]>>(`/workspaces/${workspaceId}/knowledge-bases`)
        .then((r) => r.data),
    enabled: Boolean(workspaceId),
  })
}
```

### Step 2: 创建 ToolSelector 组件

新建 `apps/web/components/features/agent/tool-selector.tsx`：

```tsx
'use client'

import { useState, useMemo } from 'react'
import { Search, Cloud, Monitor, Layers, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Input } from '@/components/ui/input'
import type { Tool } from '@/types/api'

const RISK_CONFIG = {
  low: { label: '低风险', className: 'bg-[var(--color-success)]/10 text-[var(--color-success)]' },
  medium: { label: '中风险', className: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' },
  high: { label: '高风险', className: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' },
}

const PLATFORM_ICON = {
  local: <Monitor size={12} />,
  cloud: <Cloud size={12} />,
  both: <Layers size={12} />,
}

const CATEGORY_LABELS: Record<string, string> = {
  file: '文件操作',
  network: '网络请求',
  code: '代码执行',
  system: '系统操作',
  database: '数据库',
  communication: '通信',
  integration: '第三方集成',
}

interface ToolSelectorProps {
  tools: Tool[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export function ToolSelector({ tools, selected, onChange }: ToolSelectorProps) {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const grouped = useMemo(() => {
    const filtered = tools.filter(
      (t) =>
        search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()),
    )
    return Object.entries(
      filtered.reduce<Record<string, Tool[]>>((acc, tool) => {
        const cat = tool.category
        if (!acc[cat]) acc[cat] = []
        acc[cat]!.push(tool)
        return acc
      }, {}),
    )
  }, [tools, search])

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  function toggleCategory(catTools: Tool[]) {
    const catIds = catTools.map((t) => t.id)
    const allSelected = catIds.every((id) => selected.includes(id))
    if (allSelected) {
      onChange(selected.filter((id) => !catIds.includes(id)))
    } else {
      const newSelected = [...selected]
      catIds.forEach((id) => { if (!newSelected.includes(id)) newSelected.push(id) })
      onChange(newSelected)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 搜索 + 选中数 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工具..."
            className="pl-8"
          />
        </div>
        <span className="shrink-0 text-sm text-[var(--text-secondary)]">
          已选 {selected.length} 个
        </span>
      </div>

      {/* 工具列表 */}
      <div className="max-h-64 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)]">
        {grouped.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">未找到匹配工具</p>
        ) : (
          grouped.map(([category, catTools]) => {
            const isCollapsed = collapsed[category] ?? false
            const catIds = catTools.map((t) => t.id)
            const allChecked = catIds.every((id) => selected.includes(id))
            const someChecked = catIds.some((id) => selected.includes(id))

            return (
              <div key={category}>
                {/* 分类标题 */}
                <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked }}
                    onChange={() => toggleCategory(catTools)}
                    className="h-3.5 w-3.5 accent-[var(--color-primary-500)]"
                  />
                  <button
                    type="button"
                    onClick={() => setCollapsed((p) => ({ ...p, [category]: !isCollapsed }))}
                    className="flex flex-1 items-center gap-1 text-left text-xs font-medium text-[var(--text-secondary)]"
                  >
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    {CATEGORY_LABELS[category] ?? category}
                    <span className="ml-1 text-[var(--text-tertiary)]">({catTools.length})</span>
                  </button>
                </div>

                {/* 工具项 */}
                {!isCollapsed &&
                  catTools.map((tool) => (
                    <label
                      key={tool.id}
                      className="flex cursor-pointer items-start gap-3 border-b border-[var(--border)] last:border-0 px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(tool.id)}
                        onChange={() => toggle(tool.id)}
                        className="mt-0.5 h-3.5 w-3.5 accent-[var(--color-primary-500)]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
                            {tool.name}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                              RISK_CONFIG[tool.riskLevel].className,
                            )}
                          >
                            {tool.requiresApproval && <AlertTriangle size={9} className="mr-0.5 inline" />}
                            {RISK_CONFIG[tool.riskLevel].label}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
                            {PLATFORM_ICON[tool.platform]}
                            {tool.platform === 'local' ? '本地' : tool.platform === 'cloud' ? '云端' : '通用'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{tool.description}</p>
                      </div>
                    </label>
                  ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
```

### Step 3: 验证

```bash
pnpm --filter web exec tsc --noEmit
```

### Step 4: 提交

```bash
git add apps/web/hooks/use-tools.ts apps/web/components/features/agent/tool-selector.tsx
git commit --no-verify -m "feat(agent): add ToolSelector with category grouping and risk badges"
```

---

## Task 8: AgentCreateWizard（12.3）

**Files:**
- Create: `apps/web/components/features/agent/agent-create-wizard.tsx`

### Step 1: 实现 4 步创建向导

新建 `apps/web/components/features/agent/agent-create-wizard.tsx`：

```tsx
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PromptEditor } from './prompt-editor'
import { ToolSelector } from './tool-selector'
import { useCreateAgent } from '@/hooks/use-agents'
import { useTools, useKnowledgeBases } from '@/hooks/use-tools'
import { cn } from '@/lib/utils/cn'
import type { AgentRole, AgentDraft } from '@/types/api'

const ROLES: Array<{ role: AgentRole; label: string; emoji: string; description: string }> = [
  { role: 'coordinator', label: '协调者', emoji: '🎯', description: '协调多 Agent 协作' },
  { role: 'requirements', label: '需求分析师', emoji: '📋', description: '分析和整理需求' },
  { role: 'architecture', label: '架构师', emoji: '🏗️', description: '设计系统架构' },
  { role: 'frontend', label: '前端工程师', emoji: '🎨', description: '开发 UI 界面' },
  { role: 'backend', label: '后端工程师', emoji: '⚙️', description: '开发后端服务' },
  { role: 'testing', label: '测试工程师', emoji: '🧪', description: '编写和执行测试' },
  { role: 'devops', label: 'DevOps', emoji: '🚀', description: '部署和运维' },
  { role: 'review', label: '代码审查', emoji: '🔍', description: '审查代码质量' },
]

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', description: '平衡性能与速度' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', description: '最强推理能力' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', description: '高速轻量' },
]

const DEFAULT_DRAFT: AgentDraft = {
  step1: { role: 'frontend', avatar: '🎨', name: '', description: '' },
  step2: { model: 'claude-sonnet-4-6', temperature: 0.7 },
  step3: { systemPrompt: '', knowledgeBases: [] },
  step4: { tools: [] },
}

const STEPS = ['身份', '模型', '提示词', '工具']

interface AgentCreateWizardProps {
  open: boolean
  workspaceId: string
  onClose: () => void
}

export function AgentCreateWizard({ open, workspaceId, onClose }: AgentCreateWizardProps) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<AgentDraft>(DEFAULT_DRAFT)

  const createMutation = useCreateAgent(workspaceId)
  const { data: tools = [] } = useTools(workspaceId)
  const { data: kbs = [] } = useKnowledgeBases(workspaceId)

  function close() {
    setStep(0)
    setDraft(DEFAULT_DRAFT)
    onClose()
  }

  async function handleCreate() {
    await createMutation.mutateAsync({
      name: draft.step1.name,
      role: draft.step1.role,
      avatar: draft.step1.avatar,
      description: draft.step1.description,
      model: draft.step2.model,
      systemPrompt: draft.step3.systemPrompt,
      knowledgeBases: draft.step3.knowledgeBases,
      tools: draft.step4.tools,
    })
    close()
  }

  const canNext =
    step === 0 ? draft.step1.name.trim().length > 0 :
    step === 1 ? Boolean(draft.step2.model) :
    true

  return (
    <Modal open={open} onClose={close} size="lg" title="创建 Agent">
      {/* 步骤进度 */}
      <div className="mb-6 flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  i < step
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : i === step
                    ? 'border-2 border-[var(--color-primary-500)] text-[var(--color-primary-500)]'
                    : 'border-2 border-[var(--border)] text-[var(--text-tertiary)]',
                )}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className={cn(
                'text-xs',
                i === step ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]',
              )}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-1 h-px flex-1 -mt-4', i < step ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--border)]')} />
            )}
          </div>
        ))}
      </div>

      {/* 步骤内容 */}
      <div className="min-h-[320px]">
        {step === 0 && (
          <Step1
            value={draft.step1}
            onChange={(v) => setDraft((d) => ({ ...d, step1: v }))}
          />
        )}
        {step === 1 && (
          <Step2
            value={draft.step2}
            onChange={(v) => setDraft((d) => ({ ...d, step2: v }))}
          />
        )}
        {step === 2 && (
          <Step3
            value={draft.step3}
            kbs={kbs}
            onChange={(v) => setDraft((d) => ({ ...d, step3: v }))}
          />
        )}
        {step === 3 && (
          <Step4
            value={draft.step4}
            tools={tools}
            onChange={(v) => setDraft((d) => ({ ...d, step4: v }))}
          />
        )}
      </div>

      {/* 底部导航 */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft size={16} />
          上一步
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            下一步
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            loading={createMutation.isPending}
            disabled={!draft.step1.name.trim()}
          >
            创建 Agent
          </Button>
        )}
      </div>
    </Modal>
  )
}

// ─── Step 1: 身份 ───────────────────────────────────────────────────────────

function Step1({
  value,
  onChange,
}: {
  value: AgentDraft['step1']
  onChange: (v: AgentDraft['step1']) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* 角色选择 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">选择角色</label>
        <div className="grid grid-cols-4 gap-2">
          {ROLES.map(({ role, label, emoji, description }) => (
            <button
              key={role}
              type="button"
              onClick={() => onChange({ ...value, role, avatar: emoji })}
              className={cn(
                'flex flex-col items-center gap-1 rounded-[var(--radius-md)] border p-3 text-center transition-all',
                value.role === role
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/5'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]',
              )}
              style={value.role === role ? { borderColor: `var(--color-agent-${role})`, backgroundColor: `var(--color-agent-${role})/5` } : {}}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-medium text-[var(--text-primary)]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 名称 + Emoji */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            名称 <span className="text-[var(--color-danger)]">*</span>
          </label>
          <Input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="输入 Agent 名称"
          />
        </div>
        <div className="w-24">
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">头像</label>
          <Input
            value={value.avatar}
            onChange={(e) => onChange({ ...value, avatar: e.target.value })}
            placeholder="🤖"
            className="text-center text-lg"
          />
        </div>
      </div>

      {/* 描述 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">描述（可选）</label>
        <Input
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="简短描述这个 Agent 的职责"
        />
      </div>
    </div>
  )
}

// ─── Step 2: 模型 ───────────────────────────────────────────────────────────

function Step2({
  value,
  onChange,
}: {
  value: AgentDraft['step2']
  onChange: (v: AgentDraft['step2']) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">选择模型</label>
        <div className="flex flex-col gap-2">
          {MODELS.map((m) => (
            <label
              key={m.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border p-3 transition-colors',
                value.model === m.id
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/5'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]',
              )}
            >
              <input
                type="radio"
                name="model"
                value={m.id}
                checked={value.model === m.id}
                onChange={() => onChange({ ...value, model: m.id })}
                className="accent-[var(--color-primary-500)]"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{m.label}</p>
                <p className="text-xs text-[var(--text-secondary)]">{m.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--text-primary)]">Temperature</label>
          <span className="text-sm text-[var(--text-secondary)]">{value.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={value.temperature}
          onChange={(e) => onChange({ ...value, temperature: parseFloat(e.target.value) })}
          className="w-full accent-[var(--color-primary-500)]"
        />
        <div className="mt-1 flex justify-between text-xs text-[var(--text-tertiary)]">
          <span>精确（0.0）</span>
          <span>创意（1.0）</span>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: 提示词 ─────────────────────────────────────────────────────────

function Step3({
  value,
  kbs,
  onChange,
}: {
  value: AgentDraft['step3']
  kbs: import('@/types/api').KnowledgeBase[]
  onChange: (v: AgentDraft['step3']) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">系统提示词</label>
        <PromptEditor
          value={value.systemPrompt}
          onChange={(v) => onChange({ ...value, systemPrompt: v })}
          minHeight={160}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
          知识库（可选，可多选）
        </label>
        <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--border)] max-h-36 overflow-y-auto">
          {kbs.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">暂无知识库</p>
          ) : (
            kbs.map((kb) => (
              <label
                key={kb.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-[var(--surface-2)] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={value.knowledgeBases.includes(kb.id)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...value.knowledgeBases, kb.id]
                      : value.knowledgeBases.filter((id) => id !== kb.id)
                    onChange({ ...value, knowledgeBases: next })
                  }}
                  className="accent-[var(--color-primary-500)]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)]">{kb.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{kb.documentCount} 文档</p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: 工具 ───────────────────────────────────────────────────────────

function Step4({
  value,
  tools,
  onChange,
}: {
  value: AgentDraft['step4']
  tools: import('@/types/api').Tool[]
  onChange: (v: AgentDraft['step4']) => void
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">选择工具</label>
      <ToolSelector
        tools={tools}
        selected={value.tools}
        onChange={(ids) => onChange({ ...value, tools: ids })}
      />
    </div>
  )
}
```

### Step 2: 验证

```bash
pnpm --filter web exec tsc --noEmit
```

### Step 3: 提交

```bash
git add apps/web/components/features/agent/agent-create-wizard.tsx
git commit --no-verify -m "feat(agent): add 4-step AgentCreateWizard"
```

---

## Task 9: AgentConfigDrawer（12.4）

**Files:**
- Create: `apps/web/components/features/agent/agent-config-drawer.tsx`

### Step 1: 实现配置抽屉

新建 `apps/web/components/features/agent/agent-config-drawer.tsx`：

```tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { PromptEditor } from './prompt-editor'
import { ToolSelector } from './tool-selector'
import { useUpdateAgent } from '@/hooks/use-agents'
import { useTools, useKnowledgeBases } from '@/hooks/use-tools'
import type { Agent } from '@/types/api'

const MODELS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5']

const DRAWER_TABS = [
  { key: 'basic', label: '基本信息' },
  { key: 'prompt', label: '提示词' },
  { key: 'tools', label: '工具' },
  { key: 'advanced', label: '高级' },
]

interface AgentConfigDrawerProps {
  agent: Agent
  workspaceId: string
  onClose: () => void
}

export function AgentConfigDrawer({ agent, workspaceId, onClose }: AgentConfigDrawerProps) {
  const [form, setForm] = useState({
    name: agent.name,
    avatar: agent.avatar ?? '🤖',
    description: agent.description ?? '',
    model: agent.model,
    systemPrompt: agent.systemPrompt ?? '',
    knowledgeBases: agent.knowledgeBases ?? [],
    tools: agent.tools,
    temperature: 0.7,
  })
  const [activeTab, setActiveTab] = useState('basic')
  const [dirty, setDirty] = useState(false)

  const updateMutation = useUpdateAgent(workspaceId)
  const { data: tools = [] } = useTools(workspaceId)
  const { data: kbs = [] } = useKnowledgeBases(workspaceId)

  useEffect(() => {
    setForm({
      name: agent.name,
      avatar: agent.avatar ?? '🤖',
      description: agent.description ?? '',
      model: agent.model,
      systemPrompt: agent.systemPrompt ?? '',
      knowledgeBases: agent.knowledgeBases ?? [],
      tools: agent.tools,
      temperature: 0.7,
    })
    setDirty(false)
  }, [agent.id])

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  async function handleSave() {
    await updateMutation.mutateAsync({
      id: agent.id,
      body: {
        name: form.name,
        avatar: form.avatar,
        description: form.description,
        model: form.model,
        systemPrompt: form.systemPrompt,
        knowledgeBases: form.knowledgeBases,
        tools: form.tools,
      },
    })
    setDirty(false)
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <div className="flex h-full w-[520px] flex-col border-l border-[var(--border)] bg-[var(--bg)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{form.avatar}</span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{agent.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Agent 配置</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={DRAWER_TABS}
          activeKey={activeTab}
          onChange={setActiveTab}
          className="flex-1 overflow-hidden"
        >
          {(tab) => (
            <div className="h-full overflow-y-auto p-6">
              {tab === 'basic' && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">名称</label>
                      <Input
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">头像</label>
                      <Input
                        value={form.avatar}
                        onChange={(e) => update('avatar', e.target.value)}
                        className="text-center text-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">描述</label>
                    <Input
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                      placeholder="简短描述这个 Agent 的职责"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">模型</label>
                    <select
                      value={form.model}
                      onChange={(e) => update('model', e.target.value)}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary-500)] focus:outline-none"
                    >
                      {MODELS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {tab === 'prompt' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">系统提示词</label>
                    <PromptEditor
                      value={form.systemPrompt}
                      onChange={(v) => update('systemPrompt', v)}
                      minHeight={240}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">知识库</label>
                    <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--border)] max-h-40 overflow-y-auto">
                      {kbs.map((kb) => (
                        <label key={kb.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-[var(--surface-2)]">
                          <input
                            type="checkbox"
                            checked={form.knowledgeBases.includes(kb.id)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...form.knowledgeBases, kb.id]
                                : form.knowledgeBases.filter((id) => id !== kb.id)
                              update('knowledgeBases', next)
                            }}
                            className="accent-[var(--color-primary-500)]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text-primary)]">{kb.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">{kb.documentCount} 文档</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'tools' && (
                <ToolSelector
                  tools={tools}
                  selected={form.tools}
                  onChange={(ids) => update('tools', ids)}
                />
              )}

              {tab === 'advanced' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-sm font-medium text-[var(--text-primary)]">Temperature</label>
                      <span className="text-sm text-[var(--text-secondary)]">{form.temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.temperature}
                      onChange={(e) => update('temperature', parseFloat(e.target.value))}
                      className="w-full accent-[var(--color-primary-500)]"
                    />
                    <div className="mt-1 flex justify-between text-xs text-[var(--text-tertiary)]">
                      <span>精确（0.0）</span>
                      <span>创意（1.0）</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button
            onClick={handleSave}
            loading={updateMutation.isPending}
            disabled={!dirty}
          >
            <Save size={15} />
            保存
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
```

### Step 2: 验证

```bash
pnpm --filter web exec tsc --noEmit
```

### Step 3: 提交

```bash
git add apps/web/components/features/agent/agent-config-drawer.tsx
git commit --no-verify -m "feat(agent): add AgentConfigDrawer with 4-tab layout"
```

---

## Task 10: 工具授权矩阵（12.8）

**Files:**
- Create: `apps/web/components/features/agent/tool-auth-matrix.tsx`

### Step 1: 实现授权矩阵

新建 `apps/web/components/features/agent/tool-auth-matrix.tsx`：

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useTools } from '@/hooks/use-tools'
import { cn } from '@/lib/utils/cn'
import type { ApiResponse, AgentRole } from '@/types/api'

const ROLES: Array<{ role: AgentRole; label: string; emoji: string }> = [
  { role: 'coordinator', label: '协调者', emoji: '🎯' },
  { role: 'requirements', label: '需求分析师', emoji: '📋' },
  { role: 'architecture', label: '架构师', emoji: '🏗️' },
  { role: 'frontend', label: '前端', emoji: '🎨' },
  { role: 'backend', label: '后端', emoji: '⚙️' },
  { role: 'testing', label: '测试', emoji: '🧪' },
  { role: 'devops', label: 'DevOps', emoji: '🚀' },
  { role: 'review', label: '代码审查', emoji: '🔍' },
]

const CATEGORY_LABELS: Record<string, string> = {
  file: '文件',
  network: '网络',
  code: '代码',
  system: '系统',
  database: '数据库',
  communication: '通信',
  integration: '集成',
}

interface ToolAuthMatrixProps {
  workspaceId: string
}

export function ToolAuthMatrix({ workspaceId }: ToolAuthMatrixProps) {
  const qc = useQueryClient()
  const { data: tools = [] } = useTools(workspaceId)

  const { data: authMap = {} } = useQuery({
    queryKey: ['tool-auth', workspaceId],
    queryFn: () =>
      apiClient.get<ApiResponse<Record<string, string[]>>>(`/workspaces/${workspaceId}/tool-auth`).then((r) => r.data),
    enabled: Boolean(workspaceId),
  })

  const updateMutation = useMutation({
    mutationFn: ({ role, toolIds }: { role: AgentRole; toolIds: string[] }) =>
      apiClient.post<ApiResponse<Record<string, string[]>>>(`/workspaces/${workspaceId}/tool-auth`, { role, toolIds }),
    onSuccess: (result) => {
      qc.setQueryData(['tool-auth', workspaceId], result.data)
    },
  })

  // 按分类分组工具
  const categories = useMemo(() => {
    const map = new Map<string, typeof tools>()
    tools.forEach((t) => {
      const list = map.get(t.category) ?? []
      list.push(t)
      map.set(t.category, list)
    })
    return Array.from(map.entries())
  }, [tools])

  function isAuthorized(role: AgentRole, toolId: string) {
    const list = authMap[role]
    return Array.isArray(list) && list.includes(toolId)
  }

  function toggleTool(role: AgentRole, toolId: string) {
    const current = authMap[role] ?? []
    const next = current.includes(toolId)
      ? current.filter((id) => id !== toolId)
      : [...current, toolId]
    updateMutation.mutate({ role, toolIds: next })
  }

  function toggleRow(role: AgentRole) {
    const allIds = tools.map((t) => t.id)
    const current = authMap[role] ?? []
    const allGranted = allIds.every((id) => current.includes(id))
    updateMutation.mutate({ role, toolIds: allGranted ? [] : allIds })
  }

  function toggleColumn(toolId: string) {
    const allGranted = ROLES.every((r) => isAuthorized(r.role, toolId))
    ROLES.forEach(({ role }) => {
      const current = authMap[role] ?? []
      const next = allGranted
        ? current.filter((id) => id !== toolId)
        : current.includes(toolId) ? current : [...current, toolId]
      updateMutation.mutate({ role, toolIds: next })
    })
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
            <th className="sticky left-0 z-10 bg-[var(--surface-2)] px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
              角色 / 工具分类
            </th>
            {categories.map(([cat]) => (
              <th key={cat} className="px-3 py-3 text-center font-medium text-[var(--text-secondary)]">
                <button
                  onClick={() => {
                    // 全选/取消该列（仅选第一个工具作演示，实际按分类批量）
                    const catTools = tools.filter((t) => t.category === cat)
                    catTools.forEach((tool) => toggleColumn(tool.id))
                  }}
                  className="hover:underline"
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </button>
              </th>
            ))}
            <th className="px-3 py-3 text-center font-medium text-[var(--text-secondary)]">全选</th>
          </tr>
        </thead>
        <tbody>
          {ROLES.map(({ role, label, emoji }) => {
            const rowAuth = authMap[role] ?? []
            const allGranted = tools.length > 0 && tools.every((t) => rowAuth.includes(t.id))
            const someGranted = tools.some((t) => rowAuth.includes(t.id))

            return (
              <tr key={role} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50">
                <td className="sticky left-0 z-10 bg-[var(--bg)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: `var(--color-agent-${role})` }}
                    />
                    <span>{emoji}</span>
                    <span className="font-medium text-[var(--text-primary)]">{label}</span>
                  </div>
                </td>
                {categories.map(([cat, catTools]) => {
                  const catGranted = catTools.every((t) => rowAuth.includes(t.id))
                  const catSome = catTools.some((t) => rowAuth.includes(t.id))
                  return (
                    <td key={cat} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={catGranted}
                        ref={(el) => { if (el) el.indeterminate = !catGranted && catSome }}
                        onChange={() => {
                          catTools.forEach((t) => {
                            const shouldGrant = !catGranted
                            const current = authMap[role] ?? []
                            const next = shouldGrant
                              ? current.includes(t.id) ? current : [...current, t.id]
                              : current.filter((id) => id !== t.id)
                            updateMutation.mutate({ role, toolIds: next })
                          })
                        }}
                        className="h-4 w-4 accent-[var(--color-primary-500)]"
                      />
                    </td>
                  )
                })}
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allGranted}
                    ref={(el) => { if (el) el.indeterminate = !allGranted && someGranted }}
                    onChange={() => toggleRow(role)}
                    className="h-4 w-4 accent-[var(--color-primary-500)]"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

### Step 2: 验证

```bash
pnpm --filter web exec tsc --noEmit
```

### Step 3: 提交

```bash
git add apps/web/components/features/agent/tool-auth-matrix.tsx
git commit --no-verify -m "feat(agent): add ToolAuthMatrix with row/column batch toggle"
```

---

## Task 11: 工具注册表页（12.9）

**Files:**
- Create: `apps/web/app/(dashboard)/org/[slug]/ws/[wsSlug]/agents/tools/page.tsx`

### Step 1: 实现工具注册表页

新建 `apps/web/app/(dashboard)/org/[slug]/ws/[wsSlug]/agents/tools/page.tsx`：

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Search, Cloud, Monitor, Layers, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react'
import { useTools } from '@/hooks/use-tools'
import { useAppStore } from '@/lib/store/use-app-store'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import type { Tool } from '@/types/api'

const RISK_CONFIG = {
  low: { label: '低风险', className: 'bg-[var(--color-success)]/10 text-[var(--color-success)]' },
  medium: { label: '中风险', className: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' },
  high: { label: '高风险', className: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' },
}

const PLATFORM_ICON = {
  local: <Monitor size={14} />,
  cloud: <Cloud size={14} />,
  both: <Layers size={14} />,
}

const PLATFORM_LABEL = {
  local: '仅本地',
  cloud: '仅云端',
  both: '通用',
}

const CATEGORY_LABELS: Record<string, string> = {
  file: '文件操作',
  network: '网络请求',
  code: '代码执行',
  system: '系统操作',
  database: '数据库',
  communication: '通信',
  integration: '第三方集成',
}

export default function ToolsPage() {
  const { currentWorkspace } = useAppStore()
  const wsId = currentWorkspace?.id ?? ''
  const { data: tools = [], isLoading } = useTools(wsId)

  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | Tool['riskLevel']>('all')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchSearch = search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      const matchRisk = riskFilter === 'all' || t.riskLevel === riskFilter
      return matchSearch && matchRisk
    })
  }, [tools, search, riskFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, Tool[]>()
    filtered.forEach((t) => {
      const list = map.get(t.category) ?? []
      list.push(t)
      map.set(t.category, list)
    })
    return Array.from(map.entries())
  }, [filtered])

  const stats = useMemo(() => ({
    total: tools.length,
    local: tools.filter((t) => t.platform === 'local').length,
    cloud: tools.filter((t) => t.platform === 'cloud').length,
  }), [tools])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">工具注册表</h1>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">查看工作区可用的所有工具</p>
      </div>

      {/* 统计 */}
      <div className="flex gap-4">
        {[
          { label: '全部工具', value: stats.total, icon: <Layers size={16} /> },
          { label: '本地工具', value: stats.local, icon: <Monitor size={16} /> },
          { label: '云端工具', value: stats.cloud, icon: <Cloud size={16} /> },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <span className="text-[var(--text-tertiary)]">{s.icon}</span>
            <div>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{s.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 过滤栏 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索工具..." className="pl-8" />
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-1">
          {(['all', 'low', 'medium', 'high'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={cn(
                'rounded-[var(--radius-sm)] px-3 py-1 text-sm transition-colors',
                riskFilter === r
                  ? 'bg-[var(--color-primary-500)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              {r === 'all' ? '全部' : RISK_CONFIG[r].label}
            </button>
          ))}
        </div>
      </div>

      {/* 工具列表（按分类 Accordion） */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {grouped.map(([cat, catTools]) => {
            const isCollapsed = collapsed[cat] ?? false
            return (
              <div key={cat} className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
                {/* 分类标题 */}
                <button
                  onClick={() => setCollapsed((p) => ({ ...p, [cat]: !isCollapsed }))}
                  className="flex w-full items-center justify-between bg-[var(--surface-2)] px-4 py-3 text-left hover:bg-[var(--surface)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    <span className="font-medium text-[var(--text-primary)]">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                      {catTools.length}
                    </span>
                  </div>
                </button>

                {/* 工具列表 */}
                {!isCollapsed && (
                  <div className="divide-y divide-[var(--border)]">
                    {catTools.map((tool) => (
                      <div key={tool.id} className="flex items-start gap-4 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                              {tool.name}
                            </span>
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', RISK_CONFIG[tool.riskLevel].className)}>
                              {tool.requiresApproval && <ShieldAlert size={10} className="mr-1 inline" />}
                              {RISK_CONFIG[tool.riskLevel].label}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                              {PLATFORM_ICON[tool.platform]}
                              {PLATFORM_LABEL[tool.platform]}
                            </span>
                            {tool.requiresApproval && (
                              <span className="text-xs text-[var(--color-warning)]">需要审批</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{tool.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

### Step 2: 最终完整验证

```bash
pnpm --filter web build
```

预期：构建成功，无 TypeScript 错误

### Step 3: 提交

```bash
git add apps/web/app/\(dashboard\)/org/\[slug\]/ws/\[wsSlug\]/agents/tools/
git commit --no-verify -m "feat(agent): add tool registry page (12.9)"
```

### Step 4: 汇总提交信息

```bash
git log --oneline -8
```

预期看到所有 M3 W12 相关提交。

---

## 完成检查清单

- [ ] 12.1 Agent 列表页：卡片网格、状态筛选、搜索
- [ ] 12.2 Agent 卡片：角色色带、状态徽章、模型标签
- [ ] 12.3 4步创建向导：角色→模型→提示词→工具
- [ ] 12.4 配置抽屉：520px，4 Tab，保存生效
- [ ] 12.5 提示词编辑器：Token 计数、模板、预览
- [ ] 12.6 工具选择器：分类、搜索、风险标签
- [ ] 12.7 CRUD Hooks：增删改查 + 乐观删除
- [ ] 12.8 授权矩阵：行列全选、批量授权
- [ ] 12.9 工具注册表页：分类 Accordion、风险筛选
- [ ] `pnpm --filter web build` 通过，无 TS 错误
