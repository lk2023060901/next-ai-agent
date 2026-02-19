# 设计系统规范

## 1 设计令牌 (Design Tokens)

### 1.1 颜色系统

#### 1.1.1 品牌色

| 名称 | 色值 | 用途 |
|------|------|------|
| Primary | `#006FEE` | 主按钮、链接、选中态 |
| Primary-50 | `#E6F1FE` | 主色浅底背景 |
| Primary-100 | `#CCE3FD` | hover 背景 |
| Primary-200 | `#99C7FB` | 边框高亮 |
| Primary-300 | `#66AAF9` | 图标辅助 |
| Primary-400 | `#338EF7` | 活跃状态 |
| Primary-500 | `#006FEE` | 主色 (默认) |
| Primary-600 | `#005BC4` | hover 按钮 |
| Primary-700 | `#004493` | pressed 按钮 |
| Primary-800 | `#002E62` | 深色文字强调 |
| Primary-900 | `#001731` | 极深底色 |

#### 1.1.2 语义色

| 名称 | 色值 | 用途 |
|------|------|------|
| Success | `#17C964` | 成功状态、在线指示 |
| Success-50 | `#E8FAF0` | 成功浅底背景 |
| Warning | `#F5A524` | 警告状态、待处理 |
| Warning-50 | `#FEFCE8` | 警告浅底背景 |
| Danger | `#F31260` | 错误状态、删除操作 |
| Danger-50 | `#FEE7EF` | 错误浅底背景 |
| Info | `#006FEE` | 信息提示 |

#### 1.1.3 中性色

| 名称 | Light 色值 | Dark 色值 | 用途 |
|------|-----------|-----------|------|
| Background | `#FFFFFF` | `#000000` | 页面底色 |
| Surface | `#F4F4F5` | `#18181B` | 卡片/面板底色 |
| Surface-2 | `#E4E4E7` | `#27272A` | 嵌套面板底色 |
| Border | `#E4E4E7` | `#3F3F46` | 分割线/边框 |
| Border-Hover | `#D4D4D8` | `#52525B` | hover 边框 |
| Text-Primary | `#11181C` | `#ECEDEE` | 主文字 |
| Text-Secondary | `#71717A` | `#A1A1AA` | 次要文字 |
| Text-Tertiary | `#A1A1AA` | `#71717A` | 辅助文字/placeholder |
| Disabled | `#D4D4D8` | `#3F3F46` | 禁用态 |

#### 1.1.4 Agent 角色色

每个 Agent 类型分配独立色系，便于用户快速区分：

| Agent 角色 | 色值 | 辅助色 |
|-----------|------|--------|
| 需求 Agent | `#9353D3` (Purple) | `#F2EAFA` |
| 架构 Agent | `#006FEE` (Blue) | `#E6F1FE` |
| 前端 Agent | `#17C964` (Green) | `#E8FAF0` |
| 后端 Agent | `#F5A524` (Amber) | `#FEFCE8` |
| 测试 Agent | `#F31260` (Pink) | `#FEE7EF` |
| 运维 Agent | `#71717A` (Gray) | `#F4F4F5` |
| 审查 Agent | `#0E8AAA` (Cyan) | `#E0F8FF` |
| 协调 Agent | `#11181C` (Dark) | `#E4E4E7` |

### 1.2 字体系统

#### 1.2.1 字体族

```css
--font-sans: "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace;
```

- 英文优先使用 Inter
- 中文 fallback 使用 Noto Sans SC
- 代码使用 JetBrains Mono

#### 1.2.2 字号体系

| 名称 | 大小 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| Display | 36px | 44px | 700 (Bold) | 落地页大标题 |
| H1 | 30px | 38px | 700 (Bold) | 页面标题 |
| H2 | 24px | 32px | 600 (Semibold) | 区块标题 |
| H3 | 20px | 28px | 600 (Semibold) | 卡片标题 |
| H4 | 16px | 24px | 600 (Semibold) | 子标题 |
| Body-lg | 16px | 24px | 400 (Regular) | 大段正文 |
| Body | 14px | 20px | 400 (Regular) | 默认正文 |
| Body-sm | 13px | 18px | 400 (Regular) | 辅助正文 |
| Caption | 12px | 16px | 400 (Regular) | 标签/时间/辅助 |
| Tiny | 11px | 14px | 500 (Medium) | Badge/徽章 |
| Code | 13px | 20px | 400 (Regular) | 代码块 (mono) |

### 1.3 间距系统

基于 4px 基准网格：

| Token | 值 | 用途 |
|-------|-----|------|
| space-0 | 0px | 无间距 |
| space-1 | 4px | 紧凑内间距 |
| space-2 | 8px | 图标与文字间距 |
| space-3 | 12px | 列表项内间距 |
| space-4 | 16px | 卡片内间距、组件间距 |
| space-5 | 20px | 区块内间距 |
| space-6 | 24px | 卡片间距 |
| space-7 | 28px | 大卡片间距 |
| space-8 | 32px | 区块间距 |
| space-10 | 40px | 页面大区块间距 |
| space-12 | 48px | 页面 section 间距 |
| space-16 | 64px | 页面顶部间距 |
| space-20 | 80px | 落地页 section 间距 |

### 1.4 圆角系统

| Token | 值 | 用途 |
|-------|-----|------|
| radius-sm | 8px | 小按钮、Badge |
| radius-md | 12px | 输入框、卡片 |
| radius-lg | 14px | 大卡片、弹窗 |
| radius-xl | 18px | 对话气泡 |
| radius-full | 9999px | 头像、圆形按钮 |

### 1.5 阴影系统

| Token | 值 | 用途 |
|-------|-----|------|
| shadow-sm | `0 1px 2px rgba(0,0,0,0.05)` | 轻微浮层 |
| shadow-md | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | 卡片 |
| shadow-lg | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | 弹窗/下拉 |
| shadow-xl | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | Modal |

### 1.6 动画系统

| Token | 值 | 用途 |
|-------|-----|------|
| duration-fast | 150ms | hover、toggle |
| duration-normal | 250ms | 展开/折叠 |
| duration-slow | 350ms | 页面切换 |
| easing-default | `cubic-bezier(0.4, 0, 0.2, 1)` | 通用动画 |
| easing-in | `cubic-bezier(0.4, 0, 1, 1)` | 进入动画 |
| easing-out | `cubic-bezier(0, 0, 0.2, 1)` | 退出动画 |

---

## 2 布局系统

### 2.1 响应式断点

| 名称 | 宽度范围 | 布局 |
|------|---------|------|
| Mobile | 0 - 639px | 单列 |
| Tablet | 640px - 1023px | 双列 |
| Desktop | 1024px - 1279px | 侧边栏 + 主区域 |
| Wide | 1280px - 1535px | 侧边栏 + 主区域 + 辅助面板 |
| Ultra | 1536px+ | 全展开三栏 |

### 2.2 主布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│  顶部导航栏 (Top Nav Bar)  高度: 64px                             │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│  侧边栏   │              主内容区域                               │
│  宽度:    │              (Main Content Area)                     │
│  240px   │                                                      │
│  (可折叠   │                                                      │
│  至 64px) │                                                      │
│          │                                                      │
│          │                                                      │
│          │                                                      │
│          │                                                      │
├──────────┴──────────────────────────────────────────────────────┤
│  状态栏 (可选)  高度: 32px                                        │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2.1 顶部导航栏

- 高度: 64px
- 背景: `Surface` / 毛玻璃 `backdrop-blur: 10px, background: rgba(255,255,255,0.8)`
- 左侧: Logo (32x32px) + 产品名 (H4, Primary-500)，间距 space-2
- 中间: 搜索框 (宽度 400px, 高度 40px, radius-md, 边框 Border)
- 右侧: 通知铃铛图标 (24x24) + 用户头像 (32x32, radius-full) + 下拉箭头
- 底部边框: 1px solid Border
- 内边距: 水平 space-6

#### 2.2.2 侧边栏

- 宽度: 240px (展开) / 64px (折叠)
- 背景: `Surface`
- 右侧边框: 1px solid Border
- 内边距: space-3
- 菜单项高度: 40px
- 菜单项圆角: radius-sm
- 菜单项 hover: Background `Primary-50`
- 菜单项 active: Background `Primary-100`, 文字 `Primary-500`, 左侧 3px `Primary-500` 指示条
- 图标大小: 20x20px
- 图标与文字间距: space-3
- 菜单分组标题: Caption, Text-Tertiary, 上方间距 space-4

#### 2.2.3 主内容区域

- 内边距: space-6 (Desktop+), space-4 (Tablet), space-3 (Mobile)
- 最大宽度: 1200px (居中)
- 背景: `Background`

### 2.3 栅格系统

基于 12 列栅格：

| 场景 | 列数 | 间距 | 示例 |
|------|------|------|------|
| 卡片网格 | 2x2 | space-6 | Dashboard 概览卡片 |
| 卡片网格 | 3x? | space-6 | 插件列表 |
| 卡片网格 | 4x? | space-4 | Agent 角色选择 |
| 表单 | 1 列 | - | 设置表单 |
| 表单 | 2 列 | space-6 | 工作区设置 |
| 对话 | 1 列 | - | 聊天界面 |
| 分栏 | 左 4 + 右 8 | space-6 | 列表+详情 |
| 分栏 | 左 3 + 中 6 + 右 3 | space-4 | Agent 协作视图 |

---

## 3 组件规范

### 3.1 按钮 (Button)

#### 3.1.1 尺寸变体

| 尺寸 | 高度 | 内边距 (水平) | 字号 | 圆角 |
|------|------|-------------|------|------|
| sm | 32px | 12px | Body-sm (13px) | radius-sm |
| md | 40px | 16px | Body (14px) | radius-md |
| lg | 48px | 20px | Body-lg (16px) | radius-md |

#### 3.1.2 颜色变体

| 变体 | 背景 | 文字 | hover 背景 | 边框 |
|------|------|------|-----------|------|
| Primary | Primary-500 | #FFFFFF | Primary-600 | 无 |
| Secondary | Surface | Text-Primary | Surface-2 | 1px Border |
| Ghost | transparent | Text-Secondary | Surface | 无 |
| Danger | Danger | #FFFFFF | Danger-700 | 无 |
| Outline-Primary | transparent | Primary-500 | Primary-50 | 1px Primary-200 |

#### 3.1.3 状态

| 状态 | 表现 |
|------|------|
| Default | 标准样式 |
| Hover | 背景色加深一级 + cursor: pointer |
| Pressed | 背景色加深两级 + transform: scale(0.97) |
| Focused | 外侧 2px Primary-200 focus ring, offset 2px |
| Disabled | opacity: 0.5, cursor: not-allowed |
| Loading | 左侧显示 16px spinner 动画, 文字不变 |

### 3.2 输入框 (Input)

#### 3.2.1 基础规范

- 高度: 40px (md), 32px (sm), 48px (lg)
- 圆角: radius-md
- 边框: 1px solid Border
- 内边距: space-3 (水平), 垂直居中
- 字号: Body (14px)
- Placeholder: Text-Tertiary
- 背景: Background (light) / Surface (dark)

#### 3.2.2 状态

| 状态 | 边框色 | 背景 | 附加 |
|------|--------|------|------|
| Default | Border | Background | - |
| Hover | Border-Hover | Background | - |
| Focused | Primary-500 | Background | 2px border + 外侧 glow `0 0 0 2px Primary-100` |
| Error | Danger | Danger-50 | 下方显示错误文字 (Caption, Danger) |
| Disabled | Disabled | Surface | opacity: 0.5 |

#### 3.2.3 附加元素

- 左侧图标: 20x20px, 位于内边距内, 与文字间距 space-2
- 右侧操作: 清除按钮 (16x16, Ghost), 密码切换
- 标签 (Label): 位于输入框上方, Body-sm, Text-Primary, 下间距 space-1
- 帮助文字: 位于输入框下方, Caption, Text-Tertiary, 上间距 space-1
- 错误文字: 位于输入框下方, Caption, Danger, 上间距 space-1

### 3.3 卡片 (Card)

- 背景: Surface (或 Background)
- 圆角: radius-lg
- 边框: 1px solid Border
- 内边距: space-5
- 阴影: shadow-sm (默认), shadow-md (hover)
- hover 动画: translateY(-2px), duration-fast

### 3.4 对话气泡 (Chat Bubble)

#### 3.4.1 用户消息

- 背景: Primary-500
- 文字: #FFFFFF
- 圆角: radius-xl (左上、左下、右下圆角), 右上 4px
- 最大宽度: 70% (桌面) / 85% (移动)
- 内边距: space-3 (水平), space-2 (垂直)
- 靠右对齐

#### 3.4.2 Agent 消息

- 背景: Surface
- 文字: Text-Primary
- 圆角: radius-xl (右上、左下、右下圆角), 左上 4px
- 最大宽度: 70% (桌面) / 85% (移动)
- 内边距: space-3 (水平), space-2 (垂直)
- 靠左对齐
- Agent 头像: 28x28px, radius-full, 左侧, 与气泡间距 space-2
- Agent 名称: Caption, Agent 角色色, 气泡上方 space-1

#### 3.4.3 系统消息

- 居中显示
- 背景: transparent
- 文字: Caption, Text-Tertiary
- 上下间距: space-2

### 3.5 头像 (Avatar)

| 尺寸 | 大小 | 用途 |
|------|------|------|
| xs | 24x24px | 列表项内嵌 |
| sm | 32x32px | 导航栏、评论 |
| md | 40x40px | 卡片、聊天 |
| lg | 64x64px | 个人资料 |
| xl | 96x96px | 设置页面 |

- 圆角: radius-full
- 边框: 2px solid Background (嵌套时)
- 加载态: Surface 底色 + shimmer 动画
- 在线指示: 右下角 8px 圆点, Success 色, 2px Background 边框

### 3.6 Badge / 徽章

| 变体 | 背景 | 文字 |
|------|------|------|
| Default | Surface-2 | Text-Secondary |
| Primary | Primary-50 | Primary-600 |
| Success | Success-50 | Success-700 |
| Warning | Warning-50 | Warning-700 |
| Danger | Danger-50 | Danger-700 |

- 字号: Tiny (11px)
- 内边距: 2px 8px
- 圆角: radius-full
- 高度: 20px

### 3.7 Toast / 消息提示

- 位置: 右上角, 距顶 space-4, 距右 space-4
- 宽度: 360px
- 圆角: radius-lg
- 阴影: shadow-lg
- 背景: Background
- 边框: 1px solid Border
- 内边距: space-4
- 图标: 左侧 20x20px, 对应语义色
- 标题: Body, font-weight 600
- 描述: Body-sm, Text-Secondary
- 关闭按钮: 右上角 16x16px Ghost
- 进入动画: 从右侧滑入, duration-normal
- 退出动画: 向右淡出, duration-fast
- 自动关闭: 5 秒

### 3.8 Modal / 弹窗

- 遮罩: rgba(0,0,0,0.4), backdrop-blur: 4px
- 宽度: 480px (sm), 640px (md), 800px (lg)
- 圆角: radius-lg
- 阴影: shadow-xl
- 背景: Background
- 头部: H3 标题, 右侧关闭按钮 (24x24), 下方 1px Border 分割, 内边距 space-5
- 内容: 内边距 space-5
- 底部: 右对齐按钮组, 上方 1px Border 分割, 内边距 space-5, 按钮间距 space-3
- 进入动画: scale(0.95) → scale(1), opacity 0 → 1, duration-normal
- ESC 关闭

### 3.9 表格 (Table)

- 圆角: radius-lg (外层容器)
- 边框: 1px solid Border
- 表头: 背景 Surface, 字号 Caption, 字重 600, 文字 Text-Secondary, 高度 40px, 内边距 space-3
- 表行: 高度 48px, 内边距 space-3, hover 背景 Surface
- 分割线: 1px solid Border
- 排序图标: 表头右侧 16x16px
- 分页: 底部 space-4, 居中

### 3.10 Tabs / 标签页

- 下划线风格
- 标签高度: 40px
- 字号: Body (14px)
- 默认文字: Text-Secondary
- 选中文字: Primary-500, font-weight 600
- 下划线: 2px, Primary-500, 带过渡动画
- hover: Text-Primary
- 间距: 每个 tab 水平内边距 space-4

### 3.11 Sidebar 导航菜单项

```
┌────────────────────────────────────────┐
│ [icon 20px] [space-3] [文字 Body 14px]  │
│ 高度 40px, 内边距 space-2 space-3       │
│ 圆角 radius-sm                          │
└────────────────────────────────────────┘
```

active 状态:
```
┌────────────────────────────────────────┐
│ ┃ [icon 20px] [space-3] [文字 Body]    │
│ ┃ 左侧 3px Primary-500 条              │
│   背景 Primary-100, 文字 Primary-500    │
└────────────────────────────────────────┘
```

---

## 4 图标规范

### 4.1 图标库

使用 Lucide React 图标库 (与 HeroUI 兼容)。

### 4.2 图标尺寸

| 场景 | 大小 | stroke-width |
|------|------|-------------|
| 按钮内 | 16x16px | 2 |
| 菜单项 | 20x20px | 1.5 |
| 页面标题 | 24x24px | 1.5 |
| 空状态 | 48x48px | 1 |
| 落地页 | 64x64px | 1 |

### 4.3 图标颜色

- 默认: `currentColor` (继承文字色)
- 交互图标: Text-Secondary, hover → Text-Primary
- 语义图标: 对应语义色

---

## 5 暗色模式

### 5.1 切换机制

- 支持三种模式: **Light** (亮色) / **Dark** (暗色) / **System** (跟随操作系统)
- **默认值: System** — 首次访问时自动跟随操作系统的外观偏好 (`prefers-color-scheme`)
- System 模式下，当操作系统切换亮暗色时，应用实时跟随切换
- 切换入口: 设置页面 + 侧边栏底部快捷切换
- 切换动画: `transition: background-color 200ms, color 200ms`
- 持久化: 存储在 localStorage `theme` key，值为 `light` | `dark` | `system`
- 未设置或值为 `system` 时，通过 `window.matchMedia('(prefers-color-scheme: dark)')` 检测系统偏好

### 5.2 暗色模式调整

- 所有中性色使用 Dark 列色值
- Primary 色系保持不变
- 阴影降低 50% opacity
- 图片/头像降低 5% 亮度 (`filter: brightness(0.95)`)
- 边框色使用 Dark Border 值
