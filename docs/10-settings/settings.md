# 系统设置

## 1 AI Provider 配置

### 1.1 Provider 管理页面

**路由**: `/org/[slug]/ws/[workspace-slug]/settings/providers`

**布局**: 卡片列表

每个 Provider 卡片:
```
┌──────────────────────────────────────────────────────────────┐
│ [Provider Logo 40x40] [space-3]                               │
│                                                               │
│ Anthropic                    [已配置 Badge Success]            │
│ Claude Opus 4.6, Sonnet 4.5 (Body-sm, Text-Secondary)        │
│                                                               │
│ API Key: sk-ant-****...4a2b  (Code, Body-sm)                  │
│ 最后使用: 2 分钟前  (Caption)                                   │
│                                                               │
│ [编辑](Ghost sm) [测试连接](Secondary sm) [移除](Danger Ghost) │
└──────────────────────────────────────────────────────────────┘
```

- 间距: space-4
- 内边距: space-5
- 圆角: radius-lg
- 边框: 1px Border
- 未配置状态: 边框虚线, 内部显示 "点击配置" + Plus 图标

**支持的 Provider 列表**:

| Provider | 配置字段 | 模型 |
|----------|---------|------|
| Anthropic | API Key | Claude Opus 4.6, Sonnet 4.5, Haiku 4.5 |
| OpenAI | API Key | GPT-4o, GPT-4-turbo, o1, o3-mini |
| Google | API Key | Gemini 2.0 Flash, Gemini 2.0 Pro |
| OpenRouter | API Key | 全部模型 (推荐) |
| Azure OpenAI | Endpoint + Key + Deployment | 自选 |
| AWS Bedrock | Access Key + Secret + Region | Claude, Titan |
| 自定义 (LiteLLM) | Base URL + Key | 自定义 |

### 1.2 Provider 配置 Modal

**Modal (md: 640px)**:

1. **Provider 选择**: 图标 + 名称 + 描述 (如果从卡片进入则跳过)

2. **配置表单** (因 Provider 而异):

   **Anthropic**:
   - API Key: Input (type=password, Placeholder "sk-ant-...")
   - 默认模型: Select (Opus 4.6 / Sonnet 4.5 / Haiku 4.5)

   **OpenRouter**:
   - API Key: Input (Placeholder "sk-or-...")
   - 说明: "OpenRouter 支持 200+ 模型, 推荐使用" (Info Alert)

   **自定义 (LiteLLM)**:
   - Base URL: Input (Placeholder "https://your-litellm.com/v1")
   - API Key: Input
   - 模型名: Input

3. **测试连接按钮**: 发送 "Hello" 测试请求
   - 成功: ✓ "连接成功, 模型: claude-opus-4-6" (Success)
   - 失败: ✗ "认证失败: Invalid API Key" (Danger)

4. **保存**: "保存配置" (Primary md) + "取消" (Ghost)

---

## 2 安全设置

### 2.1 沙箱配置

**路由**: `/org/[slug]/ws/[workspace-slug]/settings/security`

**设置项**:

| 设置 | 类型 | 描述 |
|------|------|------|
| 代码执行沙箱 | Toggle | Agent 代码执行是否使用 Docker 隔离 |
| 浏览器沙箱 | Toggle | 浏览器操作是否使用隔离实例 |
| 文件访问范围 | Select | 仅工作区 / 仅指定目录 / 无限制 |
| 网络访问 | Multi-select | 允许的域名列表 (或 "全部") |
| 敏感操作审批 | Toggle | 删除、部署等操作需人工确认 |
| 会话记录 | Toggle | 是否记录完整对话到审计日志 |

每个设置项布局:
```
┌──────────────────────────────────────────────────────┐
│ 代码执行沙箱 (Body, font-weight 500)         [Toggle] │
│ Agent 执行代码时使用 Docker 容器隔离                    │
│ (Caption, Text-Tertiary)                              │
└──────────────────────────────────────────────────────┘
```

- 间距: space-4 (项间), space-1 (标题与描述)
- 分组: 卡片 (Card) 包裹, 卡片标题 H4

### 2.2 工具权限

表格形式, 每行一个工具:

| 工具 | 需要审批 | 允许的 Agent | 风险等级 |
|------|---------|-------------|---------|
| code_execute | Toggle | Multi-select | Badge (高/中/低) |
| browser | Toggle | Multi-select | Badge |
| file_write | Toggle | Multi-select | Badge |
| api_request | Toggle | Multi-select | Badge |
| system_command | Toggle | Multi-select | Badge |

风险等级 Badge 颜色:
- 高: Danger
- 中: Warning
- 低: Success

---

## 3 Webhook 配置

### 3.1 Webhook 列表页

**路由**: `/org/[slug]/ws/[workspace-slug]/settings/webhooks`

**列表**: 表格

| 列 | 宽度 | 内容 |
|-----|------|------|
| URL | 40% | 截断显示 |
| 事件 | 25% | Badge 组 (2-3个, 溢出 "+N") |
| 状态 | 15% | 启用/禁用 Switch |
| 最近触发 | 10% | 相对时间 |
| 操作 | 10% | 编辑/删除 |

### 3.2 创建 Webhook

**Modal (md: 640px)**:

1. **Webhook URL**: Input (Placeholder "https://your-server.com/webhook")
2. **Secret**: Input (自动生成, 可修改, 用于签名验证)
3. **事件订阅** (Checkbox 列表):
   - `message.created` — 新消息
   - `session.created` — 新会话
   - `task.completed` — 任务完成
   - `task.failed` — 任务失败
   - `agent.error` — Agent 错误
   - `channel.status_changed` — 渠道状态变化
   - `member.joined` — 成员加入
4. **重试策略**: Select (不重试 / 重试3次 / 重试5次, 间隔 30s/60s/300s)
5. "测试 Webhook" 按钮 → 发送测试事件
6. "创建" 按钮

### 3.3 Webhook 日志

点击 Webhook 行展开:
- 最近 50 次触发记录
- 每条: 时间 | 事件类型 | 状态码 | 响应时间 | [重试]
- 失败记录: 显示响应体 (Code 字体, 可折叠)

---

## 4 导入/导出

### 4.1 数据导出

**路由**: `/org/[slug]/settings/export`

**可导出内容** (Checkbox):
- 会话历史 (JSON)
- Agent 配置 (JSON)
- 知识库文档 (ZIP)
- 用量统计 (CSV)
- 成员列表 (CSV)

**导出格式**: JSON / CSV / ZIP (视内容类型)

**操作**:
1. 勾选要导出的内容
2. "开始导出" 按钮
3. 后台处理, 完成后邮件通知 + 站内通知
4. 下载链接 (有效期 24 小时, MinIO 签名 URL)

### 4.2 数据导入

- Agent 配置: 上传 JSON 文件, 预览 → 确认导入
- 知识库: 批量上传文档 (见知识库管理)
