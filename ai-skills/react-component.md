# Skill: React Component Generator (HeroUI)

> 生成符合 NextAI Agent 设计系统的 React 组件，基于 HeroUI 3 + TailwindCSS 4。

## 触发条件

当用户要求创建新的 React 组件时激活此 Skill。

## 上下文

### 技术栈

- React 19 (函数组件 + Hooks)
- Next.js 15 App Router
- HeroUI 3 (基于 Radix 的组件库)
- TailwindCSS 4
- TypeScript 5.6+ (strict 模式)

### 设计令牌

```
主色: #006FEE (Primary-500)
字体: Inter + Noto Sans SC
代码字体: JetBrains Mono
正文字号: 14px / 20px 行高
基准间距: 4px
卡片圆角: 14px (radius-lg)
```

### 命名约定

| 类型 | 风格 | 示例 |
|------|------|------|
| 组件文件 | kebab-case | `agent-card.tsx` |
| 组件名 | PascalCase | `AgentCard` |
| Props 类型 | PascalCase + Props | `AgentCardProps` |
| Hooks | camelCase + use | `useAgentList` |
| 工具函数 | camelCase | `formatTimestamp` |
| 常量 | UPPER_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |

## 生成规则

### 1. 文件结构

```
components/
  {domain}/
    {component-name}.tsx          # 组件实现
```

非独立模块不创建额外的 index.ts、types.ts、hooks.ts 等文件，除非组件复杂度确实需要拆分。

### 2. 组件模板

```tsx
'use client';

import { /* HeroUI 组件 */ } from '@heroui/react';

type {ComponentName}Props = {
  // 必需属性在前，可选属性在后
  id: string;
  title: string;
  description?: string;
  onAction?: (id: string) => void;
};

export function {ComponentName}({ id, title, description, onAction }: {ComponentName}Props) {
  return (
    <div className="...">
      {/* 实现 */}
    </div>
  );
}
```

### 3. 核心规范

- **Props**: 使用 `type` 而非 `interface`，显式列出所有属性，不使用 `React.FC`
- **导出**: 使用命名导出 `export function`，不使用默认导出
- **状态管理**: 局部状态用 `useState`，跨组件用 Zustand store
- **数据获取**: 使用 TanStack Query (`useQuery` / `useMutation`)
- **样式**: TailwindCSS 类名，不使用内联 style，不使用 CSS Modules
- **暗色模式**: 使用 `dark:` 前缀或 HeroUI 语义颜色令牌（自动适配）
- **交互**: 使用 HeroUI 组件内置交互，不手写 onClick 样式变更
- **国际化**: 所有用户可见文本使用中文（项目默认语言）

### 4. HeroUI 组件使用

优先使用 HeroUI 内置组件：

| 需求 | HeroUI 组件 |
|------|-------------|
| 按钮 | `Button` (variant: solid/bordered/light/flat/faded/shadow/ghost) |
| 输入 | `Input` (variant: flat/bordered/faded/underlined) |
| 卡片 | `Card`, `CardHeader`, `CardBody`, `CardFooter` |
| 弹窗 | `Modal`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter` |
| 表格 | `Table`, `TableHeader`, `TableBody`, `TableColumn`, `TableRow`, `TableCell` |
| 标签页 | `Tabs`, `Tab` |
| 头像 | `Avatar` (size: sm/md/lg) |
| 徽章 | `Badge`, `Chip` |
| 下拉 | `Dropdown`, `DropdownTrigger`, `DropdownMenu`, `DropdownItem` |
| 加载 | `Spinner`, `Skeleton` |
| 提示 | `Tooltip` |

### 5. Agent 角色色

组件涉及 Agent 角色时使用对应色系：

| Agent 角色 | 色值 | 辅助色 |
|-----------|------|--------|
| 需求 Agent | `#9353D3` | `#F2EAFA` |
| 架构 Agent | `#006FEE` | `#E6F1FE` |
| 前端 Agent | `#17C964` | `#E8FAF0` |
| 后端 Agent | `#F5A524` | `#FEFCE8` |
| 测试 Agent | `#F31260` | `#FEE7EF` |
| 运维 Agent | `#71717A` | `#F4F4F5` |
| 审查 Agent | `#0E8AAA` | `#E0F8FF` |
| 协调 Agent | `#11181C` | `#E4E4E7` |

## 示例

**输入**: "创建一个 Agent 卡片组件，显示 Agent 名称、角色、状态和描述"

**输出**:

```tsx
'use client';

import { Card, CardHeader, CardBody, Avatar, Chip } from '@heroui/react';

type AgentRole = 'requirements' | 'architecture' | 'frontend' | 'backend' | 'testing' | 'ops' | 'reviewer' | 'coordinator';

type AgentCardProps = {
  name: string;
  role: AgentRole;
  status: 'active' | 'idle' | 'error';
  description: string;
  avatarUrl?: string;
  onClick?: () => void;
};

const ROLE_CONFIG: Record<AgentRole, { label: string; color: string; bg: string }> = {
  requirements: { label: '需求', color: '#9353D3', bg: '#F2EAFA' },
  architecture: { label: '架构', color: '#006FEE', bg: '#E6F1FE' },
  frontend:     { label: '前端', color: '#17C964', bg: '#E8FAF0' },
  backend:      { label: '后端', color: '#F5A524', bg: '#FEFCE8' },
  testing:      { label: '测试', color: '#F31260', bg: '#FEE7EF' },
  ops:          { label: '运维', color: '#71717A', bg: '#F4F4F5' },
  reviewer:     { label: '审查', color: '#0E8AAA', bg: '#E0F8FF' },
  coordinator:  { label: '协调', color: '#11181C', bg: '#E4E4E7' },
};

const STATUS_MAP: Record<string, { label: string; color: 'success' | 'default' | 'danger' }> = {
  active: { label: '运行中', color: 'success' },
  idle:   { label: '空闲', color: 'default' },
  error:  { label: '异常', color: 'danger' },
};

export function AgentCard({ name, role, status, description, avatarUrl, onClick }: AgentCardProps) {
  const roleConfig = ROLE_CONFIG[role];
  const statusConfig = STATUS_MAP[status];

  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      className="w-full"
    >
      <CardHeader className="flex items-center gap-3">
        <Avatar
          src={avatarUrl}
          name={name.charAt(0)}
          size="md"
          style={{ backgroundColor: roleConfig.bg, color: roleConfig.color }}
        />
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{name}</span>
            <Chip size="sm" variant="flat" style={{ backgroundColor: roleConfig.bg, color: roleConfig.color }}>
              {roleConfig.label}
            </Chip>
          </div>
          <Chip size="sm" variant="dot" color={statusConfig.color} className="mt-1">
            {statusConfig.label}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <p className="text-sm text-default-500">{description}</p>
      </CardBody>
    </Card>
  );
}
```
