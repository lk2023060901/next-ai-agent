# 测试策略

## 1 测试体系总览

### 1.1 测试金字塔

```
测试金字塔:

                 ╱╲
                ╱  ╲
               ╱ E2E╲          少量 — 关键业务流程
              ╱  测试  ╲        执行慢、成本高
             ╱──────────╲
            ╱  集成测试    ╲      适量 — API / 数据库 / 服务间交互
           ╱                ╲    中等速度
          ╱──────────────────╲
         ╱     单元测试        ╲   大量 — 函数 / 组件 / 工具类
        ╱                      ╲  执行快、成本低
       ╱────────────────────────╲
      ╱       静态检查            ╲ TypeCheck + Lint + Format
     ╱──────────────────────────────╲
```

### 1.2 覆盖率目标

| 层级 | 覆盖率目标 | 执行频率 | 执行环境 |
|------|-----------|---------|---------|
| 静态检查 | 100% (零警告) | 每次提交 | 本地 + CI |
| 单元测试 | ≥ 80% (核心模块 ≥ 90%) | 每次提交 | 本地 + CI |
| 集成测试 | 核心 API 100% 覆盖 | 每次 PR | CI |
| E2E 测试 | 关键业务流程 100% | 每日 / Release | CI |
| 性能测试 | 核心接口基准 | 每周 / Release | CI / 专用环境 |

### 1.3 测试工具链

| 工具 | 用途 | 适用范围 |
|------|------|---------|
| Vitest | 单元/集成测试 (TypeScript) | Web / Node.js 服务 |
| React Testing Library | React 组件测试 | Web 前端 |
| Playwright | E2E 浏览器测试 | Web 前端 |
| Go testing | 单元/集成测试 (Go) | API Gateway |
| pytest | 单元/集成测试 (Python) | 记忆服务 / AI 服务 |
| Testcontainers | 测试用容器管理 | 集成测试 |
| MSW (Mock Service Worker) | API Mock | 前端测试 |
| Faker.js | 测试数据生成 | 全栈 |
| k6 | 性能/压力测试 | 后端接口 |

---

## 2 单元测试

### 2.1 TypeScript 单元测试

#### 2.1.1 Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/e2e/**', '**/integration/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        '**/*.d.ts',
        '**/*.test.*',
        '**/types/**',
        '**/constants/**',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

#### 2.1.2 业务逻辑测试

```typescript
// services/agent-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from './agent-service';

describe('AgentService', () => {
  let service: AgentService;
  let mockRepo: MockAgentRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new AgentService(mockRepo);
  });

  describe('createAgent', () => {
    it('should create agent with valid config', async () => {
      const input = {
        name: 'Code Reviewer',
        role: 'reviewer' as const,
        model: 'claude-sonnet-4-20250514',
        workspaceId: 'ws_123',
      };

      const agent = await service.createAgent(input);

      expect(agent).toMatchObject({
        name: 'Code Reviewer',
        role: 'reviewer',
        model: 'claude-sonnet-4-20250514',
        isActive: true,
      });
      expect(agent.id).toBeDefined();
    });

    it('should throw when workspace agent limit exceeded', async () => {
      mockRepo.countByWorkspace.mockResolvedValue(50);

      await expect(
        service.createAgent({ name: 'Agent', role: 'specialist', model: 'gpt-4o', workspaceId: 'ws_full' }),
      ).rejects.toThrow('Agent limit exceeded');
    });
  });

  describe('assignTask', () => {
    it('should assign task to available agent', async () => {
      const agent = createMockAgent({ status: 'idle' });
      mockRepo.findAvailable.mockResolvedValue([agent]);

      const result = await service.assignTask('ws_123', { type: 'code-review', content: '...' });

      expect(result.assignedTo).toBe(agent.id);
      expect(result.status).toBe('assigned');
    });

    it('should queue task when no agents available', async () => {
      mockRepo.findAvailable.mockResolvedValue([]);

      const result = await service.assignTask('ws_123', { type: 'code-review', content: '...' });

      expect(result.status).toBe('queued');
    });
  });
});
```

#### 2.1.3 工具函数测试

```typescript
// utils/token-counter.test.ts
import { describe, it, expect } from 'vitest';
import { countTokens, truncateToTokenLimit } from './token-counter';

describe('countTokens', () => {
  it('should count tokens for English text', () => {
    expect(countTokens('Hello, world!')).toBeGreaterThan(0);
  });

  it('should count tokens for Chinese text', () => {
    const tokens = countTokens('你好，世界！');
    expect(tokens).toBeGreaterThan(0);
  });

  it('should return 0 for empty string', () => {
    expect(countTokens('')).toBe(0);
  });
});

describe('truncateToTokenLimit', () => {
  it('should not truncate text within limit', () => {
    const text = 'Short text';
    expect(truncateToTokenLimit(text, 100)).toBe(text);
  });

  it('should truncate text exceeding limit', () => {
    const text = 'A'.repeat(10000);
    const result = truncateToTokenLimit(text, 100);
    expect(countTokens(result)).toBeLessThanOrEqual(100);
  });
});
```

### 2.2 React 组件测试

#### 2.2.1 组件测试配置

```typescript
// vitest.config.web.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup-web.ts'],
    include: ['**/*.test.tsx'],
    css: false,
  },
});
```

```typescript
// tests/setup-web.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

#### 2.2.2 组件测试示例

```tsx
// components/agent-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgentCard } from './agent-card';

const mockAgent = {
  id: 'agent_1',
  name: 'Code Reviewer',
  role: 'reviewer',
  status: 'active',
  avatar: '/avatars/reviewer.png',
};

describe('AgentCard', () => {
  it('should render agent name and role', () => {
    render(<AgentCard agent={mockAgent} />);

    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('reviewer')).toBeInTheDocument();
  });

  it('should show active status badge', () => {
    render(<AgentCard agent={mockAgent} />);

    const badge = screen.getByText('active');
    expect(badge).toHaveClass('bg-success-50');
  });

  it('should call onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(<AgentCard agent={mockAgent} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith('agent_1');
  });

  it('should highlight when selected', () => {
    render(<AgentCard agent={mockAgent} isSelected />);

    expect(screen.getByRole('button').parentElement).toHaveClass('ring-primary');
  });
});
```

#### 2.2.3 Hook 测试

```typescript
// hooks/use-agent.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useAgent } from './use-agent';

const server = setupServer(
  http.get('/api/v1/agents/:id', ({ params }) => {
    return HttpResponse.json({
      code: 0,
      data: { id: params.id, name: 'Test Agent', role: 'specialist' },
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAgent', () => {
  it('should fetch agent data', async () => {
    const { result } = renderHook(() => useAgent('agent_1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.agent).toBeDefined();
    });

    expect(result.current.agent?.name).toBe('Test Agent');
    expect(result.current.isLoading).toBe(false);
  });
});
```

### 2.3 Go 单元测试

```go
// internal/service/user_service_test.go
package service_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/nextai-agent/gateway/internal/service"
)

func TestUserService_Authenticate(t *testing.T) {
    t.Run("valid credentials", func(t *testing.T) {
        svc := service.NewUserService(mockRepo)

        token, err := svc.Authenticate(context.Background(), "user@example.com", "password123")

        require.NoError(t, err)
        assert.NotEmpty(t, token.AccessToken)
        assert.NotEmpty(t, token.RefreshToken)
    })

    t.Run("invalid password", func(t *testing.T) {
        svc := service.NewUserService(mockRepo)

        _, err := svc.Authenticate(context.Background(), "user@example.com", "wrong")

        assert.ErrorIs(t, err, service.ErrUnauthorized)
    })

    t.Run("user not found", func(t *testing.T) {
        svc := service.NewUserService(mockRepo)

        _, err := svc.Authenticate(context.Background(), "nonexist@example.com", "password")

        assert.ErrorIs(t, err, service.ErrNotFound)
    })
}

// 表驱动测试
func TestRateLimiter_Allow(t *testing.T) {
    tests := []struct {
        name     string
        key      string
        limit    int
        window   time.Duration
        requests int
        wantOK   bool
    }{
        {"within limit", "user_1", 10, time.Minute, 5, true},
        {"at limit", "user_2", 10, time.Minute, 10, true},
        {"exceeds limit", "user_3", 10, time.Minute, 11, false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            limiter := ratelimit.New(tt.limit, tt.window)
            var ok bool
            for i := 0; i < tt.requests; i++ {
                ok = limiter.Allow(tt.key)
            }
            assert.Equal(t, tt.wantOK, ok)
        })
    }
}
```

### 2.4 Python 单元测试

```python
# tests/test_memory_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from memory_service.service import MemoryService
from memory_service.models import MemoryEntry, SearchResult


@pytest.fixture
def mock_vector_store():
    store = AsyncMock()
    store.search.return_value = [
        SearchResult(id="mem_1", score=0.95, content="Agent 配置方法"),
        SearchResult(id="mem_2", score=0.82, content="数据库连接池设置"),
    ]
    return store


@pytest.fixture
def service(mock_vector_store):
    return MemoryService(vector_store=mock_vector_store)


class TestMemoryService:
    async def test_search_returns_results_above_threshold(self, service):
        results = await service.search(
            query="如何配置 Agent",
            workspace_id="ws_123",
            threshold=0.8,
        )

        assert len(results) == 2
        assert results[0].score >= 0.8

    async def test_search_filters_below_threshold(self, service):
        results = await service.search(
            query="如何配置 Agent",
            workspace_id="ws_123",
            threshold=0.9,
        )

        assert len(results) == 1
        assert results[0].id == "mem_1"

    async def test_store_memory_generates_embedding(self, service, mock_vector_store):
        await service.store(
            content="新的记忆内容",
            workspace_id="ws_123",
            agent_id="agent_1",
        )

        mock_vector_store.insert.assert_called_once()
        call_args = mock_vector_store.insert.call_args
        assert call_args[1]["content"] == "新的记忆内容"

    async def test_search_empty_query_raises(self, service):
        with pytest.raises(ValueError, match="query cannot be empty"):
            await service.search(query="", workspace_id="ws_123")
```

---

## 3 集成测试

### 3.1 API 集成测试

```typescript
// tests/integration/api/agents.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, createTestUser, cleanupTestData } from '../helpers';

describe('Agent API', () => {
  let app: TestApp;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const user = await createTestUser(app);
    authToken = user.token;
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await app.close();
  });

  describe('POST /api/v1/agents', () => {
    it('should create agent with valid input', async () => {
      const res = await app.request('/api/v1/agents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Agent',
          role: 'specialist',
          model: 'claude-sonnet-4-20250514',
          systemPrompt: 'You are a helpful assistant.',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.name).toBe('Test Agent');
      expect(body.data.id).toBeDefined();
    });

    it('should return 422 for invalid input', async () => {
      const res = await app.request('/api/v1/agents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '' }),
      });

      expect(res.status).toBe(422);
    });

    it('should return 401 without auth token', async () => {
      const res = await app.request('/api/v1/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/agents', () => {
    it('should return paginated agent list', async () => {
      const res = await app.request('/api/v1/agents?page=1&pageSize=10', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.items).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();
    });
  });
});
```

### 3.2 数据库集成测试

```typescript
// tests/integration/db/agent-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase, resetDatabase } from '../helpers/db';
import { AgentRepository } from '@/repositories/agent-repository';

describe('AgentRepository', () => {
  let db: TestDatabase;
  let repo: AgentRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    await resetDatabase(db);
    repo = new AgentRepository(db);
  });

  it('should create and retrieve agent', async () => {
    const created = await repo.create({
      name: 'Test Agent',
      role: 'specialist',
      model: 'claude-sonnet-4-20250514',
      workspaceId: 'ws_test',
      createdBy: 'user_test',
    });

    const found = await repo.findById(created.id);

    expect(found).toBeDefined();
    expect(found!.name).toBe('Test Agent');
  });

  it('should soft delete agent', async () => {
    const agent = await repo.create({ /* ... */ });
    await repo.delete(agent.id);

    const found = await repo.findById(agent.id);
    expect(found).toBeNull();

    const foundWithDeleted = await repo.findById(agent.id, { includeDeleted: true });
    expect(foundWithDeleted).toBeDefined();
    expect(foundWithDeleted!.deletedAt).toBeDefined();
  });

  it('should paginate results', async () => {
    // 批量创建 25 个 Agent
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        repo.create({ name: `Agent ${i}`, role: 'specialist', model: 'gpt-4o', workspaceId: 'ws_test', createdBy: 'user_test' }),
      ),
    );

    const page1 = await repo.findByWorkspace('ws_test', { page: 1, pageSize: 10 });
    expect(page1.items).toHaveLength(10);
    expect(page1.pagination.total).toBe(25);
    expect(page1.pagination.hasMore).toBe(true);

    const page3 = await repo.findByWorkspace('ws_test', { page: 3, pageSize: 10 });
    expect(page3.items).toHaveLength(5);
    expect(page3.pagination.hasMore).toBe(false);
  });
});
```

### 3.3 Testcontainers 使用

```typescript
// tests/helpers/db.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

let pgContainer: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;

export async function createTestDatabase() {
  pgContainer = await new PostgreSqlContainer('postgres:16')
    .withDatabase('nextai_test')
    .start();

  redisContainer = await new RedisContainer('redis:7').start();

  const db = drizzle(pgContainer.getConnectionUri());
  await migrate(db, { migrationsFolder: './drizzle' });

  return {
    db,
    pgUri: pgContainer.getConnectionUri(),
    redisUri: redisContainer.getConnectionUrl(),
  };
}

export async function cleanupContainers() {
  await pgContainer?.stop();
  await redisContainer?.stop();
}
```

---

## 4 E2E 测试

### 4.1 Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 4.2 E2E 测试示例

```typescript
// e2e/agent-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Agent 协作流程', () => {
  test.beforeEach(async ({ page }) => {
    // 使用存储的认证状态
    await page.goto('/org/test-org/ws/default/chat');
  });

  test('用户发送消息并获得 Agent 回复', async ({ page }) => {
    // 输入消息
    const input = page.getByPlaceholder('输入消息...');
    await input.fill('帮我分析一下这个代码片段');
    await input.press('Enter');

    // 等待 Agent 响应
    const response = page.locator('[data-testid="agent-message"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });
    await expect(response).not.toBeEmpty();

    // 验证 Agent 角色标识
    const agentBadge = response.locator('[data-testid="agent-role-badge"]');
    await expect(agentBadge).toBeVisible();
  });

  test('创建新 Agent', async ({ page }) => {
    await page.goto('/org/test-org/ws/default/agents');

    // 点击创建按钮
    await page.getByRole('button', { name: '创建 Agent' }).click();

    // 填写表单
    await page.getByLabel('名称').fill('测试 Agent');
    await page.getByLabel('角色').selectOption('specialist');
    await page.getByLabel('模型').selectOption('claude-sonnet-4-20250514');
    await page.getByLabel('系统提示词').fill('你是一个测试助手');

    // 提交
    await page.getByRole('button', { name: '创建' }).click();

    // 验证创建成功
    await expect(page.getByText('测试 Agent')).toBeVisible();
    await expect(page.getByText('创建成功')).toBeVisible();
  });

  test('Agent 协作可视化', async ({ page }) => {
    await page.goto('/org/test-org/ws/default/agents/overview');

    // 验证协作拓扑图加载
    const topology = page.locator('[data-testid="agent-topology"]');
    await expect(topology).toBeVisible();

    // 验证 Agent 节点可见
    const nodes = topology.locator('[data-testid="agent-node"]');
    await expect(nodes).toHaveCount(await nodes.count());
    expect(await nodes.count()).toBeGreaterThan(0);

    // 点击 Agent 节点查看详情
    await nodes.first().click();
    await expect(page.getByTestId('agent-detail-panel')).toBeVisible();
  });
});
```

### 4.3 认证状态管理

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('邮箱').fill('test@example.com');
  await page.getByLabel('密码').fill('Test123456!');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page).toHaveURL(/\/org\//);

  await page.context().storageState({ path: authFile });
});
```

---

## 5 性能测试

### 5.1 k6 负载测试

```javascript
// tests/performance/api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTrend = new Trend('response_time');

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // 渐增到 50 并发
    { duration: '5m', target: 50 },    // 保持 50 并发
    { duration: '2m', target: 100 },   // 渐增到 100 并发
    { duration: '5m', target: 100 },   // 保持 100 并发
    { duration: '2m', target: 0 },     // 渐降到 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
    errors: ['rate<0.01'],                              // 错误率 < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  // Agent 列表接口
  const listRes = http.get(`${BASE_URL}/api/v1/agents`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });

  check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(listRes.status !== 200);
  responseTrend.add(listRes.timings.duration);

  sleep(1);

  // 发送消息接口
  const msgRes = http.post(
    `${BASE_URL}/api/v1/sessions/test/messages`,
    JSON.stringify({ content: '测试消息', agentId: 'agent_1' }),
    {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );

  check(msgRes, {
    'message status is 201': (r) => r.status === 201,
  });
  errorRate.add(msgRes.status !== 201);

  sleep(1);
}
```

### 5.2 性能基准指标

| 接口 | P50 | P95 | P99 | 最大 QPS |
|------|-----|-----|-----|---------|
| GET /agents | < 50ms | < 200ms | < 500ms | 1000 |
| POST /messages | < 100ms | < 300ms | < 800ms | 500 |
| GET /sessions | < 50ms | < 200ms | < 500ms | 800 |
| WebSocket 连接 | < 100ms | < 300ms | < 500ms | 200/s |
| 向量搜索 | < 100ms | < 300ms | < 1000ms | 200 |

---

## 6 测试数据管理

### 6.1 工厂函数

```typescript
// tests/factories/agent-factory.ts
import { faker } from '@faker-js/faker';
import type { Agent, CreateAgentInput } from '@/types';

export function createAgentInput(overrides?: Partial<CreateAgentInput>): CreateAgentInput {
  return {
    name: faker.person.jobTitle(),
    role: faker.helpers.arrayElement(['coordinator', 'specialist', 'reviewer']),
    model: faker.helpers.arrayElement(['claude-sonnet-4-20250514', 'gpt-4o', 'claude-haiku-4-5-20251001']),
    systemPrompt: faker.lorem.paragraph(),
    workspaceId: `ws_${faker.string.nanoid()}`,
    ...overrides,
  };
}

export function createAgent(overrides?: Partial<Agent>): Agent {
  return {
    id: `agent_${faker.string.nanoid()}`,
    ...createAgentInput(),
    isActive: true,
    createdBy: `user_${faker.string.nanoid()}`,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}
```

### 6.2 Seed 脚本

```typescript
// scripts/seed-test-data.ts
import { db } from '@nextai-agent/database';
import { users, workspaces, agents } from '@nextai-agent/database/schema';
import { createAgentInput } from '../tests/factories/agent-factory';

async function seed() {
  console.log('Seeding test data...');

  // 创建测试用户
  const [testUser] = await db.insert(users).values({
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: await hashPassword('Test123456!'),
  }).returning();

  // 创建测试工作区
  const [testWorkspace] = await db.insert(workspaces).values({
    name: 'Default Workspace',
    slug: 'default',
    ownerId: testUser.id,
  }).returning();

  // 创建测试 Agent
  const agentData = Array.from({ length: 10 }, () =>
    createAgentInput({
      workspaceId: testWorkspace.id,
      createdBy: testUser.id,
    }),
  );
  await db.insert(agents).values(agentData);

  console.log('Seed complete!');
}

seed().catch(console.error);
```

---

## 7 CI 中的测试编排

### 7.1 测试执行顺序

```
CI 测试流水线:

┌────────────────────────────────────────────────────────┐
│  Stage 1: 静态检查 (并行)                                │
│  ┌─────────┐  ┌───────────┐  ┌──────────┐             │
│  │ ESLint  │  │ TypeCheck │  │ Prettier │             │
│  └─────────┘  └───────────┘  └──────────┘             │
├────────────────────────────────────────────────────────┤
│  Stage 2: 单元测试 (并行)                                │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐              │
│  │ TS Unit │  │ Go Unit  │  │ Py Unit  │              │
│  └─────────┘  └──────────┘  └──────────┘              │
├────────────────────────────────────────────────────────┤
│  Stage 3: 集成测试 (需要数据库)                          │
│  ┌──────────────┐  ┌────────────────┐                  │
│  │ API 集成测试  │  │ DB 集成测试     │                  │
│  └──────────────┘  └────────────────┘                  │
├────────────────────────────────────────────────────────┤
│  Stage 4: E2E 测试 (Release 时触发)                     │
│  ┌──────────────┐  ┌────────────────┐                  │
│  │ Chromium E2E │  │ Firefox E2E   │                  │
│  └──────────────┘  └────────────────┘                  │
├────────────────────────────────────────────────────────┤
│  Stage 5: 构建验证                                      │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Web Build │  │ Docker Build │  │ Go Build     │    │
│  └───────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────┘
```

### 7.2 测试脚本

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "lint": "eslint . && prettier --check .",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 8 测试最佳实践

### 8.1 编写原则

| 原则 | 说明 |
|------|------|
| AAA 模式 | Arrange → Act → Assert，三段式组织测试 |
| 单一断言 | 每个测试聚焦一个行为验证 |
| 独立性 | 测试间不依赖执行顺序，不共享可变状态 |
| 可读性 | 测试名称描述行为和预期，如 `should return error when input is empty` |
| 确定性 | 测试结果不受时间、网络、外部服务影响 |
| 快速反馈 | 单元测试整体执行时间 < 30 秒 |

### 8.2 Mock 策略

| 场景 | Mock 方式 | 示例 |
|------|----------|------|
| HTTP 请求 | MSW (Service Worker) | 前端 API 调用 |
| 数据库 | Testcontainers (真实 DB) | 集成测试 |
| 外部 API | vi.mock / nock | 第三方支付、AI 接口 |
| 时间 | vi.useFakeTimers | 定时任务、超时逻辑 |
| 文件系统 | memfs / tmp 目录 | 文件上传处理 |

### 8.3 反模式清单

| 反模式 | 问题 | 改进 |
|--------|------|------|
| 测试实现细节 | 重构即破碎 | 测试行为和输出 |
| 过度 Mock | 测试无意义 | 仅 Mock 外部边界 |
| 共享可变状态 | 测试互相影响 | beforeEach 重置 |
| 硬编码 ID | 冲突/脆弱 | 使用工厂函数 |
| Sleep 等待 | 不稳定/慢 | 使用 waitFor / polling |
| 忽略失败测试 | 质量退化 | 修复或删除 |
| 仅测试 happy path | 遗漏边界 | 覆盖异常和边界 |
