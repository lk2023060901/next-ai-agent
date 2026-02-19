# 多智能体系统 (Multi-Agent System)

## 1 Agent Teams 架构

### 1.1 架构概述

基于 Anthropic Agent Teams 概念，系统采用分层 Agent 架构：

```
┌────────────────────────────────────────────────────────────────────┐
│                        协调 Agent (Coordinator)                     │
│              负责需求理解、任务拆解、Agent 派发、进度监控              │
└────────┬───────────┬───────────┬───────────┬───────────┬──────────┘
         │           │           │           │           │
    ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
    │需求Agent│ │架构Agent│ │开发Agent│ │测试Agent│ │审查Agent│
    │(Purple) │ │(Blue)   │ │(Green)  │ │(Pink)   │ │(Cyan)   │
    └─────────┘ └─────────┘ └────┬────┘ └─────────┘ └─────────┘
                                  │
                        ┌────────┼────────┐
                   ┌────▼────┐       ┌────▼────┐
                   │前端Agent│       │后端Agent│
                   │(Green)  │       │(Amber)  │
                   └─────────┘       └─────────┘
```

### 1.2 Agent 角色定义

#### 1.2.1 协调 Agent (Coordinator)

| 属性 | 值 |
|------|-----|
| 角色色 | Dark (#11181C) |
| 默认模型 | Claude Opus 4.6 |
| 职责 | 接收用户需求、分析意图、拆解任务、分派 Agent、监控进度、汇总结果 |
| 工具 | task_create, task_assign, task_status, agent_invoke, session_summary |
| 系统提示词 | 你是一个项目协调者。你的任务是理解用户需求，将其拆解为可执行的子任务，并分派给合适的专业 Agent... |

#### 1.2.2 需求 Agent (Requirements)

| 属性 | 值 |
|------|-----|
| 角色色 | Purple (#9353D3) |
| 默认模型 | Claude Opus 4.6 |
| 职责 | 需求细化、PRD 撰写、用户故事编写、验收标准定义 |
| 工具 | document_create, document_edit, template_use, search_knowledge |
| 输出格式 | Markdown PRD, User Story, 验收标准 |

#### 1.2.3 架构 Agent (Architecture)

| 属性 | 值 |
|------|-----|
| 角色色 | Blue (#006FEE) |
| 默认模型 | Claude Opus 4.6 |
| 职责 | 系统架构设计、技术选型、数据库设计、API 设计 |
| 工具 | diagram_create, code_analyze, dependency_check |
| 输出格式 | 架构图 (Mermaid), 数据库 Schema, API Spec (OpenAPI) |

#### 1.2.4 前端 Agent (Frontend)

| 属性 | 值 |
|------|-----|
| 角色色 | Green (#17C964) |
| 默认模型 | Claude Sonnet 4.5 |
| 职责 | 前端代码开发、组件实现、页面布局、样式编写 |
| 工具 | code_write, code_edit, file_create, browser_preview, npm_run |
| 输出格式 | TypeScript/TSX 代码, CSS, 配置文件 |

#### 1.2.5 后端 Agent (Backend)

| 属性 | 值 |
|------|-----|
| 角色色 | Amber (#F5A524) |
| 默认模型 | Claude Sonnet 4.5 |
| 职责 | 后端代码开发、API 实现、数据库操作、业务逻辑 |
| 工具 | code_write, code_edit, database_query, api_test, docker_run |
| 输出格式 | TypeScript/Python/Go 代码 |

#### 1.2.6 测试 Agent (Testing)

| 属性 | 值 |
|------|-----|
| 角色色 | Pink (#F31260) |
| 默认模型 | Claude Sonnet 4.5 |
| 职责 | 测试用例编写、自动化测试执行、Bug 报告 |
| 工具 | code_write, test_run, coverage_report, bug_create |
| 输出格式 | 测试代码, 测试报告, Bug 报告 |

#### 1.2.7 审查 Agent (Review)

| 属性 | 值 |
|------|-----|
| 角色色 | Cyan (#0E8AAA) |
| 默认模型 | Claude Opus 4.6 |
| 职责 | 代码审查、安全审计、质量评估 |
| 工具 | code_review (pi-coder-review), security_scan, lint_check |
| 输出格式 | Review 评论, 安全报告, 质量评分 |

#### 1.2.8 运维 Agent (DevOps)

| 属性 | 值 |
|------|-----|
| 角色色 | Gray (#71717A) |
| 默认模型 | Claude Sonnet 4.5 |
| 职责 | CI/CD 配置、部署、监控告警、日志分析 |
| 工具 | docker_compose, k8s_deploy, log_query, alert_create |
| 输出格式 | Dockerfile, YAML 配置, 部署报告 |

---

## 2 Agent 协作流程

### 2.1 需求到交付全流程

```
用户输入需求
     │
     ▼
[协调 Agent] 理解需求 ──── 不清楚 ───→ 向用户追问
     │ 清楚
     ▼
[需求 Agent] 细化需求 → 生成 PRD
     │
     ▼
[协调 Agent] 审核 PRD ──── 不通过 ───→ [需求 Agent] 修改
     │ 通过
     ▼
[架构 Agent] 架构设计 → 技术方案
     │
     ▼
[协调 Agent] 拆解开发任务, 创建 Task Board
     │
     ├──→ [前端 Agent] 前端开发 ──→ [测试 Agent] 前端测试
     │                                      │
     ├──→ [后端 Agent] 后端开发 ──→ [测试 Agent] 后端测试
     │                                      │
     ▼                                      ▼
[审查 Agent] 代码审查 ←────────────────── 所有测试通过
     │
     ▼
[运维 Agent] 部署发布
     │
     ▼
[协调 Agent] 汇总报告 → 通知用户
```

### 2.2 Agent 间通信协议

#### 2.2.1 消息格式

```json
{
  "id": "msg_uuid",
  "from_agent": "coordinator",
  "to_agent": "requirements",
  "type": "task_assign",
  "payload": {
    "task_id": "task_uuid",
    "instruction": "基于用户需求撰写详细的产品需求文档...",
    "context": {
      "user_requirement": "...",
      "workspace_id": "...",
      "session_id": "..."
    },
    "constraints": {
      "max_tokens": 100000,
      "timeout_ms": 300000,
      "model_override": null
    }
  },
  "timestamp": "2026-02-18T12:00:00Z"
}
```

#### 2.2.2 事件类型

| 事件 | 发送方 | 接收方 | 用途 |
|------|--------|--------|------|
| task_assign | Coordinator | 目标 Agent | 分配任务 |
| task_progress | 执行 Agent | Coordinator | 进度报告 (0-100%) |
| task_complete | 执行 Agent | Coordinator | 任务完成 |
| task_failed | 执行 Agent | Coordinator | 任务失败 |
| task_blocked | 执行 Agent | Coordinator | 任务阻塞 (需依赖) |
| artifact_created | 执行 Agent | Coordinator | 产物生成 (代码/文档) |
| review_request | Coordinator | Review Agent | 请求审查 |
| review_result | Review Agent | Coordinator | 审查结果 |
| user_query | Coordinator | User | 向用户追问 |
| user_response | User | Coordinator | 用户回复 |

### 2.3 任务状态机

```
pending → assigned → in_progress → review → completed
                         │                      ↑
                         ├── blocked ───────────┘ (解除阻塞后)
                         └── failed ────→ reassigned → in_progress
```

---

## 3 Agent 对话界面

### 3.1 主对话页面

**路由**: `/org/[slug]/ws/[workspace-slug]/chat`

**布局** (三栏):
```
┌──────────┬───────────────────────────────────────┬─────────────┐
│          │                                        │             │
│  会话列表  │           主聊天区域                    │  任务面板   │
│  宽度:    │                                        │  宽度:      │
│  280px   │                                        │  320px     │
│          │                                        │  (可折叠)   │
│          │                                        │             │
│          │                                        │             │
│          │                                        │             │
│          ├────────────────────────────────────────┤             │
│          │  输入区域                                │             │
└──────────┴────────────────────────────────────────┴─────────────┘
```

#### 3.1.1 会话列表 (左侧)

- 搜索框 (sm, 内边距 space-3)
- "新建对话" 按钮 (Primary, sm, 全宽, 下方间距 space-3)
- 会话列表项:
  ```
  ┌─────────────────────────────────┐
  │ [Agent角色色圆点] 会话标题 (Body) │
  │ 最近消息预览 (Caption, 1行截断)   │
  │                    时间 (Tiny)   │
  └─────────────────────────────────┘
  ```
  - 高度: 68px
  - 内边距: space-3
  - 选中: 背景 Primary-50, 左侧 3px Primary-500
  - hover: 背景 Surface
  - 未读: 右侧红色圆点 (8px, Danger)

#### 3.1.2 主聊天区域

**消息列表区** (可滚动):
- 顶部: 24px 间距
- 消息间距: space-4
- 日期分割: 居中, Caption, Text-Tertiary, 背景 pill (Surface, radius-full, 内边距 4px 12px)
- 用户消息: 右对齐, 气泡样式见设计系统 3.4.1
- Agent 消息: 左对齐, 气泡样式见设计系统 3.4.2
  - Agent 名称上方显示
  - 角色色标识
  - 支持 Markdown 渲染 (代码块、表格、列表)
  - 代码块: 深色背景 (#1E1E1E), JetBrains Mono, 右上角复制按钮 + 语言标签
- 工具调用显示:
  ```
  ┌─ 🔧 browser_navigate ──────────────────┐
  │ URL: https://example.com               │
  │ 状态: ✓ 完成 (2.3s)                    │
  │ [展开/折叠 结果]                        │
  └────────────────────────────────────────┘
  ```
  - 背景: Surface
  - 圆角: radius-md
  - 内边距: space-3
  - 默认折叠, 点击展开结果详情

- Agent 思考状态:
  ```
  [Agent头像 28px] [角色色] ● ● ● (三点跳动动画)
  "正在分析需求..." (Body-sm, Text-Tertiary, 斜体)
  ```

- 多 Agent 切换指示:
  ```
  ─────── 协调 Agent → 需求 Agent ───────
  (居中, Caption, Text-Tertiary, 左右虚线)
  ```

**输入区域** (底部固定):
- 容器: 背景 Background, 顶部 1px Border, 内边距 space-4
- Textarea: 自适应高度 (最小 44px, 最大 200px)
  - Placeholder "输入消息... (Shift+Enter 换行)"
  - 圆角: radius-xl
  - 背景: Surface
  - 内边距: space-3 水平, space-2 垂直
- 左侧按钮组 (Textarea 下方):
  - 附件按钮 (Paperclip 图标, 24px, Ghost)
  - 模型选择下拉 (当前模型名, Badge 样式)
- 右侧发送按钮:
  - 位于 Textarea 内右下角
  - 圆形按钮 (36x36px, Primary, radius-full)
  - 图标: Send (16px, #FFFFFF)
  - 禁用: 输入为空时 opacity 0.5
  - 快捷键: Enter 发送, Shift+Enter 换行

- 停止生成按钮 (Agent 回复中出现):
  - 替换发送按钮位置
  - 圆形 (36x36px, Danger, radius-full)
  - 图标: Square (停止, 16px, #FFFFFF)
  - 点击发送 abort 信号

#### 3.1.3 任务面板 (右侧)

**头部**:
- "任务" (H4) + 折叠按钮 (PanelRight 图标)
- Tabs: 当前任务 | 历史

**任务列表**:
每个任务卡片:
```
┌───────────────────────────────────────┐
│ [状态图标] [任务标题 Body 600]         │
│ [Agent 角色色圆点] [Agent名] (Caption) │
│ [进度条 100%, Success]                 │
│ [时间 Tiny Text-Tertiary]             │
└───────────────────────────────────────┘
```

状态图标:
- Pending: Circle (空心, Text-Tertiary)
- In Progress: Loader2 (旋转动画, Primary)
- Review: Eye (Cyan)
- Completed: CheckCircle (Success)
- Failed: XCircle (Danger)
- Blocked: Lock (Warning)

**任务详情** (点击展开):
- 任务描述 (Body-sm)
- 分配的 Agent (头像 + 名称)
- 依赖任务列表
- 产出物列表 (文件链接)
- 进度日志 (时间线)

### 3.2 Agent 协作可视化

**路由**: `/org/[slug]/ws/[workspace-slug]/agents/overview`

**布局**: 全屏画布

**可视化形式**: DAG (有向无环图) 流程图

- 每个 Agent 为一个节点:
  ```
  ┌──────────────────────┐
  │  [头像 40px]          │
  │  Agent 名称 (H4)      │
  │  [状态Badge]          │
  │  当前任务: xxx         │
  │  Token: 12.5K         │
  └──────────────────────┘
  ```
  - 节点背景: 对应角色色的淡色 (50 色阶)
  - 节点边框: 对应角色色 (500 色阶), 2px
  - 节点圆角: radius-lg
  - 活跃节点: 脉冲动画 (box-shadow 呼吸)

- 连接线:
  - 样式: 贝塞尔曲线, 2px
  - 颜色: Border (默认), Primary (当前活跃)
  - 箭头: 三角形, 8px
  - 数据流标注: 连线中间显示消息数

- 画布操作:
  - 鼠标拖拽平移
  - 滚轮缩放 (50%-200%)
  - 右下角: 缩放控制 + 适应屏幕按钮

---

## 4 Agent 配置

### 4.1 Agent 编辑抽屉

**Drawer**: 从右滑出, 宽度 520px, 背景 Background, 阴影 shadow-xl

**内容**:

#### 4.1.1 基础设置

- **Agent 名称**: Input
- **角色**: Select (协调/需求/架构/前端/后端/测试/审查/运维/自定义)
- **描述**: Textarea (3 行)
- **头像**: 预设头像 (按角色) 或自定义上传

#### 4.1.2 模型设置

- **模型选择**: Select + 搜索
  - 分组: Anthropic / OpenAI / Google / OpenRouter / 自定义
  - 每项显示: 模型名 + 供应商 Badge + 能力标签 (Vision/Code/Long)
- **Temperature**: Slider (0-2, 步长 0.1, 默认 0.7)
- **Max Tokens**: Number Input (默认 4096)
- **Thinking 模式**: Select (off / low / medium / high)

#### 4.1.3 工具配置

- 工具列表 (Switch 启用/禁用):
  | 工具 | 描述 | 默认 |
  |------|------|------|
  | code_write | 创建和编辑代码文件 | 开 |
  | code_execute | 执行代码 (沙箱) | 关 |
  | browser | 浏览器操作 | 关 |
  | file_manager | 文件管理 | 开 |
  | search_web | 网络搜索 | 开 |
  | search_knowledge | 知识库搜索 | 开 |
  | task_manage | 任务管理 | 关 |
  | api_request | HTTP 请求 | 关 |

- 每个工具: Switch + 名称 (Body) + 描述 (Caption, Text-Tertiary) + 展开配置按钮

#### 4.1.4 系统提示词

- Textarea: 自适应高度, 最小 100px, 最大 400px
- 支持变量插入: `{{workspace_name}}`, `{{user_name}}`, `{{date}}`
- 变量面板: 右上角按钮展开, 点击变量自动插入
- 字数统计: 底部右对齐, Caption

#### 4.1.5 高级设置

- **并发数**: Number Input (1-10, 默认 1)
- **超时时间**: Number Input (秒, 默认 300)
- **重试策略**: Select (不重试 / 重试1次 / 重试3次)
- **沙箱模式**: Toggle (Docker 沙箱隔离)
- **审批工作流**: Toggle (敏感操作需人工确认)

**底部**: "保存" (Primary) + "取消" (Ghost) + "重置默认" (Danger Ghost, 左对齐)

---

## 5 用户与 Agent 的交互模式

### 5.1 对话式交互

用户直接在聊天界面输入自然语言, 协调 Agent 自动理解并分派。

**示例流程**:
```
用户: "帮我做一个用户管理模块，包括注册、登录、个人设置"

协调 Agent: "我来帮你规划用户管理模块的开发。让我先让需求 Agent 细化需求。"

[自动切换到需求 Agent]

需求 Agent: "好的，关于用户管理模块，我需要确认以下几点：
1. 注册方式支持哪些？（邮箱/手机/第三方OAuth）
2. 是否需要两步验证(2FA)？
3. 个人设置需要包含哪些信息？
请逐一回答，或者直接说'使用默认方案'。"

用户: "邮箱 + GitHub OAuth，需要 2FA，个人设置包括头像、昵称、密码修改"

需求 Agent: "明白。我正在撰写详细的产品需求文档..."
[生成 PRD 文档, 显示在右侧任务面板]

[自动切换回协调 Agent]
协调 Agent: "PRD 已生成。我现在将任务分派给架构 Agent 和开发 Agent。"
```

### 5.2 指令式交互

用户使用 `/` 斜杠命令直接触发特定操作:

| 命令 | 功能 | 目标 Agent |
|------|------|-----------|
| `/new-session` | 创建新会话 | - |
| `/assign @agent task` | 分配任务给指定 Agent | 指定 Agent |
| `/status` | 查看当前所有任务状态 | 协调 Agent |
| `/review file.ts` | 请求代码审查 | 审查 Agent |
| `/deploy staging` | 部署到预发环境 | 运维 Agent |
| `/test run` | 运行测试 | 测试 Agent |
| `/cancel task_id` | 取消任务 | 协调 Agent |

**命令自动完成**:
- 输入 `/` 时显示命令面板 (Dropdown, 位于输入框上方)
- 列表: 命令名 + 描述 + 快捷键
- 键盘上下选择, Enter 确认, Esc 关闭
- 模糊搜索匹配

### 5.3 审批交互

敏感操作需用户确认:

```
运维 Agent: "准备将代码部署到生产环境，请确认："

┌─────────────────────────────────────────────┐
│ 🚀 部署确认                                  │
│                                              │
│ 环境: production                             │
│ 分支: main (commit abc1234)                  │
│ 变更: 3 个文件修改                            │
│                                              │
│ [查看变更详情]                                │
│                                              │
│         [取消] (Ghost)    [确认部署] (Primary) │
└─────────────────────────────────────────────┘
```

- 审批卡片: 背景 Warning-50, 边框 1px Warning-200
- 30 分钟无操作自动取消
- 取消/确认后卡片变为只读 (添加操作结果标记)

---

## 6 自定义 Agent 创建

### 6.1 设计原则

系统提供 8 种预设 Agent 角色作为模板，但**用户可以创建任意数量的自定义 Agent**。预设角色是快速起步的捷径，自定义 Agent 才是核心能力。

### 6.2 自定义 Agent 创建流程

**入口**: Agent 列表页 → "创建 Agent" 按钮 → 打开创建向导

#### 6.2.1 步骤 1: 选择起点

```
┌─────────────────────────────────────────────────────────────┐
│ 创建 Agent (H2)                                              │
│                                                              │
│ 从模板开始 (H4)                                               │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│ │ 协调   │ │ 需求   │ │ 前端   │ │ 后端   │               │
│ │ Agent  │ │ Agent  │ │ Agent  │ │ Agent  │               │
│ └────────┘ └────────┘ └────────┘ └────────┘               │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│ │ 测试   │ │ 审查   │ │ 运维   │ │ 架构   │               │
│ │ Agent  │ │ Agent  │ │ Agent  │ │ Agent  │               │
│ └────────┘ └────────┘ └────────┘ └────────┘               │
│ (4列网格, 每个带角色色圆点 + 角色名 + 简述)                     │
│                                                              │
│ ── 或者 ──                                                   │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Sparkles 图标] 从空白创建                                │ │
│ │ 完全自定义 Agent 的角色、能力和行为                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ── 或者 ──                                                   │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [MessageSquare 图标] 用自然语言描述                        │ │
│ │ "我需要一个负责数据分析和报表生成的 Agent"                  │ │
│ │ [_________________________________] [生成配置](Primary)    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**"从空白创建"**: 进入完整配置流程 (步骤 2)
**"用自然语言描述"**: LLM 自动生成 Agent 配置，用户审核后确认
**模板**: 预填充该角色的系统提示词、工具、模型设置

#### 6.2.2 步骤 2: Agent 配置

进入 Agent 编辑抽屉 (见 Section 4.1)，所有字段均可自由配置：

- **角色选择 "自定义"** 时:
  - 角色色: 打开颜色选择器 (12 预设色 + 自定义 HEX)
  - 角色名: 自由输入 (如 "数据分析师"、"翻译官"、"客服助手")

- **系统提示词**: 完全自定义
  - 提供提示词编写指南 (折叠面板)
  - 支持变量: `{{workspace_name}}`, `{{user_name}}`, `{{date}}`, `{{memory}}`
  - Token 计数实时显示
  - "用 AI 优化提示词" 按钮: 将用户写的粗略提示词优化为结构化版本

- **工具配置**: 自由组合任意工具
- **模型**: 自由选择任何已配置的 Provider/模型
- **触发条件** (可选):
  - 手动触发 (默认)
  - 关键词触发: 当用户消息包含指定关键词时自动激活
  - 渠道绑定: 绑定特定渠道/群组
  - 定时触发: Cron 表达式

#### 6.2.3 步骤 3: 测试与发布

- "测试对话" 按钮: 打开临时对话窗口，直接与新 Agent 交互
- 测试满意后: "发布 Agent" 按钮 → Agent 进入工作区的 Agent 池
- 发布后可随时编辑、禁用、删除

### 6.3 Agent 模板市场

用户创建的优秀 Agent 可发布到模板市场供他人使用：

**入口**: Agent 详情 → "发布为模板" 按钮
**审核**: 平台审核后上架
**使用**: 其他用户 "从模板创建" 时可搜索到
**收益**: 付费模板可设定价格 (插件市场体系)

### 6.4 自定义 Agent 示例

| Agent 名称 | 角色描述 | 工具 | 适用场景 |
|-----------|---------|------|---------|
| 数据分析师 | 分析数据集，生成图表和报告 | code_execute, file_manager | 数据团队 |
| 客服助手 | 回答常见问题，引导复杂问题 | search_knowledge, api_request | 客服团队 |
| 翻译官 | 多语言翻译和本地化 | search_web | 国际化团队 |
| 竞品分析师 | 收集和分析竞品信息 | browser, search_web | 产品团队 |
| 安全扫描员 | 代码安全审计和漏洞检测 | code_execute, file_manager | 安全团队 |
| 文档编写员 | 技术文档和用户手册撰写 | file_manager, search_knowledge | 任何团队 |
