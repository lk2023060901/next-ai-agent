# 数据库设计

## 1 PostgreSQL 数据模型

### 1.1 用户与认证

#### 1.1.1 users 表

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(30) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name  VARCHAR(50),
  avatar_url    VARCHAR(500),
  phone         VARCHAR(20),
  bio           TEXT,
  timezone      VARCHAR(50) DEFAULT 'Asia/Shanghai',
  locale        VARCHAR(10) DEFAULT 'zh-CN',
  email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret  VARCHAR(255),
  status        VARCHAR(20) DEFAULT 'active',  -- active, suspended, deleted
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
```

#### 1.1.2 oauth_accounts 表

```sql
CREATE TABLE oauth_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    VARCHAR(20) NOT NULL,  -- github, google
  provider_id VARCHAR(255) NOT NULL,
  access_token  TEXT,
  refresh_token TEXT,
  expires_at  TIMESTAMPTZ,
  profile     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(provider, provider_id)
);

CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
```

#### 1.1.3 refresh_tokens 表

```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB,
  ip_address  INET,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);
```

#### 1.1.4 api_keys 表

```sql
CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  key_prefix  VARCHAR(10) NOT NULL,
  key_hash    VARCHAR(255) NOT NULL,
  scopes      TEXT[] NOT NULL,
  expires_at  TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apikeys_user ON api_keys(user_id);
CREATE INDEX idx_apikeys_hash ON api_keys(key_hash);
```

### 1.2 组织与工作区

#### 1.2.1 organizations 表

```sql
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL,
  slug        VARCHAR(30) UNIQUE NOT NULL,
  description TEXT,
  avatar_url  VARCHAR(500),
  owner_id    UUID NOT NULL REFERENCES users(id),
  size_range  VARCHAR(20),  -- personal, 2-10, 11-50, 51-200, 200+
  industry    VARCHAR(50),
  plan_id     UUID REFERENCES billing_plans(id),
  status      VARCHAR(20) DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug ON organizations(slug);
CREATE INDEX idx_orgs_owner ON organizations(owner_id);
```

#### 1.2.2 org_members 表

```sql
CREATE TABLE org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL DEFAULT 'ws_member',
  invited_by  UUID REFERENCES users(id),
  joined_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_orgmem_org ON org_members(org_id);
CREATE INDEX idx_orgmem_user ON org_members(user_id);
```

#### 1.2.3 workspaces 表

```sql
CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(50) NOT NULL,
  description TEXT,
  icon        VARCHAR(10),
  icon_url    VARCHAR(500),
  visibility  VARCHAR(20) DEFAULT 'org',  -- org, private
  settings    JSONB DEFAULT '{}',
  status      VARCHAR(20) DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, slug)
);

CREATE INDEX idx_ws_org ON workspaces(org_id);
```

#### 1.2.4 workspace_members 表

```sql
CREATE TABLE workspace_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL DEFAULT 'ws_member',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_wsmem_ws ON workspace_members(workspace_id);
CREATE INDEX idx_wsmem_user ON workspace_members(user_id);
```

### 1.3 Agent 与会话

#### 1.3.1 agents 表

```sql
CREATE TABLE agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(30) NOT NULL,  -- coordinator, requirements, architecture, frontend, backend, testing, review, devops, custom
  description   TEXT,
  avatar_url    VARCHAR(500),
  model_provider VARCHAR(50) NOT NULL DEFAULT 'anthropic',
  model_name    VARCHAR(100) NOT NULL DEFAULT 'claude-opus-4-6',
  temperature   DECIMAL(3,2) DEFAULT 0.70,
  max_tokens    INTEGER DEFAULT 4096,
  thinking_mode VARCHAR(10) DEFAULT 'medium',  -- off, low, medium, high
  system_prompt TEXT,
  tools_config  JSONB DEFAULT '[]',
  advanced_config JSONB DEFAULT '{}',
  is_enabled    BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_ws ON agents(workspace_id);
CREATE INDEX idx_agents_role ON agents(role);
```

#### 1.3.2 sessions 表

```sql
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  title         VARCHAR(200),
  primary_agent_id UUID REFERENCES agents(id),
  channel_type  VARCHAR(30) DEFAULT 'webchat',
  channel_id    UUID REFERENCES channels(id),
  status        VARCHAR(20) DEFAULT 'active',  -- active, archived, deleted
  metadata      JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_ws ON sessions(workspace_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_last ON sessions(last_message_at DESC);
```

#### 1.3.3 messages 表

```sql
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL,  -- user, assistant, system, tool
  agent_id    UUID REFERENCES agents(id),
  content     TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'text',  -- text, markdown, code, image
  attachments JSONB DEFAULT '[]',
  tool_calls  JSONB DEFAULT '[]',
  tool_result JSONB,
  token_count JSONB,  -- { input: N, output: N }
  model_used  VARCHAR(100),
  latency_ms  INTEGER,
  parent_message_id UUID REFERENCES messages(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_msg_session ON messages(session_id, created_at);
CREATE INDEX idx_msg_agent ON messages(agent_id);
```

#### 1.3.4 tasks 表 (Agent 任务)

```sql
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id),
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  assigned_agent_id UUID REFERENCES agents(id),
  status          VARCHAR(20) DEFAULT 'pending',  -- pending, assigned, in_progress, review, completed, failed, blocked
  priority        INTEGER DEFAULT 0,
  progress        INTEGER DEFAULT 0,  -- 0-100
  parent_task_id  UUID REFERENCES tasks(id),
  dependencies    UUID[] DEFAULT '{}',
  artifacts       JSONB DEFAULT '[]',
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_session ON tasks(session_id);
CREATE INDEX idx_tasks_agent ON tasks(assigned_agent_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### 1.4 渠道

#### 1.4.1 channels 表

```sql
CREATE TABLE channels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type          VARCHAR(30) NOT NULL,  -- webchat, slack, discord, telegram, feishu, dingtalk, wecom, whatsapp, signal, msteams, email
  name          VARCHAR(100),
  config        JSONB NOT NULL,  -- 加密存储 Token 等敏感信息
  dm_policy     VARCHAR(20) DEFAULT 'pairing',
  group_policy  VARCHAR(20) DEFAULT 'mention',
  default_agent_id UUID REFERENCES agents(id),
  routing_rules JSONB DEFAULT '[]',
  status        VARCHAR(20) DEFAULT 'disconnected',  -- connected, disconnected, configuring, error
  last_active_at TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_ws ON channels(workspace_id);
CREATE INDEX idx_channels_type ON channels(type);
```

#### 1.4.2 channel_messages 表

```sql
CREATE TABLE channel_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  direction       VARCHAR(10) NOT NULL,  -- inbound, outbound
  external_id     VARCHAR(255),
  sender_id       VARCHAR(255),
  sender_name     VARCHAR(100),
  chat_id         VARCHAR(255),
  chat_type       VARCHAR(20),  -- dm, group, channel
  content         TEXT,
  attachments     JSONB DEFAULT '[]',
  session_id      UUID REFERENCES sessions(id),
  agent_id        UUID REFERENCES agents(id),
  status          VARCHAR(20) DEFAULT 'delivered',  -- delivered, failed, pending
  error_message   TEXT,
  latency_ms      INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chmsg_channel ON channel_messages(channel_id, created_at DESC);
CREATE INDEX idx_chmsg_session ON channel_messages(session_id);
```

### 1.5 知识库

#### 1.5.1 knowledge_bases 表

```sql
CREATE TABLE knowledge_bases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  chunk_strategy  VARCHAR(30) DEFAULT 'auto',
  chunk_size      INTEGER DEFAULT 1024,
  chunk_overlap   INTEGER DEFAULT 128,
  agent_access    UUID[] DEFAULT '{}',
  document_count  INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_ws ON knowledge_bases(workspace_id);
```

#### 1.5.2 documents 表

```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  file_name       VARCHAR(255) NOT NULL,
  file_type       VARCHAR(20) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_url        VARCHAR(500) NOT NULL,  -- MinIO URL
  chunk_count     INTEGER DEFAULT 0,
  indexing_status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, indexed, failed
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_docs_kb ON documents(knowledge_base_id);
CREATE INDEX idx_docs_status ON documents(indexing_status);
```

#### 1.5.3 document_chunks 表

```sql
CREATE TABLE document_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  token_count   INTEGER,
  metadata      JSONB DEFAULT '{}',  -- page, section, etc.
  milvus_id     VARCHAR(100),  -- 对应 Milvus 向量 ID
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_doc ON document_chunks(document_id);
CREATE INDEX idx_chunks_milvus ON document_chunks(milvus_id);
```

### 1.6 插件

#### 1.6.1 plugins 表 (市场)

```sql
CREATE TABLE plugins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  author      VARCHAR(100),
  version     VARCHAR(20),
  type        VARCHAR(20) NOT NULL,
  icon_url    VARCHAR(500),
  readme      TEXT,
  config_schema JSONB,
  permissions TEXT[],
  pricing     VARCHAR(20) DEFAULT 'free',
  install_count INTEGER DEFAULT 0,
  rating      DECIMAL(2,1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  status      VARCHAR(20) DEFAULT 'published',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.6.2 installed_plugins 表

```sql
CREATE TABLE installed_plugins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plugin_id     UUID NOT NULL REFERENCES plugins(id),
  version       VARCHAR(20),
  config        JSONB DEFAULT '{}',
  is_enabled    BOOLEAN DEFAULT TRUE,
  installed_by  UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, plugin_id)
);
```

### 1.7 计费

#### 1.7.1 billing_plans 表

```sql
CREATE TABLE billing_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL,
  slug        VARCHAR(30) UNIQUE NOT NULL,
  category    VARCHAR(20) NOT NULL,  -- personal, enterprise, custom
  tier_order  INTEGER NOT NULL DEFAULT 0,  -- 同类别内排序: 0=Free, 1=Pro, 2=Premium, 0=Team, 1=Business, 2=Enterprise
  price_monthly DECIMAL(10,2),
  price_yearly  DECIMAL(10,2),
  extra_member_price DECIMAL(10,2),  -- 超出成员单价 (¥/人/月), 仅企业方案
  limits      JSONB NOT NULL,  -- { agents, tokens_monthly, knowledge_bases, docs_per_kb, members, storage_gb, api_daily }
  features    JSONB DEFAULT '[]',  -- ["rbac", "audit_log", "sso", "sla_99_5", "multi_region", "ip_whitelist"]
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_category ON billing_plans(category, tier_order);
```

#### 1.7.2 subscriptions 表

```sql
CREATE TABLE subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id     UUID NOT NULL REFERENCES billing_plans(id),
  billing_cycle VARCHAR(10) NOT NULL,  -- monthly, yearly
  status      VARCHAR(20) DEFAULT 'active',  -- active, canceled, past_due, trialing
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  payment_method JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subs_org ON subscriptions(org_id);
```

#### 1.7.3 usage_records 表

```sql
CREATE TABLE usage_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  workspace_id UUID REFERENCES workspaces(id),
  agent_id    UUID REFERENCES agents(id),
  user_id     UUID REFERENCES users(id),
  type        VARCHAR(30) NOT NULL,  -- token_input, token_output, api_call, storage
  amount      BIGINT NOT NULL,
  model       VARCHAR(100),
  provider    VARCHAR(50),
  unit_cost   DECIMAL(10,8),
  metadata    JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_org_time ON usage_records(org_id, recorded_at DESC);
CREATE INDEX idx_usage_ws ON usage_records(workspace_id, recorded_at DESC);

-- 按天聚合分区
CREATE TABLE usage_daily (
  date        DATE NOT NULL,
  org_id      UUID NOT NULL,
  workspace_id UUID,
  agent_id    UUID,
  token_input BIGINT DEFAULT 0,
  token_output BIGINT DEFAULT 0,
  api_calls   INTEGER DEFAULT 0,
  total_cost  DECIMAL(10,4) DEFAULT 0,
  PRIMARY KEY (date, org_id, workspace_id, agent_id)
);
```

### 1.8 审计日志

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details     JSONB DEFAULT '{}',
  ip_address  INET,
  user_agent  VARCHAR(500),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org_time ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

---

## 2 Redis 数据结构

### 2.1 会话缓存

```
session:{sessionId}:state     → Hash { status, agentId, lastMessage }
session:{sessionId}:messages  → List (最近 50 条消息 ID, FIFO)
```

### 2.2 用户在线状态

```
user:{userId}:online       → String "1" (TTL 60s, 心跳续期)
ws:{wsId}:online_users     → Set { userId1, userId2, ... }
```

### 2.3 限流计数

```
rate:{userId}:{endpoint}   → String count (TTL = 窗口时间)
```

### 2.4 Agent 任务队列

```
agent:{agentId}:tasks      → Sorted Set (score=priority, value=taskId)
agent:{agentId}:current    → String taskId
```

### 2.5 Pub/Sub 频道

```
ws:{wsId}:events           → 工作区事件广播
session:{sessionId}:stream → 会话消息流
agent:{agentId}:events     → Agent 事件
```

---

## 3 Milvus 向量集合

### 3.1 knowledge_vectors

```python
collection_schema = CollectionSchema(fields=[
    FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=36, is_primary=True),
    FieldSchema(name="chunk_id", dtype=DataType.VARCHAR, max_length=36),
    FieldSchema(name="document_id", dtype=DataType.VARCHAR, max_length=36),
    FieldSchema(name="kb_id", dtype=DataType.VARCHAR, max_length=36),
    FieldSchema(name="workspace_id", dtype=DataType.VARCHAR, max_length=36),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),  # text-embedding-3-small
    FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=8192),
])

# 索引
index_params = {
    "metric_type": "COSINE",
    "index_type": "HNSW",
    "params": {"M": 16, "efConstruction": 256}
}
```

### 3.2 memory_vectors

```python
collection_schema = CollectionSchema(fields=[
    FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=36, is_primary=True),
    FieldSchema(name="workspace_id", dtype=DataType.VARCHAR, max_length=36),
    FieldSchema(name="agent_id", dtype=DataType.VARCHAR, max_length=36),
    FieldSchema(name="session_id", dtype=DataType.VARCHAR, max_length=36),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
    FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=4096),
    FieldSchema(name="memory_type", dtype=DataType.VARCHAR, max_length=20),  # preference, context, fact
    FieldSchema(name="created_at", dtype=DataType.INT64),
])
```

---

## 4 MinIO 存储结构

```
nextai-agent/
├── avatars/
│   ├── users/{userId}/avatar-{size}.webp      (32/64/128px)
│   └── orgs/{orgId}/avatar-{size}.webp
├── attachments/
│   └── {wsId}/{sessionId}/{messageId}/{filename}
├── knowledge/
│   └── {wsId}/{kbId}/{docId}/{filename}
├── plugins/
│   └── {pluginId}/icon.png
└── exports/
    └── {orgId}/{exportId}.csv
```

Bucket 策略:
- `avatars`: 公开读
- `attachments`: 需签名 URL (有效期 1 小时)
- `knowledge`: 需签名 URL
- `plugins`: 公开读
- `exports`: 需签名 URL (有效期 24 小时)
