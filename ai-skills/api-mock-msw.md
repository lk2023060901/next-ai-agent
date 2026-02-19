# Skill: API Mock Service Setup (MSW 2.x)

> 生成 MSW 2.x Mock Handler，包括数据工厂、内存数据库和 SSE 流式响应模拟。

## 触发条件

当用户要求创建 Mock API、模拟后端接口、添加 Mock 数据时激活此 Skill。

## 上下文

### 技术栈

- MSW 2.x (Mock Service Worker)
- Faker.js (模拟数据生成)
- Zod (Schema 校验复用)
- TypeScript 5.6+

### 环境控制

```env
# .env.development
NEXT_PUBLIC_API_MOCK=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# .env.staging / .env.production
NEXT_PUBLIC_API_MOCK=false
```

### 目录结构

```
apps/web/mocks/
├── browser.ts                    # 浏览器 Service Worker 初始化
├── server.ts                     # Node.js 服务端初始化
├── handlers/                     # 请求处理器
│   ├── index.ts                  # 汇总所有 handlers
│   ├── auth.ts                   # 认证相关
│   ├── agents.ts                 # Agent CRUD
│   ├── sessions.ts               # 会话管理
│   ├── channels.ts               # 渠道管理
│   ├── workspaces.ts             # 工作区管理
│   ├── plugins.ts                # 插件管理
│   └── chat.ts                   # 聊天 SSE 流式
├── db/                           # 内存数据库
│   ├── index.ts                  # 数据库实例
│   └── seed.ts                   # 种子数据
├── factories/                    # 数据工厂
│   ├── user.ts
│   ├── agent.ts
│   ├── session.ts
│   ├── workspace.ts
│   └── message.ts
└── utils/
    ├── response.ts               # 统一响应包装
    ├── pagination.ts             # 分页逻辑
    └── delay.ts                  # 延迟模拟
```

## 生成规则

### 1. Handler 模板

```typescript
// mocks/handlers/agents.ts
import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';
import { wrapResponse, wrapPaginatedResponse, wrapError } from '../utils/response';

export const agentHandlers = [
  // GET /api/v1/workspaces/:wsId/agents - 列表
  http.get('/api/v1/workspaces/:wsId/agents', async ({ params, request }) => {
    await delay(200);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const cursor = url.searchParams.get('cursor');

    const agents = mockDb.agents.filter((a) => a.workspaceId === params.wsId);
    return HttpResponse.json(wrapPaginatedResponse(agents, { limit, cursor }));
  }),

  // POST /api/v1/workspaces/:wsId/agents - 创建
  http.post('/api/v1/workspaces/:wsId/agents', async ({ params, request }) => {
    await delay(300);
    const body = await request.json();
    const agent = mockDb.createAgent({ ...body, workspaceId: params.wsId });
    return HttpResponse.json(wrapResponse(agent), { status: 201 });
  }),

  // GET /api/v1/agents/:agentId - 详情
  http.get('/api/v1/agents/:agentId', async ({ params }) => {
    await delay(150);
    const agent = mockDb.agents.find((a) => a.id === params.agentId);
    if (!agent) return HttpResponse.json(wrapError(40301, 'Agent 不存在'), { status: 404 });
    return HttpResponse.json(wrapResponse(agent));
  }),

  // PUT /api/v1/agents/:agentId - 更新
  http.put('/api/v1/agents/:agentId', async ({ params, request }) => {
    await delay(200);
    const body = await request.json();
    const agent = mockDb.updateAgent(params.agentId as string, body);
    if (!agent) return HttpResponse.json(wrapError(40301, 'Agent 不存在'), { status: 404 });
    return HttpResponse.json(wrapResponse(agent));
  }),

  // DELETE /api/v1/agents/:agentId - 删除
  http.delete('/api/v1/agents/:agentId', async ({ params }) => {
    await delay(200);
    mockDb.deleteAgent(params.agentId as string);
    return HttpResponse.json(wrapResponse(null));
  }),
];
```

### 2. 统一响应包装

```typescript
// mocks/utils/response.ts
type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  meta: { requestId: string; timestamp: string };
};

export function wrapResponse<T>(data: T): ApiResponse<T> {
  return {
    code: 0,
    message: 'success',
    data,
    meta: {
      requestId: `req_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
    },
  };
}

export function wrapPaginatedResponse<T>(
  items: T[],
  opts: { limit: number; cursor?: string | null },
) {
  const startIndex = opts.cursor
    ? items.findIndex((_, i) => String(i) === opts.cursor) + 1
    : 0;
  const sliced = items.slice(startIndex, startIndex + opts.limit);

  return wrapResponse({
    items: sliced,
    pagination: {
      total: items.length,
      cursor: startIndex + opts.limit < items.length ? String(startIndex + opts.limit) : null,
      hasMore: startIndex + opts.limit < items.length,
      limit: opts.limit,
    },
  });
}

export function wrapError(code: number, message: string) {
  return {
    code,
    message,
    meta: {
      requestId: `req_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
    },
  };
}
```

### 3. 数据工厂

```typescript
// mocks/factories/agent.ts
import { faker } from '@faker-js/faker/locale/zh_CN';

type AgentRole = 'requirements' | 'architecture' | 'frontend' | 'backend' | 'testing' | 'ops' | 'reviewer' | 'coordinator';

export function createMockAgent(overrides: Partial<MockAgent> = {}): MockAgent {
  const roles: AgentRole[] = ['requirements', 'architecture', 'frontend', 'backend', 'testing', 'ops', 'reviewer', 'coordinator'];
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement(roles),
    status: faker.helpers.arrayElement(['active', 'idle', 'error']),
    description: faker.lorem.sentence(),
    model: faker.helpers.arrayElement(['gpt-4o', 'claude-sonnet-4-20250514', 'deepseek-v3']),
    temperature: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
    systemPrompt: faker.lorem.paragraphs(2),
    workspaceId: faker.string.uuid(),
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}
```

### 4. SSE 流式响应 (AI 聊天)

```typescript
// mocks/handlers/chat.ts
import { http, HttpResponse, delay } from 'msw';

const MOCK_REPLY = '你好！我是 NextAI Agent 的智能助手。我可以帮助你完成各种任务，包括代码编写、文档生成、问题诊断等。请问有什么我可以帮助你的？';

export const chatHandlers = [
  http.post('/api/v1/chat/completions', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // 模拟 token 逐字输出
        for (const char of MOCK_REPLY) {
          await new Promise((r) => setTimeout(r, 30 + Math.random() * 40));
          const chunk = `data: ${JSON.stringify({
            id: crypto.randomUUID(),
            choices: [{ delta: { content: char }, finish_reason: null }],
          })}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),
];
```

### 5. 初始化

```typescript
// mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

```typescript
// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```tsx
// app/providers.tsx 中按需初始化
async function initMock() {
  if (process.env.NEXT_PUBLIC_API_MOCK !== 'true') return;
  if (typeof window !== 'undefined') {
    const { worker } = await import('@/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}
```

## 示例

**输入**: "为工作区成员管理创建 Mock Handler"

**输出**: 生成 `mocks/handlers/workspace-members.ts`，包含：
- `GET /api/v1/workspaces/:wsId/members` (分页列表)
- `POST /api/v1/workspaces/:wsId/members/invite` (邀请)
- `PUT /api/v1/workspaces/:wsId/members/:memberId/role` (变更角色)
- `DELETE /api/v1/workspaces/:wsId/members/:memberId` (移除)

以及对应的 `factories/workspace-member.ts` 数据工厂。
