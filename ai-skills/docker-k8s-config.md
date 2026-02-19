# Skill: Docker & Kubernetes Configuration Generator

> 生成 Dockerfile、Docker Compose、Kubernetes Manifest 配置文件。

## 触发条件

当用户要求创建容器化配置、K8s 部署文件、Docker Compose 文件时激活此 Skill。

## 上下文

### 服务清单

| 服务 | 语言 | 端口 | 基础镜像 |
|------|------|------|---------|
| web | Node.js | 3000 | node:22-alpine |
| api-gateway | Go | 8080 | golang:1.23-alpine → scratch |
| agent-service | Node.js | 3001 | node:22-alpine |
| user-service | Node.js | 3002 | node:22-alpine |
| channel-service | Node.js | 3003 | node:22-alpine |
| billing-service | Go | 3004 | golang:1.23-alpine → scratch |
| memory-service | Python | 8001 | python:3.12-slim |
| plugin-service | Node.js | 3005 | node:22-alpine |
| ws-gateway | Node.js | 3006 | node:22-alpine |

### 基础设施

| 组件 | 镜像 | 端口 |
|------|------|------|
| PostgreSQL | postgres:16-alpine | 5432 |
| Redis | redis:7-alpine | 6379 |
| Milvus | milvusdb/milvus:v2.4 | 19530 |
| MinIO | minio/minio | 9000/9001 |
| Kafka | confluentinc/cp-kafka | 9092 |
| RabbitMQ | rabbitmq:3-management-alpine | 5672/15672 |

## 生成规则

### 1. Dockerfile 模板 — Node.js (多阶段)

```dockerfile
# docker/Dockerfile.{service}
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/{service}/package.json services/{service}/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/logger/package.json packages/logger/
RUN pnpm install --frozen-lockfile --filter @nextai/{service}...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/{service}/node_modules ./services/{service}/node_modules
COPY --from=deps /app/packages/ ./packages/
COPY services/{service}/ services/{service}/
COPY tsconfig.base.json ./
RUN pnpm --filter @nextai/{service} build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system app && adduser --system --ingroup app app

COPY --from=build --chown=app:app /app/services/{service}/dist ./dist
COPY --from=build --chown=app:app /app/services/{service}/node_modules ./node_modules
COPY --from=build --chown=app:app /app/services/{service}/package.json ./

USER app
EXPOSE {port}
CMD ["node", "dist/index.js"]
```

### 2. Dockerfile 模板 — Go (多阶段)

```dockerfile
# docker/Dockerfile.gateway
FROM golang:1.23-alpine AS build
WORKDIR /app
COPY services/api-gateway/go.mod services/api-gateway/go.sum ./
RUN go mod download
COPY services/api-gateway/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

FROM scratch
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```

### 3. Dockerfile 模板 — Python

```dockerfile
# docker/Dockerfile.memory
FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY services/memory-service/pyproject.toml ./
RUN pip install --no-cache-dir -e ".[prod]"

COPY services/memory-service/app/ app/

RUN adduser --system --no-create-home app
USER app

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### 4. Docker Compose (开发环境)

```yaml
# docker/docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["15432:5432"]
    environment:
      POSTGRES_DB: nextai
      POSTGRES_USER: nextai
      POSTGRES_PASSWORD: nextai_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ../scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextai"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["16379:6379"]
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5

  milvus:
    image: milvusdb/milvus:v2.4-latest
    ports: ["29530:19530", "19091:9091"]
    environment:
      ETCD_AUTO_COMPACTION_RETENTION: "1"
    volumes:
      - milvusdata:/var/lib/milvus

  minio:
    image: minio/minio
    ports: ["19000:9000", "19001:9001"]
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - miniodata:/data

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports: ["19092:9092"]
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:19092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      CLUSTER_ID: nextai-dev-cluster
      KAFKA_LOG_RETENTION_HOURS: 24

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports: ["15672:5672", "25672:15672"]
    environment:
      RABBITMQ_DEFAULT_USER: nextai
      RABBITMQ_DEFAULT_PASS: nextai_dev

volumes:
  pgdata:
  milvusdata:
  miniodata:
```

### 5. Kubernetes Manifest 模板

```yaml
# k8s/base/{service}/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service}
  labels:
    app: {service}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: {service}
  template:
    metadata:
      labels:
        app: {service}
    spec:
      containers:
        - name: {service}
          image: nextai/{service}:latest
          ports:
            - containerPort: {port}
          envFrom:
            - configMapRef:
                name: {service}-config
            - secretRef:
                name: {service}-secrets
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /health
              port: {port}
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: {port}
            initialDelaySeconds: 15
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: {service}
spec:
  selector:
    app: {service}
  ports:
    - port: {port}
      targetPort: {port}
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {service}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {service}
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 6. 安全规则

- 容器以非 root 用户运行 (`USER app`)
- 生产镜像不包含构建工具 (多阶段构建)
- 敏感信息使用 K8s Secret，不硬编码
- Go 服务使用 `scratch` 基础镜像 (最小攻击面)
- 所有服务配置健康检查 (readiness + liveness)

## 示例

**输入**: "为 plugin-service 创建 Dockerfile 和 K8s 部署配置"

**输出**: 生成 `docker/Dockerfile.plugin`（Node.js 多阶段构建）和 `k8s/base/plugin-service/` 目录（Deployment + Service + HPA + ConfigMap）。
