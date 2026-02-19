# Skill: API Integration Test Suite Generator

> 生成 API 集成测试代码，覆盖请求/响应校验、认证、边界情况。

## 触发条件

当用户要求编写 API 测试、集成测试、端到端测试时激活此 Skill。

## 上下文

### 技术栈

- Vitest (TypeScript 测试运行器)
- Supertest (HTTP 请求测试)
- MSW (Mock 外部依赖)
- Testify (Go 测试断言)
- pytest + httpx (Python 测试)

### 测试规范

| 项目 | 目标 |
|------|------|
| 覆盖率 | ≥80% (行覆盖) |
| 命名 | `describe` 描述资源, `it` 描述行为 |
| 隔离 | 每个测试用例独立，不共享状态 |
| 数据 | 使用工厂函数生成测试数据 |
| 清理 | `afterEach` 清理所有 Mock 和状态 |

### API 响应格式

```json
// 成功
{ "code": 0, "message": "success", "data": {...}, "meta": {"requestId": "...", "timestamp": "..."} }

// 分页
{ "code": 0, "data": { "items": [...], "pagination": { "total": 100, "cursor": "...", "hasMore": true, "limit": 20 } } }

// 错误
{ "code": 40201, "message": "...", "errors": [...] }
```

## 生成规则

### 1. TypeScript 测试模板 (Vitest + Supertest)

```typescript
// tests/integration/agents.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createTestUser, createTestAgent, cleanupTestData } from '../helpers/factories';
import { generateTestToken } from '../helpers/auth';

describe('Agent API', () => {
  let app: Express.Application;
  let authToken: string;
  let testWorkspaceId: string;

  beforeAll(async () => {
    app = createApp();
    const user = await createTestUser();
    authToken = generateTestToken(user);
    testWorkspaceId = user.workspaceId;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/v1/workspaces/:wsId/agents', () => {
    it('应返回 Agent 分页列表', async () => {
      // Arrange
      await createTestAgent({ workspaceId: testWorkspaceId });
      await createTestAgent({ workspaceId: testWorkspaceId });

      // Act
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/agents`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.pagination).toMatchObject({
        limit: 10,
        hasMore: false,
      });
    });

    it('未认证时应返回 401', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/agents`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(40001);
    });

    it('无权限时应返回 403', async () => {
      const guestToken = generateTestToken({ role: 'ws_guest' });
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/agents`)
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(40101);
    });
  });

  describe('POST /api/v1/workspaces/:wsId/agents', () => {
    it('应成功创建 Agent', async () => {
      const payload = {
        name: 'Test Agent',
        role: 'frontend',
        model: 'gpt-4o',
        systemPrompt: 'You are a frontend developer.',
      };

      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/agents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toMatchObject({
        name: 'Test Agent',
        role: 'frontend',
        status: 'active',
      });
      expect(res.body.data.id).toBeDefined();
    });

    it('名称为空时应返回 400', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/agents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'frontend' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(40200);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
        ]),
      );
    });

    it('重复名称应返回 409', async () => {
      await createTestAgent({ workspaceId: testWorkspaceId, name: 'Duplicate' });

      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/agents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Duplicate', role: 'backend', model: 'gpt-4o' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe(40401);
    });
  });

  describe('DELETE /api/v1/agents/:agentId', () => {
    it('应成功删除 Agent', async () => {
      const agent = await createTestAgent({ workspaceId: testWorkspaceId });

      const res = await request(app)
        .delete(`/api/v1/agents/${agent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // 验证确已删除
      const getRes = await request(app)
        .get(`/api/v1/agents/${agent.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.status).toBe(404);
    });

    it('不存在的 Agent 应返回 404', async () => {
      const res = await request(app)
        .delete('/api/v1/agents/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(40301);
    });
  });
});
```

### 2. 测试辅助函数

```typescript
// tests/helpers/factories.ts
import { faker } from '@faker-js/faker/locale/zh_CN';

export async function createTestUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    username: faker.internet.username(),
    email: faker.internet.email(),
    role: 'ws_admin',
    workspaceId: faker.string.uuid(),
    ...overrides,
  };
}

export async function createTestAgent(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    role: 'frontend',
    model: 'gpt-4o',
    status: 'active',
    ...overrides,
  };
}
```

```typescript
// tests/helpers/auth.ts
import jwt from 'jsonwebtoken';

export function generateTestToken(user: { id?: string; role?: string }) {
  return jwt.sign(
    {
      sub: user.id ?? 'test-user-id',
      role: user.role ?? 'ws_admin',
      permissions: ['agent:use', 'agent:manage', 'session:read'],
    },
    process.env.JWT_SECRET ?? 'test-secret',
    { expiresIn: '1h' },
  );
}
```

### 3. Go 测试模板

```go
// internal/handler/agent_test.go
package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAgentHandler_List(t *testing.T) {
	t.Run("should return agent list", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/workspaces/test-ws/agents", nil)
		req.Header.Set("Authorization", "Bearer "+testToken)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)
		assert.Equal(t, float64(0), resp["code"])
	})

	t.Run("should return 401 without token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/workspaces/test-ws/agents", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}
```

### 4. Python 测试模板

```python
# tests/test_memory_api.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_create_memory(client: AsyncClient):
    response = await client.post("/api/v1/memory/", json={
        "workspace_id": "test-ws",
        "agent_id": "test-agent",
        "session_id": "test-session",
        "content": "用户喜欢使用 Python",
        "memory_type": "semantic",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["memory_type"] == "semantic"

@pytest.mark.asyncio
async def test_search_memory(client: AsyncClient):
    response = await client.post("/api/v1/memory/search", json={
        "workspace_id": "test-ws",
        "query": "Python",
        "top_k": 5,
    })
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
```

### 5. 测试覆盖清单

每个 API 端点应覆盖：

| 场景 | 预期 |
|------|------|
| 正常请求 | 200/201 + 正确数据 |
| 未认证 | 401 |
| 无权限 | 403 |
| 参数缺失 | 400 + errors 数组 |
| 资源不存在 | 404 |
| 数据冲突 | 409 |
| 分页 (第一页) | 正确的 items + hasMore |
| 分页 (最后一页) | hasMore: false |
| 空列表 | items: [], total: 0 |
