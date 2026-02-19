# API Mock Service

> 前端独立开发的基础设施，通过 MSW (Mock Service Worker) 在浏览器和 Node.js 环境中拦截网络请求，返回模拟数据，使前端无需依赖后端即可完成全部功能开发和测试。

## 1 架构设计

### 1.1 技术选型

| 方案 | MSW (选用) | JSON Server | Mirage.js |
|------|-----------|-------------|-----------|
| 拦截层级 | Service Worker / Node.js | 独立进程 | 客户端内存 |
| 真实网络行为 | ✅ 浏览器真实 fetch | ✅ 真实 HTTP | ❌ 拦截不完整 |
| SSE/流式支持 | ✅ 原生支持 | ❌ 不支持 | ❌ 不支持 |
| 测试集成 | ✅ Vitest/Playwright | ❌ 需启动进程 | ✅ 内存 |
| 类型安全 | ✅ TypeScript | ❌ JSON 配置 | ⚠️ 部分 |
| 维护成本 | 低 | 中 | 中 |
| 生产零影响 | ✅ 构建时移除 | ✅ 独立进程 | ✅ |

**选用 MSW 2.x 理由**：
- 浏览器 Service Worker 拦截，开发者工具 Network 面板可见请求
- Node.js 环境拦截，Vitest 单元测试和 Playwright E2E 测试均可使用
- 原生支持 SSE (Server-Sent Events)，可模拟 AI 流式响应
- TypeScript 类型安全的 Handler 定义
- 零运行时依赖，生产构建自动移除

### 1.2 架构图

```
Mock Service 架构:

┌──────────────────────────────────────────────────────────┐
│                     Next.js 应用                          │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐   │
│  │ Page     │    │ Hook     │    │ API Client       │   │
│  │ Component│ →  │ useAgent │ →  │ fetch('/api/...')│   │
│  └──────────┘    └──────────┘    └────────┬─────────┘   │
│                                           │              │
│                                    ┌──────▼──────┐       │
│                                    │  MSW 拦截层  │       │
│                                    │             │       │
│                           ┌────────┤ MOCK=true ? ├───┐   │
│                           │        └─────────────┘   │   │
│                           ▼                          ▼   │
│                    ┌────────────┐            ┌──────────┐│
│                    │ Mock Handler│            │ 真实后端  ││
│                    │ + 工厂数据  │            │ API 服务  ││
│                    └────────────┘            └──────────┘│
│                           │                              │
│                    ┌──────▼──────┐                       │
│                    │ Mock 数据库  │                       │
│                    │ (内存 Map)  │                       │
│                    └─────────────┘                       │
└──────────────────────────────────────────────────────────┘
```

### 1.3 环境控制

```typescript
// .env.development
NEXT_PUBLIC_API_MOCK=true     // 开启 Mock
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

// .env.staging
NEXT_PUBLIC_API_MOCK=false    // 关闭 Mock，连接真实后端
NEXT_PUBLIC_API_BASE_URL=https://api.staging.nextai-agent.com
```

---

## 2 目录结构

```
apps/web/
├── mocks/
│   ├── browser.ts                    # 浏览器 Service Worker 初始化
│   ├── server.ts                     # Node.js 服务端初始化
│   ├── handlers/                     # 请求处理器 (按资源分组)
│   │   ├── index.ts                  # 汇总所有 handlers
│   │   ├── auth.ts                   # 认证相关
│   │   ├── users.ts                  # 用户相关
│   │   ├── orgs.ts                   # 组织相关
│   │   ├── workspaces.ts            # 工作区相关
│   │   ├── agents.ts                 # Agent 相关
│   │   ├── sessions.ts              # 会话相关
│   │   ├── messages.ts              # 消息 (含流式)
│   │   ├── channels.ts              # 渠道相关
│   │   ├── knowledge.ts             # 知识库相关
│   │   ├── plugins.ts               # 插件相关
│   │   ├── billing.ts               # 计费相关
│   │   └── dashboard.ts             # 仪表盘统计
│   ├── factories/                    # 数据工厂
│   │   ├── index.ts
│   │   ├── user-factory.ts
│   │   ├── org-factory.ts
│   │   ├── workspace-factory.ts
│   │   ├── agent-factory.ts
│   │   ├── session-factory.ts
│   │   ├── message-factory.ts
│   │   ├── channel-factory.ts
│   │   ├── plugin-factory.ts
│   │   └── billing-factory.ts
│   ├── db/                           # 内存数据库
│   │   ├── index.ts                  # Mock DB 实例
│   │   └── seed.ts                   # 初始种子数据
│   └── utils/                        # Mock 工具
│       ├── response.ts               # 统一响应格式
│       ├── pagination.ts             # 分页逻辑
│       ├── delay.ts                  # 模拟网络延迟
│       └── auth.ts                   # Token 校验模拟
├── public/
│   └── mockServiceWorker.js          # MSW Worker (自动生成)
```

---

## 3 初始化配置

### 3.1 安装

```bash
pnpm --filter web add -D msw @faker-js/faker
npx msw init apps/web/public --save
```

### 3.2 浏览器端初始化

```typescript
// mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

```typescript
// app/providers/mock-provider.tsx
'use client';

import { useEffect, useState } from 'react';

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCK !== 'true') {
      setReady(true);
      return;
    }

    import('../mocks/browser').then(({ worker }) => {
      worker.start({
        onUnhandledRequest: 'bypass', // 非 Mock 路由正常放行
        quiet: false,                  // 控制台显示拦截日志
      }).then(() => setReady(true));
    });
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
```

```tsx
// app/layout.tsx
import { MockProvider } from './providers/mock-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <MockProvider>
          <QueryProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </QueryProvider>
        </MockProvider>
      </body>
    </html>
  );
}
```

### 3.3 Node.js 端初始化 (测试用)

```typescript
// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// tests/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 4 内存数据库

### 4.1 Mock DB 实现

```typescript
// mocks/db/index.ts
import type { User, Org, Workspace, Agent, Session, Message } from '@/types';
import { seedData } from './seed';

class MockDatabase {
  users = new Map<string, User>();
  orgs = new Map<string, Org>();
  workspaces = new Map<string, Workspace>();
  agents = new Map<string, Agent>();
  sessions = new Map<string, Session>();
  messages = new Map<string, Message[]>();
  // ... 其他资源

  constructor() {
    this.seed();
  }

  seed() {
    const data = seedData();

    data.users.forEach((u) => this.users.set(u.id, u));
    data.orgs.forEach((o) => this.orgs.set(o.id, o));
    data.workspaces.forEach((w) => this.workspaces.set(w.id, w));
    data.agents.forEach((a) => this.agents.set(a.id, a));
    data.sessions.forEach((s) => this.sessions.set(s.id, s));
    data.messages.forEach((msgs, sessionId) => this.messages.set(sessionId, msgs));
  }

  reset() {
    this.users.clear();
    this.orgs.clear();
    this.workspaces.clear();
    this.agents.clear();
    this.sessions.clear();
    this.messages.clear();
    this.seed();
  }
}

export const db = new MockDatabase();
```

### 4.2 种子数据

```typescript
// mocks/db/seed.ts
import { createUser, createOrg, createWorkspace, createAgent, createSession, createMessages } from '../factories';

export function seedData() {
  // 默认用户
  const user = createUser({
    id: 'user_default',
    email: 'demo@nextai-agent.com',
    displayName: 'Demo User',
  });

  // 默认组织
  const org = createOrg({
    id: 'org_default',
    name: 'NextAI Demo',
    slug: 'nextai-demo',
    ownerId: user.id,
  });

  // 默认工作区
  const workspace = createWorkspace({
    id: 'ws_default',
    name: 'Default Workspace',
    slug: 'default',
    orgId: org.id,
  });

  // 8 个预设 Agent (匹配文档 04 定义)
  const agents = [
    createAgent({ name: 'Coordinator', role: 'coordinator', model: 'claude-sonnet-4-20250514', workspaceId: workspace.id }),
    createAgent({ name: 'Requirements Analyst', role: 'requirements', model: 'claude-sonnet-4-20250514', workspaceId: workspace.id }),
    createAgent({ name: 'Architect', role: 'architecture', model: 'claude-sonnet-4-20250514', workspaceId: workspace.id }),
    createAgent({ name: 'Frontend Dev', role: 'frontend', model: 'claude-sonnet-4-20250514', workspaceId: workspace.id }),
    createAgent({ name: 'Backend Dev', role: 'backend', model: 'claude-sonnet-4-20250514', workspaceId: workspace.id }),
    createAgent({ name: 'QA Engineer', role: 'testing', model: 'claude-haiku-4-5-20251001', workspaceId: workspace.id }),
    createAgent({ name: 'Code Reviewer', role: 'reviewer', model: 'claude-sonnet-4-20250514', workspaceId: workspace.id }),
    createAgent({ name: 'DevOps', role: 'devops', model: 'claude-haiku-4-5-20251001', workspaceId: workspace.id }),
  ];

  // 3 个示例会话
  const sessions = [
    createSession({ name: '项目架构讨论', workspaceId: workspace.id }),
    createSession({ name: '代码审查 - Auth 模块', workspaceId: workspace.id }),
    createSession({ name: 'Bug 修复 #234', workspaceId: workspace.id }),
  ];

  // 每个会话的历史消息
  const messages = new Map<string, typeof Message[]>();
  sessions.forEach((s) => {
    messages.set(s.id, createMessages(s.id, agents, { count: 10 }));
  });

  return {
    users: [user],
    orgs: [org],
    workspaces: [workspace],
    agents,
    sessions,
    messages,
  };
}
```

---

## 5 数据工厂

### 5.1 基础工厂

```typescript
// mocks/factories/user-factory.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import type { User } from '@/types';

export function createUser(overrides?: Partial<User>): User {
  return {
    id: `user_${faker.string.nanoid(12)}`,
    email: faker.internet.email(),
    displayName: faker.person.fullName(),
    avatarUrl: faker.image.avatar(),
    bio: faker.lorem.sentence(),
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}
```

```typescript
// mocks/factories/agent-factory.ts
import { faker } from '@faker-js/faker';
import type { Agent, AgentRole } from '@/types';

const ROLE_MODELS: Record<AgentRole, { color: string; defaultModel: string }> = {
  coordinator:  { color: '#11181C', defaultModel: 'claude-sonnet-4-20250514' },
  requirements: { color: '#9353D3', defaultModel: 'claude-sonnet-4-20250514' },
  architecture: { color: '#006FEE', defaultModel: 'claude-sonnet-4-20250514' },
  frontend:     { color: '#17C964', defaultModel: 'claude-sonnet-4-20250514' },
  backend:      { color: '#F5A524', defaultModel: 'claude-sonnet-4-20250514' },
  testing:      { color: '#F31260', defaultModel: 'claude-haiku-4-5-20251001' },
  reviewer:     { color: '#0E8AAA', defaultModel: 'claude-sonnet-4-20250514' },
  devops:       { color: '#71717A', defaultModel: 'claude-haiku-4-5-20251001' },
};

export function createAgent(overrides?: Partial<Agent>): Agent {
  const role = overrides?.role ?? faker.helpers.arrayElement(Object.keys(ROLE_MODELS) as AgentRole[]);
  const roleConfig = ROLE_MODELS[role];

  return {
    id: `agent_${faker.string.nanoid(12)}`,
    name: faker.person.jobTitle(),
    role,
    model: roleConfig.defaultModel,
    color: roleConfig.color,
    systemPrompt: faker.lorem.paragraphs(2),
    tools: faker.helpers.arrayElements(['web-search', 'code-execution', 'file-read', 'database-query'], { min: 1, max: 3 }),
    isActive: true,
    status: faker.helpers.arrayElement(['idle', 'working', 'idle', 'idle']),
    workspaceId: `ws_${faker.string.nanoid(12)}`,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}
```

### 5.2 消息工厂 (含 Agent 切换)

```typescript
// mocks/factories/message-factory.ts
import { faker } from '@faker-js/faker/locale/zh_CN';
import type { Message, Agent } from '@/types';

export function createMessages(
  sessionId: string,
  agents: Agent[],
  options: { count?: number } = {},
): Message[] {
  const count = options.count ?? 10;
  const messages: Message[] = [];
  let currentAgent = agents.find((a) => a.role === 'coordinator') ?? agents[0];

  for (let i = 0; i < count; i++) {
    const isUser = i % 3 === 0;

    if (isUser) {
      messages.push({
        id: `msg_${faker.string.nanoid(12)}`,
        sessionId,
        role: 'user',
        content: faker.lorem.paragraph(),
        createdAt: faker.date.recent().toISOString(),
      });
    } else {
      // 偶尔切换 Agent
      if (Math.random() > 0.6) {
        const newAgent = faker.helpers.arrayElement(agents);
        if (newAgent.id !== currentAgent.id) {
          messages.push({
            id: `msg_${faker.string.nanoid(12)}`,
            sessionId,
            role: 'system',
            content: `Agent 切换: ${currentAgent.name} → ${newAgent.name}`,
            metadata: { type: 'agent-switch', fromAgent: currentAgent.id, toAgent: newAgent.id },
            createdAt: faker.date.recent().toISOString(),
          });
          currentAgent = newAgent;
        }
      }

      messages.push({
        id: `msg_${faker.string.nanoid(12)}`,
        sessionId,
        role: 'assistant',
        content: faker.lorem.paragraphs({ min: 1, max: 3 }),
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        agentRole: currentAgent.role,
        createdAt: faker.date.recent().toISOString(),
      });
    }
  }

  return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
```

---

## 6 请求处理器

### 6.1 通用工具

```typescript
// mocks/utils/response.ts
import type { ApiResponse } from '@/types';

export function success<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = { code: 0, message: 'success', data };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(code: number, message: string, status = 400): Response {
  return new Response(JSON.stringify({ code, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function paginated<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  const sliced = items.slice(start, start + pageSize);
  return {
    items: sliced,
    pagination: {
      total: items.length,
      page,
      pageSize,
      hasMore: start + pageSize < items.length,
    },
  };
}
```

```typescript
// mocks/utils/delay.ts
export function randomDelay(min = 100, max = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min) + min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### 6.2 认证 Handler

```typescript
// mocks/handlers/auth.ts
import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { success, error } from '../utils/response';
import { randomDelay } from '../utils/delay';

const MOCK_TOKEN = 'mock-jwt-token-for-development';

export const authHandlers = [
  // 登录
  http.post('/api/v1/auth/login', async ({ request }) => {
    await randomDelay(300, 800);
    const body = await request.json() as { email: string; password: string };

    const user = [...db.users.values()].find((u) => u.email === body.email);
    if (!user) {
      return error(40101, 'Invalid email or password', 401);
    }

    return success({
      accessToken: MOCK_TOKEN,
      refreshToken: 'mock-refresh-token',
      expiresIn: 604800,
      user,
    });
  }),

  // 注册
  http.post('/api/v1/auth/signup', async ({ request }) => {
    await randomDelay(500, 1000);
    const body = await request.json() as { email: string; password: string; displayName: string };

    // 检查邮箱重复
    const exists = [...db.users.values()].some((u) => u.email === body.email);
    if (exists) {
      return error(40901, 'Email already registered', 409);
    }

    const user = createUser({ email: body.email, displayName: body.displayName });
    db.users.set(user.id, user);

    return success({ user, message: 'Verification email sent' }, 201);
  }),

  // 获取当前用户
  http.get('/api/v1/users/me', async () => {
    await randomDelay();
    const user = db.users.values().next().value;
    return success(user);
  }),

  // Token 刷新
  http.post('/api/v1/auth/refresh', async () => {
    await randomDelay(100, 300);
    return success({
      accessToken: MOCK_TOKEN,
      expiresIn: 604800,
    });
  }),
];
```

### 6.3 Agent Handler

```typescript
// mocks/handlers/agents.ts
import { http } from 'msw';
import { db } from '../db';
import { createAgent } from '../factories';
import { success, error, paginated } from '../utils/response';
import { randomDelay } from '../utils/delay';

export const agentHandlers = [
  // Agent 列表
  http.get('/api/v1/ws/:wsId/agents', async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);

    const agents = [...db.agents.values()];
    return success(paginated(agents, page, pageSize));
  }),

  // Agent 详情
  http.get('/api/v1/ws/:wsId/agents/:agentId', async ({ params }) => {
    await randomDelay();
    const agent = db.agents.get(params.agentId as string);
    if (!agent) return error(40401, 'Agent not found', 404);
    return success(agent);
  }),

  // 创建 Agent
  http.post('/api/v1/ws/:wsId/agents', async ({ request, params }) => {
    await randomDelay(300, 600);
    const body = await request.json() as Partial<Agent>;
    const agent = createAgent({ ...body, workspaceId: params.wsId as string });
    db.agents.set(agent.id, agent);
    return success(agent, 201);
  }),

  // 更新 Agent
  http.patch('/api/v1/ws/:wsId/agents/:agentId', async ({ request, params }) => {
    await randomDelay(200, 400);
    const agent = db.agents.get(params.agentId as string);
    if (!agent) return error(40401, 'Agent not found', 404);

    const body = await request.json() as Partial<Agent>;
    const updated = { ...agent, ...body, updatedAt: new Date().toISOString() };
    db.agents.set(updated.id, updated);
    return success(updated);
  }),

  // 删除 Agent
  http.delete('/api/v1/ws/:wsId/agents/:agentId', async ({ params }) => {
    await randomDelay(200, 400);
    const deleted = db.agents.delete(params.agentId as string);
    if (!deleted) return error(40401, 'Agent not found', 404);
    return success(null, 204);
  }),
];
```

### 6.4 流式消息 Handler (SSE)

```typescript
// mocks/handlers/messages.ts
import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { success, paginated } from '../utils/response';
import { randomDelay } from '../utils/delay';

export const messageHandlers = [
  // 消息历史
  http.get('/api/v1/ws/:wsId/sessions/:sessionId/messages', async ({ params, request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 50);

    const messages = db.messages.get(params.sessionId as string) ?? [];
    return success(paginated(messages, page, pageSize));
  }),

  // 发送消息 (SSE 流式响应)
  http.post('/api/v1/chat', ({ request }) => {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // 模拟 Agent 思考
        controller.enqueue(encoder.encode('data: {"type":"thinking","content":"分析用户请求..."}\n\n'));
        await new Promise((r) => setTimeout(r, 500));

        // 模拟流式文本输出
        const response = '好的，我来帮你分析这个问题。\n\n首先，我们需要考虑以下几个方面：\n\n1. **数据结构设计** — 选择合适的数据模型\n2. **API 接口** — 定义清晰的接口契约\n3. **性能优化** — 确保响应速度\n\n让我逐一为你详细说明。';

        const chunks = response.split('');
        for (const char of chunks) {
          controller.enqueue(encoder.encode(`data: {"type":"delta","content":"${char.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}\n\n`));
          await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
        }

        // 工具调用模拟
        controller.enqueue(encoder.encode('data: {"type":"tool_start","name":"web-search","args":{"query":"Next.js 15 best practices"}}\n\n'));
        await new Promise((r) => setTimeout(r, 1000));
        controller.enqueue(encoder.encode('data: {"type":"tool_result","name":"web-search","result":"Found 5 relevant articles..."}\n\n'));

        // Agent 切换模拟
        controller.enqueue(encoder.encode('data: {"type":"agent_switch","from":"Coordinator","to":"Frontend Dev"}\n\n'));
        await new Promise((r) => setTimeout(r, 300));

        // 完成
        controller.enqueue(encoder.encode('data: {"type":"done","usage":{"promptTokens":150,"completionTokens":280}}\n\n'));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }),
];
```

### 6.5 仪表盘 Handler

```typescript
// mocks/handlers/dashboard.ts
import { http } from 'msw';
import { faker } from '@faker-js/faker';
import { success } from '../utils/response';
import { randomDelay } from '../utils/delay';

export const dashboardHandlers = [
  // 概览统计
  http.get('/api/v1/orgs/:slug/ws/:wsSlug/stats', async () => {
    await randomDelay();

    return success({
      activeAgents: faker.number.int({ min: 3, max: 8 }),
      todaySessions: faker.number.int({ min: 10, max: 50 }),
      tokenUsage: faker.number.int({ min: 50000, max: 200000 }),
      completedTasks: faker.number.int({ min: 20, max: 100 }),
      trends: {
        activeAgents: faker.number.float({ min: -0.1, max: 0.3, fractionDigits: 2 }),
        todaySessions: faker.number.float({ min: -0.05, max: 0.5, fractionDigits: 2 }),
        tokenUsage: faker.number.float({ min: 0, max: 0.4, fractionDigits: 2 }),
        completedTasks: faker.number.float({ min: -0.1, max: 0.6, fractionDigits: 2 }),
      },
    });
  }),

  // 消息趋势 (7天)
  http.get('/api/v1/orgs/:slug/ws/:wsSlug/stats/messages', async () => {
    await randomDelay();

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        inbound: faker.number.int({ min: 20, max: 100 }),
        outbound: faker.number.int({ min: 30, max: 150 }),
      };
    });

    return success(days);
  }),

  // Agent 负载分布
  http.get('/api/v1/orgs/:slug/ws/:wsSlug/stats/agents', async () => {
    await randomDelay();

    return success([
      { role: 'coordinator', name: 'Coordinator', tasks: faker.number.int({ min: 30, max: 60 }), color: '#11181C' },
      { role: 'frontend', name: 'Frontend Dev', tasks: faker.number.int({ min: 20, max: 50 }), color: '#17C964' },
      { role: 'backend', name: 'Backend Dev', tasks: faker.number.int({ min: 20, max: 50 }), color: '#F5A524' },
      { role: 'reviewer', name: 'Code Reviewer', tasks: faker.number.int({ min: 15, max: 40 }), color: '#0E8AAA' },
      { role: 'testing', name: 'QA Engineer', tasks: faker.number.int({ min: 10, max: 30 }), color: '#F31260' },
    ]);
  }),
];
```

### 6.6 Handler 汇总

```typescript
// mocks/handlers/index.ts
import { authHandlers } from './auth';
import { agentHandlers } from './agents';
import { messageHandlers } from './messages';
import { dashboardHandlers } from './dashboard';
import { sessionHandlers } from './sessions';
import { workspaceHandlers } from './workspaces';
import { orgHandlers } from './orgs';
import { channelHandlers } from './channels';
import { knowledgeHandlers } from './knowledge';
import { pluginHandlers } from './plugins';
import { billingHandlers } from './billing';
import { userHandlers } from './users';

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...orgHandlers,
  ...workspaceHandlers,
  ...agentHandlers,
  ...sessionHandlers,
  ...messageHandlers,
  ...channelHandlers,
  ...knowledgeHandlers,
  ...pluginHandlers,
  ...billingHandlers,
  ...dashboardHandlers,
];
```

---

## 7 Mock 到真实 API 的切换

### 7.1 切换流程

```
Mock → 真实 API 切换流程:

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. 后端实现   │     │ 2. 对比验证   │     │ 3. 切换上线   │
│ 某个 API     │ →   │ Mock vs 真实  │ →   │ 关闭该 Mock  │
│              │     │ 响应格式一致   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 7.2 渐进式切换

```typescript
// 可以按模块逐步关闭 Mock
// mocks/handlers/index.ts

const useMock = process.env.NEXT_PUBLIC_API_MOCK === 'true';

export const handlers = [
  // Auth — 后端已实现，不再 Mock
  // ...authHandlers,

  // Agent — 后端已实现，不再 Mock
  // ...agentHandlers,

  // 以下模块仍使用 Mock
  ...(useMock ? sessionHandlers : []),
  ...(useMock ? messageHandlers : []),
  ...(useMock ? dashboardHandlers : []),
  ...(useMock ? channelHandlers : []),
  ...(useMock ? knowledgeHandlers : []),
  ...(useMock ? pluginHandlers : []),
  ...(useMock ? billingHandlers : []),
];
```

### 7.3 Schema 校验

```typescript
// 确保 Mock 数据与真实 API 格式一致
// 在测试中使用 Zod Schema 校验 Mock 响应

import { z } from 'zod';

const AgentResponseSchema = z.object({
  code: z.literal(0),
  message: z.string(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    role: z.enum(['coordinator', 'requirements', 'architecture', 'frontend', 'backend', 'testing', 'reviewer', 'devops']),
    model: z.string(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
  }),
});

// 测试中校验
test('GET /agents/:id returns valid schema', async () => {
  const res = await fetch('/api/v1/ws/ws_1/agents/agent_1');
  const body = await res.json();
  expect(() => AgentResponseSchema.parse(body)).not.toThrow();
});
```

---

## 8 测试集成

### 8.1 单元测试中使用

```typescript
// components/agent-card.test.tsx
import { render, screen } from '@testing-library/react';
import { server } from '@/mocks/server';
import { http } from 'msw';
import { AgentCard } from './agent-card';

test('renders agent name', async () => {
  // 可以在单个测试中覆盖 handler
  server.use(
    http.get('/api/v1/ws/:wsId/agents/:id', () => {
      return HttpResponse.json({
        code: 0,
        data: { id: 'agent_1', name: 'Custom Agent', role: 'specialist' },
      });
    }),
  );

  render(<AgentCard agentId="agent_1" />);
  expect(await screen.findByText('Custom Agent')).toBeInTheDocument();
});
```

### 8.2 E2E 测试中使用

```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test('send message and receive streamed response', async ({ page }) => {
  // MSW 在浏览器中自动拦截
  await page.goto('/org/nextai-demo/ws/default/chat');

  const input = page.getByPlaceholder('输入消息...');
  await input.fill('帮我分析一下代码');
  await input.press('Enter');

  // 等待流式响应完成
  const response = page.locator('[data-testid="agent-message"]').last();
  await expect(response).toBeVisible({ timeout: 10000 });
  await expect(response).toContainText('数据结构设计');
});
```
