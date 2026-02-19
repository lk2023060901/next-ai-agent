# 本地部署与桌面操控 (Local Deployment & Desktop Control)

> 恢复 OpenClaw 本地设备控制能力，引入 Anthropic Computer Use 模式，实现云端 SaaS + 本地桌面操控一体化的 24/7 自主运行平台。

---

## 1 概述

### 1.1 产品背景与愿景

NextAI Agent 从 OpenClaw（本地 macOS 桌面应用）演进为 SaaS 多租户平台，在迁移过程中本地设备控制能力被标记为不迁移（doc 23："设备控制 ~5 个 Skills — 本地设备特有功能 ❌ 无"）。本文档定义如何通过 Electron 桌面端重新引入这些能力，并参考 Anthropic Computer Use 技术方案，实现完整的计算机操控。

**核心目标**：
- 恢复 OpenClaw 的本地操控能力（终端、文件、应用管理）
- 引入 Anthropic Computer Use 模式（截屏→分析→操控循环）
- 实现云端 SaaS 与本地桌面的一体化协作
- 支持 24/7 无人值守自主运行

### 1.2 参考项目对比

| 维度 | OpenClaw | Anthropic Computer Use | NextAI Agent Desktop |
|------|---------|----------------------|---------------------|
| 架构 | 单 Node.js 进程 | API + 截屏循环 | Electron + Cloud 混合 |
| 用户模式 | 本地单用户 | API 调用 | 多租户 + 本地实例 |
| 操控方式 | CLI + 有限 UI 操控 | 截屏 + 鼠标/键盘 | 全桌面操控 + 终端 + 浏览器 |
| 持久化 | SQLite + 文件系统 | 无状态 | 云端/本地可选 |
| 自主运行 | 无 | 单任务 | 24/7 守护 + 任务调度 |
| 多 Agent | 无 | 单 Agent | 编排 Agent + 多角色协作 |

### 1.3 核心能力矩阵

| 能力 | 描述 | 实现方案 | 风险等级 |
|------|------|---------|---------|
| 屏幕捕获 | 全屏/窗口/区域截屏 + OCR | Electron desktopCapturer + 平台原生 API | 低 |
| 鼠标操控 | 移动、点击、拖拽、滚动 | nut.js | 中 |
| 键盘输入 | 文本输入、组合键、系统热键 | nut.js | 中 |
| 应用管理 | 启动、切换、关闭、窗口调整 | 平台原生 API (AppleScript/Win32/D-Bus) | 中 |
| 终端执行 | 持久化 bash 会话 | Node.js child_process | 高 |
| 文件系统 | 读写编辑搜索监听 | Node.js fs API | 高 |
| 浏览器自动化 | 导航、交互、数据提取 | Playwright | 中 |
| 系统操作 | 剪贴板、通知、系统信息 | Electron API + 平台原生 | 低 |

### 1.4 与 SaaS 平台的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cloud SaaS Platform                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Agent    │  │ Memory   │  │ Plugin   │  │ User/Billing │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service      │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └──────┬───────┘   │
│        └──────────────┴──────────────┴──────────────┘           │
│                            │ REST/WebSocket                     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Electron Desktop │
                    │  ┌────────────┐  │
                    │  │ Local Agent │  │
                    │  │  Runtime    │  │
                    │  └─────┬──────┘  │
                    │        │ IPC     │
                    │  ┌─────▼──────┐  │
                    │  │  Local     │  │
                    │  │  Services  │  │
                    │  └─────┬──────┘  │
                    └────────┼─────────┘
                             │
                    ┌────────▼────────┐
                    │  Operating       │
                    │  System          │
                    │  (macOS/Win/     │
                    │   Linux)         │
                    └─────────────────┘
```

---

## 2 架构设计

### 2.1 三层架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Electron Shell                                │
│  ┌─────────────┐  ┌───────────────┐  ┌─────────────────────────┐   │
│  │  Renderer   │  │  Main Process │  │  Tray / Quick Dialog    │   │
│  │  (React UI) │  │  (IPC Hub)    │  │  (Ctrl+Shift+A)        │   │
│  └──────┬──────┘  └───────┬───────┘  └─────────────────────────┘   │
│         └─────────────────┤                                         │
├───────────────────────────┼─────────────────────────────────────────┤
│              Local Service Layer                                     │
│  ┌──────────┐  ┌──────────┤  ┌───────────┐  ┌──────────────────┐   │
│  │ Agent    │  │ Tool     │  │ Scheduler │  │ Storage          │   │
│  │ Runtime  │  │ Registry │  │ (Cron)    │  │ (Cloud/SQLite)   │   │
│  └──────────┘  └──────────┘  └───────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│              OS Integration Layer                                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐   │
│  │ Screen   │  │ Input    │  │ Process   │  │ File System      │   │
│  │ Capture  │  │ (nut.js) │  │ Manager   │  │ Access           │   │
│  └──────────┘  └──────────┘  └───────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 进程模型

| 进程 | 类型 | 职责 | 技术 |
|------|------|------|------|
| Electron Main | 主进程 | 窗口管理、IPC 路由、系统托盘、全局快捷键 | Electron 33+ |
| Electron Renderer | 渲染进程 | React UI、操作面板、实时监控 | React 19 + HeroUI |
| Agent Worker | Node.js Worker | Agent 运行时、工具执行、操控循环 | worker_threads |
| Screen Analyzer | Node.js Worker | 截屏处理、OCR、UI 元素定位 | sharp + 视觉模型 |
| Bash Session | 子进程 | 持久化终端会话 | child_process (PTY) |
| Browser Engine | 子进程 | 浏览器自动化 | Playwright |

### 2.3 通信架构

```
┌──────────────┐     IPC      ┌──────────────┐
│  Renderer    │◄────────────►│  Main Process │
│  (React UI)  │              │  (IPC Hub)    │
└──────────────┘              └───────┬───────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │ IPC             │ IPC              │ IPC
              ┌─────▼─────┐    ┌─────▼─────┐     ┌─────▼─────┐
              │ Agent      │    │ Tool      │     │ Scheduler │
              │ Worker     │    │ Executor  │     │           │
              └─────┬──────┘    └───────────┘     └───────────┘
                    │
              ┌─────▼──────────────────┐
              │ WebSocket              │
              │ wss://api.nextai-      │
              │ agent.com/ws/v1        │
              └────────────────────────┘
```

### 2.4 技术选型

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| Electron 33+ | 桌面外壳 | doc 14 已选定，跨平台，成熟生态 |
| nut.js | 跨平台鼠标/键盘输入 | 活跃维护，比 robotjs 更现代，支持 macOS/Windows/Linux |
| Electron desktopCapturer | 屏幕截取 | Electron 内建，方便快捷 |
| 平台原生截屏 API | 全桌面截屏 | CGWindowList (macOS) / Win32 (Windows) / X11 (Linux) |
| Playwright | 浏览器自动化 | doc 23 已列为可复用依赖（1.x） |
| SQLite | 本地存储模式 | OpenClaw 已验证，零配置，隐私优先 |
| sharp | 图像处理 | doc 23 可复用依赖（0.34.x），截屏压缩/缩放 |
| node-pty | 终端模拟 | 持久化 PTY 会话，支持交互式命令 |

### 2.5 数据存储策略

用户可在设置中选择存储模式：

| 模式 | 数据位置 | 适用场景 | 多设备同步 |
|------|---------|---------|-----------|
| 云端存储 | SaaS 平台 (PostgreSQL/Redis/Milvus) | 多设备使用、远程访问 | 支持 |
| 本地 SQLite | `~/.nextai-agent/data.db` | 隐私敏感、离线场景 | 不支持 |

两种模式可随时切换，切换时支持数据导入/导出。

### 2.6 目录结构

在 doc 14 和 doc 20 基础上扩展 `apps/desktop/`：

```
apps/desktop/
├── electron/
│   ├── main.ts                  # 主进程入口
│   ├── preload.ts               # Preload 脚本
│   ├── ipc-handlers.ts          # IPC 通信处理
│   ├── tray.ts                  # 系统托盘
│   ├── updater.ts               # 自动更新
│   ├── window-manager.ts        # 窗口管理
│   ├── platform/                # 平台适配层 (新增)
│   │   ├── index.ts             # 平台检测与适配器导出
│   │   ├── platform.interface.ts # 平台抽象接口
│   │   ├── macos.ts             # macOS 实现
│   │   ├── windows.ts           # Windows 实现
│   │   └── linux.ts             # Linux 实现
│   ├── tools/                   # 本地工具实现 (新增)
│   │   ├── index.ts             # 工具注册表
│   │   ├── screen-capture.ts    # 屏幕捕获
│   │   ├── screen-ocr.ts        # OCR 文字提取
│   │   ├── element-locate.ts    # UI 元素定位
│   │   ├── mouse-control.ts     # 鼠标操控
│   │   ├── keyboard-control.ts  # 键盘操控
│   │   ├── app-manager.ts       # 应用管理
│   │   ├── terminal.ts          # 终端操控
│   │   ├── file-system.ts       # 文件系统
│   │   ├── browser-auto.ts      # 浏览器自动化
│   │   └── system-ops.ts        # 系统操作
│   └── scheduler/               # 任务调度器 (新增)
│       ├── index.ts             # 调度器入口
│       ├── cron-manager.ts      # Cron 任务管理
│       ├── daemon.ts            # 守护进程管理
│       └── checkpoint.ts        # 任务检查点
├── src/                         # 复用 Web 代码 + 桌面专属组件
│   ├── components/
│   │   ├── screen-viewer.tsx    # 实时屏幕查看器
│   │   ├── operation-log.tsx    # 操作日志面板
│   │   ├── task-control.tsx     # 任务控制面板
│   │   └── permission-manager.tsx # 权限管理界面
│   └── ...
├── resources/                   # 图标、静态资源
├── electron-builder.yml         # 打包配置
└── package.json
```

---

## 3 计算机操控能力

### 3.1 工具总览

每个工具定义了默认风险等级，但**是否需要人工审批由项目级审批策略决定**（见 Section 4.3）。用户可通过 UI 或提示词为每个项目独立配置审批规则，同时运行的多个项目可以有完全不同的审批策略。

| 工具名称 | 分类 | 描述 | 风险等级 | 平台支持 |
|----------|------|------|---------|---------|
| `screenshot` | 屏幕捕获 | 全屏/窗口/区域截屏 | 低 | macOS/Win/Linux |
| `screen_ocr` | 屏幕捕获 | 截屏文字提取 | 低 | macOS/Win/Linux |
| `element_locate` | 屏幕捕获 | UI 元素定位 | 低 | macOS/Win/Linux |
| `mouse_move` | 鼠标操控 | 移动光标到指定坐标 | 中 | macOS/Win/Linux |
| `left_click` | 鼠标操控 | 左键单击 | 中 | macOS/Win/Linux |
| `right_click` | 鼠标操控 | 右键单击 | 中 | macOS/Win/Linux |
| `double_click` | 鼠标操控 | 左键双击 | 中 | macOS/Win/Linux |
| `mouse_drag` | 鼠标操控 | 拖拽操作 | 中 | macOS/Win/Linux |
| `scroll` | 鼠标操控 | 滚轮滚动 | 低 | macOS/Win/Linux |
| `type_text` | 键盘操控 | 文本输入 | 中 | macOS/Win/Linux |
| `key_press` | 键盘操控 | 组合键按下 | 中 | macOS/Win/Linux |
| `hotkey` | 键盘操控 | 系统热键 | 高 | macOS/Win/Linux |
| `app_launch` | 应用管理 | 启动应用程序 | 中 | macOS/Win/Linux |
| `app_switch` | 应用管理 | 切换到指定应用 | 低 | macOS/Win/Linux |
| `app_list` | 应用管理 | 列出运行中的应用 | 低 | macOS/Win/Linux |
| `app_close` | 应用管理 | 关闭应用程序 | 中 | macOS/Win/Linux |
| `window_manage` | 应用管理 | 调整窗口大小/位置 | 低 | macOS/Win/Linux |
| `bash_execute` | 终端操控 | 执行 bash 命令 | 高 | macOS/Win/Linux |
| `bash_session` | 终端操控 | 多会话管理 | 高 | macOS/Win/Linux |
| `file_read` | 文件系统 | 读取文件内容 | 中 | macOS/Win/Linux |
| `file_write` | 文件系统 | 写入文件 | 高 | macOS/Win/Linux |
| `file_edit` | 文件系统 | 编辑文件（精确替换） | 高 | macOS/Win/Linux |
| `file_search` | 文件系统 | 搜索文件 | 低 | macOS/Win/Linux |
| `file_watch` | 文件系统 | 监听文件变更 | 低 | macOS/Win/Linux |
| `browser_navigate` | 浏览器 | 打开/导航到 URL | 中 | macOS/Win/Linux |
| `browser_interact` | 浏览器 | 页面交互（点击/输入） | 中 | macOS/Win/Linux |
| `browser_extract` | 浏览器 | 提取页面内容 | 低 | macOS/Win/Linux |
| `clipboard_read` | 系统操作 | 读取剪贴板 | 中 | macOS/Win/Linux |
| `clipboard_write` | 系统操作 | 写入剪贴板 | 中 | macOS/Win/Linux |
| `notification_send` | 系统操作 | 发送系统通知 | 低 | macOS/Win/Linux |
| `system_info` | 系统操作 | 获取系统信息 | 低 | macOS/Win/Linux |

### 3.2 屏幕捕获与分析

#### 3.2.1 screenshot — 屏幕截图

| 属性 | 说明 |
|------|------|
| **描述** | 捕获全屏、指定窗口或指定区域的截屏 |
| **风险等级** | 低 |

**参数**：

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `mode` | `"fullscreen" \| "window" \| "region"` | 是 | 截屏模式 |
| `window_title` | `string` | 否 | 窗口标题（mode="window" 时使用） |
| `region` | `{ x: number, y: number, width: number, height: number }` | 否 | 截取区域（mode="region" 时使用） |
| `format` | `"png" \| "jpeg"` | 否 | 输出格式，默认 `"jpeg"` |
| `quality` | `number` | 否 | JPEG 质量 0-100，默认 `80` |

**返回值**：

```typescript
{
  image: string;        // Base64 编码的图像
  width: number;        // 图像宽度 (px)
  height: number;       // 图像高度 (px)
  scale: number;        // HiDPI 缩放比例
  timestamp: number;    // 截取时间戳
}
```

**坐标系统**：
- 原点：屏幕左上角 `[0, 0]`
- 坐标：`[x, y]`，x 向右递增，y 向下递增
- HiDPI 处理：物理像素 / devicePixelRatio = 逻辑像素
- 最大分辨率：长边不超过 1568px（与 Anthropic Computer Use 一致），等比缩放

#### 3.2.2 screen_ocr — 文字提取

| 属性 | 说明 |
|------|------|
| **描述** | 从截屏中提取文字内容及位置 |
| **风险等级** | 低 |

**参数**：

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `image` | `string` | 否 | Base64 图像（不提供则自动截取全屏） |
| `language` | `string` | 否 | 识别语言，默认 `"auto"` |
| `region` | `{ x: number, y: number, width: number, height: number }` | 否 | 限定识别区域 |

**返回值**：

```typescript
{
  text: string;                          // 完整识别文本
  blocks: Array<{
    text: string;                        // 文本块内容
    bounds: { x: number, y: number, width: number, height: number };
    confidence: number;                  // 置信度 0-1
  }>;
}
```

#### 3.2.3 element_locate — UI 元素定位

| 属性 | 说明 |
|------|------|
| **描述** | 通过视觉分析定位 UI 元素位置 |
| **风险等级** | 低 |

**参数**：

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `description` | `string` | 是 | 要定位的 UI 元素描述（自然语言） |
| `image` | `string` | 否 | Base64 图像（不提供则自动截取全屏） |

**返回值**：

```typescript
{
  found: boolean;
  elements: Array<{
    description: string;
    center: { x: number, y: number };    // 元素中心坐标
    bounds: { x: number, y: number, width: number, height: number };
    confidence: number;
  }>;
}
```

### 3.3 鼠标操控

#### 3.3.1 mouse_move — 移动光标

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `x` | `number` | 是 | 目标 X 坐标 |
| `y` | `number` | 是 | 目标 Y 坐标 |
| `smooth` | `boolean` | 否 | 平滑移动，默认 `true` |
| `duration` | `number` | 否 | 移动时长 (ms)，默认 `100` |

#### 3.3.2 left_click / right_click / double_click — 点击操作

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `x` | `number` | 是 | 点击 X 坐标 |
| `y` | `number` | 是 | 点击 Y 坐标 |
| `modifiers` | `Array<"shift" \| "ctrl" \| "alt" \| "cmd">` | 否 | 修饰键 |

**返回值**：`{ success: boolean, position: { x: number, y: number } }`

#### 3.3.3 mouse_drag — 拖拽

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `from_x` | `number` | 是 | 起始 X 坐标 |
| `from_y` | `number` | 是 | 起始 Y 坐标 |
| `to_x` | `number` | 是 | 目标 X 坐标 |
| `to_y` | `number` | 是 | 目标 Y 坐标 |
| `duration` | `number` | 否 | 拖拽时长 (ms)，默认 `500` |

#### 3.3.4 scroll — 滚动

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `x` | `number` | 是 | 滚动位置 X 坐标 |
| `y` | `number` | 是 | 滚动位置 Y 坐标 |
| `direction` | `"up" \| "down" \| "left" \| "right"` | 是 | 滚动方向 |
| `amount` | `number` | 否 | 滚动量 (像素)，默认 `300` |

### 3.4 键盘操控

#### 3.4.1 type_text — 文本输入

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `text` | `string` | 是 | 要输入的文本 |
| `delay` | `number` | 否 | 按键间隔 (ms)，默认 `50` |

#### 3.4.2 key_press — 组合键

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `keys` | `string[]` | 是 | 按键序列，如 `["cmd", "c"]` |

#### 3.4.3 hotkey — 系统热键

| 属性 | 说明 |
|------|------|
| **描述** | 发送系统级热键组合（如 Cmd+Tab、Cmd+Space） |
| **风险等级** | 高 |

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `keys` | `string[]` | 是 | 热键组合，如 `["cmd", "tab"]` |
| `reason` | `string` | 是 | 执行原因（用于审批和审计） |

### 3.5 应用管理

#### 3.5.1 app_launch — 启动应用

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `name` | `string` | 是 | 应用名称或路径 |
| `args` | `string[]` | 否 | 启动参数 |

#### 3.5.2 app_switch — 切换应用

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `name` | `string` | 是 | 目标应用名称 |

#### 3.5.3 app_list — 列出运行中的应用

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `include_windows` | `boolean` | 否 | 是否包含窗口列表，默认 `false` |

**返回值**：

```typescript
{
  apps: Array<{
    name: string;
    pid: number;
    windows: Array<{
      title: string;
      bounds: { x: number, y: number, width: number, height: number };
      focused: boolean;
    }>;
  }>;
}
```

#### 3.5.4 app_close — 关闭应用

| 属性 | 说明 |
|------|------|
| **风险等级** | 中 |

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `name` | `string` | 是 | 应用名称 |
| `force` | `boolean` | 否 | 强制关闭，默认 `false` |

#### 3.5.5 window_manage — 窗口管理

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `window_title` | `string` | 是 | 窗口标题 |
| `action` | `"maximize" \| "minimize" \| "restore" \| "resize" \| "move"` | 是 | 操作类型 |
| `bounds` | `{ x?: number, y?: number, width?: number, height?: number }` | 否 | 目标位置/尺寸（resize/move 时使用） |

### 3.6 终端操控

#### 3.6.1 bash_execute — 执行命令

| 属性 | 说明 |
|------|------|
| **描述** | 在持久化 bash 会话中执行命令（与 Anthropic bash tool 一致） |
| **风险等级** | 高 |

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `command` | `string` | 是 | 要执行的 bash 命令 |
| `session_id` | `string` | 否 | 会话 ID（不提供则使用默认会话） |
| `timeout` | `number` | 否 | 超时 (ms)，默认 `120000` |
| `working_dir` | `string` | 否 | 工作目录 |

**返回值**：

```typescript
{
  stdout: string;
  stderr: string;
  exit_code: number;
  session_id: string;
}
```

#### 3.6.2 bash_session — 多会话管理

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `action` | `"create" \| "list" \| "kill"` | 是 | 操作类型 |
| `session_id` | `string` | 否 | 会话 ID（kill 时必填） |
| `shell` | `string` | 否 | Shell 类型，默认 `"bash"` |

### 3.7 文件系统

所有文件操作受限于用户授权的目录范围（见 Section 7 安全模型）。

#### 3.7.1 file_read — 读取文件

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `path` | `string` | 是 | 文件路径 |
| `offset` | `number` | 否 | 起始行号 |
| `limit` | `number` | 否 | 读取行数 |

#### 3.7.2 file_write — 写入文件

| 属性 | 说明 |
|------|------|
| **风险等级** | 高 |

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `path` | `string` | 是 | 文件路径 |
| `content` | `string` | 是 | 文件内容 |

#### 3.7.3 file_edit — 编辑文件

与 Anthropic text_editor tool 对齐，使用精确字符串替换模式。

| 属性 | 说明 |
|------|------|
| **风险等级** | 高 |

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `path` | `string` | 是 | 文件路径 |
| `old_string` | `string` | 是 | 要替换的文本 |
| `new_string` | `string` | 是 | 替换后的文本 |

#### 3.7.4 file_search — 搜索文件

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `directory` | `string` | 是 | 搜索目录 |
| `pattern` | `string` | 是 | 文件名 glob 模式或内容正则 |
| `type` | `"name" \| "content"` | 否 | 搜索类型，默认 `"name"` |
| `max_results` | `number` | 否 | 最大结果数，默认 `50` |

#### 3.7.5 file_watch — 监听文件变更

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `path` | `string` | 是 | 监听路径（文件或目录） |
| `events` | `Array<"create" \| "modify" \| "delete">` | 否 | 监听事件类型 |
| `recursive` | `boolean` | 否 | 递归监听，默认 `true` |

### 3.8 浏览器自动化

基于 Playwright（doc 23 已列为可复用依赖），提供编程式浏览器操控。

#### 3.8.1 browser_navigate — 页面导航

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `url` | `string` | 是 | 目标 URL |
| `wait_until` | `"load" \| "domcontentloaded" \| "networkidle"` | 否 | 等待条件，默认 `"load"` |
| `timeout` | `number` | 否 | 超时 (ms)，默认 `30000` |

#### 3.8.2 browser_interact — 页面交互

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `action` | `"click" \| "fill" \| "select" \| "hover" \| "scroll"` | 是 | 交互类型 |
| `selector` | `string` | 是 | CSS 选择器或文本内容 |
| `value` | `string` | 否 | 输入值（fill/select 时使用） |

#### 3.8.3 browser_extract — 内容提取

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `type` | `"text" \| "html" \| "screenshot" \| "links" \| "tables"` | 是 | 提取类型 |
| `selector` | `string` | 否 | 限定提取范围的 CSS 选择器 |

### 3.9 系统操作

#### 3.9.1 clipboard_read / clipboard_write — 剪贴板

**clipboard_read** 无参数，返回 `{ text: string, formats: string[] }`。

**clipboard_write** 参数：

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `text` | `string` | 是 | 写入的文本 |

#### 3.9.2 notification_send — 系统通知

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `title` | `string` | 是 | 通知标题 |
| `body` | `string` | 是 | 通知内容 |
| `urgency` | `"low" \| "normal" \| "critical"` | 否 | 紧急程度，默认 `"normal"` |

#### 3.9.3 system_info — 系统信息

无参数。返回值：

```typescript
{
  os: string;              // 操作系统名称及版本
  arch: string;            // CPU 架构
  cpus: number;            // CPU 核心数
  memory_total: number;    // 总内存 (bytes)
  memory_free: number;     // 可用内存 (bytes)
  displays: Array<{
    id: number;
    width: number;
    height: number;
    scale: number;
  }>;
}
```

---

## 4 编排 Agent 与本地工具授权

### 4.1 编排 Agent 的最高权限

编排 Agent（Coordinator）是整个系统的最高决策者，拥有向任意 Agent 角色分配任务和工具的权限。Agent 角色不限于 doc 04 中的 8 种预设（需求/架构/前端/后端/测试/审查/运维/编排），还包括任意自定义角色：

| 角色类型 | 示例角色 | 说明 |
|---------|---------|------|
| 预设角色 | 编排、需求、架构、前端、后端、测试、审查、运维 | doc 04 定义的 8 种 |
| 自定义角色 | 产品经理、项目经理、数据分析师、客服助手、内容运营 | 用户或编排 Agent 动态创建 |

### 4.2 角色-工具授权矩阵

编排 Agent 根据任务需求，动态授权各 Agent 使用哪些本地工具：

| 角色 | 授权工具 | 典型任务场景 |
|------|---------|-------------|
| 产品经理 Agent | 浏览器自动化、截屏、OCR、文件读写 | 竞品调研、撰写 PRD、截图标注 |
| 项目经理 Agent | 应用管理、终端（只读）、系统通知、浏览器 | 查看任务看板、CI/CD 状态、提醒通知 |
| 前端 Agent | 终端、文件系统、浏览器、截屏 | 编写代码、预览效果、UI 验证截图对比 |
| 后端 Agent | 终端、文件系统 | 编写代码、运行测试、数据库操作 |
| 测试 Agent | 终端、文件系统、浏览器、截屏 | 自动化测试、E2E 测试、截图回归 |
| 运维 Agent | 终端（完全权限）、应用管理、系统信息 | 服务器运维、日志分析、进程管理 |
| 数据分析师 Agent | 文件系统、浏览器、截屏 | 数据采集、报表生成、可视化截图 |

### 4.3 项目级审批策略

审批策略以**项目（Project）**为粒度配置，同时运行的多个项目可以有完全不同的审批行为。用户可通过三种方式配置：

| 配置方式 | 说明 | 优先级 |
|---------|------|--------|
| UI 设置面板 | 在项目设置中通过可视化界面配置审批规则 | 最低（基线） |
| 提示词指令 | 在会话/任务的 System Prompt 或用户指令中声明审批意图 | 中（覆盖 UI 设置） |
| 编排 Agent 动态授权 | 编排 Agent 在分派任务时为单次任务指定审批规则 | 最高（覆盖一切） |

**安全约束**：提示词和编排 Agent 只能**收紧**审批策略（要求更多审批），不能**放松**超出 UI 中用户设定的最大权限边界。例如，UI 中将 `bash_execute` 设为"始终审批"，提示词无法将其改为"自动通过"。

```typescript
// 项目级审批策略
interface ProjectApprovalPolicy {
  project_id: string;
  project_name: string;

  // 全局开关：快速控制整个项目的审批行为
  mode: "auto" | "supervised" | "locked";
  // auto:       按规则自动决定，无需人工干预（适合可信的自动化流水线）
  // supervised: 按规则决定，但高风险操作需人工确认（默认，适合日常开发）
  // locked:     所有工具调用均需逐次人工确认（适合敏感环境）

  // 按风险等级配置审批行为
  risk_policies: {
    low:      ApprovalAction;       // 默认: "auto_approve"
    medium:   ApprovalAction;       // 默认: "auto_approve"
    high:     ApprovalAction;       // 默认: "require_approval"
    critical: ApprovalAction;       // 默认: "always_block"
  };

  // 按工具名称覆盖（优先于 risk_policies）
  tool_overrides?: Record<string, ApprovalAction>;
  // 示例: { "bash_execute": "auto_approve", "file_write": "require_approval" }

  // 按工具分类覆盖（优先级介于 risk_policies 和 tool_overrides 之间）
  category_overrides?: Record<string, ApprovalAction>;
  // 示例: { "终端操控": "auto_approve", "浏览器": "require_approval" }
}

type ApprovalAction =
  | "auto_approve"        // 自动通过，不弹窗
  | "notify_only"         // 自动通过，但发送通知让用户知晓
  | "require_approval"    // 弹窗等待用户确认
  | "always_block";       // 始终阻断（禁止该操作）
```

**审批规则解析优先级**（高→低）：

```
编排 Agent granted_tools.approval_overrides
         ↓ (仅能收紧)
提示词指令中的审批声明
         ↓ (仅能收紧)
project.tool_overrides[工具名]
         ↓
project.category_overrides[工具分类]
         ↓
project.risk_policies[工具风险等级]
         ↓
project.mode (全局开关)
```

**预设模板**：

| 模板名 | mode | low | medium | high | critical | 适用场景 |
|--------|------|-----|--------|------|----------|---------|
| 全自动 | auto | auto_approve | auto_approve | auto_approve | require_approval | CI/CD 自动化流水线 |
| 开发模式 | supervised | auto_approve | auto_approve | require_approval | always_block | 日常开发（默认） |
| 严格模式 | supervised | auto_approve | require_approval | require_approval | always_block | 生产环境操作 |
| 观察模式 | locked | require_approval | require_approval | require_approval | always_block | 首次试用/演示 |

**多项目并行示例**：

```
┌──────────────────────────┐  ┌──────────────────────────┐
│ Project A: 前端开发       │  │ Project B: 生产环境部署   │
│ 模板: 全自动              │  │ 模板: 严格模式            │
│                          │  │                          │
│ bash_execute → 自动通过   │  │ bash_execute → 需审批     │
│ file_write   → 自动通过   │  │ file_write   → 需审批     │
│ screenshot   → 自动通过   │  │ screenshot   → 自动通过   │
│                          │  │                          │
│ (Agent 可自主完成全部     │  │ (每个危险操作都会弹窗     │
│  开发-测试-提交流程)      │  │  等待用户确认)            │
└──────────────────────────┘  └──────────────────────────┘
```

### 4.4 动态工具授权协议

编排 Agent 在分派任务时，通过 `granted_tools` 字段声明该任务可使用的本地工具集。`approval_overrides` 可在项目策略基础上进一步收紧审批要求：

```typescript
// 编排 Agent 分派任务时的消息格式
interface TaskAssignment {
  id: string;
  from_agent: "coordinator";
  to_agent: string;
  type: "task_assign";
  payload: {
    task_id: string;
    instruction: string;
    context: Record<string, unknown>;
    constraints: {
      max_tokens: number;
      timeout: number;
    };
    // 本地工具授权 (新增)
    granted_tools: GrantedToolSet;
  };
  timestamp: string;
}

interface GrantedToolSet {
  tools: string[];                     // 授权的工具名称列表
  restrictions?: {
    allowed_directories?: string[];    // 文件系统限定目录
    allowed_domains?: string[];        // 浏览器限定域名
    max_risk_level?: "low" | "medium" | "high" | "critical";
  };
  // 任务级审批覆盖（只能收紧，不能放松项目策略）
  approval_overrides?: Record<string, ApprovalAction>;
}
```

### 4.5 工具注册机制

扩展 doc 04 的 `AgentTool` 接口，增加本地工具专属字段：

```typescript
type AgentTool = Tool & {
  allowedRoles: AgentRole[];
  timeout: number;
  // 本地工具扩展 (新增)
  localOnly: boolean;                  // 是否仅限本地执行
  platformSupport: {
    macos: boolean;
    windows: boolean;
    linux: boolean;
  };
  grantedByCoordinator: boolean;       // 是否需要编排 Agent 授权
  riskLevel: "low" | "medium" | "high" | "critical";
  category: string;                    // 工具分类（用于 category_overrides 匹配）
  // 注意：不再有 requiresApproval 字段，审批行为由项目级策略决定（见 4.3）
};
```

### 4.6 与插件系统集成

扩展 doc 07 的插件类型，增加 `LocalToolPlugin`：

```typescript
// 本地工具插件（扩展 doc 07 PluginType）
type PluginType =
  | "tool"
  | "channel"
  | "memory"
  | "hook"
  | "skill"
  | "agent-template"
  | "observability"
  | "local-tool";     // 新增

interface LocalToolPlugin {
  manifest: PluginManifest & {
    type: "local-tool";
    permissions: LocalPermission[];
    platformSupport: {
      macos: boolean;
      windows: boolean;
      linux: boolean;
    };
  };
  tools: AgentTool[];
  install: (context: PluginContext) => Promise<void>;
  uninstall: (context: PluginContext) => Promise<void>;
}

type LocalPermission =
  | "screen_capture"
  | "input_control"
  | "file_system"
  | "process_management"
  | "browser_automation"
  | "clipboard"
  | "terminal";
```

### 4.7 工具链组合模式

本地工具支持组合为复合操作链：

```
截屏 → OCR/元素定位 → 鼠标点击 → 等待 → 截屏验证
  │                                           │
  └───── 验证失败 → 重试/替代方案 ──────────────┘
```

典型工具链示例：

| 场景 | 工具链 |
|------|--------|
| 打开应用并操作 | `app_launch` → `screenshot` → `element_locate` → `left_click` → `screenshot` (验证) |
| 填写表单 | `screenshot` → `element_locate` → `left_click` → `type_text` → `key_press(Tab)` → 循环 |
| 文件搜索并编辑 | `file_search` → `file_read` → `file_edit` → `file_read` (验证) |
| 浏览器数据采集 | `browser_navigate` → `browser_extract` → `file_write` |
| 终端部署 | `bash_execute(git pull)` → `bash_execute(build)` → `bash_execute(deploy)` → `notification_send` |

---

## 5 Agent 操控循环

### 5.1 总体流程

```
用户下达目标
     │
     ▼
┌──────────────────┐
│  编排 Agent       │
│  (Coordinator)   │
│  1. 分析目标      │
│  2. 拆解子任务    │
│  3. 分配角色      │
│  4. 授权工具      │
└────────┬─────────┘
         │ TaskAssignment (附带 granted_tools)
    ┌────┼────┬──────────┐
    ▼    ▼    ▼          ▼
 Agent  Agent  Agent   Agent
  (A)    (B)    (C)     (D)
    │    │      │        │
    ▼    ▼      ▼        ▼
 本地操控循环  本地操控循环  ...
    │    │      │        │
    └────┼────┬─┘────────┘
         ▼
  汇报结果给编排 Agent
         │
         ▼
  编排 Agent 综合判断
  → 完成 / 继续 / 重新分派
```

### 5.2 单 Agent 操控循环

与 Anthropic Computer Use 模式一致：

```
┌─────────────────────────────────────────────┐
│              操控循环 (Control Loop)          │
│                                              │
│   ┌──────────┐                               │
│   │ Observe  │ ← 截屏 + OCR + 状态感知       │
│   └────┬─────┘                               │
│        ▼                                     │
│   ┌──────────┐                               │
│   │ Reason   │ ← 分析当前状态 vs 目标         │
│   └────┬─────┘                               │
│        ▼                                     │
│   ┌──────────┐                               │
│   │ Plan     │ ← 确定下一步操作               │
│   └────┬─────┘                               │
│        ▼                                     │
│   ┌──────────┐                               │
│   │ Act      │ ← 执行工具调用                 │
│   └────┬─────┘                               │
│        ▼                                     │
│   ┌──────────┐                               │
│   │ Verify   │ ← 截屏验证操作结果             │
│   └────┬─────┘                               │
│        │                                     │
│   ┌────▼────┐                                │
│   │ 目标达成？│                               │
│   └────┬────┘                                │
│    是  │  否                                  │
│   ┌────▼────┐  ┌────────┐                    │
│   │Complete │  │ Loop   │ → 回到 Observe     │
│   └─────────┘  └────────┘                    │
└─────────────────────────────────────────────┘
```

### 5.3 观察策略

| 策略 | 触发条件 | 说明 |
|------|---------|------|
| 操作后截屏 | 每次工具调用完成后 | 默认启用，验证操作效果 |
| 定时轮询 | 可配置间隔（默认 2s） | 等待异步操作完成时使用 |
| 事件驱动 | 文件变更、进程退出、通知弹出 | 通过 `file_watch` 等工具监听 |
| 变化检测 | 连续截屏对比 | 仅在画面变化时触发分析，节省 Token |

### 5.4 错误恢复

```
工具调用失败
     │
     ▼
┌────────────┐    ≤3次    ┌────────────┐
│ 重试相同操作 │──────────►│ 成功？      │── 是 → 继续
└────────────┘           └─────┬──────┘
                            否 │
                               ▼
                     ┌────────────────┐
                     │ 尝试替代方案    │
                     │ (不同工具/路径) │
                     └────────┬───────┘
                              │
                         ┌────▼────┐
                         │ 成功？   │── 是 → 继续
                         └────┬────┘
                           否 │
                              ▼
                     ┌────────────────┐
                     │ 上报用户        │
                     │ 请求人工介入    │
                     └────────────────┘
```

### 5.5 人机协作

| 功能 | 描述 | 操作方式 |
|------|------|---------|
| 实时观察 | 用户可在 UI 面板中实时查看 Agent 的视角（截屏 + 操作标记） | 屏幕查看器面板 |
| 暂停/恢复 | 随时暂停 Agent 操控循环 | 工具栏按钮 / 快捷键 |
| 接管控制 | 用户直接操作桌面，Agent 自动暂停并等待 | 检测到用户输入时自动触发 |
| 审批队列 | 高风险操作等待用户批准 | 通知弹窗 + 操作面板 |
| 目标调整 | 运行中修改或补充目标指令 | 聊天输入框 |

---

## 6 24/7 自主运行

### 6.1 运行模式

| 模式 | 用户状态 | 可用能力 | 典型场景 |
|------|---------|---------|---------|
| 交互式 | 在场操作 | 全部工具 | 实时协作开发 |
| 后台 | 离开但未锁屏 | 全部工具 | 长时间构建/测试 |
| 夜间 | 锁屏/休眠 | 终端 + 文件系统 | 定时任务、代码分析 |
| 紧急恢复 | 任意 | 最小工具集 | 进程崩溃后自动恢复 |

### 6.2 守护进程

各平台使用原生守护进程管理：

| 平台 | 技术 | 配置路径 |
|------|------|---------|
| macOS | launchd (LaunchAgent) | `~/Library/LaunchAgents/com.nextai-agent.plist` |
| Windows | Task Scheduler | 注册表 + 计划任务 |
| Linux | systemd (user unit) | `~/.config/systemd/user/nextai-agent.service` |

守护进程职责：
- 开机自启动 Electron 应用
- 监控主进程健康状态
- 崩溃后自动重启（间隔递增：5s → 15s → 60s）
- 管理后台 Agent Worker 生命周期

### 6.3 任务调度器

Cron 式定时任务配置：

```typescript
interface ScheduledTask {
  id: string;
  name: string;
  cron: string;                     // Cron 表达式
  instruction: string;              // Agent 执行指令
  granted_tools: GrantedToolSet;    // 工具授权
  enabled: boolean;
  last_run?: string;                // ISO 时间戳
  next_run?: string;
  retry_on_failure: boolean;
  max_retries: number;
}

// 示例
const dailyReport: ScheduledTask = {
  id: "task_001",
  name: "每日项目报告",
  cron: "0 9 * * 1-5",             // 工作日 9:00
  instruction: "检查所有项目仓库状态，生成每日开发进度报告并发送通知",
  granted_tools: {
    tools: ["bash_execute", "file_read", "file_write", "browser_navigate",
            "browser_extract", "notification_send"],
    restrictions: {
      max_risk_level: "medium"
    }
  },
  enabled: true,
  retry_on_failure: true,
  max_retries: 3
};
```

### 6.4 自动恢复

| 机制 | 说明 | 实现 |
|------|------|------|
| 任务检查点 | 每 30s 将 Agent 状态序列化到 SQLite | `checkpoint.ts` |
| 崩溃恢复 | 主进程重启后从最近检查点恢复 | 守护进程 + 检查点 |
| 状态持久化 | 操控循环的当前步骤、上下文、截屏缓存 | SQLite `agent_state` 表 |
| 任务队列持久化 | 待执行/进行中的任务队列落盘 | SQLite `task_queue` 表 |

检查点数据结构：

```typescript
interface AgentCheckpoint {
  agent_id: string;
  task_id: string;
  step: number;                     // 当前步骤序号
  loop_state: "observe" | "reason" | "plan" | "act" | "verify";
  context: string;                  // JSON 序列化的上下文
  last_screenshot?: string;         // 最后截屏的文件路径
  created_at: string;
}
```

### 6.5 节能策略

| 用户状态 | 检测方式 | Agent 行为 |
|---------|---------|-----------|
| 屏幕关闭 | Electron `powerMonitor` | 暂停视觉任务，仅执行终端/文件任务 |
| 系统锁定 | 平台 API | 队列化需要屏幕的任务，执行非视觉任务 |
| 低电量 | `powerMonitor.isOnBatteryPower()` | 降低轮询频率，延迟非紧急任务 |
| 系统休眠 | `suspend` 事件 | 持久化状态，休眠唤醒后恢复 |

---

## 7 安全模型

### 7.1 四级权限体系

| 等级 | 名称 | 允许的操作 | 典型用户 |
|------|------|-----------|---------|
| L1 | 只读 | 截屏、OCR、系统信息、文件读取、浏览器提取 | 观察者 |
| L2 | 标准 | L1 + 鼠标/键盘、应用管理、浏览器交互、剪贴板 | 普通用户 |
| L3 | 提升 | L2 + 终端执行、文件写入/编辑、系统热键 | 开发者 |
| L4 | 完全控制 | L3 + 不受限的终端、强制关闭进程、系统配置 | 管理员 |

### 7.2 操作风险分级

每个工具有固定的风险等级，但**审批行为由项目级策略决定**（见 Section 4.3）。下表列出风险等级的定义和默认推荐审批行为：

| 风险等级 | 定义 | 示例操作 | 默认推荐 (supervised 模式) |
|---------|------|---------|--------------------------|
| 低 (Low) | 只读/无副作用操作 | 截屏、OCR、系统信息、文件搜索、滚动 | auto_approve |
| 中 (Medium) | 可逆的交互操作 | 鼠标点击、键盘输入、应用启动/切换、浏览器导航 | auto_approve |
| 高 (High) | 有副作用且不易撤销 | 终端命令、文件写入/编辑、应用关闭、系统热键 | require_approval |
| 危险 (Critical) | 破坏性/不可逆操作 | `rm -rf`、系统配置修改、密码相关操作 | always_block |

用户可在每个项目中自由调整这些默认值。例如在全自动化的 CI/CD 项目中将 High 设为 `auto_approve`，在敏感项目中将 Medium 设为 `require_approval`。

### 7.3 沙箱隔离

**文件系统白名单**：

```typescript
interface FileSystemPolicy {
  allowed_directories: string[];    // 授权目录列表
  denied_patterns: string[];        // 拒绝的路径模式
  max_file_size: number;            // 单文件大小上限 (bytes)
}

// 默认策略
const defaultPolicy: FileSystemPolicy = {
  allowed_directories: [
    "~/Projects",
    "~/Documents/NextAI",
    "~/Desktop"
  ],
  denied_patterns: [
    "~/.ssh/*",
    "~/.gnupg/*",
    "~/.aws/*",
    "**/node_modules/**",
    "/etc/**",
    "/System/**"
  ],
  max_file_size: 50 * 1024 * 1024   // 50MB
};
```

**网络域名白名单**（浏览器自动化）：

```typescript
interface NetworkPolicy {
  allowed_domains: string[];         // 允许访问的域名
  blocked_domains: string[];         // 禁止访问的域名
}

// 默认阻断列表
const defaultBlocked: string[] = [
  "*.bank.com",
  "*.banking.*",
  "accounts.google.com",
  "id.apple.com",
  "login.microsoftonline.com"
];
```

**进程隔离**：Agent Worker 运行在独立 Node.js Worker Thread 中，通过 MessagePort 通信，无法直接访问主进程资源。

### 7.4 敏感操作保护

以下场景自动阻断并请求人工确认：

| 场景 | 检测方式 | 处理 |
|------|---------|------|
| 金融网站操作 | URL 域名匹配 | 阻断 + 通知用户 |
| 密码管理器 | 应用名称/窗口标题匹配 | 阻断 + 通知用户 |
| 系统管理后台 | URL + 端口号模式匹配 | 阻断 + 通知用户 |
| sudo / 提权操作 | 命令解析 | 阻断 + 必须逐次确认 |
| 批量删除 | 命令参数分析 (`rm -rf`, `DROP TABLE`) | 阻断 + 必须逐次确认 |

### 7.5 审计日志

全部操作记录到审计日志（与 doc 13 审计日志规范一致）：

```typescript
interface AuditLogEntry {
  timestamp: string;               // ISO 8601
  agent_id: string;                // 执行 Agent
  tool: string;                    // 工具名称
  parameters: Record<string, unknown>;  // 调用参数（脱敏后）
  result: "success" | "failed" | "blocked" | "approved" | "denied";
  risk_level: "low" | "medium" | "high" | "critical";
  screenshot_thumbnail?: string;   // 截图缩略图路径（可选）
  duration_ms: number;             // 执行耗时
  error?: string;                  // 错误信息
}
```

日志存储：本地 SQLite `audit_log` 表，可选同步到云端（仅云端存储模式）。

### 7.6 紧急停止

| 触发方式 | 说明 |
|---------|------|
| `Ctrl+Shift+Esc` | 全局热键，立即停止所有 Agent 操控 |
| 系统托盘按钮 | 点击托盘"紧急停止"按钮 |
| 云端远程停止 | 通过 SaaS 平台仪表盘发送停止指令（仅云端模式） |
| 用户输入检测 | 检测到用户鼠标/键盘活动时自动暂停 |

紧急停止执行流程：
1. 立即冻结所有 Agent Worker
2. 终止正在执行的 bash 子进程
3. 关闭 Playwright 浏览器实例
4. 保存当前检查点
5. 发送通知告知用户停止原因

### 7.7 数据隐私

| 措施 | 说明 |
|------|------|
| 截图加密传输 | 发送到云端的截图使用 TLS 1.3 加密 |
| 截图不持久化 | 可配置"不保存截图"模式，仅内存中处理 |
| 敏感信息遮蔽 | 截图中的密码框区域自动模糊化 |
| 本地存储加密 | SQLite 数据库可选 SQLCipher 加密 |

---

## 8 云端-本地一体化

### 8.1 数据存储模式

用户在设置中配置存储模式：

| 模式 | 数据位置 | 特点 |
|------|---------|------|
| 云端存储 | SaaS 平台 (PostgreSQL/Redis/Milvus) | 多设备同步、远程访问、团队协作、云端备份 |
| 本地 SQLite | `~/.nextai-agent/data.db` | 完全离线、隐私优先、零网络依赖 |

**模式切换**：

```typescript
interface StorageConfig {
  mode: "cloud" | "local";
  cloud?: {
    api_url: string;
    ws_url: string;
    token: string;
  };
  local?: {
    db_path: string;                  // 默认 ~/.nextai-agent/data.db
    encryption: boolean;              // 是否启用 SQLCipher
  };
}

// 切换时的数据迁移
interface DataMigration {
  direction: "cloud_to_local" | "local_to_cloud";
  include: Array<"sessions" | "messages" | "memories" | "tasks" | "agent_configs">;
  conflict_resolution: "keep_source" | "keep_target" | "merge";
}
```

### 8.2 连接模式

| 模式 | 网络要求 | 可用功能 | 数据行为 |
|------|---------|---------|---------|
| 完全连接 | 稳定网络 | 全部功能 | 实时同步到云端 |
| 混合模式 | 间歇网络 | 全部功能 | 离线缓存 + 恢复后同步 |
| 离线模式 | 无网络 | 本地工具 + 本地 Agent (需本地模型) | 仅本地存储 |

### 8.3 数据同步（云端模式）

| 数据类型 | 同步方向 | 同步策略 | 冲突解决 |
|---------|---------|---------|---------|
| 会话 (Sessions) | 双向 | 实时 (WebSocket) | 服务端优先 |
| 消息 (Messages) | 双向 | 实时 (WebSocket) | 追加模式 |
| 记忆 (Memories) | 双向 | 定期 (5 min) | 时间戳优先 |
| 任务状态 | 双向 | 实时 (WebSocket) | 服务端优先 |
| Agent 配置 | 双向 | 变更时 | Last-write-wins |
| 审计日志 | 本地→云端 | 批量 (1 min) | 仅追加 |

### 8.4 远程监控

云端模式下，用户可通过 SaaS 平台仪表盘远程监控本地 Agent（需用户明确授权）：

| 功能 | 说明 |
|------|------|
| Agent 状态 | 运行中/空闲/错误/已停止 |
| 操作日志流 | 实时查看 Agent 操作记录 |
| 截屏快照 | 查看最近 Agent 视角截屏（需授权） |
| 远程控制 | 暂停/恢复/停止 Agent |
| 任务管理 | 远程下发/取消任务 |

### 8.5 混合执行

部分任务在云端执行（利用强大算力和服务），部分在本地执行（需要操控本地环境）：

| 执行位置 | 任务类型 | 原因 |
|---------|---------|------|
| 云端 | 代码审查、架构设计、文档生成 | 无需本地操控，利用云端 GPU |
| 本地 | 终端操作、浏览器自动化、文件编辑 | 需要本地环境访问权限 |
| 混合 | Agent 协作任务 | 编排 Agent 在云端，执行 Agent 在本地 |

### 8.6 冲突解决

离线期间产生的变更在恢复连接后同步，采用以下策略：

| 数据类型 | 策略 | 说明 |
|---------|------|------|
| 会话/消息 | 追加合并 | 两端消息按时间戳排序合并 |
| Agent 配置 | Last-write-wins | 最后修改的版本覆盖 |
| 任务状态 | 服务端优先 | 云端状态为权威源 |
| 记忆 | 时间戳优先 | 相同 key 取最新时间戳 |
| 文件 | 用户选择 | 提示用户手动解决冲突 |

---

## 9 用户界面

### 9.1 桌面端主界面布局

扩展 doc 14 的桌面端布局，增加本地操控相关面板：

```
┌─────────────────────────────────────────────────────────────────────┐
│  ◉ ◉ ◉   NextAI Agent Desktop          ─ □ ✕   [🔴 紧急停止]      │
├──────────┬──────────────────────────────────┬───────────────────────┤
│          │                                  │                       │
│  会话    │         聊天主区域                │    实时屏幕查看器     │
│  列表    │                                  │                       │
│          │  ┌────────────────────────────┐  │  ┌─────────────────┐  │
│  ────    │  │ Agent: 正在执行截屏...     │  │  │  Agent 视角     │  │
│  会话1   │  │ [截图缩略图]               │  │  │  (镜像实时画面) │  │
│  会话2   │  │                            │  │  │                 │  │
│  会话3   │  │ Agent: 已定位到"提交"按钮  │  │  │  + 操作标记     │  │
│          │  │ [截图 + 红色十字线标记]    │  │  │  (点击位置,     │  │
│          │  │                            │  │  │   光标轨迹)     │  │
│          │  │ Agent: 点击完成,正在验证...│  │  │                 │  │
│          │  └────────────────────────────┘  │  └─────────────────┘  │
│          │                                  │                       │
│          │  ┌────────────────────────────┐  │  ┌─────────────────┐  │
│          │  │ 💬 输入指令...             │  │  │  操作日志       │  │
│          │  └────────────────────────────┘  │  │  09:01 screenshot│  │
│          │                                  │  │  09:01 ocr       │  │
│          │                                  │  │  09:02 click     │  │
├──────────┴──────────────────────────────────┤  │  09:02 screenshot│  │
│  任务控制面板                                │  └─────────────────┘  │
│  ┌──────────────────────────────────────┐   │                       │
│  │ 当前: 自动化表单填写  ██████░░ 60%   │   │  ┌─────────────────┐  │
│  │ [⏸暂停] [⏹停止] [📋日志] [⚙设置]   │   │  │  审批队列 (2)   │  │
│  │ 等待审批: bash_execute "npm deploy"  │   │  │  ☐ bash_execute │  │
│  │          [✅批准] [❌拒绝]           │   │  │  ☐ file_write   │  │
│  └──────────────────────────────────────┘   │  └─────────────────┘  │
└─────────────────────────────────────────────┴───────────────────────┘
```

### 9.2 实时屏幕查看器

镜像 Agent 视角的实时画面，叠加操作标记：

| 标记 | 含义 | 可视化 |
|------|------|--------|
| 红色十字线 | 点击位置 | 十字交叉线 + 坐标标签 |
| 蓝色矩形 | 定位的 UI 元素 | 虚线矩形框 |
| 绿色路径 | 鼠标移动轨迹 | 带箭头的曲线 |
| 橙色高亮 | 正在输入的文本区域 | 半透明遮罩 |

### 9.3 操作日志面板

实时展示 Agent 操作流水：

| 列 | 内容 |
|----|------|
| 时间 | HH:mm:ss 精确到秒 |
| 工具 | 工具名称 + 图标 |
| 参数 | 关键参数摘要（截断显示） |
| 状态 | 成功 ✅ / 失败 ❌ / 等待 ⏳ / 已阻断 🚫 |
| 截图 | 缩略图（点击放大查看） |

### 9.4 权限管理界面

**全局安全设置**：

| 设置项 | 说明 |
|--------|------|
| 授权目录 | 管理文件系统白名单目录列表 |
| 授权域名 | 管理浏览器自动化的域名白名单 |
| 应用黑名单 | 禁止 Agent 操控的应用列表 |
| 权限等级 | 选择 L1-L4 权限等级 |

**项目审批策略**（每个项目独立配置）：

| 设置项 | 说明 |
|--------|------|
| 审批模板 | 从预设模板（全自动/开发模式/严格模式/观察模式）快速选择 |
| 全局模式 | auto / supervised / locked 三选一 |
| 风险等级策略 | 为低/中/高/危险四级分别设置审批动作 |
| 工具分类覆盖 | 为特定工具分类（如"终端操控"）设置审批动作 |
| 单工具覆盖 | 为特定工具（如 `bash_execute`）设置审批动作 |
| 提示词授权 | 启用/禁用通过提示词调整审批策略 |

### 9.5 系统托盘增强

扩展 doc 14 的系统托盘功能：

| 元素 | 说明 |
|------|------|
| 状态指示灯 | 🟢 运行中 / 🟡 空闲 / 🔴 错误 / ⚪ 已停止 |
| Agent 当前任务 | 显示正在执行的任务名称 |
| 快捷操作 | 暂停/恢复、新任务、打开主窗口 |
| 紧急停止 | 红色按钮，一键停止所有 Agent |
| 审批通知 | 有待审批操作时显示角标数字 |

---

## 10 部署与安装

### 10.1 系统要求

| 平台 | 最低配置 | 推荐配置 |
|------|---------|---------|
| macOS | macOS 12+, Apple Silicon / Intel, 8GB RAM, 2GB 磁盘 | macOS 14+, Apple Silicon, 16GB RAM, 5GB 磁盘 |
| Windows | Windows 10 (21H2)+, x64, 8GB RAM, 2GB 磁盘 | Windows 11, x64, 16GB RAM, 5GB 磁盘 |
| Linux | Ubuntu 22.04+ / Fedora 38+, x64, 8GB RAM, 2GB 磁盘 | Ubuntu 24.04+, x64, 16GB RAM, 5GB 磁盘 |

**额外要求**：

| 平台 | 必需权限 |
|------|---------|
| macOS | 辅助功能权限 (Accessibility)、屏幕录制权限 (Screen Recording) |
| Windows | 管理员权限（首次安装）、UI Automation 权限 |
| Linux | X11/Wayland 显示服务器、`xdotool`（X11）、D-Bus |

### 10.2 安装流程

```
下载安装包
     │
     ▼
运行安装程序
     │
     ▼
首次运行向导
     │
     ├── 1. 登录云端账户（或选择离线模式）
     │
     ├── 2. 授权系统权限
     │      ├── macOS: 辅助功能 + 屏幕录制
     │      ├── Windows: UAC 确认
     │      └── Linux: 提示安装依赖
     │
     ├── 3. 选择工作目录（Agent 的文件系统白名单）
     │
     ├── 4. 选择存储模式（云端 / 本地 SQLite）
     │
     └── 5. 完成 → 进入主界面
```

### 10.3 安装包格式

| 平台 | 格式 | 签名/公证 |
|------|------|----------|
| macOS | `.dmg` (Universal Binary: arm64 + x64) | Apple Notarization + Developer ID |
| Windows | `.exe` (NSIS installer) | Code Signing Certificate |
| Linux | `.AppImage` + `.deb` + `.rpm` | GPG 签名 |

### 10.4 配置文件

配置文件路径：`~/.nextai-agent/config.json`（延续 OpenClaw 的 `~/.openclaw/` 模式）

```json
{
  "version": "1.0.0",
  "storage": {
    "mode": "cloud",
    "local_db_path": "~/.nextai-agent/data.db",
    "local_db_encryption": false
  },
  "cloud": {
    "api_url": "https://api.nextai-agent.com",
    "ws_url": "wss://api.nextai-agent.com/ws/v1"
  },
  "security": {
    "permission_level": "L3",
    "allowed_directories": ["~/Projects", "~/Documents/NextAI"],
    "blocked_domains": ["*.bank.com"],
    "blocked_apps": ["Keychain Access", "1Password"]
  },
  "projects": {
    "default_approval_template": "开发模式",
    "items": {
      "project_frontend": {
        "name": "前端开发",
        "approval": {
          "mode": "auto",
          "risk_policies": {
            "low": "auto_approve",
            "medium": "auto_approve",
            "high": "auto_approve",
            "critical": "require_approval"
          },
          "tool_overrides": {}
        }
      },
      "project_prod_deploy": {
        "name": "生产部署",
        "approval": {
          "mode": "supervised",
          "risk_policies": {
            "low": "auto_approve",
            "medium": "require_approval",
            "high": "require_approval",
            "critical": "always_block"
          },
          "tool_overrides": {
            "bash_execute": "require_approval"
          }
        }
      }
    }
  },
  "scheduler": {
    "enabled": true,
    "daemon_autostart": true
  },
  "performance": {
    "screenshot_quality": 80,
    "screenshot_max_dimension": 1568,
    "polling_interval_ms": 2000,
    "max_memory_mb": 500
  },
  "ui": {
    "theme": "system",
    "show_screen_viewer": true,
    "show_operation_log": true
  }
}
```

### 10.5 自动更新

扩展 doc 14 的 electron-updater 机制：

| 渠道 | 更新策略 | 说明 |
|------|---------|------|
| stable | 自动下载 + 提示安装 | 默认渠道 |
| beta | 手动检查 + 确认下载 | 可选加入 |
| nightly | 手动下载 | 开发者专用 |

### 10.6 企业部署

| 功能 | 说明 |
|------|------|
| 静默安装 | `--silent` 命令行参数 |
| MDM 配置 | 通过 MDM 推送 `config.json` |
| 集中管理 | 管理员控制台批量管理桌面端 |
| 策略下发 | 统一权限策略、工具白名单、审计要求 |

---

## 11 跨平台实现

### 11.1 平台适配层接口

```typescript
interface PlatformAdapter {
  // 平台标识
  readonly platform: "macos" | "windows" | "linux";

  // 屏幕捕获
  captureScreen(options?: CaptureOptions): Promise<ScreenCapture>;
  captureWindow(windowId: string): Promise<ScreenCapture>;
  captureRegion(region: Region): Promise<ScreenCapture>;

  // 输入模拟
  mouseMove(x: number, y: number, smooth?: boolean): Promise<void>;
  mouseClick(x: number, y: number, button: MouseButton): Promise<void>;
  mouseDrag(from: Point, to: Point, duration?: number): Promise<void>;
  scroll(x: number, y: number, dx: number, dy: number): Promise<void>;
  typeText(text: string, delay?: number): Promise<void>;
  keyPress(keys: string[]): Promise<void>;

  // 应用管理
  launchApp(name: string, args?: string[]): Promise<ProcessInfo>;
  switchToApp(name: string): Promise<void>;
  listApps(): Promise<AppInfo[]>;
  closeApp(name: string, force?: boolean): Promise<void>;
  manageWindow(windowId: string, action: WindowAction): Promise<void>;

  // 系统
  getClipboard(): Promise<string>;
  setClipboard(text: string): Promise<void>;
  sendNotification(title: string, body: string): Promise<void>;
  getSystemInfo(): Promise<SystemInfo>;
  getDisplays(): Promise<DisplayInfo[]>;
}
```

### 11.2 macOS 实现

| 功能 | 技术 | 说明 |
|------|------|------|
| 屏幕捕获 | CGWindowListCreateImage | 全桌面访问，包括非前台窗口 |
| 输入模拟 | CGEventPost / nut.js | 需要辅助功能权限 |
| 应用管理 | AppleScript / JXA | `osascript -e` 或 Node.js JXA 绑定 |
| 辅助功能 | Accessibility API (AXUIElement) | UI 元素树遍历 |
| 窗口管理 | NSWindow / CGWindow | 位置、大小、全屏控制 |

### 11.3 Windows 实现

| 功能 | 技术 | 说明 |
|------|------|------|
| 屏幕捕获 | Win32 BitBlt / DXGI Desktop Duplication | GPU 加速截屏 |
| 输入模拟 | SendInput / nut.js | 支持 UAC 窗口输入 |
| 应用管理 | COM / WMI | 进程管理 |
| 辅助功能 | UI Automation | UI 元素定位与操控 |
| 窗口管理 | Win32 SetWindowPos | 位置、大小、置顶 |

### 11.4 Linux 实现

| 功能 | 技术 | 说明 |
|------|------|------|
| 屏幕捕获 | X11 XGetImage / Xvfb (headless) | Wayland 需 PipeWire |
| 输入模拟 | xdotool / nut.js | X11 专用 |
| 应用管理 | D-Bus / wmctrl | 窗口管理器集成 |
| 辅助功能 | AT-SPI2 | GNOME/KDE 辅助功能 |
| 窗口管理 | X11 XMoveResizeWindow / wmctrl | 多窗口管理器兼容 |

### 11.5 平台差异矩阵

| 功能 | macOS | Windows | Linux |
|------|-------|---------|-------|
| 全桌面截屏 | ✅ CGWindowList | ✅ DXGI | ✅ X11 / ⚠️ Wayland |
| 高 DPI 支持 | ✅ Retina 原生 | ✅ DPI 感知 | ⚠️ 取决于 DE |
| 输入模拟 | ✅ 需辅助功能权限 | ✅ 需 UAC 确认 | ✅ X11 / ⚠️ Wayland |
| 应用管理 | ✅ AppleScript | ✅ COM/WMI | ⚠️ 依赖 WM |
| 系统通知 | ✅ Notification Center | ✅ Toast | ✅ libnotify |
| 守护进程 | ✅ launchd | ✅ Task Scheduler | ✅ systemd |
| 全局热键 | ✅ | ✅ | ⚠️ X11 only |

说明：✅ 完全支持，⚠️ 部分支持/有限制

### 11.6 优先级

实现优先级：**macOS 优先**（延续 OpenClaw 传统）→ Windows → Linux

---

## 12 性能与优化

### 12.1 性能指标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| 截屏延迟 | < 100ms | 从调用到返回 Base64 |
| 操控响应 | < 200ms | 从指令到输入事件发出 |
| OCR 处理 | < 500ms | 单次截屏 OCR 全流程 |
| Agent 循环 | < 3s | 单次 observe→act 循环（不含模型推理） |
| 内存占用 | < 500MB | Electron + Agent Worker 总计 |
| 磁盘占用 | < 2GB | 应用 + 本地数据 + 截屏缓存 |

### 12.2 Token 优化

截屏传输到视觉模型的 Token 消耗优化：

| 策略 | 节省比例 | 说明 |
|------|---------|------|
| JPEG 压缩 | ~60% | 相比 PNG，截屏使用 JPEG quality=80 |
| 分辨率限制 | ~40% | 长边最大 1568px，等比缩放 |
| 变化检测 | ~50% | 连续截屏对比，未变化时跳过分析 |
| 区域截取 | ~70% | 仅截取相关区域而非全屏 |
| 增量描述 | ~30% | 向模型发送"与上次截屏相比的变化"而非完整描述 |

### 12.3 资源预算

| 组件 | CPU 上限 | 内存上限 | 说明 |
|------|---------|---------|------|
| Electron Main | 5% | 100MB | 窗口管理 + IPC |
| Electron Renderer | 10% | 150MB | React UI |
| Agent Worker (每个) | 10% | 100MB | Agent 运行时 |
| Screen Analyzer | 15% | 100MB | 截屏处理 + 压缩 |
| Playwright | 10% | 200MB | 浏览器自动化 |
| SQLite | 2% | 50MB | 本地存储 |

---

## 13 测试策略

### 13.1 测试层级

| 层级 | 范围 | 工具 | 覆盖率目标 |
|------|------|------|-----------|
| 单元测试 | 工具函数、平台适配器、数据转换 | Vitest | > 80% |
| 集成测试 | 工具链组合、IPC 通信、存储同步 | Vitest + Playwright Test | > 70% |
| E2E 测试 | 完整操控工作流（截屏→操控→验证） | Playwright + 虚拟显示 | 核心流程 100% |
| 安全测试 | 权限边界、沙箱逃逸、审计完整性 | 自定义安全测试套件 | 关键路径 100% |

### 13.2 模拟环境

| 环境 | 用途 | 技术 |
|------|------|------|
| CI 虚拟显示 | Linux CI 中运行屏幕相关测试 | Xvfb (1920x1080) |
| 模拟桌面 | 测试应用管理/窗口操作 | Docker + Xvfb + Window Manager |
| 截屏录制 | 测试回放 + 视觉回归 | 预录制截屏序列 |

### 13.3 安全测试

| 测试项 | 验证内容 | 预期结果 |
|--------|---------|---------|
| 权限边界 | L1 用户尝试执行 L3 工具 | 阻断 + 审计记录 |
| 目录逃逸 | `../` 路径穿越攻击 | 阻断 + 错误提示 |
| 命令注入 | bash_execute 参数注入 | 参数转义 + 阻断 |
| 沙箱隔离 | Worker Thread 尝试访问主进程 | 隔离生效 |
| 审计完整性 | 删除/篡改审计日志 | 不可变 + 完整性校验 |
| 紧急停止 | 并发操控中触发紧急停止 | 所有操作 < 1s 内停止 |

---

## 14 实施路线图

### 14.1 阶段规划

```
P1 核心工具                P2 扩展能力
────────────────          ────────────────
│ 截屏捕获     │          │ 应用管理      │
│ 鼠标操控     │          │ 浏览器自动化  │
│ 键盘输入     │    ──►   │ 文件监听      │
│ 终端执行     │          │ 系统操作      │
│ 文件读写     │          │ 窗口管理      │
│ 操控循环     │          │ OCR + 元素定位│
────────────────          ────────────────
                                │
        ┌───────────────────────┘
        ▼
P3 自主运行                P4 企业功能
────────────────          ────────────────
│ 守护进程     │          │ MDM 部署      │
│ 任务调度器   │          │ 集中管理      │
│ 检查点恢复   │    ──►   │ 策略下发      │
│ 云端同步     │          │ 审计合规      │
│ 远程监控     │          │ SSO 集成      │
│ 混合执行     │          │ 自定义插件    │
────────────────          ────────────────
```

### 14.2 各阶段详情

| 阶段 | 核心交付 | 依赖 |
|------|---------|------|
| P1 核心工具 | 截屏 + 鼠标 + 键盘 + 终端 + 文件 + 操控循环 + 安全基础 | doc 14 (Electron 基座) |
| P2 扩展能力 | 应用管理 + 浏览器自动化 + OCR + 完整工具集 | P1 + doc 04 (Agent 系统) |
| P3 自主运行 | 守护进程 + 调度器 + 检查点 + 云端集成 + 远程监控 | P2 + doc 07 (插件系统) |
| P4 企业功能 | MDM + 集中管理 + 合规审计 + SSO | P3 |

### 14.3 依赖关系

| 本文档章节 | 依赖文档 | 依赖内容 |
|-----------|---------|---------|
| 架构设计 (2) | doc 14 前端架构 | Electron 基座、IPC、窗口管理 |
| 工具注册 (4) | doc 04 Agent 系统 | `AgentTool` 接口、角色定义、消息协议 |
| 插件集成 (4) | doc 07 插件市场 | `PluginType`、`PluginContext`、`PluginManifest` |
| 目录结构 (2) | doc 20 目录规范 | `apps/desktop/` 结构、命名规范 |
| 安全模型 (7) | doc 13 基础设施 | 安全架构、审计日志、监控 |
| 云端集成 (8) | doc 19 部署指南 | 云端服务架构、环境变量 |
| 工具模式 (3) | doc 23 迁移映射 | OpenClaw 工具模式、可复用依赖 |
