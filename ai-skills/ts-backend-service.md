# Skill: TypeScript Backend Service Boilerplate

> 生成 Node.js 微服务脚手架，遵循 NextAI Agent 后端架构规范。

## 触发条件

当用户要求创建新的 Node.js/TypeScript 后端服务、API 服务模块时激活此 Skill。

## 上下文

### 技术栈

- Node.js 22 LTS + TypeScript 5.6+
- Express 5 / Fastify 5 (HTTP 框架)
- Drizzle ORM (PostgreSQL)
- Zod (请求/响应校验)
- Pino (结构化日志)
- Vitest (测试)

### 服务列表 (Monorepo 下 services/)

| 服务 | 语言 | 职责 |
|------|------|------|
| api-gateway | Golang | API 路由、限流、认证 |
| agent-service | Node.js | Agent 生命周期、LLM 调度 |
| user-service | Node.js | 用户认证、RBAC |
| channel-service | Node.js | 渠道接入、消息分发 |
| billing-service | Golang | 计费、订阅管理 |
| memory-service | Python | 向量检索、记忆管理 |
| plugin-service | Node.js | 插件注册、沙箱执行 |
| ws-gateway | Node.js | WebSocket 长连接 |

### 命名约定

| 类型 | 风格 | 示例 |
|------|------|------|
| 目录/文件 | kebab-case | `agent-service/`, `create-agent.ts` |
| 函数 | camelCase | `getAgentById` |
| 类型/接口 | PascalCase | `AgentConfig` |
| 环境变量 | UPPER_SNAKE_CASE | `DATABASE_URL` |
| API 路径 | kebab-case | `/api/v1/agent-configs` |
| DB 表名 | snake_case 复数 | `agent_configs` |

## 生成规则

### 1. 服务目录结构

```
services/{service-name}/
├── src/
│   ├── index.ts                    # 入口
│   ├── app.ts                      # Express/Fastify 实例
│   ├── config.ts                   # 环境变量 (Zod 校验)
│   ├── routes/                     # 路由定义
│   │   ├── index.ts
│   │   └── {resource}.route.ts
│   ├── handlers/                   # 请求处理器
│   │   └── {resource}.handler.ts
│   ├── services/                   # 业务逻辑
│   │   └── {resource}.service.ts
│   ├── repositories/               # 数据访问
│   │   └── {resource}.repo.ts
│   ├── middlewares/                 # 中间件
│   │   ├── auth.ts
│   │   ├── error-handler.ts
│   │   └── validate.ts
│   ├── types/                      # 类型定义
│   │   └── {resource}.ts
│   └── utils/                      # 工具函数
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

### 2. 入口文件

```typescript
// src/index.ts
import { createApp } from './app';
import { config } from './config';
import { logger } from '@nextai/logger';

async function main() {
  const app = createApp();

  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Service started');
  });

  // 优雅关闭
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Failed to start service:', err);
  process.exit(1);
});
```

### 3. 配置校验

```typescript
// src/config.ts
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
});

export const config = configSchema.parse(process.env);
export type Config = z.infer<typeof configSchema>;
```

### 4. 路由 + Handler + Service 三层架构

```typescript
// src/routes/agent.route.ts
import { Router } from 'express';
import { agentHandler } from '../handlers/agent.handler';
import { validate } from '../middlewares/validate';
import { createAgentSchema, updateAgentSchema } from '../types/agent';

const router = Router();
router.get('/', agentHandler.list);
router.post('/', validate(createAgentSchema), agentHandler.create);
router.get('/:id', agentHandler.getById);
router.put('/:id', validate(updateAgentSchema), agentHandler.update);
router.delete('/:id', agentHandler.remove);

export { router as agentRoutes };
```

```typescript
// src/handlers/agent.handler.ts
import type { Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agent.service';

export const agentHandler = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, cursor } = req.query;
      const result = await agentService.list({
        workspaceId: req.params.wsId,
        limit: Number(limit) || 20,
        cursor: cursor as string | undefined,
      });
      res.json({ code: 0, message: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const agent = await agentService.create({
        ...req.body,
        workspaceId: req.params.wsId,
      });
      res.status(201).json({ code: 0, message: 'success', data: agent });
    } catch (err) {
      next(err);
    }
  },
};
```

```typescript
// src/services/agent.service.ts
import { agentRepo } from '../repositories/agent.repo';
import type { CreateAgentInput } from '../types/agent';

export const agentService = {
  async list(opts: { workspaceId: string; limit: number; cursor?: string }) {
    return agentRepo.findMany(opts);
  },

  async create(input: CreateAgentInput) {
    // 业务逻辑：校验额度、检查命名唯一性等
    return agentRepo.insert(input);
  },
};
```

### 5. 错误处理中间件

```typescript
// src/middlewares/error-handler.ts
import type { Request, Response, NextFunction } from 'express';
import { logger } from '@nextai/logger';
import { ZodError } from 'zod';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      code: 40200,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ code: 50000, message: 'Internal server error' });
}
```

### 6. 请求校验中间件

```typescript
// src/middlewares/validate.ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}
```

## 示例

**输入**: "创建 channel-service 的基础脚手架"

**输出**: 生成完整的 `services/channel-service/` 目录，包含入口、配置、路由、Handler、Service、Repository 各层代码，以及 Dockerfile 和 tsconfig.json。
