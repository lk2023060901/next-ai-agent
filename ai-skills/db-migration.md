# Skill: Database Migration Writing (Drizzle)

> 生成 Drizzle ORM 迁移脚本，安全地变更数据库 Schema。

## 触发条件

当用户要求修改已有数据表结构、添加字段、修改索引、数据迁移时激活此 Skill。

## 上下文

### 技术栈

- Drizzle ORM + drizzle-kit
- PostgreSQL 16
- TypeScript 5.6+

### 迁移目录

```
packages/database/
├── src/
│   └── schema/          # Drizzle Schema 文件
├── drizzle/
│   └── migrations/      # 生成的 SQL 迁移文件
│       ├── 0000_initial.sql
│       ├── 0001_add_agent_tools.sql
│       └── meta/        # 迁移元数据
├── drizzle.config.ts    # drizzle-kit 配置
└── package.json
```

### drizzle-kit 配置

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/*.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## 生成规则

### 1. 迁移命令流程

```bash
# 1. 修改 src/schema/*.ts 中的 Drizzle Schema
# 2. 生成迁移 SQL
pnpm drizzle-kit generate

# 3. 检查生成的 SQL 是否正确
# 4. 应用迁移
pnpm drizzle-kit migrate

# 5. (可选) 直接推送到数据库 (开发环境)
pnpm drizzle-kit push
```

### 2. 安全迁移原则

| 操作 | 安全级别 | 注意事项 |
|------|---------|---------|
| 添加可空字段 | 安全 | 无需默认值 |
| 添加带默认值的字段 | 安全 | 小表可直接加 NOT NULL |
| 大表添加 NOT NULL 字段 | 需分步 | 先加可空 → 回填 → 改 NOT NULL |
| 删除字段 | 危险 | 先确认无代码引用 |
| 重命名字段 | 危险 | 用新增+迁移+删除替代直接 RENAME |
| 修改字段类型 | 危险 | 使用 USING 子句或新增字段 |
| 添加索引 | 安全 | 大表使用 CONCURRENTLY |
| 删除索引 | 安全 | 确认无性能依赖 |
| 删除表 | 危险 | 确认无外键引用 |

### 3. 迁移 SQL 模板

#### 添加字段

```sql
-- 0002_add_agent_max_tokens.sql
ALTER TABLE agents ADD COLUMN max_tokens INTEGER DEFAULT 4096;
ALTER TABLE agents ADD COLUMN top_p REAL DEFAULT 1.0;
```

#### 添加索引 (大表)

```sql
-- 0003_add_messages_index.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_session_created
  ON messages(session_id, created_at DESC);
```

#### 分步添加 NOT NULL 字段 (大表)

```sql
-- 0004_add_workspace_slug_step1.sql
-- Step 1: 添加可空字段
ALTER TABLE workspaces ADD COLUMN slug VARCHAR(50);

-- Step 2: 回填数据 (在应用层或单独脚本执行)
-- UPDATE workspaces SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;

-- 0005_add_workspace_slug_step2.sql
-- Step 3: 确认全部回填后，设置 NOT NULL
ALTER TABLE workspaces ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX idx_workspaces_slug ON workspaces(org_id, slug);
```

#### 数据迁移

```sql
-- 0006_migrate_agent_config.sql
-- 将 agents 表的 JSON config 字段拆分到独立表

-- Step 1: 创建新表
CREATE TABLE agent_parameters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  max_tokens  INTEGER DEFAULT 4096,
  top_p       REAL DEFAULT 1.0,
  temperature REAL DEFAULT 0.7,
  stop_sequences TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: 迁移数据
INSERT INTO agent_parameters (agent_id, max_tokens, top_p, temperature)
SELECT
  id,
  COALESCE((config->>'maxTokens')::INTEGER, 4096),
  COALESCE((config->>'topP')::REAL, 1.0),
  COALESCE(temperature, 0.7)
FROM agents;

-- Step 3: 索引
CREATE INDEX idx_agent_parameters_agent ON agent_parameters(agent_id);
```

### 4. Drizzle Schema 变更

当修改 Schema 文件时，遵循以下模式：

```typescript
// 添加新字段
export const agents = pgTable('agents', {
  // ... 已有字段
  maxTokens: integer('max_tokens').default(4096),    // 新增
  topP: real('top_p').default(1.0),                   // 新增
});

// 添加新关联
export const agentsRelations = relations(agents, ({ one, many }) => ({
  workspace: one(workspaces, { /* ... */ }),
  tools: many(agentTools),
  parameters: one(agentParameters),  // 新增
}));
```

### 5. 回滚策略

每个迁移文件应有对应的回滚 SQL（虽然 Drizzle 不自动管理回滚）：

```sql
-- 0002_add_agent_max_tokens.sql
-- UP
ALTER TABLE agents ADD COLUMN max_tokens INTEGER DEFAULT 4096;

-- DOWN (注释保留，手动回滚时使用)
-- ALTER TABLE agents DROP COLUMN max_tokens;
```

### 6. 迁移检查清单

生成迁移后确认：

- [ ] SQL 语法正确，可在 PostgreSQL 16 执行
- [ ] 大表操作使用 `CONCURRENTLY` (索引) 或分步执行 (NOT NULL)
- [ ] 新索引不会与已有索引冲突
- [ ] 外键 `ON DELETE` 行为正确 (CASCADE / SET NULL / RESTRICT)
- [ ] 默认值合理，不影响已有数据
- [ ] 相关 Drizzle Schema 文件已同步更新
- [ ] 相关 TypeScript 类型已更新

## 示例

**输入**: "agents 表需要添加 'archived' 状态和归档时间字段"

**输出**:

```sql
-- drizzle/migrations/0007_add_agent_archived.sql
ALTER TABLE agents ADD COLUMN archived_at TIMESTAMPTZ;
CREATE INDEX idx_agents_archived ON agents(archived_at) WHERE archived_at IS NOT NULL;

-- 更新 CHECK 约束 (如果有的话)
-- status 字段已是 VARCHAR，无需修改，值由应用层控制
```

```typescript
// 更新 Schema
export const agents = pgTable('agents', {
  // ...已有字段
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (table) => [
  // ...已有索引
  index('idx_agents_archived').on(table.archivedAt),
]);
```
