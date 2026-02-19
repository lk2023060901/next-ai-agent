# API 设计规范

## 1 API 总则

### 1.1 基础规范

| 项目 | 规范 |
|------|------|
| 协议 | HTTPS (TLS 1.3) |
| 格式 | JSON (Content-Type: application/json) |
| 版本 | URL 路径: `/api/v1/...` |
| 认证 | Bearer Token (JWT) |
| 编码 | UTF-8 |
| 时间 | ISO 8601 (UTC): `2026-02-18T12:00:00Z` |
| ID | UUID v7 (时间排序) |
| 分页 | Cursor-based (默认) 或 Offset-based |

### 1.2 通用响应格式

**成功响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "meta": {
    "requestId": "req_uuid",
    "timestamp": "2026-02-18T12:00:00Z"
  }
}
```

**分页响应**:
```json
{
  "code": 0,
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 100,
      "cursor": "eyJpZCI6MTAwfQ==",
      "hasMore": true,
      "limit": 20
    }
  }
}
```

**错误响应**:
```json
{
  "code": 40001,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "meta": {
    "requestId": "req_uuid",
    "timestamp": "2026-02-18T12:00:00Z"
  }
}
```

### 1.3 错误码规范

| 范围 | 类别 | 示例 |
|------|------|------|
| 40000-40099 | 认证错误 | 40001 Token 过期 |
| 40100-40199 | 权限错误 | 40101 无权限访问 |
| 40200-40299 | 参数错误 | 40201 参数缺失 |
| 40300-40399 | 资源不存在 | 40301 用户不存在 |
| 40400-40499 | 冲突错误 | 40401 用户名已存在 |
| 42900-42999 | 限流错误 | 42901 请求过于频繁 |
| 50000-50099 | 服务器错误 | 50001 内部错误 |
| 50300-50399 | 依赖服务错误 | 50301 AI Provider 不可用 |

### 1.4 限流策略

| 端点类别 | 限制 | 窗口 |
|----------|------|------|
| 认证接口 | 10 次 | 1 分钟 |
| Agent 对话 | 60 次 | 1 分钟 |
| 管理接口 | 100 次 | 1 分钟 |
| 文件上传 | 20 次 | 1 分钟 |
| WebSocket | 100 消息 | 1 分钟 |

限流响应:
```
HTTP 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1708300060
```

---

## 2 API 端点列表

### 2.1 认证 (Auth)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/auth/signup` | 注册 |
| POST | `/api/v1/auth/login` | 登录 |
| POST | `/api/v1/auth/logout` | 登出 |
| POST | `/api/v1/auth/refresh` | 刷新 Token |
| POST | `/api/v1/auth/forgot-password` | 忘记密码 |
| POST | `/api/v1/auth/reset-password` | 重置密码 |
| POST | `/api/v1/auth/verify-email` | 验证邮箱 |
| GET | `/api/v1/auth/oauth/github` | GitHub OAuth |
| GET | `/api/v1/auth/oauth/google` | Google OAuth |
| GET | `/api/v1/auth/oauth/callback` | OAuth 回调 |

### 2.2 用户 (Users)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/users/me` | 获取当前用户 |
| PATCH | `/api/v1/users/me` | 更新个人信息 |
| PUT | `/api/v1/users/me/avatar` | 上传头像 |
| PUT | `/api/v1/users/me/password` | 修改密码 |
| GET | `/api/v1/users/me/sessions` | 登录会话列表 |
| DELETE | `/api/v1/users/me/sessions/:id` | 撤销会话 |
| POST | `/api/v1/users/me/2fa/enable` | 开启 2FA |
| POST | `/api/v1/users/me/2fa/verify` | 验证 2FA |
| DELETE | `/api/v1/users/me/2fa` | 关闭 2FA |
| GET | `/api/v1/users/me/api-keys` | API Key 列表 |
| POST | `/api/v1/users/me/api-keys` | 创建 API Key |
| DELETE | `/api/v1/users/me/api-keys/:id` | 删除 API Key |

### 2.3 组织 (Organizations)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/orgs` | 我的组织列表 |
| POST | `/api/v1/orgs` | 创建组织 |
| GET | `/api/v1/orgs/:slug` | 获取组织详情 |
| PATCH | `/api/v1/orgs/:slug` | 更新组织 |
| DELETE | `/api/v1/orgs/:slug` | 删除组织 |
| GET | `/api/v1/orgs/:slug/members` | 成员列表 |
| POST | `/api/v1/orgs/:slug/members/invite` | 邀请成员 |
| PATCH | `/api/v1/orgs/:slug/members/:userId` | 更新成员角色 |
| DELETE | `/api/v1/orgs/:slug/members/:userId` | 移除成员 |
| GET | `/api/v1/orgs/:slug/audit-logs` | 审计日志 |

### 2.4 工作区 (Workspaces)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/orgs/:slug/workspaces` | 工作区列表 |
| POST | `/api/v1/orgs/:slug/workspaces` | 创建工作区 |
| GET | `/api/v1/orgs/:slug/ws/:wsSlug` | 获取工作区详情 |
| PATCH | `/api/v1/orgs/:slug/ws/:wsSlug` | 更新工作区 |
| DELETE | `/api/v1/orgs/:slug/ws/:wsSlug` | 删除工作区 |
| GET | `/api/v1/orgs/:slug/ws/:wsSlug/stats` | 工作区统计 |

### 2.5 Agent

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/ws/:wsId/agents` | Agent 列表 |
| POST | `/api/v1/ws/:wsId/agents` | 创建 Agent |
| GET | `/api/v1/ws/:wsId/agents/:agentId` | 获取 Agent 详情 |
| PATCH | `/api/v1/ws/:wsId/agents/:agentId` | 更新 Agent |
| DELETE | `/api/v1/ws/:wsId/agents/:agentId` | 删除 Agent |
| POST | `/api/v1/ws/:wsId/agents/:agentId/invoke` | 调用 Agent |

### 2.6 会话 (Sessions)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/ws/:wsId/sessions` | 会话列表 |
| POST | `/api/v1/ws/:wsId/sessions` | 创建会话 |
| GET | `/api/v1/ws/:wsId/sessions/:sessionId` | 获取会话详情 |
| DELETE | `/api/v1/ws/:wsId/sessions/:sessionId` | 删除会话 |
| GET | `/api/v1/ws/:wsId/sessions/:sessionId/messages` | 消息列表 |
| POST | `/api/v1/ws/:wsId/sessions/:sessionId/messages` | 发送消息 |
| POST | `/api/v1/ws/:wsId/sessions/:sessionId/abort` | 中止生成 |

### 2.7 渠道 (Channels)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/ws/:wsId/channels` | 渠道列表 |
| POST | `/api/v1/ws/:wsId/channels` | 添加渠道 |
| GET | `/api/v1/ws/:wsId/channels/:channelId` | 渠道详情 |
| PATCH | `/api/v1/ws/:wsId/channels/:channelId` | 更新渠道 |
| DELETE | `/api/v1/ws/:wsId/channels/:channelId` | 断开渠道 |
| POST | `/api/v1/ws/:wsId/channels/:channelId/test` | 测试连接 |
| GET | `/api/v1/ws/:wsId/channels/:channelId/logs` | 消息日志 |

### 2.8 知识库 (Knowledge Base)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/ws/:wsId/knowledge` | 知识库列表 |
| POST | `/api/v1/ws/:wsId/knowledge` | 创建知识库 |
| GET | `/api/v1/ws/:wsId/knowledge/:kbId` | 知识库详情 |
| PATCH | `/api/v1/ws/:wsId/knowledge/:kbId` | 更新知识库 |
| DELETE | `/api/v1/ws/:wsId/knowledge/:kbId` | 删除知识库 |
| POST | `/api/v1/ws/:wsId/knowledge/:kbId/documents` | 上传文档 |
| GET | `/api/v1/ws/:wsId/knowledge/:kbId/documents` | 文档列表 |
| DELETE | `/api/v1/ws/:wsId/knowledge/:kbId/documents/:docId` | 删除文档 |
| POST | `/api/v1/ws/:wsId/knowledge/:kbId/search` | 搜索知识库 |

### 2.9 插件 (Plugins)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/plugins/marketplace` | 市场插件列表 |
| GET | `/api/v1/plugins/marketplace/:pluginId` | 插件详情 |
| GET | `/api/v1/ws/:wsId/plugins` | 已安装插件 |
| POST | `/api/v1/ws/:wsId/plugins/:pluginId/install` | 安装插件 |
| DELETE | `/api/v1/ws/:wsId/plugins/:pluginId` | 卸载插件 |
| PATCH | `/api/v1/ws/:wsId/plugins/:pluginId/config` | 更新插件配置 |

### 2.10 计费 (Billing)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/billing/plans` | 全部可用方案列表 (按 category 分组: personal/enterprise/custom) |
| GET | `/api/v1/billing/plans/:planSlug` | 方案详情 |
| GET | `/api/v1/orgs/:slug/billing/subscription` | 当前订阅 (含方案详情、用量概览) |
| POST | `/api/v1/orgs/:slug/billing/subscribe` | 新订阅 (body: { planSlug, billingCycle }) |
| POST | `/api/v1/orgs/:slug/billing/upgrade` | 升级方案 (body: { planSlug }, 立即生效) |
| POST | `/api/v1/orgs/:slug/billing/downgrade` | 降级方案 (body: { planSlug }, 周期末生效) |
| POST | `/api/v1/orgs/:slug/billing/switch-cycle` | 切换计费周期 (body: { billingCycle: monthly/yearly }) |
| POST | `/api/v1/orgs/:slug/billing/cancel` | 取消订阅 (周期末生效) |
| GET | `/api/v1/orgs/:slug/billing/invoices` | 账单列表 (支持筛选: status, dateRange) |
| GET | `/api/v1/orgs/:slug/billing/invoices/:invoiceId/pdf` | 下载发票 PDF |
| GET | `/api/v1/orgs/:slug/billing/usage` | 用量统计 (支持筛选: period, workspace, agent) |
| POST | `/api/v1/orgs/:slug/billing/payment-method` | 更新支付方式 |
| POST | `/api/v1/billing/contact-sales` | 定制方案咨询提交 (body: { name, company, email, phone, teamSize, description }) |

---

## 3 WebSocket API

### 3.1 连接

```
wss://api.nextai-agent.com/ws/v1?token=<jwt>&workspace=<wsId>
```

### 3.2 消息格式

```json
{
  "type": "event_type",
  "payload": { ... },
  "timestamp": "2026-02-18T12:00:00Z"
}
```

### 3.3 事件类型

**客户端 → 服务端**:

| type | 描述 | payload |
|------|------|---------|
| `chat.send` | 发送消息 | `{ sessionId, content, attachments }` |
| `chat.abort` | 中止生成 | `{ sessionId }` |
| `chat.typing` | 输入状态 | `{ sessionId, isTyping }` |
| `session.subscribe` | 订阅会话 | `{ sessionId }` |
| `session.unsubscribe` | 取消订阅 | `{ sessionId }` |
| `ping` | 心跳 | `{}` |

**服务端 → 客户端**:

| type | 描述 | payload |
|------|------|---------|
| `chat.message.delta` | 流式消息片段 | `{ sessionId, agentId, delta, messageId }` |
| `chat.message.complete` | 消息完成 | `{ sessionId, agentId, message }` |
| `chat.tool.start` | 工具调用开始 | `{ sessionId, toolName, args }` |
| `chat.tool.result` | 工具调用结果 | `{ sessionId, toolName, result }` |
| `agent.switch` | Agent 切换 | `{ sessionId, fromAgent, toAgent }` |
| `task.update` | 任务状态更新 | `{ taskId, status, progress }` |
| `agent.thinking` | Agent 思考状态 | `{ sessionId, agentId, thinking }` |
| `error` | 错误 | `{ code, message }` |
| `pong` | 心跳回复 | `{}` |

### 3.4 流式输出示例

```
← { "type": "agent.thinking", "payload": { "agentId": "coord", "thinking": "分析用户需求..." } }
← { "type": "agent.switch", "payload": { "fromAgent": "coord", "toAgent": "requirements" } }
← { "type": "chat.message.delta", "payload": { "delta": "好的，" } }
← { "type": "chat.message.delta", "payload": { "delta": "我来帮你" } }
← { "type": "chat.message.delta", "payload": { "delta": "撰写需求文档。" } }
← { "type": "chat.tool.start", "payload": { "toolName": "document_create" } }
← { "type": "chat.tool.result", "payload": { "toolName": "document_create", "result": { "docId": "..." } } }
← { "type": "chat.message.complete", "payload": { "messageId": "msg_xxx" } }
← { "type": "task.update", "payload": { "taskId": "task_xxx", "status": "completed" } }
```
