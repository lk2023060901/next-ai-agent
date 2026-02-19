# 前端开发路线图

> 前端驱动开发策略：先完成前端体验，后端根据前端需求定义数据结构和 API，最终评估后端架构后开始编码。

## 1 开发策略

### 1.1 核心原则

```
开发流程:

Phase 1-5                     Phase 6                    Phase 7
前端开发 (Mock API)            后端契约定义                 后端编码
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ 前端完整实现  │          │ 根据前端需求  │          │ 后端架构评估  │
│ UI + 交互    │    →     │ 定义数据结构  │    →     │ 技术选型确认  │
│ Mock Service │          │ API 接口契约  │          │ 服务端编码    │
│ E2E 可演示   │          │ 数据库 Schema │          │ 联调测试      │
└──────────────┘          └──────────────┘          └──────────────┘
```

| 原则 | 说明 |
|------|------|
| 前端优先 | 先实现完整 UI 和交互体验，确保产品设计落地 |
| Mock 驱动 | 通过 API Mock Service 脱离后端独立开发 |
| 体验优先 | 以用户体验为标准驱动技术决策 |
| 渐进细化 | 接口契约随前端完善逐步补齐 |
| 可演示 | 每个里程碑产出可交互的完整功能 |

### 1.2 技术基座

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 15.x |
| UI 库 | React | 19.x |
| 组件库 | HeroUI (NextUI v3) | 3.x |
| 样式 | TailwindCSS | 4.x |
| AI SDK | Vercel AI SDK | 4.x |
| 状态-服务端 | TanStack Query (React Query) | 5.x |
| 状态-客户端 | Zustand | 5.x |
| 表单 | React Hook Form + Zod | 7.x + 3.x |
| 图表 | Recharts | 2.x |
| 流程图 | XY Flow (React Flow) | 12.x |
| Mock 服务 | MSW (Mock Service Worker) | 2.x |
| 测试 | Vitest + React Testing Library + Playwright | — |

---

## 2 里程碑总览

### 2.1 里程碑规划

```
时间线 (共 20 周):

Week  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
      ├──────────┤
      M1: 基座搭建 (4w)
                  ├──────────┤
                  M2: 认证与设置 (4w)
                              ├───────────────────┤
                              M3: 核心体验 (6w)
                                                   ├──────────┤
                                                   M4: 高级功能 (4w)
                                                               ├────┤
                                                               M5: 打磨 (2w)
```

### 2.2 里程碑摘要

| 里程碑 | 名称 | 周期 | 核心交付 |
|--------|------|------|---------|
| M1 | 基座搭建 | Week 1-4 | 设计系统、布局框架、Mock 服务、基础组件库 |
| M2 | 认证与设置 | Week 5-8 | 注册/登录、个人设置、组织/工作区管理、**项目审批策略** |
| M3 | 核心体验 | Week 9-14 | 对话界面、Agent 管理、仪表盘、协作可视化、**工具授权管理** |
| M4 | 高级功能 | Week 15-18 | 知识库、渠道管理、插件市场、计费订阅、**远程监控与任务调度** |
| M5 | 体验打磨 | Week 19-20 | 性能优化、无障碍、响应式、E2E 测试 |

> doc 24 (本地部署与桌面操控) 新增功能已分散集成到 M2-M4 中，不新增里程碑。

---

## 3 M1: 基座搭建 (Week 1-4)

### 3.1 目标

搭建完整的开发基础设施，包括设计系统组件库、全局布局、Mock 服务和开发工具链，使后续功能开发可以快速推进。

### 3.2 任务拆解

#### Week 1: 项目初始化 + 设计 Token

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 1.1 | Next.js 项目脚手架 | `apps/web/` 目录 | `pnpm dev` 可启动 |
| 1.2 | TailwindCSS 4 + HeroUI 配置 | `tailwind.config.ts` | 主题色/字体/间距生效 |
| 1.3 | 设计 Token 落地 | CSS 变量 + Tailwind 扩展 | 颜色/字体/圆角/阴影与设计稿一致 |
| 1.4 | 暗色模式 + 主题切换 | ThemeProvider | Light/Dark/System 三档，默认 System（跟随系统），实时响应系统偏好变化 |
| 1.5 | ESLint + Prettier + Husky | 配置文件 | 保存时自动格式化，commit 时校验 |
| 1.6 | TypeScript strict 配置 | `tsconfig.json` | 零 `any`，strict 开启 |
| 1.7 | 目录结构按规范创建 | 完整骨架 | 符合 20-directory-structure 规范 |

#### Week 2: 基础 UI 组件

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 2.1 | Button 组件 | `components/ui/button.tsx` | 5 变体 × 3 尺寸，loading/disabled 状态 |
| 2.2 | Input + Textarea | `components/ui/input.tsx` | 图标、标签、错误状态、密码切换 |
| 2.3 | Select / Dropdown | `components/ui/select.tsx` | 搜索、分组、多选 |
| 2.4 | Modal / Dialog | `components/ui/modal.tsx` | 背景模糊、ESC 关闭、480/640/800px |
| 2.5 | Toast 通知 | `components/ui/toast.tsx` | 4 类型，自动关闭 5s，右上角堆叠 |
| 2.6 | Avatar + Badge | `components/ui/avatar.tsx` | xs-xl 尺寸，在线指示器 |
| 2.7 | Card 组件 | `components/ui/card.tsx` | hover 阴影，可点击态 |
| 2.8 | Table + Pagination | `components/ui/data-table.tsx` | 排序、分页、空状态 |
| 2.9 | Tabs 组件 | `components/ui/tabs.tsx` | 下划线样式，平滑过渡 |
| 2.10 | 空状态 + 加载骨架 | `components/ui/empty-state.tsx` | 图标+描述+操作按钮 |

#### Week 3: 布局系统 + 路由

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 3.1 | 根布局 (Provider 组合) | `app/layout.tsx` | QueryProvider + ThemeProvider + AuthProvider |
| 3.2 | 认证布局 | `app/(auth)/layout.tsx` | 左右分栏，品牌展示 + 表单 |
| 3.3 | 主应用布局 | `app/(dashboard)/layout.tsx` | 侧边栏 240px + 顶栏 64px |
| 3.4 | 侧边栏组件 | `components/layout/sidebar.tsx` | 折叠/展开、菜单分组、活跃高亮 |
| 3.5 | 顶栏组件 | `components/layout/topbar.tsx` | Logo、全局搜索、通知铃、用户菜单 |
| 3.6 | 面包屑导航 | `components/layout/breadcrumb.tsx` | 自动根据路由生成 |
| 3.7 | 组织/工作区切换器 | `components/features/workspace/workspace-switcher.tsx` | 侧边栏顶部下拉 |
| 3.8 | 全部路由占位页 | `app/(dashboard)/org/[slug]/...` | 所有路由可访问（含 projects/monitoring/scheduler），显示"开发中" |

#### Week 4: Mock 服务 + API 客户端

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 4.1 | MSW 初始化 | `mocks/` 目录 | 浏览器和 Node 环境均可拦截 |
| 4.2 | Mock 数据工厂 | `mocks/factories/` | 每个资源有 Faker 工厂函数 |
| 4.3 | Auth Mock Handlers | `mocks/handlers/auth.ts` | 登录/注册/刷新 Token 模拟 |
| 4.4 | 核心资源 Mock | `mocks/handlers/*.ts` | User/Org/Workspace/Agent/Session |
| 4.5 | API 客户端封装 | `lib/api/client.ts` | Fetch 封装 + Token 注入 + 错误处理 |
| 4.6 | 资源 API 模块 | `lib/api/agent-api.ts` 等 | 每个资源独立文件 |
| 4.7 | React Query 配置 | `providers/query-provider.tsx` | 全局 QueryClient + DevTools |
| 4.8 | Zustand Store 骨架 | `lib/store/` | app-store / auth-store / chat-store |

### 3.3 M1 交付标准

- [ ] `pnpm dev` 启动后可看到完整布局（侧边栏+顶栏+内容区）
- [ ] 所有基础 UI 组件可在浏览器中交互
- [ ] 暗色模式正常切换
- [ ] Mock 服务拦截所有 API 请求，返回合理数据
- [ ] 所有页面路由可访问（虽然内容为空）

---

## 4 M2: 认证与设置 (Week 5-8)

### 4.1 目标

完成完整的用户认证流程和个人/组织/工作区管理页面，用户可以注册、登录、配置个人信息和管理团队。

### 4.2 任务拆解

#### Week 5: 认证页面

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 5.1 | 登录页 | `app/(auth)/login/page.tsx` | 邮箱+密码、OAuth 按钮、记住我 |
| 5.2 | 注册页 | `app/(auth)/signup/page.tsx` | 表单验证、密码强度指示、条款勾选 |
| 5.3 | 忘记密码 | `app/(auth)/forgot-password/page.tsx` | 邮箱输入 + 发送确认 |
| 5.4 | 重置密码 | `app/(auth)/reset-password/page.tsx` | Token 校验 + 新密码设置 |
| 5.5 | 邮箱验证 | `app/(auth)/verify-email/page.tsx` | 验证码/链接确认 |
| 5.6 | Auth Store | `lib/store/use-auth-store.ts` | 登录态管理、Token 刷新 |
| 5.7 | Auth Guard | `middleware.ts` | 未登录自动跳转 /login |
| 5.8 | OAuth 按钮组 | `components/features/auth/oauth-buttons.tsx` | GitHub + Google |

#### Week 6: 个人设置

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 6.1 | 设置布局 | `app/settings/layout.tsx` | 左侧导航 + 右侧内容 |
| 6.2 | 个人资料 | `app/settings/profile/page.tsx` | 头像上传、姓名、简介、时区 |
| 6.3 | 安全设置 | `app/settings/security/page.tsx` | 修改密码、2FA 开关、会话列表 |
| 6.4 | 外观设置 | `app/settings/appearance/page.tsx` | 主题切换、字号、紧凑模式 |
| 6.5 | 通知设置 | `app/settings/notifications/page.tsx` | 邮件/应用内/推送开关 |
| 6.6 | API 密钥 | `app/settings/api-keys/page.tsx` | 创建/删除密钥、复制、过期时间 |

#### Week 7: 组织管理

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 7.1 | 组织列表/创建 | `app/(dashboard)/org/` | 卡片列表 + 创建弹窗 |
| 7.2 | 组织设置 | `org/[slug]/settings/page.tsx` | 名称、Logo、描述编辑 |
| 7.3 | 成员管理 | `org/[slug]/settings/members/page.tsx` | 邀请、角色变更、移除 |
| 7.4 | 角色权限 | RBAC 前端控制 | Owner/Admin/Member 按钮显隐 |
| 7.5 | 审计日志 | `org/[slug]/settings/audit/page.tsx` | 时间线列表 + 筛选 |
| 7.6 | 邀请流程 | 邀请弹窗 + 邮件 Mock | 邮箱输入 + 角色选择 + 发送 |

#### Week 8: 工作区管理 + 项目审批策略

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 8.1 | 工作区列表 | `org/[slug]/workspaces/page.tsx` | 卡片网格、搜索、排序 |
| 8.2 | 创建工作区 | 创建弹窗/向导 | 名称、描述、图标选择 |
| 8.3 | 工作区首页 | `ws/[wsSlug]/page.tsx` | 概览卡片 + 快速操作 + 最近活动 |
| 8.4 | 工作区切换 | Sidebar Switcher 完善 | 实际数据驱动、最近访问排序 |
| 8.5 | 工作区设置 | `ws/[wsSlug]/settings/page.tsx` | 基本信息、删除确认 |
| 8.6 | 项目列表与创建 | `ws/[wsSlug]/projects/page.tsx` | 项目卡片（名称、审批模式标签、Agent 数）、创建弹窗 |
| 8.7 | 项目审批策略设置 | `components/features/project/approval-policy-editor.tsx` | 模板选择（全自动/开发模式/严格模式/观察模式）、全局模式切换（auto/supervised/locked）、风险等级策略配置（low/medium/high/critical 各选 auto_approve/notify_only/require_approval/always_block） |
| 8.8 | 工具级审批覆盖 | `components/features/project/tool-override-table.tsx` | 按分类展示全部工具、每行可选审批动作覆盖、搜索/筛选 |
| 8.9 | 项目审批 Mock | `mocks/handlers/project.ts` | 项目 CRUD + 审批策略读写 Mock |

### 4.3 M2 交付标准

- [ ] 完整注册→登录→进入主界面流程可走通
- [ ] 个人设置全部页面可交互
- [ ] 组织创建、成员邀请流程完整
- [ ] 工作区 CRUD 功能完整
- [ ] RBAC 权限按钮显隐正确
- [ ] 项目创建 + 审批策略配置流程完整（可选模板、调整风险等级、工具覆盖）
- [ ] 多项目间审批策略相互独立

---

## 5 M3: 核心体验 (Week 9-14)

### 5.1 目标

实现产品最核心的三大功能：**多 Agent 对话界面、Agent 管理配置、数据仪表盘**。这是产品的核心竞争力所在。

### 5.2 任务拆解

#### Week 9-10: 对话基础

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 9.1 | 对话页三栏布局 | `chat/page.tsx` | 会话列表(280px) + 对话区 + 任务栏(320px) |
| 9.2 | 会话列表 | `components/features/chat/session-list.tsx` | 搜索、新建、未读标记、时间排序 |
| 9.3 | 消息列表 | `components/features/chat/message-list.tsx` | 虚拟滚动、日期分隔线、滚动到底部 |
| 9.4 | 消息气泡 | `components/features/chat/message-bubble.tsx` | 用户/Agent 双侧样式、角色标识 |
| 9.5 | Markdown 渲染 | 消息内容渲染器 | 代码高亮、表格、列表、链接 |
| 9.6 | 消息输入框 | `components/features/chat/message-input.tsx` | 自动高度、Ctrl+Enter 发送、附件按钮 |
| 9.7 | 消息 Mock 数据 | `mocks/handlers/chat.ts` | 模拟多轮对话、多 Agent 消息 |
| 9.8 | Chat Store | `lib/store/use-chat-store.ts` | 会话管理、消息列表、发送状态 |

#### Week 11: 流式响应 + Agent 切换

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 11.1 | SSE 流式消息 | Vercel AI SDK useChat 集成 | 逐字流式输出、打字机效果 |
| 11.2 | Mock SSE | MSW stream handler | 模拟流式返回 + 延迟 |
| 11.3 | Agent 切换指示器 | 消息间 Agent 切换标识 | 显示"切换到 [Agent 名称]" |
| 11.4 | 思考状态 | `components/features/chat/thinking-indicator.tsx` | 三点动画 + "正在思考..." |
| 11.5 | 工具调用卡片 | `components/features/chat/tool-call-card.tsx` | 工具名、参数、结果、折叠展开、**风险等级标签**、**本地/云端执行标识** |
| 11.6 | 审批卡片 | `components/features/chat/approval-card.tsx` | 允许/拒绝按钮、30 分钟倒计时、**显示触发审批的策略来源**（项目策略/编排 Agent/提示词） |
| 11.7 | 中断生成 | 停止按钮 | 点击后中断流式输出 |

#### Week 12: Agent 管理

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 12.1 | Agent 列表页 | `agents/page.tsx` | 卡片网格、状态筛选、搜索 |
| 12.2 | Agent 卡片 | `components/features/agent/agent-card.tsx` | 角色色带、状态徽章、模型标签 |
| 12.3 | Agent 创建向导 | `components/features/agent/agent-create-wizard.tsx` | 4 步向导：角色→模型→提示词→工具 |
| 12.4 | Agent 配置抽屉 | `components/features/agent/agent-config-drawer.tsx` | 520px 抽屉、Tab 切换配置项 |
| 12.5 | 系统提示词编辑器 | 富文本/代码编辑器 | 变量插入、模板选择 |
| 12.6 | 工具选择器 | 多选工具列表 | 分类、搜索、描述展示、**本地工具标识**、**风险等级标签**、**平台支持图标** |
| 12.7 | Agent CRUD Hooks | `hooks/use-agents.ts` | React Query CRUD Mutations |
| 12.8 | 角色-工具授权矩阵 | `components/features/agent/tool-auth-matrix.tsx` | 表格：行=Agent 角色、列=工具分类，单元格=授权状态；支持批量授权/撤销 |
| 12.9 | 工具注册表查看 | `ws/[wsSlug]/agents/tools/page.tsx` | 全部工具列表（云端+本地），按分类分组，显示风险等级/平台支持/当前审批策略 |

#### Week 13: 协作可视化

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 13.1 | 拓扑图页面 | `agents/overview/page.tsx` | 全屏画布 + 控制栏 |
| 13.2 | Agent 节点组件 | XY Flow 自定义节点 | 头像、名称、角色色、状态指示 |
| 13.3 | 连线组件 | XY Flow 自定义边 | Bezier 曲线、动画粒子、方向箭头 |
| 13.4 | 布局算法 | Dagre 自动布局 | 层级清晰、无交叉 |
| 13.5 | 交互功能 | 缩放、平移、点击详情 | 点击节点弹出 Agent 面板 |
| 13.6 | 任务面板 | 右侧任务流列表 | 任务状态、分配的 Agent、耗时 |

#### Week 14: 仪表盘

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 14.1 | 组织仪表盘 | `org/[slug]/dashboard/page.tsx` | 4 统计卡片 + 图表 + 活动 |
| 14.2 | 统计卡片 | `components/features/dashboard/stat-card.tsx` | 数字、趋势%、迷你图 |
| 14.3 | 消息趋势图 | 面积图 (Recharts) | 7 天折线、双系列 |
| 14.4 | Agent 负载图 | 环形图 (Recharts) | 角色色、中心标签 |
| 14.5 | 活动时间线 | `components/features/dashboard/activity-timeline.tsx` | 时间排序、类型筛选 |
| 14.6 | 用量统计页 | `org/[slug]/usage/page.tsx` | Token 消耗、API 调用、成本分析 |
| 14.7 | 用量图表 | 多维度柱状图/折线图 | 按天/周/月、按 Agent/模型 |

### 5.3 M3 交付标准

- [ ] 完整的多 Agent 对话体验（发送→流式回复→工具调用→Agent 切换）
- [ ] Agent CRUD + 配置完整
- [ ] 协作拓扑图可交互
- [ ] 仪表盘图表数据正确渲染（Mock 数据）
- [ ] 用量统计页可用
- [ ] 工具调用卡片正确显示风险等级和本地/云端标识
- [ ] 审批卡片显示策略来源，审批行为与项目策略一致
- [ ] 角色-工具授权矩阵可交互配置
- [ ] 工具注册表正确展示全部工具（含 doc 24 本地工具）

---

## 6 M4: 高级功能 (Week 15-18)

### 6.1 任务拆解

#### Week 15: 知识库

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 15.1 | 知识库列表 | `knowledge/page.tsx` | 卡片 + 文档数量 + 最近更新 |
| 15.2 | 创建知识库 | 创建弹窗 | 名称、描述、嵌入模型选择 |
| 15.3 | 知识库详情 | `knowledge/[kbId]/page.tsx` | 文档表格 + 搜索测试 |
| 15.4 | 文件上传区 | `components/features/knowledge/upload-zone.tsx` | 拖拽上传、进度条、类型限制 |
| 15.5 | 文档表格 | 文件列表 + 状态 | 名称、大小、处理状态、操作 |
| 15.6 | 搜索测试 | 查询输入 + 结果列表 | 相关性分数、高亮匹配 |

#### Week 16: 渠道管理

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 16.1 | 渠道列表 | `channels/page.tsx` | 按平台分组、状态指示 |
| 16.2 | 添加渠道 | 平台选择 + 配置表单 | 11 种渠道类型图标 |
| 16.3 | 渠道配置 | `channels/[channelId]/page.tsx` | 平台特定配置项 |
| 16.4 | 连接测试 | 测试按钮 + 状态反馈 | 成功/失败 + 错误详情 |
| 16.5 | 路由规则 | 规则构建器 | 条件 + 目标 Agent 映射 |
| 16.6 | 消息日志 | 渠道消息流水 | 时间、方向、内容预览 |

#### Week 17: 插件市场

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 17.1 | 已安装插件 | `plugins/page.tsx` | 卡片列表、启用/禁用开关 |
| 17.2 | 插件市场 | `plugins/marketplace/page.tsx` | 分类筛选、搜索、排序 |
| 17.3 | 插件详情 | `plugins/marketplace/[pluginId]/page.tsx` | 描述、截图、评分、安装按钮 |
| 17.4 | 安装流程 | 安装确认 + 配置弹窗 | 权限声明、参数配置 |
| 17.5 | 插件配置 | 配置表单 | 插件特定设置项 |

#### Week 18: 计费订阅 + 远程监控 + 任务调度

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 18.1 | 定价页 | `(marketing)/pricing/page.tsx` | 月/年切换、7 套餐对比 |
| 18.2 | 订阅管理 | `org/[slug]/settings/billing/page.tsx` | 当前套餐、升级/降级 |
| 18.3 | 账单列表 | 发票列表 + 下载 | 日期、金额、状态、PDF |
| 18.4 | 支付方式 | 支付方式管理 | 添加/删除信用卡 |
| 18.5 | 用量告警 | 告警设置 | 阈值配置 + 通知渠道 |
| 18.6 | 远程监控仪表盘 | `ws/[wsSlug]/monitoring/page.tsx` | 已连接桌面端列表（状态指示灯：运行中/空闲/错误/离线）、当前 Agent 任务摘要 |
| 18.7 | 操作日志流 | `components/features/monitoring/operation-log.tsx` | 实时操作流水表（时间、工具、参数摘要、状态图标、截图缩略图）、筛选/搜索 |
| 18.8 | 远程控制面板 | `components/features/monitoring/remote-control.tsx` | 暂停/恢复/停止按钮、远程下发任务输入框、紧急停止确认弹窗 |
| 18.9 | 任务调度管理 | `ws/[wsSlug]/scheduler/page.tsx` | 定时任务列表（名称、Cron 表达式、下次执行时间、启用开关）、创建/编辑弹窗（指令、Cron 配置器、工具授权选择） |
| 18.10 | 调度执行历史 | `components/features/scheduler/execution-history.tsx` | 执行记录表（时间、状态、耗时、日志链接）、重新运行按钮 |
| 18.11 | 审计日志增强 | 增强 `org/[slug]/settings/audit/page.tsx` | 新增列：工具名称、风险等级、审批结果（auto/approved/denied/blocked）、截图缩略图；筛选支持按风险等级/审批状态 |
| 18.12 | 监控+调度 Mock | `mocks/handlers/monitoring.ts` + `scheduler.ts` | 桌面端状态、操作日志、定时任务 CRUD Mock |

---

## 7 M5: 体验打磨 (Week 19-20)

### 7.1 任务拆解

#### Week 19: 性能 + 无障碍

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 19.1 | 代码分割 | 路由级 lazy loading | 首屏 JS < 200KB (gzip) |
| 19.2 | 图片优化 | next/image + WebP | LCP < 2.5s |
| 19.3 | 虚拟滚动优化 | 长列表性能 | 10,000 条消息不卡顿 |
| 19.4 | Prefetch 策略 | 路由预加载 + 数据预取 | 页面切换 < 300ms |
| 19.5 | 无障碍审计 | axe-core 扫描 | 0 critical/serious 问题 |
| 19.6 | 键盘导航 | 全局快捷键 | Tab 导航、Enter 确认、ESC 关闭 |
| 19.7 | ARIA 标注 | 语义化标签 | 屏幕阅读器可用 |

#### Week 20: 响应式 + E2E 测试

| # | 任务 | 产出 | 验收标准 |
|---|------|------|---------|
| 20.1 | 平板适配 | 768px-1024px | 侧边栏折叠、内容自适应 |
| 20.2 | 手机适配 | < 768px | 底部导航、全屏对话 |
| 20.3 | E2E 测试套件 | Playwright 脚本 | 核心流程 100% 覆盖 |
| 20.4 | 视觉回归测试 | Playwright 截图对比 | 关键页面无视觉偏差 |
| 20.5 | 错误边界完善 | 全局/页面级 ErrorBoundary | 崩溃时优雅降级 |
| 20.6 | Loading 状态 | 全局骨架屏 | 每个页面有专属 loading |
| 20.7 | 空状态设计 | 各页面空态 | 引导用户下一步操作 |

---

## 8 Mock Service 架构

> 详细规范见文档 [22-API Mock Service](../22-api-mock-service/api-mock-service.md)

### 8.1 Mock 覆盖范围

| 阶段 | Mock 覆盖 |
|------|----------|
| M1 | Auth、User、Org、Workspace 基础 CRUD |
| M2 | 完整 Auth 流程、Settings、Members、Audit、**Project (含审批策略)** |
| M3 | Agent CRUD、Session、Message (含流式)、Dashboard Stats、**Tool Registry、Tool Auth Matrix** |
| M4 | Knowledge、Channel、Plugin、Billing、**Desktop Monitoring、Scheduler、Operation Log** |
| M5 | 全量 Mock 稳定运行 |

### 8.2 Mock → 真实 API 切换

```typescript
// 通过环境变量控制
// .env.development
NEXT_PUBLIC_API_MOCK=true   // 使用 MSW Mock
NEXT_PUBLIC_API_MOCK=false  // 连接真实后端
```

> 前端代码零改动即可切换，API 客户端层自动适配。

---

## 9 质量门禁

### 9.1 每个里程碑的质量要求

| 检查项 | M1 | M2 | M3 | M4 | M5 |
|--------|----|----|----|----|-----|
| TypeScript 零 any | ✅ | ✅ | ✅ | ✅ | ✅ |
| ESLint 零 error | ✅ | ✅ | ✅ | ✅ | ✅ |
| 组件测试覆盖 | 50% | 60% | 70% | 75% | 80% |
| E2E 核心流程 | — | 登录流 | 对话流 | 全流程 | 100% |
| Lighthouse 分数 | — | — | ≥ 80 | ≥ 85 | ≥ 90 |
| 暗色模式 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 响应式 | — | — | Desktop | Tablet | Mobile |

### 9.2 代码审查清单

| 类别 | 检查项 |
|------|--------|
| 组件 | Props 类型完整、无内联 style、cn() 合并类名 |
| Hooks | 自定义 Hook 以 use- 开头、返回语义化对象 |
| 状态 | 服务端数据用 React Query、UI 状态用 Zustand |
| 性能 | 列表有 key、大列表虚拟滚动、memo 合理使用 |
| 安全 | 用户输入转义、Token 不存 localStorage |
| 无障碍 | 语义化 HTML、ARIA 标签、焦点管理 |

---

## 10 风险与应对

| 风险 | 影响 | 应对策略 |
|------|------|---------|
| Agent 可视化复杂度高 | M3 延期 | 先实现静态拓扑，动画/实时更新后续迭代 |
| 流式消息边界情况多 | 对话体验不稳定 | 重点测试中断/重连/并发场景 |
| HeroUI 组件不满足定制需求 | 开发效率降低 | 提前评估，必要时自建组件 |
| Mock 数据与真实接口偏差 | 联调成本高 | Mock 严格遵循 API 设计文档 Schema |
| 设计稿与实现差异 | 返工 | 每周与设计对齐，M2 后锁定设计 |
| 审批策略配置 UI 复杂度 | M2 Week 8 工期紧张 | 先实现模板选择 + 全局模式，工具级覆盖延后到 M3 |
| 远程监控依赖 WebSocket 实时数据 | Mock 难度大 | 用 SSE Mock 模拟实时推送，先静态展示后加动态 |
| 本地工具列表随桌面端开发扩展 | 工具注册表频繁变更 | 工具元数据独立配置文件，与代码解耦 |
