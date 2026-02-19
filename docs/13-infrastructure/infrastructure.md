# 基础设施架构

## 1 部署架构

### 1.1 总体部署图

```
                           ┌──────────────┐
                           │   CDN/WAF    │
                           │  (CloudFlare) │
                           └──────┬───────┘
                                  │
                           ┌──────▼───────┐
                           │  负载均衡器   │
                           │  (Nginx/ALB)  │
                           └──────┬───────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
     ┌──────▼───────┐     ┌──────▼───────┐     ┌──────▼───────┐
     │  Web 前端     │     │  API Gateway │     │  WebSocket   │
     │  (Next.js)   │     │  (Golang)    │     │  Gateway     │
     │  SSR/Static  │     │  认证/限流    │     │  (Node.js)   │
     └──────────────┘     └──────┬───────┘     └──────┬───────┘
                                  │                     │
            ┌─────────────────────┼─────────────────────┤
            │                     │                     │
     ┌──────▼───────┐     ┌──────▼───────┐     ┌──────▼───────┐
     │  用户服务     │     │  Agent 服务   │     │  渠道服务     │
     │  (Node.js)   │     │  (Node.js +  │     │  (Node.js)   │
     │              │     │   Python)    │     │              │
     └──────────────┘     └──────────────┘     └──────────────┘
     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
     │  计费服务     │     │  记忆服务     │     │  插件服务     │
     │  (Golang)    │     │  (Python)    │     │  (Node.js)   │
     └──────────────┘     └──────────────┘     └──────────────┘
            │                     │                     │
     ┌──────▼──────────────────────▼─────────────────────▼──────┐
     │                     消息队列层                             │
     │          ┌──────────┐        ┌──────────┐                │
     │          │  Kafka   │        │ RabbitMQ │                │
     │          └──────────┘        └──────────┘                │
     └──────────────────────────────────────────────────────────┘
            │                     │                     │
     ┌──────▼──────────────────────▼─────────────────────▼──────┐
     │                      数据存储层                           │
     │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
     │  │PostgreSQL│ │  Redis   │ │  MinIO   │ │  Milvus  │  │
     │  │ (主从)   │ │ (哨兵)   │ │ (集群)   │ │ (集群)   │  │
     │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
     └──────────────────────────────────────────────────────────┘
```

### 1.2 服务清单

| 服务名 | 语言 | 端口 | 副本数 | CPU | 内存 |
|--------|------|------|--------|-----|------|
| web-frontend | TypeScript (Next.js) | 3000 | 2 | 0.5c | 512MB |
| api-gateway | Golang | 8080 | 3 | 1c | 512MB |
| ws-gateway | TypeScript (Node.js) | 8081 | 2 | 1c | 1GB |
| user-service | TypeScript (Node.js) | 8001 | 2 | 0.5c | 512MB |
| agent-service | TypeScript + Python | 8002 | 4 | 2c | 4GB |
| channel-service | TypeScript (Node.js) | 8003 | 2 | 1c | 1GB |
| memory-service | Python | 8004 | 2 | 1c | 2GB |
| billing-service | Golang | 8005 | 2 | 0.5c | 256MB |
| plugin-service | TypeScript (Node.js) | 8006 | 2 | 0.5c | 512MB |

---

## 2 消息队列设计

### 2.1 Kafka Topics

| Topic | 分区数 | 用途 | 生产者 | 消费者 |
|-------|--------|------|--------|--------|
| `agent.events` | 8 | Agent 事件流 (思考、工具调用、回复) | agent-service | ws-gateway, memory-service |
| `agent.tasks` | 4 | Agent 任务分派 | agent-service | agent-service (不同实例) |
| `usage.records` | 4 | 用量计量 | 所有服务 | billing-service |
| `audit.logs` | 2 | 审计日志 | 所有服务 | log-aggregator |

### 2.2 RabbitMQ Queues

| Queue | Exchange | 用途 | 消费者 |
|-------|----------|------|--------|
| `channel.inbound.{type}` | `channel.inbound` (topic) | 渠道入站消息 | channel-service |
| `channel.outbound` | `channel.outbound` (direct) | 渠道出站消息 | channel-service |
| `notification.email` | `notification` (topic) | 邮件通知 | notification-worker |
| `notification.push` | `notification` (topic) | 推送通知 | notification-worker |
| `document.index` | `document` (direct) | 文档索引任务 | memory-service |
| `plugin.event` | `plugin` (fanout) | 插件事件广播 | plugin-service |

### 2.3 消息保留策略

| Topic/Queue | 保留时间 | 备注 |
|-------------|---------|------|
| agent.events | 7 天 | 可回放 |
| usage.records | 30 天 | 聚合后删除 |
| audit.logs | 90 天 | 合规需求 |
| channel.inbound/outbound | 处理后 ACK | 即时消费 |
| notification.* | 1 天 | 重试 3 次后进 DLQ |

---

## 3 服务间通信

### 3.1 同步调用 (gRPC / REST)

```
api-gateway  ──REST──→  user-service (认证/权限校验)
api-gateway  ──REST──→  各业务服务 (路由转发)
agent-service ──gRPC──→ memory-service (知识检索)
agent-service ──REST──→ 外部 AI Provider (模型调用)
channel-service ──REST──→ 外部渠道 API (消息发送)
billing-service ──REST──→ 支付网关 (扣费)
```

### 3.2 异步通信 (消息队列)

```
channel-service → [RabbitMQ] → agent-service (入站消息触发 Agent)
agent-service → [Kafka] → ws-gateway (流式推送到客户端)
agent-service → [RabbitMQ] → channel-service (出站消息)
所有服务 → [Kafka] → billing-service (用量计量)
agent-service → [RabbitMQ] → memory-service (文档索引)
```

---

## 4 高可用与容灾

### 4.1 PostgreSQL

- 主从复制 (Streaming Replication)
- 读写分离: 写操作 → 主库, 读操作 → 从库
- 自动故障转移: Patroni + etcd
- 备份: 每日全量 + WAL 归档 (MinIO)

### 4.2 Redis

- Redis Sentinel 模式 (1主2从3哨兵)
- 持久化: AOF (每秒 fsync)
- 内存上限: 4GB, LRU 淘汰

### 4.3 MinIO

- 纠删码模式 (4 节点, 2 奇偶校验)
- 跨区域复制 (可选)
- 版本控制启用 (knowledge bucket)

### 4.4 Milvus

- 集群模式 (2 QueryNode, 2 DataNode, 3 etcd)
- 数据持久化到 MinIO
- 自动负载均衡

---

## 5 监控与告警

### 5.1 监控指标

| 类别 | 指标 | 告警阈值 |
|------|------|---------|
| 系统 | CPU 使用率 | > 80% 持续 5 分钟 |
| 系统 | 内存使用率 | > 85% |
| 系统 | 磁盘使用率 | > 90% |
| API | 请求延迟 P99 | > 2000ms |
| API | 错误率 | > 1% |
| Agent | 调用延迟 P95 | > 30s |
| Agent | 失败率 | > 5% |
| DB | 连接池使用率 | > 80% |
| DB | 查询延迟 P95 | > 500ms |
| Queue | 消息堆积 | > 10000 |
| Queue | 消费延迟 | > 30s |

### 5.2 日志规范

```json
{
  "timestamp": "2026-02-18T12:00:00.000Z",
  "level": "info",
  "service": "agent-service",
  "traceId": "trace_uuid",
  "spanId": "span_uuid",
  "message": "Agent task completed",
  "data": {
    "agentId": "...",
    "taskId": "...",
    "latencyMs": 1234
  }
}
```

- 日志级别: debug / info / warn / error / fatal
- 分布式追踪: OpenTelemetry (traceId 贯穿全链路)
- 日志聚合: Kafka → Elasticsearch → Kibana

---

## 6 安全架构

### 6.1 网络安全

- 所有外部通信使用 TLS 1.3
- 服务间通信使用 mTLS (可选) 或 VPC 内网
- WAF 防护 (SQL 注入、XSS、CSRF)
- DDoS 防护 (CloudFlare)

### 6.2 数据安全

- 数据库字段级加密 (敏感字段: Token, Secret)
- 密码: bcrypt (cost=12)
- API Key: SHA-256 哈希存储, 明文仅创建时展示一次
- MinIO: SSE-S3 加密
- 备份加密: AES-256

### 6.3 合规

- GDPR: 数据导出/删除 API
- 审计日志: 所有敏感操作记录
- 数据保留策略: 按方案配置
