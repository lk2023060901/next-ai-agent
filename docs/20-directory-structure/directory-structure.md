# 目录结构规范

## 1 Monorepo 根目录

### 1.1 整体结构

```
nextai-agent/
├── apps/                        # 应用程序
│   ├── web/                     # Web 前端 (Next.js 15)
│   ├── desktop/                 # 桌面端 (Electron)
│   └── miniapp/                 # 小程序 (UniApp)
├── services/                    # 后端服务
│   ├── api-gateway/             # API 网关 (Golang)
│   ├── agent-service/           # Agent 服务 (Node.js)
│   ├── user-service/            # 用户服务 (Node.js)
│   ├── channel-service/         # 渠道服务 (Node.js)
│   ├── billing-service/         # 计费服务 (Golang)
│   ├── memory-service/          # 记忆服务 (Python)
│   ├── plugin-service/          # 插件服务 (Node.js)
│   └── ws-gateway/              # WebSocket 网关 (Node.js)
├── packages/                    # 共享包
│   ├── database/                # 数据库 Schema + 迁移
│   ├── shared-types/            # 共享类型定义
│   ├── ui/                      # 共享 UI 组件库
│   ├── logger/                  # 统一日志库
│   ├── config/                  # 共享配置工具
│   └── utils/                   # 通用工具函数
├── scripts/                     # 脚本工具
│   ├── init-db.sql              # 数据库初始化
│   ├── seed-test-data.ts        # 测试数据填充
│   └── check-env.sh             # 环境检查脚本
├── docker/                      # Docker 相关
│   ├── Dockerfile.web
│   ├── Dockerfile.gateway
│   ├── Dockerfile.agent
│   ├── Dockerfile.memory
│   └── docker-compose.dev.yml
├── k8s/                         # Kubernetes 配置
│   ├── base/                    # 基础配置
│   └── overlays/                # 环境覆盖
│       ├── staging/
│       └── production/
├── docs/                        # 项目文档
│   ├── 00-overview/
│   ├── 01-design-system/
│   ├── ...
│   └── README.md
├── .github/                     # GitHub 配置
│   ├── workflows/               # CI/CD 流水线
│   │   ├── ci.yml
│   │   ├── deploy.yml
│   │   └── dependabot.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
├── .husky/                      # Git Hooks
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
├── .vscode/                     # VS Code 共享配置
│   ├── extensions.json
│   ├── settings.json
│   └── launch.json
├── package.json                 # 根包配置
├── pnpm-workspace.yaml          # pnpm 工作区
├── pnpm-lock.yaml               # 锁定文件
├── tsconfig.base.json           # TypeScript 基础配置
├── eslint.config.js             # ESLint 配置
├── .prettierrc                  # Prettier 配置
├── .gitignore
├── .env.example                 # 环境变量模板
├── Makefile                     # 常用命令集
└── README.md                    # 项目说明
```

### 1.2 pnpm Workspace 配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'services/*'
```

### 1.3 Makefile 命令集

```makefile
# Makefile
.PHONY: dev build test lint clean

# ===== 开发 =====
dev:                          ## 启动全部开发服务
	docker compose -f docker/docker-compose.dev.yml up -d
	pnpm dev

dev-infra:                    ## 仅启动基础设施
	docker compose -f docker/docker-compose.dev.yml up -d

dev-web:                      ## 仅启动 Web 前端
	pnpm --filter web dev

dev-gateway:                  ## 仅启动 API Gateway
	cd services/api-gateway && go run ./cmd/server

# ===== 构建 =====
build:                        ## 构建全部
	pnpm build

build-web:                    ## 构建 Web
	pnpm --filter web build

build-gateway:                ## 构建 Gateway
	cd services/api-gateway && go build -o bin/server ./cmd/server

# ===== 测试 =====
test:                         ## 运行全部测试
	pnpm test:unit
	cd services/api-gateway && go test ./...

test-unit:                    ## 运行单元测试
	pnpm test:unit

test-e2e:                     ## 运行 E2E 测试
	pnpm test:e2e

# ===== 代码质量 =====
lint:                         ## 检查代码质量
	pnpm lint
	cd services/api-gateway && golangci-lint run

format:                       ## 格式化代码
	pnpm format
	cd services/api-gateway && gofmt -w .

typecheck:                    ## TypeScript 类型检查
	pnpm typecheck

# ===== 数据库 =====
db-migrate:                   ## 执行数据库迁移
	pnpm --filter database migrate

db-seed:                      ## 填充测试数据
	pnpm tsx scripts/seed-test-data.ts

db-reset:                     ## 重置数据库
	pnpm --filter database reset

# ===== 清理 =====
clean:                        ## 清理构建产物
	rm -rf apps/*/dist apps/*/.next services/*/bin
	rm -rf node_modules/.cache

clean-all: clean              ## 深度清理 (含 node_modules)
	rm -rf node_modules apps/*/node_modules packages/*/node_modules

help:                         ## 显示帮助
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
```

---

## 2 Web 前端 (Next.js)

### 2.1 完整目录结构

```
apps/web/
├── app/                              # App Router (页面路由)
│   ├── (auth)/                       # 认证页面组 (无侧边栏)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── layout.tsx                # 认证页面布局 (左右分栏)
│   │
│   ├── (marketing)/                  # 营销页面组
│   │   ├── page.tsx                  # 落地页
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/                  # 主应用 (含侧边栏+顶栏)
│   │   ├── org/
│   │   │   └── [slug]/              # 组织级页面
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx      # 组织仪表盘
│   │   │       ├── usage/
│   │   │       │   └── page.tsx      # 用量统计
│   │   │       ├── settings/
│   │   │       │   ├── page.tsx      # 组织设置
│   │   │       │   ├── members/
│   │   │       │   │   └── page.tsx  # 成员管理
│   │   │       │   ├── billing/
│   │   │       │   │   └── page.tsx  # 计费管理
│   │   │       │   └── audit/
│   │   │       │       └── page.tsx  # 审计日志
│   │   │       ├── workspaces/
│   │   │       │   └── page.tsx      # 工作区列表
│   │   │       └── ws/
│   │   │           └── [wsSlug]/     # 工作区级页面
│   │   │               ├── page.tsx          # 工作区首页
│   │   │               ├── chat/
│   │   │               │   └── page.tsx      # 对话页面
│   │   │               ├── agents/
│   │   │               │   ├── page.tsx      # Agent 列表
│   │   │               │   └── overview/
│   │   │               │       └── page.tsx  # 协作可视化
│   │   │               ├── channels/
│   │   │               │   ├── page.tsx      # 渠道列表
│   │   │               │   └── [channelId]/
│   │   │               │       └── page.tsx  # 渠道详情
│   │   │               ├── knowledge/
│   │   │               │   ├── page.tsx      # 知识库列表
│   │   │               │   └── [kbId]/
│   │   │               │       └── page.tsx  # 知识库详情
│   │   │               ├── memory/
│   │   │               │   └── page.tsx      # 记忆管理
│   │   │               ├── plugins/
│   │   │               │   ├── page.tsx      # 已安装插件
│   │   │               │   └── marketplace/
│   │   │               │       ├── page.tsx  # 插件市场
│   │   │               │       └── [pluginId]/
│   │   │               │           └── page.tsx
│   │   │               └── settings/
│   │   │                   └── page.tsx      # 工作区设置
│   │   └── layout.tsx                # 主应用布局
│   │
│   ├── settings/                     # 个人设置
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── security/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── appearance/
│   │   │   └── page.tsx
│   │   ├── api-keys/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── api/                          # API Routes (BFF)
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── health/
│   │   │   └── route.ts
│   │   └── upload/
│   │       └── route.ts
│   │
│   ├── layout.tsx                    # 根布局
│   ├── not-found.tsx                 # 404 页面
│   ├── error.tsx                     # 错误边界
│   ├── loading.tsx                   # 全局 loading
│   └── globals.css                   # 全局样式
│
├── components/                       # 组件
│   ├── ui/                           # 基础 UI 组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   ├── data-table.tsx
│   │   └── ...
│   ├── features/                     # 业务功能组件
│   │   ├── agent/
│   │   │   ├── agent-card.tsx
│   │   │   ├── agent-list.tsx
│   │   │   ├── agent-create-wizard.tsx
│   │   │   └── agent-topology.tsx
│   │   ├── chat/
│   │   │   ├── chat-panel.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   ├── message-input.tsx
│   │   │   └── typing-indicator.tsx
│   │   ├── workspace/
│   │   │   ├── workspace-card.tsx
│   │   │   └── workspace-switcher.tsx
│   │   └── billing/
│   │       ├── pricing-card.tsx
│   │       └── usage-chart.tsx
│   └── layout/                       # 布局组件
│       ├── sidebar.tsx
│       ├── topbar.tsx
│       ├── sidebar-nav.tsx
│       └── breadcrumb.tsx
│
├── hooks/                            # 自定义 Hooks
│   ├── use-agent.ts
│   ├── use-agents.ts
│   ├── use-chat.ts
│   ├── use-workspace.ts
│   ├── use-user.ts
│   ├── use-websocket.ts
│   ├── use-debounce.ts
│   └── use-media-query.ts
│
├── lib/                              # 工具库
│   ├── api/                          # API 客户端
│   │   ├── client.ts                 # Axios/Fetch 封装
│   │   ├── agent-api.ts
│   │   ├── user-api.ts
│   │   ├── workspace-api.ts
│   │   └── billing-api.ts
│   ├── store/                        # 状态管理
│   │   ├── use-app-store.ts          # 全局 UI 状态 (Zustand)
│   │   ├── use-auth-store.ts         # 认证状态
│   │   └── use-chat-store.ts         # 对话状态
│   ├── utils/                        # 工具函数
│   │   ├── cn.ts                     # 类名合并
│   │   ├── format.ts                 # 格式化 (日期/金额)
│   │   ├── validation.ts             # 表单校验
│   │   └── token.ts                  # Token 管理
│   └── constants/                    # 常量
│       ├── routes.ts                 # 路由常量
│       ├── agent-roles.ts            # Agent 角色定义
│       └── plan-limits.ts            # 套餐限制
│
├── providers/                        # React Providers
│   ├── query-provider.tsx            # React Query
│   ├── theme-provider.tsx            # 主题
│   └── auth-provider.tsx             # 认证
│
├── types/                            # 类型定义
│   ├── agent.ts
│   ├── user.ts
│   ├── workspace.ts
│   ├── message.ts
│   └── api.ts
│
├── tests/                            # 测试
│   ├── setup.ts                      # 测试初始化
│   ├── setup-web.ts                  # 浏览器测试初始化
│   └── helpers/                      # 测试工具
│       ├── render.tsx                # 自定义 render
│       └── factories.ts             # 测试数据工厂
│
├── e2e/                              # E2E 测试
│   ├── auth.setup.ts
│   ├── agent-workflow.spec.ts
│   └── chat.spec.ts
│
├── public/                           # 静态资源
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│
├── next.config.ts                    # Next.js 配置
├── tailwind.config.ts                # TailwindCSS 配置
├── tsconfig.json                     # TypeScript 配置
├── vitest.config.ts                  # Vitest 配置
├── playwright.config.ts              # Playwright 配置
└── package.json
```

### 2.2 目录职责说明

| 目录 | 职责 | 约束 |
|------|------|------|
| `app/` | 页面路由，数据获取，布局 | 仅放 page/layout/error/loading |
| `components/ui/` | 基础展示组件 | 无业务逻辑，纯 Props 驱动 |
| `components/features/` | 业务功能组件 | 可包含状态和副作用 |
| `components/layout/` | 布局壳组件 | 侧边栏、顶栏、面包屑 |
| `hooks/` | 自定义 Hooks | 以 `use-` 开头命名 |
| `lib/api/` | API 请求封装 | 一个文件对应一个资源 |
| `lib/store/` | 全局状态 (Zustand) | 以 `use-*-store` 命名 |
| `lib/utils/` | 纯工具函数 | 无副作用，可单元测试 |
| `types/` | TypeScript 类型 | 仅 type/interface，无运行时代码 |
| `providers/` | React Context Providers | 在根 layout 中组合 |

---

## 3 API Gateway (Golang)

### 3.1 目录结构

```
services/api-gateway/
├── cmd/
│   └── server/
│       └── main.go                   # 入口：初始化 + 启动
├── internal/                         # 私有业务代码
│   ├── config/
│   │   └── config.go                 # 配置加载 (Viper)
│   ├── handler/                      # HTTP Handler
│   │   ├── auth_handler.go
│   │   ├── agent_handler.go
│   │   ├── user_handler.go
│   │   ├── workspace_handler.go
│   │   └── health_handler.go
│   ├── middleware/                    # 中间件
│   │   ├── auth.go                   # JWT 认证
│   │   ├── cors.go                   # CORS
│   │   ├── ratelimit.go              # 限流
│   │   ├── logger.go                 # 请求日志
│   │   ├── recovery.go               # Panic 恢复
│   │   └── tracing.go                # 链路追踪
│   ├── service/                      # 业务逻辑
│   │   ├── auth_service.go
│   │   ├── proxy_service.go          # 反向代理到下游服务
│   │   └── ratelimit_service.go
│   ├── repository/                   # 数据访问
│   │   ├── user_repo.go
│   │   └── cache_repo.go             # Redis 缓存
│   ├── model/                        # 数据模型
│   │   ├── user.go
│   │   ├── token.go
│   │   └── errors.go
│   └── router/
│       └── router.go                 # 路由注册
├── pkg/                              # 可导出的公共包
│   ├── auth/
│   │   └── jwt.go                    # JWT 工具
│   ├── response/
│   │   └── response.go               # 统一响应格式
│   └── validator/
│       └── validator.go               # 请求校验
├── api/
│   └── openapi.yaml                  # OpenAPI 规范
├── go.mod
├── go.sum
└── Makefile
```

### 3.2 Go 项目约定

| 原则 | 说明 |
|------|------|
| `cmd/` | 仅包含 main 函数，尽量精简 |
| `internal/` | 不可被外部包导入 |
| `pkg/` | 可被其他服务复用的通用包 |
| `handler → service → repository` | 三层架构，依赖方向从上到下 |
| 接口定义在使用方 | consumer 定义 interface，provider 实现 |

---

## 4 Node.js 服务

### 4.1 Agent 服务结构

```
services/agent-service/
├── src/
│   ├── index.ts                      # 入口
│   ├── app.ts                        # Express/Hono 应用
│   ├── config/
│   │   └── index.ts                  # 配置加载
│   ├── routes/                       # 路由定义
│   │   ├── agent-routes.ts
│   │   ├── session-routes.ts
│   │   └── message-routes.ts
│   ├── controllers/                  # 请求处理
│   │   ├── agent-controller.ts
│   │   ├── session-controller.ts
│   │   └── message-controller.ts
│   ├── services/                     # 业务逻辑
│   │   ├── agent-service.ts
│   │   ├── coordination-service.ts   # Agent 协调
│   │   ├── task-assignment-service.ts
│   │   └── llm-service.ts            # LLM 调用封装
│   ├── repositories/                 # 数据访问
│   │   ├── agent-repository.ts
│   │   ├── session-repository.ts
│   │   └── message-repository.ts
│   ├── models/                       # 数据模型 / Schema
│   │   ├── agent.ts
│   │   ├── session.ts
│   │   └── message.ts
│   ├── events/                       # 事件处理
│   │   ├── kafka-consumer.ts
│   │   ├── kafka-producer.ts
│   │   └── handlers/
│   │       ├── agent-event-handler.ts
│   │       └── message-event-handler.ts
│   ├── middleware/                    # 中间件
│   │   ├── auth.ts
│   │   ├── validate.ts
│   │   └── error-handler.ts
│   ├── utils/                        # 工具函数
│   │   ├── token-counter.ts
│   │   └── prompt-builder.ts
│   └── types/                        # 类型定义
│       ├── agent.ts
│       └── message.ts
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   └── agent-service.test.ts
│   │   └── utils/
│   │       └── token-counter.test.ts
│   ├── integration/
│   │   └── api/
│   │       └── agents.test.ts
│   └── helpers/
│       ├── db.ts
│       └── factories.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

### 4.2 Node.js 服务约定

| 原则 | 说明 |
|------|------|
| `routes → controllers → services → repositories` | 四层架构 |
| Controller | 仅处理 HTTP 请求/响应，不含业务逻辑 |
| Service | 核心业务逻辑，可被多个 Controller 复用 |
| Repository | 纯数据访问，返回领域对象 |
| events/ | Kafka/RabbitMQ 消费者和生产者 |

---

## 5 Python 服务

### 5.1 记忆服务结构

```
services/memory-service/
├── src/
│   ├── __init__.py
│   ├── main.py                       # FastAPI 入口
│   ├── config.py                     # 配置 (Pydantic Settings)
│   ├── api/                          # API 路由
│   │   ├── __init__.py
│   │   ├── memory_router.py
│   │   ├── embedding_router.py
│   │   └── health_router.py
│   ├── services/                     # 业务逻辑
│   │   ├── __init__.py
│   │   ├── memory_service.py
│   │   ├── embedding_service.py
│   │   ├── compression_service.py    # 上下文压缩
│   │   └── recall_service.py         # 记忆召回
│   ├── repositories/                 # 数据访问
│   │   ├── __init__.py
│   │   ├── milvus_repo.py            # 向量存储
│   │   └── pg_repo.py                # 关系数据
│   ├── models/                       # 数据模型
│   │   ├── __init__.py
│   │   ├── memory.py
│   │   └── embedding.py
│   └── utils/                        # 工具函数
│       ├── __init__.py
│       ├── tokenizer.py
│       └── text_splitter.py
├── tests/
│   ├── conftest.py                   # pytest fixtures
│   ├── test_memory_service.py
│   ├── test_embedding_service.py
│   └── test_compression_service.py
├── pyproject.toml                    # 项目配置 (uv)
├── uv.lock                           # 依赖锁定
└── Makefile
```

---

## 6 共享包

### 6.1 packages 结构

```
packages/
├── database/                         # 数据库 Schema + 迁移
│   ├── src/
│   │   ├── index.ts                  # 导出 db 实例
│   │   ├── schema/                   # Drizzle Schema
│   │   │   ├── users.ts
│   │   │   ├── workspaces.ts
│   │   │   ├── agents.ts
│   │   │   ├── sessions.ts
│   │   │   ├── messages.ts
│   │   │   ├── channels.ts
│   │   │   ├── plugins.ts
│   │   │   └── index.ts              # 统一导出
│   │   └── migrations/               # 迁移文件
│   │       ├── 0001_initial.sql
│   │       └── 0002_add_agents.sql
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── shared-types/                     # 共享类型定义
│   ├── src/
│   │   ├── api.ts                    # API 请求/响应类型
│   │   ├── agent.ts                  # Agent 相关类型
│   │   ├── user.ts                   # 用户相关类型
│   │   ├── workspace.ts              # 工作区相关类型
│   │   ├── message.ts                # 消息相关类型
│   │   ├── billing.ts                # 计费相关类型
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
│
├── ui/                               # 共享 UI 组件
│   ├── src/
│   │   ├── components/               # 跨端共享组件
│   │   │   ├── avatar-group.tsx
│   │   │   ├── status-badge.tsx
│   │   │   └── empty-state.tsx
│   │   ├── hooks/                    # 共享 Hooks
│   │   │   └── use-copy-to-clipboard.ts
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
│
├── logger/                           # 统一日志
│   ├── src/
│   │   ├── index.ts
│   │   ├── logger.ts                 # Pino 封装
│   │   └── transports.ts             # 日志输出目标
│   ├── tsconfig.json
│   └── package.json
│
├── config/                           # 共享配置
│   ├── src/
│   │   ├── index.ts
│   │   └── env.ts                    # 环境变量加载
│   ├── tsconfig.json
│   └── package.json
│
└── utils/                            # 通用工具
    ├── src/
    │   ├── index.ts
    │   ├── format.ts                 # 格式化工具
    │   ├── crypto.ts                 # 加密工具
    │   ├── retry.ts                  # 重试工具
    │   └── pagination.ts             # 分页工具
    ├── tsconfig.json
    └── package.json
```

### 6.2 包引用方式

```json
// apps/web/package.json
{
  "dependencies": {
    "@nextai-agent/database": "workspace:*",
    "@nextai-agent/shared-types": "workspace:*",
    "@nextai-agent/ui": "workspace:*",
    "@nextai-agent/logger": "workspace:*"
  }
}

// services/agent-service/package.json
{
  "dependencies": {
    "@nextai-agent/database": "workspace:*",
    "@nextai-agent/shared-types": "workspace:*",
    "@nextai-agent/logger": "workspace:*",
    "@nextai-agent/utils": "workspace:*"
  }
}
```

---

## 7 命名规范速查

### 7.1 文件命名

| 类型 | 风格 | 示例 |
|------|------|------|
| React 组件 | kebab-case.tsx | `agent-card.tsx` |
| Hook | kebab-case.ts (use- 前缀) | `use-agent.ts` |
| 工具函数 | kebab-case.ts | `token-counter.ts` |
| 常量 | kebab-case.ts | `agent-roles.ts` |
| 类型定义 | kebab-case.ts | `agent.ts` |
| 测试文件 | *.test.ts / *.test.tsx | `agent-service.test.ts` |
| E2E 测试 | *.spec.ts | `chat.spec.ts` |
| Go 文件 | snake_case.go | `auth_handler.go` |
| Go 测试 | snake_case_test.go | `auth_handler_test.go` |
| Python 文件 | snake_case.py | `memory_service.py` |
| Python 测试 | test_*.py | `test_memory_service.py` |
| 配置文件 | kebab-case | `vitest.config.ts` |
| Docker | Dockerfile.{name} | `Dockerfile.web` |

### 7.2 目录命名

| 层级 | 风格 | 示例 |
|------|------|------|
| 顶层目录 | kebab-case | `apps/`, `services/`, `packages/` |
| 应用/服务 | kebab-case | `api-gateway/`, `agent-service/` |
| 代码目录 | kebab-case | `components/`, `hooks/`, `utils/` |
| 功能目录 | kebab-case | `features/agent/`, `features/chat/` |
| 路由目录 | kebab-case / [param] | `(dashboard)/`, `[slug]/` |
| 文档目录 | 数字前缀-kebab-case | `04-agent-system/` |

### 7.3 导出规范

```typescript
// ✅ 每个目录有 index.ts 统一导出
// packages/shared-types/src/index.ts
export type { Agent, AgentConfig, AgentRole } from './agent';
export type { User, UserProfile } from './user';
export type { Workspace, WorkspaceMember } from './workspace';
export type { Message, MessageContent } from './message';

// ✅ 组件直接导出，不使用 default export
// components/features/agent/agent-card.tsx
export function AgentCard(props: AgentCardProps) { ... }

// ❌ 避免 default export (除 Next.js page/layout 外)
// export default function AgentCard() { ... }
```

---

## 8 新增模块检查清单

当需要添加新模块时，按以下清单操作：

| 步骤 | 操作 |
|------|------|
| 1 | 确认模块归属 (apps / services / packages) |
| 2 | 创建标准目录结构 |
| 3 | 配置 `package.json` (name 以 `@nextai-agent/` 开头) |
| 4 | 配置 `tsconfig.json` (继承 `tsconfig.base.json`) |
| 5 | 在 `pnpm-workspace.yaml` 确认路径匹配 |
| 6 | 添加 Makefile 命令 |
| 7 | 添加 Dockerfile (如需独立部署) |
| 8 | 添加 K8s 配置 (如需独立部署) |
| 9 | 更新 CI 流水线 |
| 10 | 在文档中记录模块说明 |
