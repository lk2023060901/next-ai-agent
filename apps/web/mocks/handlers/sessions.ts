import { http, HttpResponse, delay } from 'msw'
import { makeSession, makeMessage } from '../factories/session.factory'
import type { Session, Message, SseEvent, ToolCall, ApprovalRequest } from '@/types/api'

const SESSIONS: Session[] = [
  makeSession({ id: 'session-1', title: 'Todo 应用开发', messageCount: 8, lastMessageAt: new Date(Date.now() - 3600000).toISOString() }),
  makeSession({ id: 'session-2', title: 'API 设计讨论', messageCount: 4, lastMessageAt: new Date(Date.now() - 86400000).toISOString() }),
  makeSession({ id: 'session-3', title: '数据库 Schema 设计', messageCount: 12, lastMessageAt: new Date(Date.now() - 172800000).toISOString() }),
]

const MESSAGES: Record<string, Message[]> = {
  'session-1': [
    makeMessage({ sessionId: 'session-1', role: 'user', content: '请帮我开发一个 Todo 应用，需要支持任务分类和优先级标记。' }),
    makeMessage({ sessionId: 'session-1', role: 'assistant', agentId: 'agent-coordinator', content: '收到！我来协调团队成员分工完成这个任务。\n\n**分工安排：**\n- 需求分析师：梳理功能需求\n- 架构师：设计技术架构\n- 前后端工程师：并行开发\n- 测试工程师：编写测试用例' }),
    makeMessage({ sessionId: 'session-1', role: 'assistant', agentId: 'agent-requirements', content: '## 需求分析\n\n### 核心功能\n1. **任务管理**：增删改查、完成标记\n2. **分类系统**：自定义标签/分类\n3. **优先级**：高/中/低三档\n4. **截止日期**：支持提醒\n\n### 用户故事\n- 作为用户，我希望能快速添加任务并设置优先级\n- 作为用户，我希望按分类筛选任务\n- 作为用户，我希望在任务截止前收到提醒' }),
    makeMessage({ sessionId: 'session-1', role: 'assistant', agentId: 'agent-architecture', content: '## 技术架构设计\n\n### 技术栈\n```\nFrontend: Next.js 15 + TypeScript + TailwindCSS\nBackend:  FastAPI + PostgreSQL\nCache:    Redis\nAuth:     JWT\n```\n\n### 数据模型\n```sql\nCREATE TABLE tasks (\n  id UUID PRIMARY KEY,\n  title VARCHAR(255) NOT NULL,\n  description TEXT,\n  priority ENUM(\'low\', \'medium\', \'high\'),\n  category_id UUID REFERENCES categories(id),\n  due_date TIMESTAMP,\n  completed_at TIMESTAMP,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n```' }),
    makeMessage({ sessionId: 'session-1', role: 'assistant', agentId: 'agent-frontend', content: '前端已搭建完成，以下是核心组件结构：\n\n```tsx\n// TaskCard.tsx\nexport function TaskCard({ task }: { task: Task }) {\n  return (\n    <div className="rounded-lg border p-4">\n      <div className="flex items-center gap-2">\n        <PriorityBadge priority={task.priority} />\n        <h3 className="font-medium">{task.title}</h3>\n      </div>\n      {task.dueDate && (\n        <DueDateChip date={task.dueDate} />\n      )}\n    </div>\n  )\n}\n```\n\n所有组件已完成，等待后端 API 联调。' }),
    makeMessage({ sessionId: 'session-1', role: 'user', content: '后端 API 的设计方案是什么？' }),
    makeMessage({ sessionId: 'session-1', role: 'assistant', agentId: 'agent-backend', content: '## 后端 API 设计\n\n### RESTful 接口\n\n| 方法 | 路径 | 说明 |\n|------|------|------|\n| GET | /api/tasks | 获取任务列表（支持筛选/排序） |\n| POST | /api/tasks | 创建新任务 |\n| PUT | /api/tasks/:id | 更新任务 |\n| DELETE | /api/tasks/:id | 删除任务 |\n| PATCH | /api/tasks/:id/complete | 标记完成 |\n\n### 查询参数\n```\nGET /api/tasks?category=work&priority=high&page=1&limit=20\n```\n\nAPI 文档已生成，可访问 `/docs` 查看 Swagger UI。' }),
    makeMessage({ sessionId: 'session-1', role: 'assistant', agentId: 'agent-testing', content: '## 测试覆盖报告\n\n✅ 单元测试：**47/47** 通过\n✅ 集成测试：**23/23** 通过\n⚠️ E2E 测试：**18/20** 通过（2 个待修复）\n\n**待修复问题：**\n1. 任务拖拽排序在 Safari 上表现异常\n2. 截止日期提醒通知权限处理逻辑需要优化\n\n测试报告已生成至 `coverage/` 目录。' }),
  ],
  'session-2': [
    makeMessage({ sessionId: 'session-2', role: 'user', content: '我需要设计一套 RESTful API，用于管理多租户 SaaS 平台。' }),
    makeMessage({ sessionId: 'session-2', role: 'assistant', agentId: 'agent-architecture', content: '## 多租户 API 设计方案\n\n### 方案对比\n\n| 方案 | 优点 | 缺点 |\n|------|------|------|\n| 子域名隔离 | 完全隔离、自定义域名 | 运维复杂 |\n| Path 前缀 | 简单易实现 | 耦合度高 |\n| Header 传递 | 灵活 | 需要客户端配合 |\n\n**推荐方案：** 结合 Path 前缀 + JWT 中租户信息\n\n```\n/api/v1/{tenantId}/resources\n```' }),
    makeMessage({ sessionId: 'session-2', role: 'user', content: '认证和授权怎么处理？' }),
    makeMessage({ sessionId: 'session-2', role: 'assistant', agentId: 'agent-backend', content: '### 认证授权方案\n\n```python\n# JWT Payload 结构\n{\n  "sub": "user_id",\n  "tenant_id": "tenant_123",\n  "roles": ["admin", "viewer"],\n  "exp": 1735000000\n}\n```\n\n**权限中间件：**\n```python\nasync def verify_tenant_access(request: Request, tenant_id: str):\n    token = extract_token(request)\n    payload = decode_jwt(token)\n    if payload["tenant_id"] != tenant_id:\n        raise HTTPException(403, "Access denied")\n```' }),
  ],
}

export const sessionHandlers = [
  http.get('/api/workspaces/:wsId/sessions', async () => {
    await delay(250)
    return HttpResponse.json({ data: SESSIONS })
  }),

  http.post('/api/workspaces/:wsId/sessions', async ({ request, params }) => {
    await delay(300)
    const body = (await request.json()) as Record<string, unknown>
    const session = makeSession({ workspaceId: String(params['wsId']), ...body })
    SESSIONS.unshift(session)
    MESSAGES[session.id] = []
    return HttpResponse.json({ data: session }, { status: 201 })
  }),

  http.get('/api/sessions/:id/messages', async ({ params }) => {
    await delay(200)
    const msgs = MESSAGES[String(params['id'])] ?? []
    return HttpResponse.json({ data: msgs })
  }),

  http.post('/api/sessions/:id/messages', async ({ request, params }) => {
    await delay(120)
    const body = (await request.json()) as Record<string, unknown>
    const sessionId = String(params['id'])
    const msg = makeMessage({ sessionId, ...body })
    if (!MESSAGES[sessionId]) MESSAGES[sessionId] = []
    MESSAGES[sessionId]!.push(msg)

    // Update session metadata
    const idx = SESSIONS.findIndex((s) => s.id === sessionId)
    if (idx !== -1) {
      SESSIONS[idx] = {
        ...SESSIONS[idx]!,
        messageCount: (MESSAGES[sessionId]?.length ?? 0),
        lastMessageAt: new Date().toISOString(),
      }
    }

    return HttpResponse.json({ data: msg }, { status: 201 })
  }),

  http.post('/api/sessions/:id/stream', async ({ request, params }) => {
    const body = (await request.json()) as { content: string }
    const sessionId = String(params['id'])
    const userContent = body.content ?? ''

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        function send(event: SseEvent) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }

        async function sleep(ms: number) {
          await new Promise((r) => setTimeout(r, ms))
        }

        async function streamText(messageId: string, text: string, chunkSize = 4) {
          for (let i = 0; i < text.length; i += chunkSize) {
            send({ type: 'text-delta', messageId, delta: text.slice(i, i + chunkSize) })
            await sleep(25)
          }
        }

        // ── Coordinator response ─────────────────────────────────────────────
        await sleep(400)
        send({ type: 'agent-switch', agentId: 'agent-coordinator', agentRole: 'coordinator', agentName: '协调者' })
        const coordMsgId = `stream-coord-${Date.now()}`
        send({ type: 'message-start', messageId: coordMsgId, agentId: 'agent-coordinator' })
        await streamText(
          coordMsgId,
          `收到你的请求："${userContent}"\n\n我来协调团队分工处理这个任务。\n\n**分工安排：**\n- 前端工程师：UI 实现\n- 后端工程师：API 设计\n- 测试工程师：用例编写`,
        )
        send({ type: 'message-end', messageId: coordMsgId })

        // ── Frontend agent + tool call ───────────────────────────────────────
        await sleep(600)
        send({ type: 'agent-switch', agentId: 'agent-frontend', agentRole: 'frontend', agentName: '前端工程师' })
        const frontMsgId = `stream-front-${Date.now()}`
        send({ type: 'message-start', messageId: frontMsgId, agentId: 'agent-frontend' })
        await streamText(frontMsgId, '我先读取现有代码，了解项目结构。\n\n')

        // Tool call: file read
        const fileToolCall: ToolCall = {
          id: `tool-read-${Date.now()}`,
          name: 'file_read',
          category: 'file',
          riskLevel: 'low',
          isLocal: true,
          params: { path: 'src/components/TaskCard.tsx' },
          status: 'running',
        }
        send({ type: 'tool-call', messageId: frontMsgId, toolCall: fileToolCall })
        await sleep(800)
        send({
          type: 'tool-result',
          messageId: frontMsgId,
          toolCallId: fileToolCall.id,
          result: '// TaskCard.tsx — 87 lines\nexport function TaskCard({ task }: Props) { ... }',
          status: 'success',
        })
        await sleep(300)
        await streamText(
          frontMsgId,
          '\n代码读取完成。`TaskCard` 组件结构清晰，我将在此基础上新增优先级筛选功能。',
        )

        // Tool call: terminal (medium risk)
        const termToolCall: ToolCall = {
          id: `tool-term-${Date.now()}`,
          name: 'bash_execute',
          category: 'terminal',
          riskLevel: 'medium',
          isLocal: true,
          params: { command: 'npm run build', timeout: 30000 },
          status: 'running',
        }
        send({ type: 'tool-call', messageId: frontMsgId, toolCall: termToolCall })
        await sleep(1200)
        send({
          type: 'tool-result',
          messageId: frontMsgId,
          toolCallId: termToolCall.id,
          result: '✓ Build succeeded in 4.2s',
          status: 'success',
        })
        await sleep(200)
        await streamText(frontMsgId, '\n构建通过，准备提交代码。')
        send({ type: 'message-end', messageId: frontMsgId })

        // ── Approval request (high-risk git push) ───────────────────────────
        await sleep(400)
        const approvMsgId = `stream-approve-${Date.now()}`
        send({ type: 'message-start', messageId: approvMsgId, agentId: 'agent-frontend' })
        const approval: ApprovalRequest = {
          id: `approval-${Date.now()}`,
          toolName: 'git_push',
          reason: '即将推送代码到远程仓库 origin/main 分支，影响线上环境',
          riskLevel: 'high',
          policySource: '项目策略：高风险操作需审批',
          params: { remote: 'origin', branch: 'main', force: false },
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          status: 'pending',
        }
        send({ type: 'approval-request', messageId: approvMsgId, approval })
        send({ type: 'message-end', messageId: approvMsgId })

        await sleep(200)
        send({ type: 'done' })
        controller.close()

        // Persist user message + agent messages in mock store
        if (!MESSAGES[sessionId]) MESSAGES[sessionId] = []
        const userMsg = makeMessage({ sessionId, role: 'user', content: userContent })
        MESSAGES[sessionId]!.push(userMsg)
        const idx = SESSIONS.findIndex((s) => s.id === sessionId)
        if (idx !== -1) {
          SESSIONS[idx] = {
            ...SESSIONS[idx]!,
            messageCount: MESSAGES[sessionId]!.length,
            lastMessageAt: new Date().toISOString(),
          }
        }
      },
    })

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }),
]
