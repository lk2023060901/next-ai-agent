# NextAI Agent — 产品需求文档索引

> 基于 OpenClaw 改造的 SaaS 多智能体协作平台，完整产品需求文档。

## 文档目录

| 编号 | 模块 | 文件 | 描述 |
|------|------|------|------|
| 00 | [产品概述](./00-overview/product-overview.md) | product-overview.md | 产品定位、架构总览、技术选型、改造策略 |
| 01 | [设计系统](./01-design-system/design-system.md) | design-system.md | 颜色、字体、间距、圆角、组件规范、暗色模式 |
| 02 | [用户认证](./02-user-auth/user-auth.md) | user-auth.md | 注册/登录流程、RBAC 权限、个人设置 |
| 03 | [工作区管理](./03-workspace/workspace.md) | workspace.md | 组织管理、工作区 CRUD、成员管理、审计日志 |
| 04 | [Agent 系统](./04-agent-system/agent-system.md) | agent-system.md | Multi-Agent Teams 架构、角色定义、协作流程、对话界面、自定义 Agent 创建 |
| 05 | [渠道管理](./05-channels/channels.md) | channels.md | 渠道列表、配置流程、路由规则、WebChat |
| 06 | [仪表盘](./06-dashboard/dashboard.md) | dashboard.md | 全局 Dashboard、统计卡片、图表、用量统计 |
| 07 | [插件市场](./07-plugins/plugins.md) | plugins.md | 插件架构、免费/付费市场、开发者 API、可观测性集成、商业化 |
| 08 | [记忆系统](./08-memory/memory.md) | memory.md | 六层记忆体系、上下文压缩、长期记忆、跨 Agent 共享、Token 优化、RAG 增强 |
| 09 | [计费系统](./09-billing/billing.md) | billing.md | 定价方案、订阅管理、用量告警、超额处理 |
| 10 | [系统设置](./10-settings/settings.md) | settings.md | AI Provider 配置、安全设置、Webhook、导入导出 |
| 11 | [API 设计](./11-api/api-design.md) | api-design.md | RESTful API 端点、WebSocket 协议、错误码 |
| 12 | [数据库设计](./12-database/database-schema.md) | database-schema.md | PostgreSQL Schema、Redis 结构、Milvus 集合、MinIO 存储 |
| 13 | [基础设施](./13-infrastructure/infrastructure.md) | infrastructure.md | 部署架构、消息队列、高可用、监控告警、安全 |
| 14 | [前端架构](./14-frontend/frontend-architecture.md) | frontend-architecture.md | Next.js 结构、Electron 桌面、UniApp 小程序 |
| 15 | [项目搭建](./15-project-setup/project-setup.md) | project-setup.md | 环境要求、工具版本、IDE 配置、快速启动、Docker Compose |
| 16 | [编码规范](./16-coding-standards/coding-standards.md) | coding-standards.md | TypeScript/React/Go/Python 规范、命名约定、安全编码、代码审查 |
| 17 | [Git 工作流](./17-git-workflow/git-workflow.md) | git-workflow.md | 分支策略、提交规范、PR 流程、版本管理、Hooks、CI/CD |
| 18 | [测试策略](./18-testing-strategy/testing-strategy.md) | testing-strategy.md | 单元/集成/E2E/性能测试、覆盖率目标、测试工具链、最佳实践 |
| 19 | [部署指南](./19-deployment-guide/deployment-guide.md) | deployment-guide.md | Docker 容器化、K8s 部署、CI/CD 流水线、环境变量、运维手册 |
| 20 | [目录结构](./20-directory-structure/directory-structure.md) | directory-structure.md | Monorepo 结构、前端/后端/共享包目录规范、命名规范 |
| 21 | [前端开发路线图](./21-frontend-roadmap/frontend-roadmap.md) | frontend-roadmap.md | 5 个里程碑、20 周任务拆解、前端驱动开发策略、质量门禁 |
| 22 | [API Mock Service](./22-api-mock-service/api-mock-service.md) | api-mock-service.md | MSW 架构、Mock 数据工厂、流式响应模拟、渐进式切换 |
| 23 | [OpenClaw 迁移映射](./23-openclaw-migration/openclaw-migration.md) | openclaw-migration.md | 模块迁移矩阵、数据映射、渠道改造、技术栈对照、执行计划 |

## 技术栈总览

| 层级 | 技术 |
|------|------|
| 前端 Web | React 19 + Next.js 15 + HeroUI + TailwindCSS 4 + Vercel AI SDK |
| 桌面 | Electron |
| 小程序 | UniApp (Vue 3) |
| API 网关 | Golang |
| 业务服务 | TypeScript (Node.js) + Python + Golang |
| 数据库 | PostgreSQL 16 + Redis 7 |
| 向量库 | Milvus 2.4 |
| 对象存储 | MinIO |
| 消息队列 | Kafka + RabbitMQ |
| AI 路由 | OpenRouter + Vercel AI SDK + LiteLLM |
| Agent 框架 | Anthropic Agent Teams + Pi Agent Runtime |

## 设计规范速查

| 项目 | 值 |
|------|-----|
| 主色 | `#006FEE` |
| 字体 | Inter + Noto Sans SC |
| 代码字体 | JetBrains Mono |
| 正文字号 | 14px / 20px 行高 |
| 基准间距 | 4px |
| 卡片圆角 | 14px |
| 侧边栏宽 | 240px (折叠 64px) |
| 顶栏高度 | 64px |
