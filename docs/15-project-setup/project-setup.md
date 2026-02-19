# 项目搭建与开发环境

## 1 环境要求

### 1.1 系统要求

| 系统 | 最低版本 | 说明 |
|------|---------|------|
| macOS | 13 (Ventura)+ | 推荐开发环境，原生支持 ARM64 |
| Linux | Ubuntu 22.04+ / Fedora 38+ | 服务端推荐环境 |
| Windows | WSL2 (Ubuntu 22.04) | 必须使用 WSL2，不支持原生 Windows |

**硬件建议**:

| 配置 | 最低 | 推荐 |
|------|------|------|
| CPU | 4 核 | 8 核+ |
| 内存 | 16 GB | 32 GB (Milvus 需要较多内存) |
| 磁盘 | 50 GB 可用 | 100 GB SSD |

### 1.2 必备工具版本

| 工具 | 最低版本 | 推荐版本 | 安装方式 |
|------|---------|---------|---------|
| Node.js | 22.0.0 | 22 LTS | fnm / nvm (见 5.5) |
| pnpm | 9.0.0 | 9.15+ | corepack enable |
| Go | 1.22.0 | 1.23+ | `brew install go` / 官网下载 |
| Python | 3.12.0 | 3.12+ | pyenv / 系统包管理 |
| Docker | 25.0.0 | 最新 | Docker Desktop / colima |
| Docker Compose | v2.24.0 | 最新 | Docker Desktop 自带 |
| Git | 2.40.0 | 最新 | 系统自带 / brew |
| Make | 3.81+ | 最新 | 系统自带 |

**版本验证脚本**:

```bash
# 一键检查所有工具版本
node -v && pnpm -v && go version && python3 --version && docker --version && docker compose version && git --version
```

### 1.3 推荐 IDE 和插件

#### 1.3.1 VS Code (推荐)

**必装扩展**:

| 扩展 | 用途 |
|------|------|
| ESLint | TypeScript/JavaScript 代码检查 |
| Prettier | 代码格式化 |
| Tailwind CSS IntelliSense | TailwindCSS 类名提示 |
| TypeScript Importer | 自动导入 |
| Go | Go 语言支持 |
| Python | Python 语言支持 |
| Prisma | 数据库 Schema 高亮 |
| Docker | Docker 文件支持 |
| GitLens | Git 增强 |
| Error Lens | 内联错误提示 |

**推荐配置** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"]
  ],
  "[go]": {
    "editor.defaultFormatter": "golang.go"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

#### 1.3.2 JetBrains

| IDE | 用途 |
|-----|------|
| WebStorm | 前端 + Node.js 服务开发 |
| GoLand | API Gateway + 计费服务 |
| PyCharm | 记忆服务 + Agent Python 模块 |

---

## 2 快速开始

### 2.1 克隆项目

```bash
git clone git@github.com:nextai/next-ai-agent.git
cd next-ai-agent
```

### 2.2 安装依赖

```bash
# 启用 corepack (管理 pnpm 版本)
corepack enable

# 安装 Node.js 依赖 (所有 workspace)
pnpm install

# 安装 Go 依赖
cd services/api-gateway && go mod download && cd ../..
cd services/billing-service && go mod download && cd ../..

# 安装 Python 依赖
cd services/memory-service && pip install -r requirements.txt && cd ../..
cd services/agent-service/python && pip install -r requirements.txt && cd ../../..
```

**一键安装** (推荐):

```bash
make install
```

### 2.3 环境变量配置

```bash
# 从模板创建本地环境变量文件
cp .env.example .env.local
```

**环境变量分类说明**:

| 分类 | 变量 | 默认值 | 说明 |
|------|------|--------|------|
| **数据库** | `DATABASE_URL` | `postgresql://nextai:nextai_dev@localhost:15432/nextai_dev` | PostgreSQL 连接串 |
| **Redis** | `REDIS_URL` | `redis://localhost:16379` | Redis 连接地址 |
| **MinIO** | `MINIO_ENDPOINT` | `localhost:19000` | MinIO API 端点 |
| | `MINIO_ACCESS_KEY` | `minioadmin` | MinIO 访问密钥 |
| | `MINIO_SECRET_KEY` | `minioadmin` | MinIO 密钥 |
| **Milvus** | `MILVUS_HOST` | `localhost` | Milvus 地址 |
| | `MILVUS_PORT` | `29530` | Milvus 端口 |
| **Kafka** | `KAFKA_BROKERS` | `localhost:19092` | Kafka Broker 地址 |
| **RabbitMQ** | `RABBITMQ_URL` | `amqp://guest:guest@localhost:15672` | RabbitMQ 连接串 |
| **AI Provider** | `OPENROUTER_API_KEY` | (需填写) | OpenRouter API Key |
| | `ANTHROPIC_API_KEY` | (需填写) | Anthropic API Key (可选) |
| **JWT** | `JWT_SECRET` | `dev-secret-change-in-production` | JWT 签名密钥 |
| | `JWT_EXPIRES_IN` | `1h` | Access Token 有效期 |
| **OAuth** | `GITHUB_CLIENT_ID` | (需填写) | GitHub OAuth App ID |
| | `GITHUB_CLIENT_SECRET` | (需填写) | GitHub OAuth Secret |
| | `GOOGLE_CLIENT_ID` | (可选) | Google OAuth Client ID |
| **邮件** | `SMTP_HOST` | `localhost` | SMTP 服务器 (开发用 Mailpit) |
| | `SMTP_PORT` | `11025` | SMTP 端口 |
| **通用** | `NODE_ENV` | `development` | 运行环境 |
| | `LOG_LEVEL` | `debug` | 日志级别 |
| | `APP_URL` | `http://localhost:3000` | 前端地址 |
| | `API_URL` | `http://localhost:8080` | API 地址 |

### 2.4 基础设施启动

```bash
# 启动所有基础设施 (PostgreSQL, Redis, MinIO, Milvus, Kafka, RabbitMQ, Mailpit)
docker compose -f docker-compose.dev.yml up -d

# 等待所有服务健康
docker compose -f docker-compose.dev.yml ps

# 仅启动核心服务 (不含 Milvus, 节省资源)
docker compose -f docker-compose.dev.yml up -d postgres redis minio kafka rabbitmq mailpit
```

**管理界面访问**:

| 服务 | 地址 | 用户名/密码 |
|------|------|-----------|
| MinIO Console | http://localhost:19001 | minioadmin / minioadmin |
| Kafka UI | http://localhost:18090 | 无需认证 |
| RabbitMQ Management | http://localhost:25672 | guest / guest |
| Milvus Attu | http://localhost:13001 | 无需认证 |
| Mailpit | http://localhost:18025 | 无需认证 |

### 2.5 数据库初始化

```bash
# 执行数据库迁移
pnpm db:migrate

# 填充种子数据 (开发用默认数据)
pnpm db:seed

# 重置数据库 (⚠️ 清空所有数据)
pnpm db:reset
```

### 2.6 启动开发服务器

| 命令 | 服务 | 端口 | 说明 |
|------|------|------|------|
| `pnpm dev:web` | Web 前端 (Next.js) | 3000 | 热更新 |
| `pnpm dev:gateway` | API Gateway (Go) | 8080 | Air 热重载 |
| `pnpm dev:user` | 用户服务 | 8001 | tsx watch |
| `pnpm dev:agent` | Agent 服务 | 8002 | tsx watch + Python |
| `pnpm dev:channel` | 渠道服务 | 8003 | tsx watch |
| `pnpm dev:memory` | 记忆服务 (Python) | 8004 | uvicorn --reload |
| `pnpm dev:billing` | 计费服务 (Go) | 8005 | Air 热重载 |
| `pnpm dev:plugin` | 插件服务 | 8006 | tsx watch |
| `pnpm dev:ws` | WebSocket 网关 | 8081 | tsx watch |
| **`make dev`** | **全部服务** | **全部** | **一键启动** |

**一键启动全部**:

```bash
# 启动基础设施 + 所有业务服务
make dev
```

**启动顺序依赖图**:

```
docker-compose.dev.yml (基础设施)
        │
        ├── pnpm db:migrate (数据库迁移)
        │
        ├─→ api-gateway ──→ 所有业务服务就绪后对外服务
        │
        ├─→ user-service
        ├─→ agent-service (TS + Python)
        ├─→ channel-service
        ├─→ memory-service
        ├─→ billing-service
        ├─→ plugin-service
        │
        ├─→ ws-gateway
        │
        └─→ web (Next.js) ──→ 依赖 api-gateway + ws-gateway
```

---

## 3 Monorepo 结构

### 3.1 包管理器

项目采用 **pnpm workspace** 管理 Monorepo:

| 特性 | 说明 |
|------|------|
| 内容寻址存储 | 依赖去重，节省磁盘空间 |
| 严格模式 | 防止幽灵依赖 (phantom dependencies) |
| Workspace 协议 | 包间通过 `workspace:*` 相互引用 |
| 并行执行 | `pnpm -r` 递归执行命令，支持拓扑排序 |

### 3.2 工作区配置

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
```

### 3.3 包依赖关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        应用层 (Apps)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   web    │  │ desktop  │  │api-gateway│  │ws-gateway │       │
│  │(Next.js) │  │(Electron)│  │  (Go)     │  │ (Node.js) │       │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └─────┬─────┘       │
├───────┼──────────────┼────────────────────────────┼──────────────┤
│       │         服务层 (Services)                   │              │
│  ┌────┴──────┐ ┌──────────┐ ┌───────────┐ ┌──────┴─────┐       │
│  │user-svc   │ │agent-svc │ │channel-svc│ │plugin-svc  │       │
│  │  (TS)     │ │(TS+Py)   │ │  (TS)     │ │  (TS)      │       │
│  └────┬──────┘ └────┬─────┘ └─────┬─────┘ └──────┬─────┘       │
│       │      ┌──────┴──────┐      │               │              │
│       │      │memory-svc   │      │  ┌────────────┘              │
│       │      │ (Python)    │      │  │ billing-svc (Go)          │
├───────┼──────┼─────────────┼──────┼──┼───────────────────────────┤
│       │   共享包层 (Packages)      │  │                           │
│  ┌────┴──────┴─────────────┴──────┴──┴──────┐                    │
│  │ shared-types │ shared-utils │ ui │ config │                    │
│  │ database     │ logger       │              │                    │
│  └──────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4 Docker Compose 开发环境

### 4.1 核心服务配置

```yaml
# docker-compose.dev.yml (简化版)
name: nextai-dev

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: nextai
      POSTGRES_PASSWORD: nextai_dev
      POSTGRES_DB: nextai_dev
    ports: ["15432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextai"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports: ["16379:6379"]
    volumes: [redis_data:/data]

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["19000:9000", "19001:9001"]
    volumes: [minio_data:/data]

  milvus:
    image: milvusdb/milvus:v2.4-latest
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    ports: ["29530:19530"]
    depends_on: [etcd, minio]

  etcd:
    image: quay.io/coreos/etcd:v3.5.11
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd

  kafka:
    image: bitnami/kafka:3.7
    environment:
      KAFKA_CFG_NODE_ID: 0
      KAFKA_CFG_PROCESS_ROLES: controller,broker
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 0@kafka:9093
      KAFKA_CFG_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094
      KAFKA_CFG_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,EXTERNAL://localhost:19092
      KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: CONTROLLER
    ports: ["19092:9094"]

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    ports: ["15672:5672", "25672:15672"]

  mailpit:
    image: axllent/mailpit:latest
    ports: ["11025:1025", "18025:8025"]

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 4.2 端口映射速查

| 主机端口 | 服务 | 协议 | 说明 |
|---------|------|------|------|
| 15432 | PostgreSQL | TCP | 数据库 |
| 16379 | Redis | TCP | 缓存 |
| 19000 | MinIO API | HTTP | S3 兼容 |
| 19001 | MinIO Console | HTTP | 管理界面 |
| 29530 | Milvus | gRPC | 向量数据库 |
| 19092 | Kafka | TCP | 消息队列 |
| 15672 | RabbitMQ | AMQP | 消息队列 |
| 25672 | RabbitMQ UI | HTTP | 管理界面 |
| 11025 | Mailpit SMTP | SMTP | 邮件测试 |
| 18025 | Mailpit UI | HTTP | 邮件查看 |

### 4.3 常用命令速查

```bash
docker compose -f docker-compose.dev.yml up -d          # 启动全部
docker compose -f docker-compose.dev.yml down            # 停止全部
docker compose -f docker-compose.dev.yml ps              # 查看状态
docker compose -f docker-compose.dev.yml logs -f kafka   # 查看日志
docker compose -f docker-compose.dev.yml down -v         # 停止并清除数据 (⚠️)
```

---

## 5 常见问题 (FAQ)

### 5.1 端口冲突解决

```bash
# 查看占用端口的进程
lsof -i :15432         # macOS / Linux

# 停止本地 PostgreSQL
brew services stop postgresql   # macOS
sudo systemctl stop postgresql  # Linux
```

### 5.2 数据库连接失败

```bash
# 1. 确认容器状态
docker compose -f docker-compose.dev.yml ps postgres

# 2. 手动连接测试
docker compose -f docker-compose.dev.yml exec postgres psql -U nextai -d nextai_dev -c "SELECT 1"

# 3. 检查 DATABASE_URL 格式
echo $DATABASE_URL
# 应为: postgresql://nextai:nextai_dev@localhost:15432/nextai_dev
```

### 5.3 MinIO 权限问题

```bash
# 重新初始化 Bucket
docker compose -f docker-compose.dev.yml exec minio mc alias set local http://localhost:19000 minioadmin minioadmin
docker compose -f docker-compose.dev.yml exec minio mc mb local/avatars --ignore-existing
docker compose -f docker-compose.dev.yml exec minio mc anonymous set download local/avatars
```

### 5.4 Milvus 启动缓慢

Milvus Standalone 首次启动约 60-120 秒，属正常现象。需至少 4 GB 可用内存。

如果不需要向量检索，可暂时跳过:

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis minio kafka rabbitmq mailpit
```

### 5.5 Node.js 版本管理

推荐使用 **fnm** (Rust 编写，速度快):

```bash
# 安装 fnm
brew install fnm   # macOS
# 或: curl -fsSL https://fnm.vercel.app/install | bash

# 配置 shell (.zshrc)
eval "$(fnm env --use-on-cd)"

# 安装并使用 Node.js 22
fnm install 22
fnm use 22
fnm default 22

# 启用 corepack (管理 pnpm)
corepack enable
```

项目根目录包含 `.node-version` 和 `.nvmrc` 文件，fnm/nvm 会自动切换版本。

---

> **关联文档**: [00-产品概述](../00-overview/product-overview.md) | [13-基础设施](../13-infrastructure/infrastructure.md) | [14-前端架构](../14-frontend/frontend-architecture.md) | [20-目录结构](../20-directory-structure/directory-structure.md)
