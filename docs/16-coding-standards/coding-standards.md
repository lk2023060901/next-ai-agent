# 编码规范

## 1 通用原则

### 1.1 核心理念

| 原则 | 说明 |
|------|------|
| 可读性优先 | 代码是写给人看的，优先清晰可读，避免炫技 |
| 一致性 | 团队统一风格，不因个人偏好产生差异 |
| 最小惊讶 | API/函数行为应符合直觉预期 |
| DRY | 避免重复，但不过度抽象；3 次以上重复再提取 |
| YAGNI | 不实现当前不需要的功能 |
| 单一职责 | 函数/组件/模块只做一件事 |

### 1.2 语言版本要求

| 语言 | 版本 | 标准 |
|------|------|------|
| TypeScript | 5.6+ | ES2024 / strict 模式 |
| React | 19.x | 函数组件 + Hooks |
| Next.js | 15.x | App Router |
| Go | 1.23+ | Go Modules |
| Python | 3.12+ | Type Hints (PEP 484+) |
| SQL | PostgreSQL 16 | 使用标准 SQL，避免非标准扩展 |

---

## 2 TypeScript 规范

### 2.1 基本风格

```typescript
// ✅ 使用 type 优先，interface 仅在需要 extends/implements 时使用
type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
};

// ✅ 使用 const 断言和 as const
const ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

type Role = (typeof ROLE)[keyof typeof ROLE];

// ✅ 枚举值使用联合类型而非 enum
type Status = 'active' | 'inactive' | 'suspended';

// ❌ 避免使用 enum
// enum Status { Active, Inactive, Suspended }
```

### 2.2 命名约定

| 类型 | 风格 | 示例 |
|------|------|------|
| 变量 / 函数 | camelCase | `getUserById`, `isLoading` |
| 类 / 类型 / 接口 | PascalCase | `UserProfile`, `AgentConfig` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 文件名 (组件) | kebab-case | `user-profile.tsx`, `agent-card.tsx` |
| 文件名 (工具/配置) | kebab-case | `auth-utils.ts`, `db-config.ts` |
| 目录名 | kebab-case | `agent-system/`, `user-auth/` |
| 环境变量 | UPPER_SNAKE_CASE | `DATABASE_URL`, `REDIS_HOST` |
| CSS 类名 | kebab-case (TailwindCSS) | `text-primary`, `bg-content1` |
| 数据库表名 | snake_case (复数) | `users`, `agent_configs` |
| 数据库字段 | snake_case | `created_at`, `display_name` |
| API 路径 | kebab-case | `/api/v1/agent-configs` |

### 2.3 函数规范

```typescript
// ✅ 明确返回类型（公开 API / 工具函数必须标注）
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(amount);
}

// ✅ 参数超过 3 个使用对象参数
export function createAgent(options: {
  name: string;
  role: AgentRole;
  model: string;
  systemPrompt: string;
  tools?: string[];
}): Agent {
  // ...
}

// ✅ 异步函数统一使用 async/await，禁止混用 .then()
export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/v1/users/${id}`);
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch user');
  }
  return response.json();
}

// ❌ 避免嵌套超过 3 层
// ❌ 避免函数体超过 50 行
```

### 2.4 类型系统

```typescript
// ✅ 善用工具类型
type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateUserInput = Partial<Pick<User, 'displayName' | 'avatarUrl' | 'bio'>>;

// ✅ 使用 Zod 做运行时校验 + 类型推导
import { z } from 'zod';

const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.enum(['coordinator', 'specialist', 'reviewer']),
  model: z.string(),
  systemPrompt: z.string().max(10000),
  tools: z.array(z.string()).optional(),
});

type CreateAgentInput = z.infer<typeof CreateAgentSchema>;

// ✅ 严格禁止 any，必要时使用 unknown 并配合类型守卫
function processEvent(event: unknown): void {
  if (isAgentEvent(event)) {
    handleAgentEvent(event);
  }
}

// ✅ 泛型命名遵循语义化
type ApiResponse<TData> = {
  code: number;
  message: string;
  data: TData;
};
```

### 2.5 导入顺序

```typescript
// 1. Node.js 内置模块
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// 2. 第三方库
import { z } from 'zod';
import { eq } from 'drizzle-orm';

// 3. 内部包 (@nextai-agent/*)
import { logger } from '@nextai-agent/logger';
import { db } from '@nextai-agent/database';

// 4. 相对路径导入 (由远及近)
import { AgentService } from '../../services/agent-service';
import { formatDate } from '../utils/format';
import { AGENT_ROLES } from './constants';
```

> ESLint `import/order` 规则自动执行排序，保存时自动修复。

### 2.6 错误处理

```typescript
// ✅ 自定义错误类层级
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} with id ${id} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>) {
    super('VALIDATION_ERROR', 'Input validation failed', 422, details);
  }
}

// ✅ 统一错误处理中间件
export function errorHandler(err: unknown, req: Request, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }
  // 未知错误不暴露细节
  logger.error('Unhandled error', { error: err });
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
  });
}
```

---

## 3 React / Next.js 规范

### 3.1 组件设计

```tsx
// ✅ 组件 Props 使用 type + 语义化命名
type AgentCardProps = {
  agent: Agent;
  isSelected?: boolean;
  onSelect?: (agentId: string) => void;
};

// ✅ 函数组件 + 解构 Props
export function AgentCard({ agent, isSelected = false, onSelect }: AgentCardProps) {
  return (
    <Card
      className={cn('cursor-pointer transition-shadow', isSelected && 'ring-2 ring-primary')}
      isPressable
      onPress={() => onSelect?.(agent.id)}
    >
      <CardBody className="flex flex-row items-center gap-3">
        <Avatar src={agent.avatar} name={agent.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          <p className="text-xs text-default-500">{agent.role}</p>
        </div>
        <Badge color={agent.status === 'active' ? 'success' : 'default'}>
          {agent.status}
        </Badge>
      </CardBody>
    </Card>
  );
}
```

### 3.2 组件分层

```
组件分层结构:

┌─────────────────────────────────────────────────────────────────┐
│  Page (app/.../page.tsx)                                        │
│  - 数据获取（Server Component / React Query）                    │
│  - 页面级布局编排                                                │
├─────────────────────────────────────────────────────────────────┤
│  Feature (components/features/*)                                │
│  - 业务逻辑组件                                                  │
│  - 可包含状态管理和副作用                                         │
│  - 组合 UI 组件                                                  │
├─────────────────────────────────────────────────────────────────┤
│  UI (components/ui/*)                                           │
│  - 纯展示组件，基于 HeroUI 封装                                  │
│  - 无业务逻辑，仅接收 Props                                      │
│  - 可被任意 Feature 组件复用                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Hooks 规范

```typescript
// ✅ 自定义 Hook 以 use 开头，返回语义化对象
export function useAgent(agentId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentApi.getById(agentId),
    enabled: !!agentId,
  });

  return { agent: data, isLoading, error };
}

// ✅ 副作用 Hook 封装 Mutation
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: agentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

// ✅ Hook 文件与组件分离
// hooks/use-agent.ts      — 数据 Hook
// hooks/use-websocket.ts  — WebSocket Hook
// hooks/use-debounce.ts   — 通用工具 Hook
```

### 3.4 Server Component vs Client Component

| 场景 | 选择 | 说明 |
|------|------|------|
| 静态展示 / SEO 页面 | Server Component | 默认，无需标注 |
| 数据获取 (直接查库) | Server Component | 在组件内直接调用数据层 |
| 交互操作 (点击/输入) | Client Component | 顶部添加 `'use client'` |
| 状态管理 (useState 等) | Client Component | 含 Hooks 的组件 |
| 浏览器 API | Client Component | window/localStorage 等 |

**原则**: Server Component 优先，仅在需要交互时使用 Client Component。Client Component 尽量放在组件树的叶子节点。

### 3.5 样式规范

```tsx
// ✅ 使用 TailwindCSS 实用类 + cn() 工具合并
import { cn } from '@nextui-org/react';

function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        status === 'active' && 'bg-success-50 text-success-700',
        status === 'error' && 'bg-danger-50 text-danger-700',
        status === 'pending' && 'bg-warning-50 text-warning-700',
        className,
      )}
    >
      {status}
    </span>
  );
}

// ❌ 禁止使用内联 style（除动态计算值外）
// ❌ 禁止使用 CSS Modules
// ❌ 禁止使用 !important
```

### 3.6 状态管理规范

| 状态类型 | 工具 | 示例 |
|----------|------|------|
| 服务端数据 | React Query (TanStack Query) | 用户信息、Agent 列表 |
| 全局 UI 状态 | Zustand | 侧边栏折叠、主题切换 |
| 表单状态 | React Hook Form + Zod | 创建 Agent 表单 |
| URL 状态 | nuqs (URL Search Params) | 筛选、排序、分页 |
| 组件局部状态 | useState / useReducer | 弹窗开关、输入框 |
| AI 流式响应 | Vercel AI SDK (useChat) | 对话消息流 |

---

## 4 Go 语言规范

### 4.1 项目结构

```
services/api-gateway/
├── cmd/
│   └── server/
│       └── main.go              # 入口
├── internal/
│   ├── config/                  # 配置加载
│   ├── handler/                 # HTTP Handler
│   ├── middleware/               # 中间件
│   ├── service/                 # 业务逻辑
│   ├── repository/              # 数据访问
│   └── model/                   # 数据模型
├── pkg/                         # 可复用包
│   ├── auth/
│   ├── ratelimit/
│   └── response/
├── api/                         # OpenAPI 规范
├── go.mod
└── go.sum
```

### 4.2 命名约定

| 类型 | 风格 | 示例 |
|------|------|------|
| 包名 | 小写单词，不用下划线 | `ratelimit`, `authz` |
| 导出函数/类型 | PascalCase | `NewRouter`, `UserService` |
| 私有函数/变量 | camelCase | `parseToken`, `maxRetries` |
| 接口名 | PascalCase + er 后缀 | `Reader`, `AgentRunner` |
| 常量 | PascalCase 或 UPPER_SNAKE | `MaxConnections`, `DefaultTimeout` |
| 错误变量 | Err 前缀 | `ErrNotFound`, `ErrUnauthorized` |

### 4.3 错误处理

```go
// ✅ 自定义错误类型
type AppError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Status  int    `json:"-"`
}

func (e *AppError) Error() string {
    return e.Message
}

var (
    ErrNotFound     = &AppError{Code: "NOT_FOUND", Message: "resource not found", Status: 404}
    ErrUnauthorized = &AppError{Code: "UNAUTHORIZED", Message: "unauthorized", Status: 401}
    ErrForbidden    = &AppError{Code: "FORBIDDEN", Message: "forbidden", Status: 403}
)

// ✅ 使用 fmt.Errorf + %w 包装错误
func (s *UserService) GetByID(ctx context.Context, id string) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("UserService.GetByID: %w", err)
    }
    if user == nil {
        return nil, ErrNotFound
    }
    return user, nil
}

// ✅ 永远检查 error 返回
// ❌ 禁止使用 _ 忽略 error（除非有明确注释说明原因）
```

### 4.4 并发规范

```go
// ✅ 使用 context 控制 goroutine 生命周期
func (s *AgentService) RunAgent(ctx context.Context, config AgentConfig) error {
    g, ctx := errgroup.WithContext(ctx)

    g.Go(func() error {
        return s.processMessages(ctx, config)
    })

    g.Go(func() error {
        return s.watchHealth(ctx, config)
    })

    return g.Wait()
}

// ✅ channel 使用完毕必须 close
// ✅ 优先使用 sync.Once / sync.Map 而非手动加锁
// ❌ 禁止裸起 goroutine，必须有 recover 机制
```

---

## 5 Python 规范

### 5.1 基本风格

| 规则 | 说明 |
|------|------|
| 格式化工具 | Black (line-length=100) |
| Linter | Ruff |
| 类型检查 | mypy (strict 模式) |
| 导入排序 | isort (Black 兼容 profile) |
| Docstring | Google 风格 |

### 5.2 命名约定

| 类型 | 风格 | 示例 |
|------|------|------|
| 模块 / 包 | snake_case | `memory_service`, `embedding_utils` |
| 类名 | PascalCase | `MemoryManager`, `VectorStore` |
| 函数 / 方法 | snake_case | `get_embeddings`, `compress_context` |
| 常量 | UPPER_SNAKE_CASE | `MAX_TOKEN_LIMIT`, `DEFAULT_MODEL` |
| 私有成员 | 单下划线前缀 | `_internal_cache`, `_process_batch` |

### 5.3 类型注解

```python
from typing import TypeAlias
from collections.abc import Sequence

# ✅ 使用内置类型语法 (Python 3.12+)
def search_memory(
    query: str,
    workspace_id: str,
    *,
    top_k: int = 10,
    threshold: float = 0.7,
    filters: dict[str, str] | None = None,
) -> list[MemoryResult]:
    """搜索记忆库。

    Args:
        query: 搜索查询文本。
        workspace_id: 工作区 ID。
        top_k: 返回结果数量上限。
        threshold: 相似度阈值。
        filters: 可选的元数据过滤条件。

    Returns:
        匹配的记忆结果列表，按相关性排序。

    Raises:
        ValueError: 当 query 为空字符串时。
        ConnectionError: 当 Milvus 连接失败时。
    """
    ...

# ✅ 使用 TypeAlias 定义复杂类型
EmbeddingVector: TypeAlias = list[float]
TokenCount: TypeAlias = int
```

### 5.4 异步代码

```python
import asyncio
from contextlib import asynccontextmanager

# ✅ 异步数据库操作
async def get_agent_memory(
    agent_id: str,
    session_id: str,
) -> list[MemoryEntry]:
    async with get_db_session() as session:
        result = await session.execute(
            select(MemoryEntry)
            .where(MemoryEntry.agent_id == agent_id)
            .where(MemoryEntry.session_id == session_id)
            .order_by(MemoryEntry.created_at.desc())
            .limit(50)
        )
        return list(result.scalars().all())

# ✅ 并发任务使用 asyncio.gather / TaskGroup
async def process_batch(items: list[str]) -> list[Embedding]:
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(embed_text(item)) for item in items]
    return [task.result() for task in tasks]
```

---

## 6 数据库规范

### 6.1 SQL 命名规范

| 对象 | 风格 | 示例 |
|------|------|------|
| 表名 | snake_case (复数) | `users`, `agent_configs` |
| 字段名 | snake_case | `created_at`, `workspace_id` |
| 主键 | `id` (UUID) | `id UUID DEFAULT gen_random_uuid()` |
| 外键 | `{表名单数}_id` | `user_id`, `workspace_id` |
| 索引名 | `idx_{表名}_{字段名}` | `idx_users_email` |
| 唯一索引 | `uniq_{表名}_{字段名}` | `uniq_users_email` |
| 复合索引 | `idx_{表名}_{字段1}_{字段2}` | `idx_messages_session_id_created_at` |
| 枚举类型 | snake_case | `agent_role`, `channel_type` |

### 6.2 字段规范

```sql
-- ✅ 标准字段模板
CREATE TABLE agents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    role          agent_role NOT NULL DEFAULT 'specialist',
    model         VARCHAR(50) NOT NULL,
    system_prompt TEXT NOT NULL DEFAULT '',
    config        JSONB NOT NULL DEFAULT '{}',
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_by    UUID NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ✅ 时间字段统一使用 TIMESTAMPTZ
-- ✅ 布尔字段使用 is_ / has_ 前缀
-- ✅ JSON 字段使用 JSONB 而非 JSON
-- ✅ 字符串长度约束必须设置
-- ❌ 禁止使用 SERIAL，ID 统一使用 UUID
-- ❌ 禁止使用 ON DELETE SET NULL（除非有明确业务需求）
```

### 6.3 查询规范

```sql
-- ✅ 分页查询使用 cursor 分页（大数据量）
SELECT id, name, created_at
FROM agents
WHERE workspace_id = $1
  AND created_at < $2
ORDER BY created_at DESC
LIMIT 20;

-- ✅ 批量操作使用 UNNEST
INSERT INTO agent_tools (agent_id, tool_name)
SELECT $1, UNNEST($2::text[]);

-- ✅ 查询结果仅 SELECT 需要的列
-- ❌ 禁止 SELECT *
-- ❌ 禁止在循环中执行查询 (N+1)
-- ❌ 禁止在事务中执行外部 API 调用
```

---

## 7 API 设计规范

### 7.1 RESTful 约定

| 操作 | 方法 | 路径 | 示例 |
|------|------|------|------|
| 列表 | GET | /resources | `GET /api/v1/agents` |
| 详情 | GET | /resources/:id | `GET /api/v1/agents/:id` |
| 创建 | POST | /resources | `POST /api/v1/agents` |
| 更新 | PATCH | /resources/:id | `PATCH /api/v1/agents/:id` |
| 删除 | DELETE | /resources/:id | `DELETE /api/v1/agents/:id` |

### 7.2 响应格式

```json
// ✅ 成功响应
{
  "code": 0,
  "message": "success",
  "data": { ... }
}

// ✅ 列表响应（包含分页）
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "hasMore": true
    }
  }
}

// ✅ 错误响应
{
  "code": 40001,
  "message": "Validation failed",
  "details": {
    "name": ["Name is required"],
    "email": ["Invalid email format"]
  }
}
```

### 7.3 接口安全

| 规则 | 说明 |
|------|------|
| 认证 | 所有非公开 API 必须携带 Bearer Token |
| 权限校验 | 使用 RBAC 中间件，按角色控制访问 |
| 输入校验 | 所有输入使用 Zod Schema 验证 |
| 速率限制 | 按 API Key / IP 限流 |
| SQL 注入 | 使用参数化查询，禁止拼接 SQL |
| XSS | 输出转义，CSP Header |
| CORS | 白名单配置，禁止 `*` |

---

## 8 注释与文档规范

### 8.1 代码注释

```typescript
// ✅ 仅在逻辑不明显时添加注释，解释「为什么」而非「做什么」
// Agent 空闲超过 30 分钟后自动休眠，减少资源占用
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// ✅ TODO/FIXME 格式
// TODO(username): 实现消息重试机制 — #123
// FIXME(username): 高并发下存在竞态条件 — #456

// ❌ 禁止无意义注释
// 获取用户  ← 看函数名就知道
function getUser() {}
```

### 8.2 JSDoc / TSDoc

```typescript
/**
 * 创建新的 Agent 实例并注册到协作网络。
 *
 * @param options - Agent 配置选项
 * @returns 创建完成的 Agent 实例
 * @throws {ValidationError} 配置参数不合法时
 * @throws {QuotaError} 工作区 Agent 数量超出配额时
 *
 * @example
 * ```ts
 * const agent = await createAgent({
 *   name: 'Code Reviewer',
 *   role: 'reviewer',
 *   model: 'claude-sonnet-4-20250514',
 * });
 * ```
 */
export async function createAgent(options: CreateAgentOptions): Promise<Agent> {
  // ...
}
```

---

## 9 工程配置

### 9.1 ESLint 配置

```javascript
// eslint.config.js (Flat Config)
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // Import
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      }],
      'import/no-duplicates': 'error',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
);
```

### 9.2 Prettier 配置

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 9.3 TypeScript 配置

```json
// tsconfig.base.json (Monorepo 根)
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true
  }
}
```

### 9.4 Go Lint 配置

```yaml
# .golangci.yml
linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - unused
    - gofmt
    - goimports
    - gocritic
    - misspell
    - prealloc
    - revive

linters-settings:
  govet:
    check-shadowing: true
  revive:
    rules:
      - name: exported
        severity: warning
      - name: unexported-return
        severity: warning
  goimports:
    local-prefixes: github.com/nextai-agent

run:
  timeout: 5m
  go: '1.23'
```

---

## 10 安全编码规范

### 10.1 敏感信息

| 规则 | 说明 |
|------|------|
| 禁止硬编码 | API Key、密码、Token 禁止出现在代码中 |
| 环境变量 | 敏感配置通过 `.env` 或 Vault 注入 |
| .gitignore | `.env*`、`credentials/` 必须在忽略列表 |
| 日志脱敏 | 日志中禁止输出完整 Token、密码、信用卡号 |
| 响应过滤 | API 返回不包含 `password`、`secret` 字段 |

### 10.2 输入安全

```typescript
// ✅ 所有用户输入必须校验
const inputSchema = z.object({
  query: z.string().min(1).max(1000).trim(),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ✅ 文件上传校验
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ✅ HTML 转义输出内容
import { sanitize } from 'isomorphic-dompurify';
const safeHtml = sanitize(userInput);
```

### 10.3 依赖安全

| 工具 | 用途 | 执行时机 |
|------|------|---------|
| `pnpm audit` | 检查 Node.js 依赖漏洞 | CI / 每周 |
| `govulncheck` | 检查 Go 依赖漏洞 | CI / 每周 |
| `pip-audit` | 检查 Python 依赖漏洞 | CI / 每周 |
| Dependabot | 自动更新有漏洞的依赖 | 持续 |

---

## 11 日志规范

### 11.1 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| `error` | 需要人工介入的错误 | 数据库连接失败、支付回调异常 |
| `warn` | 可能有问题但系统可恢复 | 重试成功、接近限流阈值 |
| `info` | 关键业务事件 | 用户注册、Agent 创建、订单完成 |
| `debug` | 开发调试详情 | 请求参数、SQL 语句、中间变量 |

### 11.2 结构化日志

```typescript
// ✅ 使用结构化 JSON 格式
import { logger } from '@nextai-agent/logger';

logger.info('Agent created', {
  agentId: agent.id,
  workspaceId: agent.workspaceId,
  role: agent.role,
  model: agent.model,
  userId: ctx.userId,
  duration: Date.now() - startTime,
});

// ✅ 请求链路追踪
logger.info('API request', {
  traceId: ctx.traceId,
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  duration: ms,
  userId: ctx.userId,
});

// ❌ 禁止 console.log 在生产代码
// ❌ 禁止日志包含敏感信息
```

---

## 12 代码审查清单

### 12.1 提交前自查

| 类别 | 检查项 |
|------|--------|
| 功能 | 代码实现了需求描述的功能 |
| 类型 | 无 `any`，关键路径有完整类型标注 |
| 错误 | 异常路径有处理，不吞掉错误 |
| 安全 | 无硬编码密钥，输入已校验 |
| 性能 | 无 N+1 查询，大列表有分页 |
| 测试 | 新功能有对应测试用例 |
| 命名 | 变量/函数/文件名符合规范 |
| 注释 | 复杂逻辑有注释说明原因 |
| 依赖 | 无多余依赖引入 |
| 日志 | 关键操作有日志记录 |

### 12.2 审查关注点

```
审查优先级:

┌─────────────────────────────────────────────────────┐
│  P0: 安全问题 — 注入、信息泄露、权限绕过            │
├─────────────────────────────────────────────────────┤
│  P1: 正确性 — 逻辑错误、边界条件、竞态条件          │
├─────────────────────────────────────────────────────┤
│  P2: 可维护性 — 代码结构、命名、复杂度              │
├─────────────────────────────────────────────────────┤
│  P3: 性能 — 数据库查询、内存使用、网络请求          │
├─────────────────────────────────────────────────────┤
│  P4: 风格 — 格式、注释、命名偏好 (Linter 自动覆盖) │
└─────────────────────────────────────────────────────┘
```
