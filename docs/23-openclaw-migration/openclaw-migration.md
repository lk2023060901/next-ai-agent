# OpenClaw → NextAI Agent 迁移映射

> 基于 OpenClaw 源码（`/Volumes/data/github/ai/openclaw`）分析，详细记录从个人 AI 助手到 SaaS 多租户平台的改造映射。

## 1 产品定位差异

### 1.1 根本性差异

| 维度 | OpenClaw | NextAI Agent |
|------|----------|-------------|
| 定位 | 个人 AI 助手 Gateway | SaaS 多智能体协作平台 |
| 用户模型 | 单用户，本地运行 | 多租户，组织/工作区隔离 |
| 部署方式 | 本地设备 (CLI + WebSocket) | 云端 Kubernetes 集群 |
| 认证 | Token / 密码 / Tailscale | JWT + OAuth + RBAC |
| 数据存储 | SQLite + 文件系统 | PostgreSQL + Redis + Milvus + MinIO |
| Agent 模型 | 单 Agent + 渠道路由 | Multi-Agent Teams 协作 |
| 前端 | Lit Web Components | React 19 + Next.js 15 |
| 运行时 | Node.js 22 (ESM) | Node.js + Go + Python |
| 协议 | WebSocket RPC | REST API + WebSocket + SSE |
| 计费 | 免费 | SaaS 订阅 + 用量计量 |

### 1.2 架构对比图

```
OpenClaw 架构:

┌────────────────────────────────────────────┐
│           单一 Node.js 进程                  │
│  ┌──────┐  ┌───────┐  ┌────────────────┐  │
│  │ CLI  │  │Gateway │  │ Pi Agent Runner│  │
│  │      │→ │WebSocket│→ │ (嵌入式)       │  │
│  └──────┘  │ :18789 │  └────────────────┘  │
│            └───┬────┘                       │
│       ┌────────┼────────┐                   │
│       │        │        │                   │
│  ┌────▼──┐ ┌──▼───┐ ┌──▼───┐              │
│  │Telegram│ │Discord│ │Slack │ ...          │
│  └───────┘ └──────┘ └──────┘              │
│       │                                     │
│  ┌────▼──────────────┐                     │
│  │ SQLite + 文件系统  │                     │
│  │ ~/.openclaw/       │                     │
│  └───────────────────┘                     │
└────────────────────────────────────────────┘


NextAI Agent 架构:

┌─────────────────────────────────────────────────────────┐
│                    云端微服务架构                          │
│                                                         │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐          │
│  │ Next.js  │  │API Gateway│  │ WS Gateway │          │
│  │ Web      │→ │ (Golang)  │  │ (Node.js)  │          │
│  └──────────┘  └─────┬─────┘  └─────┬──────┘          │
│                      │               │                  │
│    ┌─────────────────┼───────────────┤                  │
│    │          │      │        │      │                  │
│  ┌─▼──┐  ┌──▼──┐ ┌─▼───┐ ┌─▼──┐ ┌▼────┐            │
│  │User │  │Agent│ │Chan.│ │Mem.│ │Bill.│  ...        │
│  │Svc  │  │Svc  │ │Svc  │ │Svc │ │Svc  │            │
│  └─────┘  └─────┘ └─────┘ └────┘ └─────┘            │
│    │          │       │       │       │                │
│  ┌─▼──────────▼───────▼───────▼───────▼──┐            │
│  │  PostgreSQL  Redis  Milvus  MinIO     │            │
│  │  Kafka  RabbitMQ                       │            │
│  └────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## 2 模块迁移映射

### 2.1 总览矩阵

| OpenClaw 模块 | 路径 | 迁移策略 | NextAI Agent 对应 | 复用程度 |
|--------------|------|---------|-------------------|---------|
| Gateway Server | `src/gateway/` | **重写** | API Gateway (Go) + WS Gateway (Node) | 0% — 架构完全不同 |
| Pi Agent Runner | `src/agents/` | **重新设计** | Agent Service (多 Agent 协作) | 10% — 工具模式可参考 |
| Channel Plugins | `src/channels/`, `extensions/` | **适配改造** | Channel Service | 30% — 适配器模式可复用 |
| Config System | `src/config/` | **部分复用** | Settings Service | 20% — Zod 校验模式可复用 |
| Memory/Search | `src/memory/` | **重写** | Memory Service (Python) | 5% — 概念参考，实现完全不同 |
| Session Storage | `src/sessions/` | **重写** | Session 表 (PostgreSQL) | 0% — 从文件到数据库 |
| Routing | `src/routing/` | **重新设计** | Agent 协调器 | 10% — 路由概念可参考 |
| Web UI | `ui/` | **完全重写** | Web App (Next.js) | 0% — Lit → React |
| CLI | `src/cli/` | **不迁移** | — | N/A — SaaS 不需要 CLI |
| Plugin SDK | `src/plugin-sdk/` | **参考重建** | Plugin Service | 15% — 接口设计可参考 |
| Hooks | `src/hooks/` | **参考重建** | Webhook Service | 10% — 概念可参考 |
| Skills | `skills/` | **评估迁移** | 内置工具 | 20% — 部分 skill 逻辑可复用 |

### 2.2 复用程度图示

```
模块复用程度:

完全重写 ◄──────────────────────────────────────► 直接复用
  0%         10%         20%         30%         100%
  │           │           │           │
  ├─ Gateway Server                   │
  ├─ Web UI (Lit → React)            │
  ├─ Session Storage                  │
  │           │                       │
  │           ├─ Routing              │
  │           ├─ Agent Runner         │
  │           ├─ Hooks                │
  │           │           │           │
  │           │           ├─ Config   │
  │           │           │           │
  │           │           │           ├─ Channel Adapters
  │           │           │           │
```

---

## 3 详细迁移方案

### 3.1 前端 (完全重写)

**OpenClaw 前端**: Lit Web Components (`ui/src/`)
**NextAI Agent 前端**: React 19 + Next.js 15

| OpenClaw 组件 | 功能 | NextAI Agent 对应 | 迁移方式 |
|--------------|------|-------------------|---------|
| `ui/app.ts` | 应用主控制器 | `app/layout.tsx` | 重写 — 框架不同 |
| `ui/app-chat.ts` | 对话界面 | `app/(dashboard)/ws/[wsSlug]/chat/page.tsx` | 重写 — 多 Agent 对话 |
| `ui/app-channels.ts` | 渠道管理 | `app/(dashboard)/ws/[wsSlug]/channels/page.tsx` | 重写 |
| `ui/app-settings.ts` | 设置页 | `app/settings/` | 重写 — 多页面体系 |
| `ui/app-gateway.ts` | Gateway 控制 | 不迁移 | N/A — SaaS 无需 |
| `ui/chat/` | 消息渲染 | `components/features/chat/` | 重写 — 参考渲染逻辑 |
| `ui/components/` | 基础组件 | `components/ui/` | 重写 — 使用 HeroUI |

**可参考的设计模式**：
- 消息渲染的 Markdown 处理逻辑
- 流式消息的增量更新策略
- 工具调用结果的折叠展示

### 3.2 Agent 系统 (重新设计)

**OpenClaw**: 单 Agent + 渠道路由
**NextAI Agent**: Multi-Agent Teams 协作

```
OpenClaw Agent 模型:

用户消息 → 渠道路由 → 单个 Agent (Pi) → 响应

NextAI Agent 模型:

用户消息 → Coordinator Agent
              ├→ Requirements Agent ─┐
              ├→ Architecture Agent ─┤
              ├→ Frontend Agent     ─┤→ 聚合响应
              ├→ Backend Agent      ─┤
              └→ Testing Agent      ─┘
```

| OpenClaw | 路径 | NextAI Agent | 迁移说明 |
|----------|------|-------------|---------|
| Pi Embedded Runner | `src/agents/pi-embedded-runner.ts` | Agent Coordination Service | 从单 Agent 执行改为多 Agent 编排 |
| Pi Tools | `src/agents/pi-tools.ts` | Agent Tool Registry | 工具注册机制可参考，但需支持多 Agent 工具隔离 |
| Pi Settings | `src/agents/pi-settings.ts` | Agent Config (DB) | 从文件配置改为数据库存储 |
| Pi Extensions | `src/agents/pi-extensions/` | Agent Middleware | 上下文裁剪、思考模式可参考 |
| Agent Route | `src/routing/resolve-route.ts` | Task Assignment Service | 从渠道路由改为任务分派 |

**可复用的代码逻辑**：

```typescript
// OpenClaw: src/agents/pi-tools.ts — 工具定义模式
// 这种工具注册模式可以参考
type Tool = {
  name: string;
  description: string;
  parameters: ZodSchema;
  execute: (args: unknown, context: ToolContext) => Promise<ToolResult>;
};

// NextAI Agent 中需要扩展为:
type AgentTool = Tool & {
  allowedRoles: AgentRole[];    // 角色级别的工具权限
  requiresApproval: boolean;     // 是否需要用户审批
  timeout: number;               // 执行超时
};
```

### 3.3 渠道系统 (适配改造)

**OpenClaw 渠道架构**: 插件式适配器，Gateway 统一调度
**NextAI Agent 渠道架构**: 微服务式渠道服务，多租户隔离

| OpenClaw 渠道 | 路径 | 复用建议 |
|--------------|------|---------|
| Telegram (grammY) | `src/telegram/` | ✅ 可复用 grammY 集成逻辑，需加多租户支持 |
| Discord (discord.js) | `src/discord/` | ✅ 可复用 discord.js 集成逻辑 |
| Slack (Bolt) | `src/slack/` | ✅ 可复用 Bolt 集成逻辑 |
| WhatsApp (Baileys) | `src/channels/web/` | ⚠️ 可参考，但 Baileys 稳定性需评估 |
| 微信 | 不存在 | ❌ 需全新实现 |
| 飞书 | 不存在 | ❌ 需全新实现 |
| 钉钉 | 不存在 | ❌ 需全新实现 |

**适配器模式迁移**：

```typescript
// OpenClaw 渠道适配器 (src/channels/plugins/types.ts):
// 接口设计良好，可以作为 NextAI Agent 的参考

// OpenClaw 的适配器接口 (简化):
interface ChannelPlugin {
  id: string;
  adapters: {
    auth: ChannelAuthAdapter;
    messaging: ChannelMessagingAdapter;
    streaming: ChannelStreamingAdapter;
    // ...
  };
  capabilities: ChannelCapabilities;
}

// NextAI Agent 需要扩展:
interface ChannelAdapter extends ChannelPlugin {
  tenantId: string;              // 多租户标识
  workspaceId: string;           // 工作区隔离
  rateLimits: RateLimitConfig;   // 租户级限流
  webhookUrl: string;            // Webhook 回调地址
  encryptionKey: string;         // 租户级加密
}
```

### 3.4 配置系统 (部分复用)

**OpenClaw**: JSON5 文件配置 (`~/.openclaw/openclaw.json`)
**NextAI Agent**: 数据库配置 + 管理后台

| OpenClaw 配置 | 路径 | NextAI Agent | 迁移说明 |
|--------------|------|-------------|---------|
| Zod Schema | `src/config/zod-schema.ts` | 各服务 Schema | ✅ Zod 校验模式直接复用 |
| 环境变量替换 | `src/config/env-substitution.ts` | Config Service | ✅ 环境变量注入逻辑可复用 |
| 配置合并 | `src/config/merge-config.ts` | — | ⚠️ 参考，DB 配置不需要文件合并 |
| 配置验证 | `src/config/validation.ts` | API 输入校验 | ✅ 验证模式可复用 |
| 旧版迁移 | `src/config/legacy-migrate.ts` | — | ❌ 不需要 |

**可直接复用的代码**：

```typescript
// OpenClaw: src/config/env-substitution.ts
// 环境变量替换逻辑，可用于 NextAI Agent 的配置管理
function substituteEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, key) => {
    return process.env[key] ?? '';
  });
}

// OpenClaw: src/config/zod-schema.ts
// Zod 配置校验模式，可以参考来定义 Agent 配置 Schema
const AgentConfigSchema = z.object({
  name: z.string().min(1).max(100),
  model: z.string(),
  systemPrompt: z.string().max(10000),
  tools: z.array(z.string()).optional(),
  maxTokens: z.number().int().positive().optional(),
});
```

### 3.5 记忆系统 (完全重写)

**OpenClaw**: SQLite + FTS5 全文搜索 + 本地 Embedding
**NextAI Agent**: PostgreSQL + Milvus 向量检索 + 六层记忆体系

| OpenClaw | NextAI Agent | 说明 |
|----------|-------------|------|
| SQLite `chunks` 表 | Milvus `memory_vectors` 集合 | 向量存储完全不同 |
| FTS5 全文搜索 | PostgreSQL `tsvector` + Milvus ANN | 检索策略更丰富 |
| 本地 Embedding | 远程 Embedding API | 支持多种 Embedding 模型 |
| 单用户数据 | 多租户隔离 | 需要 workspace_id 分区 |
| 文件级分块 | 六层记忆体系 | 从简单文件索引到完整记忆架构 |

**可参考的设计**：
- 文本分块策略 (`src/memory/memory-schema.ts` 中的 chunk 逻辑)
- 增量索引机制（hash 比对避免重复索引）
- FTS 与向量检索的混合召回思路

### 3.6 认证系统 (完全重写)

**OpenClaw**: 简单 Token / 密码认证
**NextAI Agent**: JWT + OAuth + RBAC + 2FA

| OpenClaw | NextAI Agent | 说明 |
|----------|-------------|------|
| 单 Token | JWT (Access + Refresh) | 完整的 Token 生命周期 |
| 无角色 | 6 种角色 (Super Admin → Viewer) | RBAC 权限矩阵 |
| 无 OAuth | GitHub + Google OAuth | 第三方登录 |
| 无 2FA | TOTP 2FA | 可选双因素认证 |
| 本地回环免认证 | 无 | 云端必须认证 |

---

## 4 数据迁移

### 4.1 数据存储映射

| OpenClaw 数据 | 存储位置 | NextAI Agent | 存储位置 |
|--------------|---------|-------------|---------|
| 配置 | `~/.openclaw/openclaw.json` | 系统设置 | `settings` 表 |
| 会话 | `~/.openclaw/sessions/*.json` | 会话 | `sessions` 表 |
| 消息历史 | 嵌入在 Session JSON 中 | 消息 | `messages` 表 |
| 记忆索引 | `~/.openclaw/workspace/memory/` (SQLite) | 向量记忆 | Milvus `memory_vectors` |
| 文件 | 本地文件系统 | 对象存储 | MinIO `documents` bucket |
| 日志 | `~/.openclaw/workspace/logs/` | 审计日志 | `audit_logs` 表 |
| Hook | `~/.openclaw/workspace/hooks/` | Webhook | `webhooks` 表 |

### 4.2 数据模型映射

```
OpenClaw Session JSON → NextAI Agent 数据库:

OpenClaw:
{
  "key": "main",                    → sessions.id (UUID)
  "accountId": "telegram:123",      → sessions.channel_id + sessions.external_id
  "channel": "telegram",            → sessions.channel_type
  "history": [                      → messages 表 (一对多)
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "metadata": {
    "labels": ["project"],          → sessions.tags (JSONB)
    "createdAt": "2024-01-01"       → sessions.created_at
  }
}

NextAI Agent:
sessions:
  id: UUID
  workspace_id: UUID (新增 — 多租户)
  name: VARCHAR
  channel_type: VARCHAR
  channel_id: UUID
  created_by: UUID (新增 — 用户归属)
  tags: JSONB
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ

messages:
  id: UUID
  session_id: UUID (FK → sessions)
  role: message_role ('user'|'assistant'|'system'|'tool')
  content: TEXT
  agent_id: UUID (新增 — 多 Agent 标识)
  tool_calls: JSONB (新增 — 工具调用记录)
  token_usage: JSONB (新增 — Token 消耗)
  created_at: TIMESTAMPTZ
```

---

## 5 渠道插件迁移详细方案

### 5.1 可迁移的渠道

| 渠道 | OpenClaw 库 | 迁移复杂度 | 主要改造点 |
|------|------------|-----------|-----------|
| Telegram | grammY 1.40 | ⭐⭐ 中低 | 添加多租户 Bot Token 管理 |
| Discord | discord.js | ⭐⭐ 中低 | 添加多 Guild 租户隔离 |
| Slack | @slack/bolt 4.6 | ⭐⭐ 中低 | 添加多 Workspace Token 管理 |
| WhatsApp | @whiskeysockets/baileys 7 | ⭐⭐⭐ 中高 | 会话持久化从文件改为 DB |
| LINE | @line/bot-sdk 10 | ⭐⭐ 中低 | 添加多租户 Token |
| Matrix | matrix-js-sdk | ⭐⭐ 中低 | 添加多 Homeserver 支持 |

### 5.2 需要新增的国内渠道

| 渠道 | SDK/协议 | 优先级 | 说明 |
|------|---------|-------|------|
| 微信公众号 | 微信开放平台 API | P0 | 国内必备 |
| 微信小程序 | UniApp + 微信 SDK | P0 | 与 UniApp 前端配合 |
| 企业微信 | 企业微信 API | P1 | 企业客户核心需求 |
| 飞书 | 飞书开放平台 API | P1 | 字节系企业客户 |
| 钉钉 | 钉钉开放平台 API | P1 | 阿里系企业客户 |

### 5.3 渠道适配器改造模板

```typescript
// OpenClaw 的适配器模式 → NextAI Agent 的多租户适配器

// 原 OpenClaw Telegram 适配器 (简化):
class TelegramChannel {
  bot: Bot;  // 单一 Bot 实例

  constructor(token: string) {
    this.bot = new Bot(token);
  }

  async sendMessage(chatId: string, text: string) {
    await this.bot.api.sendMessage(chatId, text);
  }
}

// NextAI Agent 多租户 Telegram 适配器:
class TelegramChannelAdapter implements ChannelAdapter {
  private bots = new Map<string, Bot>(); // 租户 → Bot 实例池

  async initialize(config: TenantChannelConfig) {
    const bot = new Bot(config.botToken);
    this.bots.set(config.tenantId, bot);
    await bot.init();
  }

  async sendMessage(tenantId: string, chatId: string, text: string) {
    const bot = this.bots.get(tenantId);
    if (!bot) throw new Error(`No bot for tenant ${tenantId}`);
    await bot.api.sendMessage(chatId, text);
  }

  async handleWebhook(tenantId: string, update: Update) {
    const bot = this.bots.get(tenantId);
    await bot.handleUpdate(update);
  }

  async disconnect(tenantId: string) {
    const bot = this.bots.get(tenantId);
    await bot?.stop();
    this.bots.delete(tenantId);
  }
}
```

---

## 6 技术栈迁移对照

### 6.1 依赖迁移

| 用途 | OpenClaw | NextAI Agent | 迁移说明 |
|------|----------|-------------|---------|
| 前端框架 | Lit 3.3 | React 19 + Next.js 15 | 完全替换 |
| UI 组件 | 自建 Lit 组件 | HeroUI 3 + TailwindCSS 4 | 完全替换 |
| HTTP 服务 | Express 5 | Hono (Node.js) / Gin (Go) | 替换 — 微服务架构 |
| Schema 验证 | Zod 4 | Zod 3 | ✅ 可复用 (降版本) |
| Agent 运行时 | Pi (@mariozechner/pi) | Anthropic Agent SDK + Vercel AI SDK | 替换 — 多 Agent 架构 |
| 数据库 | SQLite (node:sqlite) | PostgreSQL 16 (Drizzle ORM) | 完全替换 |
| 向量搜索 | SQLite FTS5 | Milvus 2.4 | 完全替换 |
| 缓存 | 内存 Map | Redis 7 | 新增 |
| 对象存储 | 本地文件系统 | MinIO | 新增 |
| 消息队列 | 无 | Kafka + RabbitMQ | 新增 |
| 日志 | 自建 Logger | Pino | 替换 |
| 测试 | Vitest | Vitest + Playwright | ✅ 沿用 Vitest |
| 构建 | Rolldown / tsdown | Turbopack (Next.js) + esbuild | 替换 |
| Lint | Oxlint + Oxfmt | ESLint + Prettier | 替换 — 生态更成熟 |
| 包管理 | pnpm | pnpm | ✅ 沿用 |

### 6.2 可直接沿用的依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `pnpm` | 9.x | 包管理器 |
| `zod` | 3.x/4.x | Schema 校验 |
| `vitest` | 2.x | 测试框架 |
| `grammy` | 1.x | Telegram Bot |
| `discord.js` | 14.x | Discord Bot |
| `@slack/bolt` | 4.x | Slack Bot |
| `sharp` | 0.34.x | 图片处理 |
| `pdfjs-dist` | 5.x | PDF 解析 |
| `markdown-it` | 14.x | Markdown 渲染 |
| `playwright-core` | 1.x | 浏览器自动化 |

---

## 7 Skills 迁移评估

### 7.1 OpenClaw Skills 分类

OpenClaw 内置 54+ Skills（`/Volumes/data/github/ai/openclaw/skills/`）:

| 分类 | 数量 | 迁移价值 | 说明 |
|------|------|---------|------|
| 代码相关 | ~15 | ⭐⭐⭐ 高 | Code review, refactor, debug 等 |
| 文档相关 | ~8 | ⭐⭐ 中 | 文档生成、翻译、总结 |
| 数据处理 | ~6 | ⭐⭐ 中 | CSV/JSON 转换、数据分析 |
| 系统操作 | ~10 | ⭐ 低 | 本地文件操作，SaaS 不适用 |
| 网络操作 | ~5 | ⭐⭐ 中 | Web 搜索、API 调用 |
| 创意相关 | ~5 | ⭐⭐ 中 | 写作、头脑风暴 |
| 设备控制 | ~5 | ❌ 无 | 本地设备特有功能 |

### 7.2 推荐迁移的 Skills

```
迁移优先级:

P0 (必须):
├─ code-review       — 代码审查 (Agent Team 核心能力)
├─ code-refactor     — 代码重构
├─ debug-assist      — 调试辅助
├─ api-design        — API 设计
└─ test-generate     — 测试生成

P1 (建议):
├─ doc-generate      — 文档生成
├─ translate         — 翻译
├─ summarize         — 内容总结
├─ web-search        — 网络搜索
└─ data-analysis     — 数据分析

P2 (后续):
├─ brainstorm        — 头脑风暴
├─ writing-assist    — 写作辅助
└─ image-generate    — 图片生成
```

---

## 8 迁移执行计划

### 8.1 阶段规划

```
迁移执行时间线:

Phase A: 前端完全重写 (Week 1-20, 独立进行)
├─ 不依赖 OpenClaw 代码
├─ 基于产品需求文档实现
└─ 使用 Mock Service

Phase B: 后端架构评估 (Week 16-18, 与前端 M4 并行)
├─ 评估 OpenClaw 可复用代码
├─ 确定后端技术选型
└─ 定义服务划分

Phase C: 后端实现 + 渠道迁移 (Week 18-30)
├─ 核心服务开发 (Auth, User, Agent, Session)
├─ 渠道适配器改造 (Telegram, Discord, Slack)
├─ 国内渠道开发 (微信, 飞书, 钉钉)
└─ 前后端联调

Phase D: 数据迁移工具 (Week 28-30, 如需从 OpenClaw 导入数据)
├─ Session JSON → PostgreSQL 迁移脚本
├─ Memory SQLite → Milvus 迁移脚本
└─ 配置文件 → 数据库配置迁移
```

### 8.2 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Pi Agent 运行时不可替代 | Agent 功能降级 | 评估 Anthropic Agent SDK 替代方案 |
| WhatsApp Baileys 不稳定 | 渠道不可用 | 准备官方 WhatsApp Business API 备选 |
| OpenClaw Skill 格式不兼容 | 迁移成本增加 | 定义通用 Skill Schema，用适配层包装 |
| 多租户改造遗漏 | 数据泄露 | 架构层强制 tenant_id 过滤 |
| 性能差异 (SQLite → PostgreSQL) | 延迟增加 | Redis 缓存 + 连接池优化 |

---

## 9 关键文件参考索引

### 9.1 OpenClaw 核心文件速查

| 文件 | 行数 | 重点内容 |
|------|------|---------|
| `src/gateway/server.impl.ts` | ~2500 | Gateway 核心逻辑，理解整体架构 |
| `src/agents/pi-embedded-runner.ts` | ~800 | Agent 执行引擎，理解工具调用流程 |
| `src/agents/pi-tools.ts` | ~600 | 工具系统，参考工具注册模式 |
| `src/channels/plugins/types.ts` | ~400 | 渠道适配器接口，复用设计模式 |
| `src/config/zod-schema.ts` | ~800 | Zod 配置校验，复用校验模式 |
| `src/config/env-substitution.ts` | ~100 | 环境变量替换，可直接复用 |
| `src/memory/memory-schema.ts` | ~200 | 记忆索引 Schema，参考分块策略 |
| `src/routing/resolve-route.ts` | ~300 | 路由解析，参考路由模式 |
| `src/plugin-sdk/index.ts` | ~200 | 插件 SDK 接口，参考插件设计 |
| `ui/src/ui/chat/` | ~500 | 对话 UI，参考消息渲染逻辑 |
