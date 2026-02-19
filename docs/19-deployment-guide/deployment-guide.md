# 部署指南

## 1 部署架构

### 1.1 环境划分

| 环境 | 用途 | 部署方式 | 域名 |
|------|------|---------|------|
| Local | 本地开发 | Docker Compose | localhost:13000 |
| Development | 联调测试 | Docker Compose / K8s | dev.nextai-agent.com |
| Staging | 预发布验收 | Kubernetes | staging.nextai-agent.com |
| Production | 正式生产 | Kubernetes (HA) | app.nextai-agent.com |

### 1.2 环境拓扑

```
生产环境部署拓扑:

                    ┌────────────────────────┐
                    │      CloudFlare CDN    │
                    │      WAF + DDoS 防护   │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │    Ingress Controller   │
                    │    (Nginx / Traefik)    │
                    └───────────┬────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
   ┌──────▼──────┐     ┌───────▼──────┐     ┌───────▼──────┐
   │  Web (×2)   │     │ API GW (×3)  │     │  WS GW (×2)  │
   │  Next.js    │     │  Golang      │     │  Node.js     │
   │  SSR/Static │     │  限流/认证    │     │  长连接       │
   └─────────────┘     └───────┬──────┘     └───────┬──────┘
                               │                     │
   ┌─────────────────────────────────────────────────┤
   │           Kubernetes Service Mesh               │
   ├──────────┬──────────┬──────────┬───────────────┤
   │ 用户服务  │ Agent 服务│ 渠道服务  │ 记忆服务      │
   │ (×2)     │ (×3)     │ (×2)     │ (×2)         │
   ├──────────┼──────────┼──────────┼───────────────┤
   │ 计费服务  │ 插件服务  │          │               │
   │ (×2)     │ (×2)     │          │               │
   └──────────┴──────────┴──────────┴───────────────┘
          │                     │                     │
   ┌──────▼─────────────────────▼─────────────────────▼──────┐
   │                    数据存储层 (StatefulSet)               │
   │  PostgreSQL (主从)  Redis (哨兵)  MinIO (纠删)  Milvus   │
   └─────────────────────────────────────────────────────────┘
```

---

## 2 Docker 容器化

### 2.1 镜像构建策略

| 服务 | 基础镜像 | 构建方式 | 产物大小 |
|------|---------|---------|---------|
| Web (Next.js) | node:22-alpine | 多阶段构建 | ~200MB |
| API Gateway | golang:1.23-alpine → scratch | 多阶段构建 | ~20MB |
| Node.js 服务 | node:22-alpine | 多阶段构建 | ~150MB |
| Python 服务 | python:3.12-slim | 多阶段构建 | ~300MB |

### 2.2 Next.js Dockerfile

```dockerfile
# Dockerfile.web
# ---- Stage 1: 依赖安装 ----
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

RUN pnpm install --frozen-lockfile --filter web...

# ---- Stage 2: 构建 ----
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

# ---- Stage 3: 运行 ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### 2.3 Go API Gateway Dockerfile

```dockerfile
# Dockerfile.gateway
# ---- Stage 1: 构建 ----
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates
WORKDIR /src

COPY services/api-gateway/go.mod services/api-gateway/go.sum ./
RUN go mod download

COPY services/api-gateway/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

# ---- Stage 2: 运行 ----
FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server /server

EXPOSE 8080
ENTRYPOINT ["/server"]
```

### 2.4 Python 服务 Dockerfile

```dockerfile
# Dockerfile.memory
# ---- Stage 1: 构建 ----
FROM python:3.12-slim AS builder

WORKDIR /app
RUN pip install --no-cache-dir uv

COPY services/memory-service/pyproject.toml services/memory-service/uv.lock ./
RUN uv sync --frozen --no-dev

COPY services/memory-service/ .

# ---- Stage 2: 运行 ----
FROM python:3.12-slim AS runner

WORKDIR /app
RUN useradd --system --uid 1001 appuser

COPY --from=builder /app /app
ENV PATH="/app/.venv/bin:$PATH"

USER appuser
EXPOSE 8090

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8090"]
```

---

## 3 Docker Compose 部署

### 3.1 开发环境 Compose

```yaml
# docker-compose.dev.yml
name: nextai-agent-dev

services:
  # ---------- 基础设施 ----------
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nextai_agent
      POSTGRES_USER: nextai
      POSTGRES_PASSWORD: ${DB_PASSWORD:-nextai_dev_2024}
    ports:
      - "15432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextai"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD:-redis_dev_2024}
    ports:
      - "16379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-redis_dev_2024}", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    ports:
      - "19000:9000"
      - "19001:9001"
    volumes:
      - minio-data:/data

  milvus:
    image: milvusdb/milvus:v2.4-latest
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_USE_EMBED: "true"
      COMMON_STORAGETYPE: local
    ports:
      - "29530:19530"
      - "19091:9091"
    volumes:
      - milvus-data:/var/lib/milvus
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/healthz"]
      interval: 10s
      timeout: 10s
      retries: 10

  # ---------- 消息队列 ----------
  kafka:
    image: bitnami/kafka:3.7
    environment:
      KAFKA_CFG_NODE_ID: 0
      KAFKA_CFG_PROCESS_ROLES: controller,broker
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 0@kafka:9093
      KAFKA_CFG_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_CFG_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE: "true"
    ports:
      - "19092:9092"
    volumes:
      - kafka-data:/bitnami/kafka

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-nextai}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS:-nextai_dev_2024}
    ports:
      - "15672:5672"
      - "25672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  postgres-data:
  redis-data:
  minio-data:
  milvus-data:
  kafka-data:
  rabbitmq-data:
```

### 3.2 全栈 Compose (Staging)

```yaml
# docker-compose.staging.yml
name: nextai-agent-staging

include:
  - docker-compose.dev.yml  # 继承基础设施

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "13000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api-gateway:8080
      - NEXT_PUBLIC_WS_URL=ws://ws-gateway:8081
    depends_on:
      api-gateway:
        condition: service_healthy

  api-gateway:
    build:
      context: .
      dockerfile: Dockerfile.gateway
    ports:
      - "18080:8080"
    environment:
      - DATABASE_URL=postgresql://nextai:${DB_PASSWORD}@postgres:5432/nextai_agent
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  agent-service:
    build:
      context: .
      dockerfile: Dockerfile.agent
    environment:
      - DATABASE_URL=postgresql://nextai:${DB_PASSWORD}@postgres:5432/nextai_agent
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - KAFKA_BROKERS=kafka:9092
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      kafka:
        condition: service_started

  memory-service:
    build:
      context: .
      dockerfile: Dockerfile.memory
    environment:
      - MILVUS_HOST=milvus
      - MILVUS_PORT=19530
      - DATABASE_URL=postgresql://nextai:${DB_PASSWORD}@postgres:5432/nextai_agent
    depends_on:
      milvus:
        condition: service_healthy
```

---

## 4 Kubernetes 部署

### 4.1 命名空间规划

| 命名空间 | 用途 |
|---------|------|
| `nextai-system` | 核心业务服务 |
| `nextai-data` | 数据库和存储服务 |
| `nextai-mq` | 消息队列服务 |
| `nextai-monitoring` | 监控和日志服务 |
| `ingress-nginx` | Ingress 控制器 |

### 4.2 Deployment 示例

```yaml
# k8s/base/api-gateway/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: nextai-system
  labels:
    app: api-gateway
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: api-gateway
        version: v1
    spec:
      serviceAccountName: api-gateway
      containers:
        - name: api-gateway
          image: registry.nextai-agent.com/api-gateway:latest
          ports:
            - containerPort: 8080
              protocol: TCP
          envFrom:
            - configMapRef:
                name: api-gateway-config
            - secretRef:
                name: api-gateway-secrets
          resources:
            requests:
              cpu: 500m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]
      terminationGracePeriodSeconds: 30
```

### 4.3 Service 配置

```yaml
# k8s/base/api-gateway/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: nextai-system
spec:
  selector:
    app: api-gateway
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
  type: ClusterIP

---
# k8s/base/api-gateway/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway
  namespace: nextai-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 4.4 Ingress 配置

```yaml
# k8s/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nextai-ingress
  namespace: nextai-system
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.nextai-agent.com
        - api.nextai-agent.com
      secretName: nextai-tls
  rules:
    - host: app.nextai-agent.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 3000
    - host: api.nextai-agent.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 8080
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: ws-gateway
                port:
                  number: 8081
```

### 4.5 ConfigMap & Secret

```yaml
# k8s/overlays/production/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-gateway-config
  namespace: nextai-system
data:
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  CORS_ORIGINS: "https://app.nextai-agent.com"
  RATE_LIMIT_RPS: "100"
  RATE_LIMIT_BURST: "200"

---
# k8s/overlays/production/sealed-secret.yaml
# 使用 Sealed Secrets 加密敏感信息
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: api-gateway-secrets
  namespace: nextai-system
spec:
  encryptedData:
    DATABASE_URL: AgBg...encrypted...
    REDIS_URL: AgBg...encrypted...
    JWT_SECRET: AgBg...encrypted...
    OPENROUTER_API_KEY: AgBg...encrypted...
```

---

## 5 CI/CD 流水线

### 5.1 流水线总览

```
CI/CD 流水线:

Push to Branch     PR Created        Merge to main     Tag Release
     │                  │                  │                 │
     ▼                  ▼                  ▼                 ▼
┌─────────┐      ┌───────────┐     ┌────────────┐    ┌────────────┐
│ Lint +  │      │ Full CI   │     │ Build +    │    │ Build +    │
│ TypeChk │      │ Pipeline  │     │ Push Image │    │ Push Image │
└─────────┘      │           │     │ Deploy to  │    │ Deploy to  │
                 │ - Lint    │     │ Staging    │    │ Production │
                 │ - Test    │     └────────────┘    └────────────┘
                 │ - Build   │
                 │ - Preview │
                 └───────────┘
```

### 5.2 GitHub Actions 部署流水线

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: registry.nextai-agent.com
  IMAGE_PREFIX: nextai

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - { name: web, dockerfile: Dockerfile.web }
          - { name: api-gateway, dockerfile: Dockerfile.gateway }
          - { name: agent-service, dockerfile: Dockerfile.agent }
          - { name: memory-service, dockerfile: Dockerfile.memory }
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service.name }}
          tags: |
            type=sha,prefix=
            type=ref,event=tag
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ${{ matrix.service.dockerfile }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubeconfig
        run: echo "${{ secrets.KUBE_CONFIG_STAGING }}" | base64 -d > $HOME/.kube/config

      - name: Deploy to Staging
        run: |
          kubectl set image deployment/web web=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/web:${GITHUB_SHA::7} -n nextai-system
          kubectl set image deployment/api-gateway api-gateway=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:${GITHUB_SHA::7} -n nextai-system
          kubectl rollout status deployment/api-gateway -n nextai-system --timeout=300s

  deploy-production:
    needs: build-and-push
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubeconfig
        run: echo "${{ secrets.KUBE_CONFIG_PRODUCTION }}" | base64 -d > $HOME/.kube/config

      - name: Deploy to Production
        run: |
          TAG=${GITHUB_REF#refs/tags/}
          kubectl set image deployment/web web=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/web:$TAG -n nextai-system
          kubectl set image deployment/api-gateway api-gateway=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:$TAG -n nextai-system
          kubectl rollout status deployment/api-gateway -n nextai-system --timeout=300s
```

---

## 6 环境变量管理

### 6.1 变量分类

| 类别 | 存储方式 | 示例 |
|------|---------|------|
| 公开配置 | ConfigMap / .env | LOG_LEVEL, CORS_ORIGINS |
| 敏感凭证 | Sealed Secret / Vault | DATABASE_URL, API_KEY |
| 构建变量 | GitHub Secrets | REGISTRY_USER, KUBE_CONFIG |
| 前端公开 | `NEXT_PUBLIC_*` | NEXT_PUBLIC_API_URL |

### 6.2 环境变量清单

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|-------|------|
| `DATABASE_URL` | ✅ | — | PostgreSQL 连接串 |
| `REDIS_URL` | ✅ | — | Redis 连接串 |
| `JWT_SECRET` | ✅ | — | JWT 签名密钥 (≥32 位) |
| `JWT_EXPIRES_IN` | ❌ | `7d` | JWT 过期时间 |
| `OPENROUTER_API_KEY` | ✅ | — | OpenRouter API 密钥 |
| `MILVUS_HOST` | ✅ | `localhost` | Milvus 地址 |
| `MILVUS_PORT` | ❌ | `29530` | Milvus 端口 |
| `MINIO_ENDPOINT` | ✅ | — | MinIO 端点 |
| `MINIO_ACCESS_KEY` | ✅ | — | MinIO Access Key |
| `MINIO_SECRET_KEY` | ✅ | — | MinIO Secret Key |
| `KAFKA_BROKERS` | ✅ | — | Kafka Broker 地址 (逗号分隔) |
| `RABBITMQ_URL` | ✅ | — | RabbitMQ 连接串 |
| `SMTP_HOST` | ❌ | — | 邮件服务器地址 |
| `SMTP_PORT` | ❌ | `587` | 邮件服务器端口 |
| `SMTP_USER` | ❌ | — | 邮件账号 |
| `SMTP_PASS` | ❌ | — | 邮件密码 |
| `LOG_LEVEL` | ❌ | `info` | 日志级别 |
| `LOG_FORMAT` | ❌ | `json` | 日志格式 (json / text) |
| `NEXT_PUBLIC_API_URL` | ✅ | — | 前端 API 地址 |
| `NEXT_PUBLIC_WS_URL` | ✅ | — | 前端 WebSocket 地址 |
| `SENTRY_DSN` | ❌ | — | Sentry 错误追踪 DSN |

### 6.3 .env 模板

```bash
# .env.example — 复制为 .env.local 后填写实际值

# ===== 数据库 =====
DATABASE_URL=postgresql://nextai:nextai_dev_2024@localhost:15432/nextai_agent
REDIS_URL=redis://:redis_dev_2024@localhost:16379

# ===== 认证 =====
JWT_SECRET=your-jwt-secret-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# ===== AI 服务 =====
OPENROUTER_API_KEY=sk-or-xxx
# 可选：直接配置各厂商 API Key
# OPENAI_API_KEY=sk-xxx
# ANTHROPIC_API_KEY=sk-ant-xxx

# ===== 存储 =====
MILVUS_HOST=localhost
MILVUS_PORT=29530
MINIO_ENDPOINT=localhost:19000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# ===== 消息队列 =====
KAFKA_BROKERS=localhost:19092
RABBITMQ_URL=amqp://nextai:nextai_dev_2024@localhost:15672

# ===== 前端 =====
NEXT_PUBLIC_API_URL=http://localhost:18080
NEXT_PUBLIC_WS_URL=ws://localhost:18081

# ===== 可选 =====
LOG_LEVEL=debug
# SENTRY_DSN=
# SMTP_HOST=
```

---

## 7 数据库迁移

### 7.1 Drizzle 迁移工作流

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 查看迁移 SQL
pnpm drizzle-kit migrate --dry-run

# 执行迁移
pnpm drizzle-kit migrate

# 回滚 (手动编写回滚 SQL)
pnpm drizzle-kit drop
```

### 7.2 迁移规范

| 规则 | 说明 |
|------|------|
| 向前兼容 | 迁移不应破坏运行中的旧版本服务 |
| 不可逆操作 | 删列/删表必须先标注废弃，下个版本再删除 |
| 数据迁移 | 大表数据迁移使用批量脚本，不在 DDL 中执行 |
| 测试 | 迁移脚本必须在 Staging 验证后才能上 Production |
| 备份 | Production 迁移前必须执行数据库快照 |

### 7.3 部署时迁移

```yaml
# k8s/base/db-migrate-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  namespace: nextai-system
  annotations:
    argocd.argoproj.io/hook: PreSync
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: registry.nextai-agent.com/nextai/db-migrate:latest
          command: ["pnpm", "drizzle-kit", "migrate"]
          envFrom:
            - secretRef:
                name: db-migrate-secrets
      restartPolicy: Never
  backoffLimit: 3
```

---

## 8 SSL/TLS 配置

### 8.1 证书管理

使用 **cert-manager** 自动管理 Let's Encrypt 证书：

```yaml
# k8s/base/cert-manager/cluster-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@nextai-agent.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

### 8.2 安全 Headers

```yaml
# Nginx Ingress 安全头配置
nginx.ingress.kubernetes.io/configuration-snippet: |
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
```

---

## 9 运维操作手册

### 9.1 常用运维命令

```bash
# ===== 部署状态 =====
kubectl get pods -n nextai-system
kubectl get deployments -n nextai-system
kubectl rollout status deployment/api-gateway -n nextai-system

# ===== 日志查看 =====
kubectl logs -f deployment/api-gateway -n nextai-system --tail=100
kubectl logs -f deployment/agent-service -n nextai-system --since=1h

# ===== 扩缩容 =====
kubectl scale deployment/api-gateway --replicas=5 -n nextai-system

# ===== 回滚 =====
kubectl rollout history deployment/api-gateway -n nextai-system
kubectl rollout undo deployment/api-gateway -n nextai-system
kubectl rollout undo deployment/api-gateway --to-revision=3 -n nextai-system

# ===== 进入 Pod =====
kubectl exec -it deploy/api-gateway -n nextai-system -- sh

# ===== 数据库操作 =====
kubectl exec -it statefulset/postgres -n nextai-data -- psql -U nextai -d nextai_agent
```

### 9.2 健康检查端点

| 服务 | 端点 | 说明 |
|------|------|------|
| API Gateway | `GET /health` | 基础健康检查 |
| API Gateway | `GET /health/ready` | 就绪检查 (含 DB/Redis) |
| Web | `GET /api/health` | Next.js 健康检查 |
| Agent Service | `GET /health` | Agent 服务健康 |
| Memory Service | `GET /health` | 记忆服务健康 |

### 9.3 备份策略

| 数据 | 备份方式 | 频率 | 保留期 |
|------|---------|------|-------|
| PostgreSQL | pg_dump + 增量 WAL | 每日全量 + 持续 WAL | 30 天 |
| Redis | RDB + AOF | 每小时 RDB | 7 天 |
| MinIO | 跨区域复制 | 实时 | 持久 |
| Milvus | 快照备份 | 每日 | 14 天 |

### 9.4 告警规则摘要

| 指标 | Warning | Critical |
|------|---------|----------|
| API P99 延迟 | > 1s | > 3s |
| 错误率 (5xx) | > 1% | > 5% |
| CPU 使用率 | > 70% | > 90% |
| 内存使用率 | > 75% | > 90% |
| 磁盘使用率 | > 80% | > 90% |
| Pod 重启次数 | > 3/h | > 10/h |
| 数据库连接池 | > 80% | > 95% |
