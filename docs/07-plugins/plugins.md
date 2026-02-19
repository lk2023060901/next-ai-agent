# 插件市场与开发者生态

## 1 插件系统架构

### 1.1 插件类型

| 类型 | 描述 | 示例 |
|------|------|------|
| Tool Plugin | 为 Agent 提供新工具 | GitHub 集成、Jira 集成 |
| Channel Plugin | 新增消息渠道 | 钉钉、企业微信 |
| Memory Plugin | 记忆/知识存储后端 | LanceDB、Pinecone |
| Hook Plugin | 生命周期钩子 | 消息过滤、审计日志 |
| Skill | 预定义的任务模板 | 代码审查、翻译、摘要 |
| Agent Template | 可复用的 Agent 配置 | 数据分析师、客服助手 |
| Observability Plugin | 可观测性扩展 | 自定义指标、日志管道 |

### 1.2 插件 SDK 接口

```typescript
interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  icon: string;
  type: PluginType;
  permissions: Permission[];
  configSchema?: JSONSchema;
  pricing: PricingConfig;
  observability?: ObservabilityConfig;
  apiDocs?: string;       // OpenAPI spec URL
  webhooks?: WebhookDef[];
}

type PluginType = "tool" | "channel" | "memory" | "hook" | "skill" | "agent-template" | "observability";

interface PricingConfig {
  model: "free" | "one_time" | "subscription" | "usage_based";
  price?: number;            // 一次性购买价格 (分)
  monthlyPrice?: number;     // 月订阅价格 (分)
  usageUnit?: string;        // 用量单位 (如 "API call", "document")
  usagePrice?: number;       // 单位价格 (分)
  trialDays?: number;        // 试用天数
  revenueSplit: number;      // 开发者分成比例 (0-100, 默认 70)
}

interface ObservabilityConfig {
  metrics?: MetricDef[];      // 自定义指标定义
  logs?: LogConfig;           // 日志级别和格式
  traces?: boolean;           // 是否接入分布式追踪
  healthCheck?: string;       // 健康检查端点路径
  dashboard?: string;         // 自定义 Grafana dashboard JSON
}
```

---

## 2 开发者 API 平台

### 2.1 API 设计原则

对外暴露的开发者 API 遵循以下原则：
- RESTful + WebSocket 双协议
- 所有端点均有 OpenAPI 3.1 规范文档
- SDK 提供 TypeScript、Python、Golang 三语言
- 沙箱环境用于开发调试
- 限流独立于主 API (开发者有独立配额)

### 2.2 开发者 API 端点

#### 2.2.1 Agent 调用 API

允许外部系统通过 API 调用 Agent：

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/dev/agents/{agentId}/chat` | 同步调用 Agent (等待完整回复) |
| POST | `/api/v1/dev/agents/{agentId}/chat/stream` | 流式调用 Agent (SSE) |
| POST | `/api/v1/dev/agents/{agentId}/invoke` | 调用 Agent 执行特定工具 |
| GET | `/api/v1/dev/agents/{agentId}/status` | 获取 Agent 当前状态 |

**请求示例**:
```json
POST /api/v1/dev/agents/{agentId}/chat/stream
Authorization: Bearer dev_sk_xxx
Content-Type: application/json

{
  "message": "帮我分析这段代码的性能问题",
  "session_id": "optional_session_for_context",
  "attachments": [
    { "type": "code", "content": "function foo() { ... }", "language": "typescript" }
  ],
  "config": {
    "model_override": "claude-sonnet-4-5",
    "max_tokens": 2048,
    "tools": ["code_analyze", "search_knowledge"]
  }
}
```

**SSE 流式响应**:
```
data: {"type":"thinking","content":"分析代码结构..."}
data: {"type":"delta","content":"这段代码存在"}
data: {"type":"delta","content":"以下性能问题：\n\n1. "}
data: {"type":"tool_call","name":"code_analyze","status":"running"}
data: {"type":"tool_result","name":"code_analyze","result":{...}}
data: {"type":"delta","content":"根据分析结果..."}
data: {"type":"done","usage":{"input_tokens":1234,"output_tokens":567}}
```

#### 2.2.2 记忆 API

允许外部系统读写 Agent 记忆：

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/dev/memory/write` | 写入记忆 |
| POST | `/api/v1/dev/memory/search` | 搜索记忆 |
| GET | `/api/v1/dev/memory/{memoryId}` | 获取记忆详情 |
| DELETE | `/api/v1/dev/memory/{memoryId}` | 删除记忆 |
| POST | `/api/v1/dev/knowledge/{kbId}/search` | 搜索知识库 |
| POST | `/api/v1/dev/knowledge/{kbId}/ingest` | 程序化灌入知识 |

#### 2.2.3 Webhook API

允许外部事件触发 Agent：

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/dev/webhooks` | 创建 Webhook |
| GET | `/api/v1/dev/webhooks` | 列出 Webhook |
| DELETE | `/api/v1/dev/webhooks/{id}` | 删除 Webhook |
| POST | `/api/v1/dev/webhooks/{id}/test` | 测试触发 |

**支持的事件**: `message.received`, `task.completed`, `task.failed`, `agent.error`, `session.created`, `memory.updated`, `channel.status_changed`

#### 2.2.4 插件运行时 API

插件运行时可调用的宿主 API：

```typescript
// 插件运行时上下文
interface PluginContext {
  // 读取插件配置
  getConfig<T>(): T;

  // Agent 相关
  sendMessage(agentId: string, message: string): Promise<AgentResponse>;
  getSessionHistory(sessionId: string, limit?: number): Promise<Message[]>;

  // 记忆相关
  writeMemory(memory: MemoryInput): Promise<string>;
  searchMemory(query: string, options?: SearchOptions): Promise<MemoryResult[]>;

  // 存储 (每个插件独立的 Key-Value 存储)
  storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
  };

  // 日志 (自动关联到可观测性系统)
  logger: {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, error?: Error, data?: Record<string, unknown>): void;
  };

  // 指标 (自动上报到可观测性系统)
  metrics: {
    counter(name: string, value?: number, tags?: Record<string, string>): void;
    gauge(name: string, value: number, tags?: Record<string, string>): void;
    histogram(name: string, value: number, tags?: Record<string, string>): void;
  };

  // HTTP 外部请求 (经过平台代理, 记录审计日志)
  fetch(url: string, options?: RequestInit): Promise<Response>;

  // 发送通知
  notify(userId: string, notification: Notification): Promise<void>;
}
```

### 2.3 开发者控制台

**路由**: `/developer`

**页面结构**:

```
┌──────────┬──────────────────────────────────────────────────┐
│          │                                                   │
│  左侧导航 │              主内容区                              │
│          │                                                   │
│  概览     │                                                   │
│  API 密钥 │                                                   │
│  我的插件 │                                                   │
│  文档     │                                                   │
│  沙箱     │                                                   │
│  分析     │                                                   │
│  收入     │                                                   │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

#### 2.3.1 API 密钥管理

- 开发者专用 API Key (前缀 `dev_sk_`)
- 独立的限流配额 (不占用主账号配额)
- 支持 Scope 限制 (agent:invoke, memory:read, memory:write, webhook:manage)

#### 2.3.2 沙箱环境

- 隔离的测试工作区
- 模拟 Agent 响应 (不消耗真实 Token)
- Webhook 测试端点
- 请求日志查看器

#### 2.3.3 插件提交与发布

发布流程:
```
本地开发 → 提交审核 → 自动化检查 → 人工审核 → 上架
                          │
                          ├─ 安全扫描 (依赖漏洞检查)
                          ├─ 权限合理性检查
                          ├─ 性能基准测试
                          └─ 可观测性合规检查
```

---

## 3 插件市场页面

### 3.1 市场首页

**路由**: `/org/[slug]/plugins/marketplace`

**页面结构**:

```
┌─────────────────────────────────────────────────────────────────┐
│ 插件市场 (H2)                                                    │
│ 发现和安装扩展，增强 Agent 的能力 (Body, Text-Secondary)            │
│                                                                  │
│ [搜索框 宽400px] [分类筛选 Select] [价格筛选 Select] [排序 Select]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 精选推荐 (H3)                                                    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│ │ 推荐插件  │ │ 推荐插件  │ │ 推荐插件  │ │ 推荐插件  │               │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│ (4列, 间距 space-4, 水平滚动)                                     │
│                                                                  │
│ 全部插件 (H3)  Tabs: [全部|工具|渠道|记忆|技能|Agent模板]           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│ │ 插件卡片  │ │ 插件卡片  │ │ 插件卡片  │                         │
│ └──────────┘ └──────────┘ └──────────┘                         │
│ (3列网格, 间距 space-4)                                           │
└─────────────────────────────────────────────────────────────────┘
```

**价格筛选 Select**:
- 全部
- 免费
- 付费
- 有试用期

### 3.2 精选推荐卡片

```
┌───────────────────────────────────────┐
│ [背景渐变: 对应分类色 → 深色]          │
│ 高度: 160px                           │
│                                       │
│ [插件图标 48x48, 白色/浅色]            │
│ 插件名称 (H3, #FFFFFF)                │
│ 简短描述 (Body-sm, rgba(255,255,255,0.8)) │
│                                       │
│ [安装数 Tiny] · [评分 ★4.8 Tiny]       │
│ [Free Badge] 或 [¥29/月 Badge]         │
└───────────────────────────────────────┘
```

- 圆角: radius-lg
- hover: scale(1.02), shadow-lg

### 3.3 插件列表卡片

```
┌───────────────────────────────────────┐
│ ┌──────┐                              │
│ │ 图标  │  插件名称 (H4)               │
│ │48x48 │  作者名 (Caption, Text-Tert)  │
│ └──────┘                              │
│                                       │
│ 简短描述，最多两行截断 (Body-sm,         │
│ Text-Secondary)                       │
│                                       │
│ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │ Tool │ │¥29/月│ │ ★4.5 │          │
│ └──────┘ └──────┘ └──────┘          │
│ (Badge 组, 水平排列)                   │
│                                       │
│ [安装 / 已安装 ✓ / 购买]  按钮         │
└───────────────────────────────────────┘
```

**价格 Badge 样式**:
- 免费: `Free` (Success-50 背景, Success-600 文字)
- 一次性: `¥99` (Primary-50, Primary-600)
- 订阅: `¥29/月` (Primary-50, Primary-600)
- 按量: `按量计费` (Warning-50, Warning-600)

**按钮样式**:
- 免费插件: "安装" (Primary sm)
- 已安装: "已安装 ✓" (Success-50, Success-600, CheckCircle)
- 付费未购买: "购买 ¥99" (Primary sm) 或 "订阅 ¥29/月" (Primary sm)
- 付费有试用: "免费试用 7 天" (Outline-Primary sm)

### 3.4 插件详情页

**路由**: `/org/[slug]/plugins/marketplace/[plugin-id]`

**布局** (左右分栏: 主内容 + 侧边栏):

```
┌─────────────────────────────────────────────────────────────┐
│ ← 返回  (Ghost link)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [图标 64x64]                                                 │
│ 插件名称 (H1)                                                │
│ 作者: xxx (Body-sm) · 版本: 1.2.3 · 更新: 2026-02-01         │
│ [★★★★☆ 4.5] (12 评价)                                       │
│                                                              │
│ [安装/购买] (Primary lg)  [GitHub] (Secondary sm)            │
│                                                              │
│ 付费插件额外显示:                                              │
│ ┌──────────────────────────────────────────┐                │
│ │ ¥29/月  或  ¥299/年 (省15%)              │                │
│ │ [7天免费试用] (Outline-Primary)            │                │
│ │ 退款政策: 购买7天内无条件退款 (Caption)     │                │
│ └──────────────────────────────────────────┘                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Tabs: [介绍 | API文档 | 配置说明 | 版本历史 | 评价]            │
│                                                              │
│ (介绍 Tab - 主内容区)         (侧边栏 280px)                  │
│ Markdown 渲染的详细介绍        ┌───────────────────┐        │
│ 截图 Gallery                   │ 信息               │        │
│                                │ 类型: Tool Plugin  │        │
│                                │ 许可证: MIT        │        │
│                                │ 安装数: 1,234      │        │
│                                │ 价格: ¥29/月       │        │
│                                │ 大小: 45KB         │        │
│                                │ 权限: browser...   │        │
│                                │                    │        │
│                                │ 可观测性           │        │
│                                │ ✓ 自定义指标       │        │
│                                │ ✓ 分布式追踪       │        │
│                                │ ✓ 健康检查         │        │
│                                │                    │        │
│                                │ 兼容性             │        │
│                                │ Agent: v1.0+       │        │
│                                │ Node: 22+          │        │
│                                └───────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**(API 文档 Tab)**:
- 嵌入式 Swagger/Redoc 风格的 API 文档渲染
- 插件暴露的自定义 API 端点
- 请求/响应示例
- 认证方式说明

### 3.5 已安装插件页面

**路由**: `/org/[slug]/ws/[workspace-slug]/plugins`

**列表**: 每个已安装插件显示为一行:

```
┌──────────────────────────────────────────────────────────────────────┐
│ [图标 40x40] [插件名 H4]  [版本 Badge]  [状态: 启用/禁用 Switch]      │
│              [描述 Body-sm Text-Sec]                                  │
│              [价格: Free / ¥29/月 到期:2026-03-18 (Caption)]          │
│                                                                       │
│  [配置](Ghost sm) [指标](Ghost sm) [更新](Primary sm) [卸载](Danger Ghost sm) │
└──────────────────────────────────────────────────────────────────────┘
```

- "指标" 按钮: 打开该插件的可观测性面板

**配置弹窗**: 根据 pluginManifest.configSchema 动态渲染表单

---

## 4 可观测性集成

### 4.1 设计原则

可观测性不应是插件的可选项，而应**自然下沉到插件运行时**，让每个插件零配置获得基础可观测能力，同时允许高级定制。

### 4.2 三层可观测性模型

```
┌──────────────────────────────────────────────────────────────────┐
│ 第3层: 插件自定义可观测性 (开发者主动埋点)                          │
│ - 自定义业务指标 (如 "文档解析成功率")                              │
│ - 自定义 Trace Span                                              │
│ - 自定义 Dashboard                                               │
├──────────────────────────────────────────────────────────────────┤
│ 第2层: 平台自动注入 (插件运行时自动采集)                            │
│ - 每次调用的延迟、成功/失败计数                                    │
│ - Token 消耗归因到插件                                            │
│ - 内存/CPU 使用量                                                 │
│ - HTTP 外部请求的链路追踪                                         │
├──────────────────────────────────────────────────────────────────┤
│ 第1层: 基础健康检查 (零配置)                                      │
│ - 插件启动/停止状态                                               │
│ - 心跳检测 (每 30 秒)                                            │
│ - 错误率告警 (>5% 自动告警)                                      │
│ - 调用量统计                                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 自动注入机制

平台在插件运行时自动包裹 (wrap) 插件的关键方法：

```typescript
// 平台自动包裹插件的 tool handler
function wrapToolHandler(pluginId: string, handler: ToolHandler): ToolHandler {
  return async (input, context) => {
    const span = tracer.startSpan(`plugin.${pluginId}.tool_call`);
    const startTime = Date.now();

    try {
      const result = await handler(input, context);

      metrics.counter("plugin.tool_call.success", 1, { plugin: pluginId });
      metrics.histogram("plugin.tool_call.duration_ms", Date.now() - startTime, { plugin: pluginId });

      span.setStatus({ code: SpanStatusCode.OK });
      return result;

    } catch (error) {
      metrics.counter("plugin.tool_call.error", 1, { plugin: pluginId, error: error.name });
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      logger.error(`Plugin ${pluginId} tool call failed`, error);
      throw error;

    } finally {
      span.end();
    }
  };
}
```

### 4.4 插件可观测性面板

**入口**: 已安装插件列表 → "指标" 按钮 → Drawer (480px)

**面板内容**:

```
┌──────────────────────────────────────────────────────┐
│ GitHub 集成 - 运行状态 (H3)                           │
│                                                       │
│ 状态: ● 运行中 (Success)    运行时间: 3天2小时         │
│                                                       │
│ ┌──────────────┐  ┌──────────────┐                   │
│ │ 今日调用: 234 │  │ 错误率: 0.4% │                   │
│ └──────────────┘  └──────────────┘                   │
│ ┌──────────────┐  ┌──────────────┐                   │
│ │ P95延迟: 45ms│  │ Token: 12.5K │                   │
│ └──────────────┘  └──────────────┘                   │
│                                                       │
│ 调用趋势 (24h 折线图, 高200px)                         │
│ [───────────────────────────────────]                 │
│                                                       │
│ 最近错误 (列表, 最多5条)                               │
│ ┌─────────────────────────────────────────┐          │
│ │ ✗ [2min前] Rate limit exceeded (429)    │          │
│ │ ✗ [1h前] Connection timeout             │          │
│ └─────────────────────────────────────────┘          │
│                                                       │
│ [查看完整日志](Ghost sm)  [查看 Traces](Ghost sm)     │
└──────────────────────────────────────────────────────┘
```

### 4.5 开发者分析面板

**路由**: `/developer/analytics`

开发者可查看自己发布的插件的聚合指标：

- 总安装量趋势
- 日活跃使用量
- 错误率趋势
- 用户评分趋势
- 收入统计 (付费插件)
- 各版本采用率

---

## 5 插件商业化

### 5.1 收费模型

| 模型 | 描述 | 开发者分成 | 适用场景 |
|------|------|-----------|---------|
| 免费 | 完全免费使用 | - | 开源工具、推广 |
| 一次性购买 | 一次付费永久使用 | 70% | 小工具 |
| 月订阅 | 按月付费, 取消后失效 | 70% | 持续服务 |
| 按量计费 | 按使用量付费 | 70% | API 集成类 |

### 5.2 开发者收入页面

**路由**: `/developer/revenue`

**内容**:
- 总收入、本月收入、待结算金额
- 收入趋势图 (按天/周/月)
- 各插件收入明细表
- 提现记录
- 提现操作: 最低 ¥100 起提, T+7 到账

### 5.3 试用与退款

- 付费插件可设置 3/7/14 天试用期
- 一次性购买: 7 天内无条件退款
- 订阅: 当前计费周期内可取消, 周期末失效
- 退款后插件立即禁用

---

## 6 技能 (Skills)

### 6.1 技能选择器

在对话界面，输入 `/skill` 或点击技能按钮:

**Dropdown Panel** (宽 400px, 最大高 400px):
- 搜索框 (sm)
- 分类 Tabs (内联): 全部 | 开发 | 内容 | 分析
- 技能列表:
  ```
  [图标 20px] [技能名 Body] [描述 Caption Text-Tert] [Free/¥ Badge]
  ```
  - 高度: 40px
  - hover: 背景 Surface
  - 点击: 插入技能命令到输入框

### 6.2 预置技能列表

| 技能名 | 命令 | 描述 | Agent | 价格 |
|--------|------|------|-------|------|
| 代码审查 | `/review` | 审查指定代码文件 | 审查 Agent | 免费 |
| 需求文档 | `/prd` | 生成产品需求文档 | 需求 Agent | 免费 |
| API 设计 | `/api-design` | 设计 RESTful API | 架构 Agent | 免费 |
| 单元测试 | `/unit-test` | 生成单元测试代码 | 测试 Agent | 免费 |
| 翻译 | `/translate` | 多语言翻译 | 通用 Agent | 免费 |
| 摘要 | `/summarize` | 文档/会话摘要 | 通用 Agent | 免费 |
| 部署 | `/deploy` | 部署代码到环境 | 运维 Agent | 免费 |
| 数据库迁移 | `/migrate` | 生成数据库迁移 | 后端 Agent | 免费 |
