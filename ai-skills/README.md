# AI Skills — NextAI Agent

> 适用于 Claude Code CLI、ChatGPT Desktop、Cursor、Windsurf 等 AI 编程助手的通用 Skills。
> 每个 Skill 是一份独立的 Prompt 指令文件，AI 助手加载后可按规范自动生成代码。

## Skills 索引

| 类别 | Skill | 文件 | 描述 |
|------|-------|------|------|
| **前端** | React 组件生成器 | [react-component.md](./react-component.md) | HeroUI + TailwindCSS 组件脚手架 |
| **前端** | AI 聊天 UI 组件 | [ai-chat-ui.md](./ai-chat-ui.md) | Vercel AI SDK 流式对话组件 |
| **前端** | 表单验证 (Zod) | [form-validation-zod.md](./form-validation-zod.md) | Zod Schema + React Hook Form |
| **前端** | Design Token 实现 | [design-token-tailwind.md](./design-token-tailwind.md) | 设计令牌 → TailwindCSS 变量 |
| **前端** | API Mock 服务 | [api-mock-msw.md](./api-mock-msw.md) | MSW 2.x Mock Handler 生成 |
| **后端** | TypeScript 服务脚手架 | [ts-backend-service.md](./ts-backend-service.md) | Node.js 微服务 Boilerplate |
| **后端** | Go API Handler | [go-api-handler.md](./go-api-handler.md) | Go 网关 Handler + Router |
| **后端** | Python AI 服务 | [python-ai-service.md](./python-ai-service.md) | FastAPI + Async 服务脚手架 |
| **数据库** | Schema 生成器 | [db-schema-generator.md](./db-schema-generator.md) | PostgreSQL + Drizzle Schema |
| **数据库** | 迁移文件编写 | [db-migration.md](./db-migration.md) | Drizzle 迁移脚本生成 |
| **测试** | API 集成测试 | [api-integration-test.md](./api-integration-test.md) | Vitest + Supertest 测试套件 |
| **权限** | RBAC 权限矩阵 | [rbac-enforcer.md](./rbac-enforcer.md) | 角色权限检查代码生成 |
| **DevOps** | Docker & K8s 配置 | [docker-k8s-config.md](./docker-k8s-config.md) | Dockerfile + K8s Manifest |
| **DevOps** | Monorepo 项目搭建 | [monorepo-setup.md](./monorepo-setup.md) | pnpm workspace 初始化 |
| **质量** | Code Review 检查 | [code-review-checklist.md](./code-review-checklist.md) | 代码审查自动化检查 |

## 使用方式

### Claude Code CLI

```bash
# 加载单个 Skill
claude --skill ai-skills/react-component.md

# 在对话中引用
# "按照 react-component skill 生成一个 AgentCard 组件"
```

### ChatGPT / Cursor / Windsurf

将 Skill 文件内容粘贴到 System Prompt 或 Custom Instructions 中即可。

## 约定

- 每个 Skill 文件都是自包含的，包含完整的上下文和规范引用
- 技术栈基于 NextAI Agent 项目文档，但 Skill 本身是通用的
- 输出代码遵循 `docs/16-coding-standards` 编码规范
- 所有生成代码默认支持 Light / Dark / System 三种主题
