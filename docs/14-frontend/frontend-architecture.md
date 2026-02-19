# 前端架构设计

## 1 Web 应用 (Next.js)

### 1.1 项目结构

```
web/
├── app/                          # App Router
│   ├── (auth)/                   # 认证页面组
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── layout.tsx            # 认证布局 (左右分栏)
│   ├── (marketing)/              # 营销页面组
│   │   ├── page.tsx              # 落地页
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # 主应用
│   │   ├── org/
│   │   │   └── [slug]/
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── usage/page.tsx
│   │   │       ├── settings/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── members/page.tsx
│   │   │       │   ├── billing/page.tsx
│   │   │       │   └── audit/page.tsx
│   │   │       ├── workspaces/page.tsx
│   │   │       └── ws/
│   │   │           └── [wsSlug]/
│   │   │               ├── page.tsx          # 工作区首页
│   │   │               ├── chat/page.tsx     # 对话页面
│   │   │               ├── agents/
│   │   │               │   ├── page.tsx      # Agent 列表
│   │   │               │   └── overview/page.tsx  # 协作可视化
│   │   │               ├── channels/
│   │   │               │   ├── page.tsx
│   │   │               │   └── [channelId]/page.tsx
│   │   │               ├── knowledge/
│   │   │               │   ├── page.tsx
│   │   │               │   └── [kbId]/page.tsx
│   │   │               ├── memory/page.tsx
│   │   │               ├── plugins/
│   │   │               │   ├── page.tsx      # 已安装
│   │   │               │   └── marketplace/
│   │   │               │       ├── page.tsx
│   │   │               │       └── [pluginId]/page.tsx
│   │   │               └── settings/page.tsx
│   │   └── layout.tsx            # 主布局 (侧边栏+顶栏)
│   ├── settings/                 # 个人设置
│   │   ├── profile/page.tsx
│   │   ├── security/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── appearance/page.tsx
│   │   ├── api-keys/page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API Routes (BFF)
│   │   └── v1/
│   ├── layout.tsx                # 根布局
│   ├── globals.css
│   └── providers.tsx             # Context Providers
├── components/
│   ├── ui/                       # HeroUI 封装 + 自定义组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── sidebar.tsx
│   │   └── ...
│   ├── chat/                     # 聊天相关
│   │   ├── chat-panel.tsx
│   │   ├── message-list.tsx
│   │   ├── message-bubble.tsx
│   │   ├── chat-input.tsx
│   │   ├── tool-call-card.tsx
│   │   ├── agent-thinking.tsx
│   │   ├── approval-card.tsx
│   │   └── session-list.tsx
│   ├── agent/                    # Agent 相关
│   │   ├── agent-card.tsx
│   │   ├── agent-config-drawer.tsx
│   │   ├── agent-flow-graph.tsx
│   │   └── task-panel.tsx
│   ├── channel/                  # 渠道相关
│   │   ├── channel-list.tsx
│   │   ├── channel-config-form.tsx
│   │   └── routing-rules.tsx
│   ├── knowledge/                # 知识库相关
│   │   ├── kb-card.tsx
│   │   ├── upload-zone.tsx
│   │   ├── document-table.tsx
│   │   └── search-test.tsx
│   ├── dashboard/                # 仪表盘相关
│   │   ├── stat-card.tsx
│   │   ├── area-chart.tsx
│   │   ├── donut-chart.tsx
│   │   └── activity-timeline.tsx
│   └── layout/                   # 布局组件
│       ├── top-nav.tsx
│       ├── sidebar-nav.tsx
│       ├── org-switcher.tsx
│       └── breadcrumb.tsx
├── hooks/                        # 自定义 Hooks
│   ├── use-auth.ts
│   ├── use-session.ts
│   ├── use-websocket.ts
│   ├── use-agent.ts
│   ├── use-chat.ts
│   ├── use-debounce.ts
│   └── use-media-query.ts
├── lib/                          # 工具库
│   ├── api-client.ts             # HTTP 客户端 (fetch wrapper)
│   ├── ws-client.ts              # WebSocket 客户端
│   ├── auth.ts                   # 认证工具
│   ├── ai.ts                     # Vercel AI SDK 配置
│   ├── utils.ts                  # 通用工具
│   └── constants.ts
├── stores/                       # 状态管理 (Zustand)
│   ├── auth-store.ts
│   ├── workspace-store.ts
│   ├── chat-store.ts
│   ├── agent-store.ts
│   └── ui-store.ts
├── types/                        # TypeScript 类型
│   ├── user.ts
│   ├── workspace.ts
│   ├── agent.ts
│   ├── session.ts
│   ├── channel.ts
│   └── api.ts
├── styles/                       # 样式
│   ├── tokens.css                # 设计令牌
│   └── components.css            # 组件覆盖样式
├── public/
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

### 1.2 状态管理

使用 Zustand + React Query:

- **Zustand**: 客户端 UI 状态 (sidebar 折叠、主题、当前组织/工作区)
- **React Query (TanStack Query)**: 服务端数据缓存 (用户、Agent、会话、消息)
- **Vercel AI SDK**: AI 流式交互状态

```typescript
// stores/chat-store.ts
interface ChatStore {
  currentSessionId: string | null;
  isGenerating: boolean;
  abortController: AbortController | null;

  setCurrentSession: (id: string) => void;
  startGeneration: () => void;
  stopGeneration: () => void;
}
```

### 1.3 AI 流式交互

使用 Vercel AI SDK 的 `useChat` hook:

```typescript
import { useChat } from "ai/react";

const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
  api: "/api/v1/chat",
  body: { sessionId, agentId },
  onResponse: (response) => { /* 处理流式响应 */ },
  onFinish: (message) => { /* 消息完成 */ },
  onError: (error) => { /* 错误处理 */ },
});
```

### 1.4 WebSocket 集成

```typescript
// hooks/use-websocket.ts
function useWebSocket(workspaceId: string) {
  const ws = useRef<WebSocket>(null);

  useEffect(() => {
    const token = getAccessToken();
    ws.current = new WebSocket(
      `wss://api.nextai-agent.com/ws/v1?token=${token}&workspace=${workspaceId}`
    );

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "chat.message.delta":
          // 更新消息流
          break;
        case "task.update":
          // 更新任务面板
          break;
        case "agent.switch":
          // Agent 切换指示
          break;
      }
    };

    // 心跳
    const heartbeat = setInterval(() => {
      ws.current?.send(JSON.stringify({ type: "ping" }));
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      ws.current?.close();
    };
  }, [workspaceId]);
}
```

---

## 2 桌面应用 (Electron)

### 2.1 项目结构

```
desktop/
├── electron/
│   ├── main.ts              # 主进程
│   ├── preload.ts           # 预加载脚本
│   ├── ipc-handlers.ts      # IPC 通信处理
│   ├── tray.ts              # 系统托盘
│   ├── updater.ts           # 自动更新
│   └── window-manager.ts    # 窗口管理
├── src/                     # 复用 Web 代码 (共享组件)
├── resources/               # 图标、静态资源
├── electron-builder.yml     # 打包配置
└── package.json
```

### 2.2 桌面专属功能

| 功能 | 描述 |
|------|------|
| 系统托盘 | 最小化到托盘, 显示通知数 |
| 全局快捷键 | `Ctrl+Shift+A` 唤出快速对话窗 |
| 通知 | 系统原生通知 (Agent 完成、消息到达) |
| 自动更新 | electron-updater (GitHub Releases) |
| 深度链接 | `nextai-agent://` 协议 |
| 本地文件访问 | Agent 可读取本地文件 (需授权) |

### 2.3 快速对话窗

- 全局快捷键唤出
- 尺寸: 600px 宽 x 400px 高
- 位置: 屏幕居中
- 样式: 无边框, 圆角 radius-xl, 阴影 shadow-xl
- 内容: 简化版聊天界面 (输入框 + 消息列表)
- ESC 关闭

---

## 3 小程序 (UniApp)

### 3.1 项目结构

```
miniapp/
├── src/
│   ├── pages/
│   │   ├── index/            # 首页 (对话列表)
│   │   ├── chat/             # 对话页面
│   │   ├── agents/           # Agent 列表
│   │   ├── settings/         # 设置
│   │   └── login/            # 登录
│   ├── components/
│   │   ├── chat-bubble.vue
│   │   ├── agent-card.vue
│   │   └── nav-bar.vue
│   ├── stores/               # Pinia 状态管理
│   ├── api/                  # API 封装
│   ├── utils/
│   ├── App.vue
│   ├── main.ts
│   └── pages.json            # 路由配置
├── static/
└── manifest.json
```

### 3.2 小程序适配

| 页面 | 功能 | 适配说明 |
|------|------|---------|
| 首页 | 会话列表 | 下拉刷新, 无限滚动 |
| 对话 | 聊天交互 | 键盘适配, 语音输入 |
| Agent | Agent 列表 | 简化版卡片 |
| 设置 | 基础设置 | 账号、通知、关于 |

**小程序限制适配**:
- WebSocket: 使用 `uni.connectSocket`
- 存储: `uni.setStorage` (本地缓存 Token)
- 分享: 支持微信分享会话链接
- 无插件市场 (引导到 Web 端)
- 无知识库管理 (引导到 Web 端)

---

## 4 关键技术方案

### 4.1 依赖版本

| 依赖 | 版本 | 用途 |
|------|------|------|
| next | ^15.0.0 | SSR 框架 |
| react | ^19.0.0 | UI 框架 |
| @heroui/react | ^3.0.0 | 组件库 |
| tailwindcss | ^4.0.0 | 原子 CSS |
| ai (vercel) | ^4.0.0 | AI 交互 |
| zustand | ^5.0.0 | 状态管理 |
| @tanstack/react-query | ^5.0.0 | 数据获取 |
| recharts | ^2.12.0 | 图表 |
| lucide-react | ^0.450.0 | 图标 |
| zod | ^3.23.0 | 校验 |
| dayjs | ^1.11.0 | 日期 |
| framer-motion | ^11.0.0 | 动画 |
| @xyflow/react | ^12.0.0 | 流程图 (Agent 协作可视化) |

### 4.2 性能优化

| 策略 | 实现 |
|------|------|
| 代码分割 | Next.js 自动 + dynamic() 懒加载 |
| 图片优化 | next/image + WebP + 响应式 |
| 字体优化 | next/font + subset |
| 缓存 | React Query staleTime + ISR |
| 虚拟滚动 | 消息列表使用 react-window |
| Bundle 分析 | @next/bundle-analyzer |
| 预渲染 | 落地页/定价页 SSG |

### 4.3 国际化

- 框架: next-intl
- 语言: zh-CN (默认) + en
- 翻译文件: `messages/zh-CN.json`, `messages/en.json`
- URL: `/zh-CN/...` 或 `/en/...` (可选, 也可用 cookie)
