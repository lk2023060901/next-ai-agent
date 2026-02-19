# Skill: Database Schema & Drizzle Schema Generator

> 生成 PostgreSQL 表设计和对应的 Drizzle ORM Schema 代码。

## 触发条件

当用户要求创建新数据表、设计数据模型、生成 Drizzle Schema 时激活此 Skill。

## 上下文

### 技术栈

- PostgreSQL 16
- Drizzle ORM (TypeScript ORM)
- UUID v7 (时间排序主键)
- TypeScript 5.6+

### 数据库规范

| 项目 | 规范 |
|------|------|
| 表名 | snake_case 复数: `users`, `agent_configs` |
| 字段名 | snake_case: `created_at`, `display_name` |
| 主键 | UUID v7: `gen_random_uuid()` |
| 时间 | TIMESTAMPTZ，默认 `NOW()` |
| 软删除 | 使用 `status` 字段而非 `deleted_at` |
| 枚举 | VARCHAR + CHECK 约束，不使用 PostgreSQL ENUM |
| JSON | 使用 JSONB 类型 |
| 索引 | 查询频率高的字段必建索引 |

### 已有核心表

```
users, oauth_accounts, refresh_tokens, api_keys,
organizations, org_members,
workspaces, workspace_members,
agents, agent_configs, agent_tools,
sessions, messages, message_attachments,
channels, channel_configs,
plugins, plugin_installations,
knowledge_bases, documents, document_chunks,
memories, memory_embeddings,
subscriptions, usage_records, invoices,
audit_logs, system_settings
```

## 生成规则

### 1. SQL 建表模板

```sql
CREATE TABLE {table_name} (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 业务字段
  {field_name}  {TYPE} {CONSTRAINTS},
  -- 关联字段
  {fk_field}    UUID NOT NULL REFERENCES {parent_table}(id) ON DELETE CASCADE,
  -- 状态字段
  status        VARCHAR(20) DEFAULT 'active',
  -- 时间戳
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_{table}_{field} ON {table_name}({field_name});
-- 复合唯一约束 (如需要)
CREATE UNIQUE INDEX idx_{table}_{f1}_{f2} ON {table_name}({f1}, {f2});
```

### 2. Drizzle Schema 模板

```typescript
// packages/database/src/schema/{table-name}.ts
import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt'),
  model: varchar('model', { length: 50 }).notNull(),
  temperature: real('temperature').default(0.7),
  config: jsonb('config').$type<AgentConfigJson>(),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_agents_workspace').on(table.workspaceId),
  index('idx_agents_role').on(table.role),
  uniqueIndex('idx_agents_ws_name').on(table.workspaceId, table.name),
]);

// 关联定义
export const agentsRelations = relations(agents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [agents.workspaceId],
    references: [workspaces.id],
  }),
  tools: many(agentTools),
  sessions: many(sessions),
}));

// JSONB 字段类型
type AgentConfigJson = {
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
};
```

### 3. 类型推导

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { agents } from './schema/agents';

// 查询结果类型
export type Agent = InferSelectModel<typeof agents>;

// 插入参数类型
export type NewAgent = InferInsertModel<typeof agents>;
```

### 4. 常用字段模式

```typescript
// 时间戳字段 (每个表都应包含)
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
};

// 软删除状态
const statusField = {
  status: varchar('status', { length: 20 }).default('active'),
  // 可选值: 'active' | 'inactive' | 'suspended' | 'deleted'
};

// 多租户字段
const tenantFields = {
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
};
```

### 5. 索引策略

| 场景 | 索引类型 | 示例 |
|------|---------|------|
| 外键查询 | 普通索引 | `idx_agents_workspace` |
| 唯一约束 | 唯一索引 | `idx_users_email` |
| 状态筛选 | 普通索引 | `idx_agents_status` |
| 时间排序 | 降序索引 | `idx_sessions_created DESC` |
| 全文搜索 | GIN 索引 | `idx_messages_content_gin` |
| 复合查询 | 复合索引 | `idx_messages_session_created` |

## 示例

**输入**: "设计插件评价表，用户可以对已安装的插件打分和评论"

**输出**:

```sql
CREATE TABLE plugin_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id     UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title         VARCHAR(100),
  content       TEXT,
  status        VARCHAR(20) DEFAULT 'published',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plugin_id, user_id)
);

CREATE INDEX idx_plugin_reviews_plugin ON plugin_reviews(plugin_id);
CREATE INDEX idx_plugin_reviews_user ON plugin_reviews(user_id);
CREATE INDEX idx_plugin_reviews_rating ON plugin_reviews(plugin_id, rating);
```

```typescript
export const pluginReviews = pgTable('plugin_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  pluginId: uuid('plugin_id').notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: smallint('rating').notNull(),
  title: varchar('title', { length: 100 }),
  content: text('content'),
  status: varchar('status', { length: 20 }).default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_plugin_reviews_plugin').on(table.pluginId),
  index('idx_plugin_reviews_user').on(table.userId),
  uniqueIndex('idx_plugin_reviews_unique').on(table.pluginId, table.userId),
]);
```
