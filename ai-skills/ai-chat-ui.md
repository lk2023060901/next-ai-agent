# Skill: AI Chat UI Components (Streaming)

> 生成基于 Vercel AI SDK 的流式聊天 UI 组件，支持 Multi-Agent 对话显示。

## 触发条件

当用户要求创建聊天界面、消息组件、流式响应 UI 时激活此 Skill。

## 上下文

### 技术栈

- Vercel AI SDK 4.x (`ai` / `@ai-sdk/react`)
- React 19 + Next.js 15 App Router
- HeroUI 3 + TailwindCSS 4
- Server-Sent Events (SSE) 流式传输

### 核心 Hook

```tsx
import { useChat } from '@ai-sdk/react';

// useChat 提供:
// - messages: Message[] (对话消息列表)
// - input: string (输入框文本)
// - handleInputChange: (e) => void
// - handleSubmit: (e) => void
// - isLoading: boolean (流式生成中)
// - stop: () => void (停止生成)
// - reload: () => void (重新生成最后一条)
// - append: (message) => void (追加消息)
// - setMessages: (messages) => void (设置消息)
```

### 消息类型

```typescript
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
  // NextAI Agent 扩展字段
  agentRole?: AgentRole;       // Agent 角色标识
  agentName?: string;          // Agent 显示名称
  toolCalls?: ToolCall[];      // 工具调用列表
  thinking?: string;           // 思考过程 (可折叠)
  approval?: ApprovalRequest;  // 需要人工审批
};

type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'completed' | 'failed';
};

type ApprovalRequest = {
  id: string;
  action: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
};
```

## 生成规则

### 1. 聊天面板结构

```
chat-panel.tsx           # 主面板容器
├── session-list.tsx     # 左侧会话列表
├── message-list.tsx     # 消息列表 (虚拟滚动)
│   ├── message-bubble.tsx   # 单条消息气泡
│   ├── tool-call-card.tsx   # 工具调用展示
│   ├── agent-thinking.tsx   # 思考过程折叠
│   └── approval-card.tsx    # 审批卡片
└── chat-input.tsx       # 底部输入框
```

### 2. 消息气泡规范

- **用户消息**: 右对齐，Primary 色背景，白色文字
- **Agent 消息**: 左对齐，Surface 背景，左侧显示 Agent 头像和角色标签
- **系统消息**: 居中，Caption 字号，Text-Tertiary 色
- **流式输出**: 逐字渲染，末尾显示闪烁光标 `▌`
- **Markdown**: 使用 `react-markdown` + `remark-gfm` 渲染 Agent 回复
- **代码块**: JetBrains Mono 字体，带语言标签和复制按钮

### 3. Agent 角色区分

多 Agent 对话中，每条 Agent 消息左侧显示：
- Agent 头像 (圆形，使用角色对应色)
- Agent 名称 + 角色标签 (Chip)
- 相邻同 Agent 消息合并头像

### 4. 工具调用展示

```tsx
// 工具调用卡片状态
// pending:   灰色边框，Spinner 图标
// running:   Primary 边框，动画 Spinner
// completed: Success 边框，✓ 图标，可展开查看结果
// failed:    Danger 边框，✗ 图标，显示错误信息
```

### 5. 输入框规范

- 多行文本框，`Shift+Enter` 换行，`Enter` 发送
- 左侧: 附件按钮 (文件上传)
- 右侧: 发送按钮 (Primary 色) / 停止按钮 (流式生成中显示)
- 上方: 可选 Agent 选择器 (切换对话目标 Agent)
- 最大高度 200px，超出后内部滚动

## 示例

**输入**: "创建聊天消息列表组件，支持流式输出和 Agent 角色标识"

**输出**:

```tsx
'use client';

import { useRef, useEffect } from 'react';
import { Avatar, Chip, ScrollShadow } from '@heroui/react';
import type { Message } from '@/types/chat';
import { MessageBubble } from './message-bubble';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
};

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <ScrollShadow className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const isSameAgent =
            prevMessage?.role === 'assistant' &&
            message.role === 'assistant' &&
            prevMessage.agentName === message.agentName;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              showAvatar={!isSameAgent}
              isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollShadow>
  );
}
```

```tsx
'use client';

import { Avatar, Chip } from '@heroui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types/chat';
import { AGENT_ROLE_CONFIG } from '@/config/agent-roles';
import { ToolCallCard } from './tool-call-card';

type MessageBubbleProps = {
  message: Message;
  showAvatar: boolean;
  isStreaming: boolean;
};

export function MessageBubble({ message, showAvatar, isStreaming }: MessageBubbleProps) {
  if (message.role === 'system') {
    return (
      <div className="text-center">
        <span className="text-xs text-default-400">{message.content}</span>
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  // Agent 消息
  const roleConfig = message.agentRole ? AGENT_ROLE_CONFIG[message.agentRole] : null;

  return (
    <div className="flex gap-3">
      {showAvatar ? (
        <Avatar
          name={message.agentName?.charAt(0) ?? 'A'}
          size="sm"
          className="mt-1 shrink-0"
          style={roleConfig ? { backgroundColor: roleConfig.bg, color: roleConfig.color } : undefined}
        />
      ) : (
        <div className="w-8 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        {showAvatar && message.agentName && (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium">{message.agentName}</span>
            {roleConfig && (
              <Chip size="sm" variant="flat" style={{ backgroundColor: roleConfig.bg, color: roleConfig.color }}>
                {roleConfig.label}
              </Chip>
            )}
          </div>
        )}
        {message.toolCalls?.map((tool) => (
          <ToolCallCard key={tool.id} toolCall={tool} />
        ))}
        <div className="rounded-2xl bg-default-100 px-4 py-2.5 text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
          {isStreaming && <span className="animate-pulse">▌</span>}
        </div>
      </div>
    </div>
  );
}
```

```tsx
'use client';

import { useState, useRef } from 'react';
import { Button, Textarea } from '@heroui/react';
import { Send, Square, Paperclip } from 'lucide-react';

type ChatInputProps = {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
};

export function ChatInput({ input, isLoading, onInputChange, onSubmit, onStop }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) onSubmit();
    }
  }

  return (
    <div className="border-t border-divider px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <Button isIconOnly variant="light" size="sm" aria-label="附件">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={input}
          onValueChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Shift+Enter 换行)"
          minRows={1}
          maxRows={6}
          className="flex-1"
          variant="bordered"
        />
        {isLoading ? (
          <Button isIconOnly color="danger" variant="flat" size="sm" onPress={onStop} aria-label="停止生成">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            isIconOnly
            color="primary"
            size="sm"
            isDisabled={!input.trim()}
            onPress={onSubmit}
            aria-label="发送"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```
