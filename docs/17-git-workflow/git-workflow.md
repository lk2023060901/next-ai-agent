# Git 工作流与版本管理

## 1 分支策略

### 1.1 分支模型

采用 **GitHub Flow + Release Branch** 混合策略，兼顾敏捷开发与稳定发布。

```
分支结构:

main ──────●──────●──────●──────●──────●──────●──── (始终可部署)
            \           ↗      \           ↗
feat/xxx     ●────●────●        \         /
                                 \       /
release/1.2   ────────────●──────●──────● ──── (发布分支)
                           \
hotfix/fix-xxx              ●────●
```

### 1.2 分支类型

| 分支 | 命名规则 | 来源 | 合入 | 生命周期 |
|------|---------|------|------|---------|
| `main` | `main` | — | — | 永久 |
| 功能分支 | `feat/{module}-{description}` | `main` | `main` | PR 合并后删除 |
| 修复分支 | `fix/{module}-{description}` | `main` | `main` | PR 合并后删除 |
| 发布分支 | `release/{version}` | `main` | `main` | 发布完成后保留 tag 删除分支 |
| 热修复 | `hotfix/{description}` | `release/*` 或 `main` | `release/*` + `main` | 合并后删除 |
| 文档分支 | `docs/{description}` | `main` | `main` | PR 合并后删除 |
| 重构分支 | `refactor/{description}` | `main` | `main` | PR 合并后删除 |
| CI 分支 | `ci/{description}` | `main` | `main` | PR 合并后删除 |

### 1.3 分支命名示例

```bash
# ✅ 正确命名
feat/agent-memory-integration
feat/billing-stripe-webhook
fix/chat-message-ordering
fix/ws-reconnect-race-condition
docs/api-design-update
refactor/auth-middleware-cleanup
hotfix/payment-callback-timeout
release/1.2.0

# ❌ 错误命名
feature/add_new_thing        # 使用 feat/ 前缀，不用下划线
my-branch                    # 缺少类型前缀
feat/update                  # 描述太模糊
```

---

## 2 提交规范

### 2.1 Commit Message 格式

采用 **Conventional Commits** 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### 2.2 Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(agent): add multi-agent collaboration` |
| `fix` | Bug 修复 | `fix(chat): resolve message ordering issue` |
| `docs` | 文档变更 | `docs(api): update WebSocket protocol spec` |
| `style` | 格式修改 (不影响逻辑) | `style(web): fix import order` |
| `refactor` | 重构 (非新功能非修复) | `refactor(auth): simplify JWT validation` |
| `perf` | 性能优化 | `perf(memory): optimize vector search query` |
| `test` | 测试相关 | `test(billing): add subscription upgrade tests` |
| `chore` | 构建/工具/依赖更新 | `chore(deps): upgrade next to 15.2` |
| `ci` | CI/CD 配置 | `ci: add e2e test pipeline` |
| `revert` | 回滚 | `revert: feat(agent): add multi-agent collaboration` |

### 2.3 Scope 范围

| Scope | 覆盖模块 |
|-------|---------|
| `web` | Web 前端 (Next.js) |
| `desktop` | Electron 桌面端 |
| `miniapp` | UniApp 小程序 |
| `gateway` | API Gateway (Golang) |
| `agent` | Agent 服务 |
| `memory` | 记忆服务 |
| `billing` | 计费服务 |
| `channel` | 渠道服务 |
| `plugin` | 插件服务 |
| `chat` | 对话相关 |
| `auth` | 认证鉴权 |
| `db` | 数据库迁移 |
| `infra` | 基础设施 |
| `deps` | 依赖更新 |
| `api` | API 设计 |

### 2.4 提交示例

```bash
# ✅ 标准格式
git commit -m "feat(agent): add coordinator agent role assignment

Implement automatic role assignment for coordinator agents based on
task complexity analysis. The coordinator now evaluates incoming
requests and delegates to the most suitable specialist agent.

Closes #234"

# ✅ Breaking Change
git commit -m "feat(api)!: migrate to v2 response format

BREAKING CHANGE: API response wrapper changed from
{ status, result } to { code, message, data }.
Migration guide: docs/migration/api-v2.md"

# ✅ 简单提交
git commit -m "fix(chat): prevent duplicate message rendering"
git commit -m "chore(deps): upgrade react to 19.1"
git commit -m "docs: update deployment guide"
```

### 2.5 提交粒度

| 原则 | 说明 |
|------|------|
| 原子性 | 一个提交做一件事，可独立 revert |
| 可编译 | 每个提交都应保证项目可编译通过 |
| 可测试 | 功能提交应包含对应测试 |
| 不混杂 | 不要在功能提交中混入格式修改 |

---

## 3 Pull Request 流程

### 3.1 PR 工作流

```
PR 生命周期:

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  创建 PR  │────▶│  CI 检查  │────▶│ Code Review│────▶│   合并    │
│          │     │          │     │          │     │          │
│ - 描述   │     │ - Lint   │     │ - ≥1 Approve│   │ - Squash │
│ - 关联 Issue│  │ - Test   │     │ - 解决评论 │    │ - 删除分支│
│ - 标签   │     │ - Build  │     │ - 无冲突  │     │ - 关联 Issue│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
      │                │                │                │
      ▼                ▼                ▼                ▼
   Draft PR        ❌ 失败         Request Changes    Merged ✅
   (可选)         需修复后重试      需修改后重新审查
```

### 3.2 PR 模板

```markdown
## 概述

<!-- 简述此 PR 的目的和变更内容 -->

## 变更类型

- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 重构 (refactor)
- [ ] 文档 (docs)
- [ ] 测试 (test)
- [ ] CI/构建 (ci/chore)

## 变更说明

<!-- 详细描述变更内容 -->

### 关联 Issue

Closes #

## 测试

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试（描述测试步骤）

## 截图/录屏

<!-- UI 变更需附带截图或录屏 -->

## 部署注意事项

<!-- 是否需要数据库迁移、环境变量更新、配置变更等 -->

## 审查清单

- [ ] 代码符合编码规范
- [ ] 无安全隐患
- [ ] 有适当的错误处理
- [ ] 有适当的日志记录
```

### 3.3 PR 规则

| 规则 | 要求 |
|------|------|
| 标题格式 | 遵循 Conventional Commits 格式 |
| 描述 | 必须填写变更说明和测试说明 |
| 大小限制 | 单个 PR 变更不超过 500 行 (不含生成代码) |
| CI 通过 | 所有检查项 (lint/test/build) 必须通过 |
| 审查人数 | 至少 1 人 Approve |
| 冲突解决 | 合并前必须 rebase 到最新 main |
| 合并方式 | 统一使用 **Squash and Merge** |

### 3.4 Code Review 指南

**审查者职责**：

| 关注点 | 说明 |
|--------|------|
| 正确性 | 代码逻辑是否正确，边界条件是否处理 |
| 安全性 | 是否有注入、越权、信息泄露风险 |
| 可读性 | 命名是否清晰，逻辑是否容易理解 |
| 一致性 | 是否符合项目编码规范和设计模式 |
| 测试覆盖 | 核心逻辑是否有测试覆盖 |

**审查回复规范**：

```
# 审查评论前缀
[nit]      — 非阻塞性建议 (格式、命名微调)
[suggest]  — 建议改进 (可讨论)
[question] — 需要作者解释
[must]     — 必须修改才能合并
```

---

## 4 版本管理

### 4.1 版本号规范

采用 **Semantic Versioning 2.0** (语义化版本)：

```
MAJOR.MINOR.PATCH[-prerelease]

示例:
1.0.0        — 首个正式版本
1.1.0        — 新增功能，向后兼容
1.1.1        — Bug 修复
1.2.0-beta.1 — 预发布版本
2.0.0        — 不兼容的 API 变更
```

| 版本位 | 何时递增 | 示例 |
|--------|---------|------|
| MAJOR | 不兼容的 API 变更 | API 响应格式变更、数据库 Schema 大改 |
| MINOR | 向后兼容的新功能 | 新增 Agent 角色、新增渠道类型 |
| PATCH | 向后兼容的 Bug 修复 | 修复消息排序、修复计费计算 |

### 4.2 发布流程

```
发布流程:

main ──────────────────────────────────────────────────────
         \                                    ↗
release/1.2.0 ──● tag: v1.2.0-rc.1 ──● tag: v1.2.0 ──●
                 │                      │
                 ▼                      ▼
              部署到 Staging          部署到 Production
              内部验收测试            正式发布

步骤:
  1. 从 main 创建 release/x.y.z 分支
  2. 在 release 分支打 RC tag (v1.2.0-rc.1)
  3. 部署 RC 到 Staging 环境
  4. 验收测试通过后打正式 tag (v1.2.0)
  5. CI 自动部署到 Production
  6. 合并 release 分支回 main
  7. 删除 release 分支
```

### 4.3 Changelog 生成

```bash
# 使用 conventional-changelog 自动生成
pnpm changeset       # 创建变更记录
pnpm changeset version  # 更新版本号 + 生成 CHANGELOG
pnpm changeset publish  # 发布 (Monorepo 包)
```

**CHANGELOG 格式**：

```markdown
# Changelog

## [1.2.0] - 2025-03-15

### 新增
- Agent 多角色协作支持 (#234)
- 渠道路由规则配置 (#256)

### 修复
- 修复消息顺序错乱问题 (#278)
- 修复工作区切换后状态未清除 (#281)

### 变更
- API 响应分页格式统一 (#265)
```

---

## 5 Git Hooks

### 5.1 Husky + lint-staged 配置

```json
// package.json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{go}": [
      "gofmt -w",
      "goimports -w"
    ],
    "*.{py}": [
      "black",
      "ruff check --fix"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

### 5.2 Hook 配置

| Hook | 执行时机 | 操作 |
|------|---------|------|
| `pre-commit` | 提交前 | lint-staged 格式化 + lint |
| `commit-msg` | 写入消息后 | commitlint 校验提交信息格式 |
| `pre-push` | 推送前 | 运行类型检查 + 单元测试 |

```bash
# .husky/pre-commit
pnpm lint-staged

# .husky/commit-msg
pnpm commitlint --edit $1

# .husky/pre-push
pnpm typecheck
pnpm test:unit --passWithNoTests
```

### 5.3 Commitlint 配置

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'chore', 'ci', 'revert',
    ]],
    'scope-enum': [1, 'always', [
      'web', 'desktop', 'miniapp', 'gateway', 'agent',
      'memory', 'billing', 'channel', 'plugin', 'chat',
      'auth', 'db', 'infra', 'deps', 'api',
    ]],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

---

## 6 CI/CD 集成

### 6.1 CI 检查流水线

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit --coverage
      - uses: codecov/codecov-action@v4

  test-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: nextai_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/nextai_test
          REDIS_URL: redis://localhost:6379

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  go-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
      - run: cd services/api-gateway && go vet ./...
      - run: cd services/api-gateway && golangci-lint run
      - run: cd services/api-gateway && go test ./... -race -cover
```

### 6.2 自动化规则

| 事件 | 触发操作 |
|------|---------|
| PR 创建 | 自动运行 CI (lint + test + build) |
| PR 合并到 main | 自动部署到 Staging |
| 打 Release Tag | 自动部署到 Production |
| Dependabot PR | 自动运行 CI，通过后自动合并 |

---

## 7 Hotfix 流程

### 7.1 紧急修复流程

```
Hotfix 流程:

production 问题发现
        │
        ▼
┌──────────────────┐
│ 1. 从 main 创建   │
│    hotfix/xxx    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. 修复 + 测试    │
│    最小化变更      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. 创建 PR       │
│    标注 🔥 Hotfix │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. 加急 Review    │
│    ≥1 Approve     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. 合并 + Tag     │
│    自动部署       │
└──────────────────┘
```

### 7.2 Hotfix 规则

| 规则 | 说明 |
|------|------|
| 范围 | 仅修复目标问题，不夹带其他改动 |
| 测试 | 必须包含回归测试用例 |
| 审查 | 可加急审查，但不可跳过 |
| 部署 | 合并后立即自动部署 |
| 回溯 | 修复后需创建 Issue 分析根因 |

---

## 8 .gitignore 规范

```gitignore
# 依赖
node_modules/
vendor/
__pycache__/
*.pyc
.venv/

# 构建产物
.next/
out/
dist/
build/
*.exe
*.dll
*.so
*.dylib

# 环境配置
.env
.env.local
.env.*.local
!.env.example

# IDE
.vscode/settings.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~

# 系统文件
.DS_Store
Thumbs.db

# 测试覆盖率
coverage/
*.lcov

# 日志
logs/
*.log

# Docker 数据卷
docker-data/
postgres-data/
redis-data/
minio-data/
milvus-data/

# 敏感文件
credentials/
*.pem
*.key
*.p12
```

---

## 9 Git 常用操作速查

### 9.1 日常开发

```bash
# 创建功能分支
git checkout main && git pull
git checkout -b feat/agent-memory-integration

# 开发中定期提交
git add -A
git commit -m "feat(agent): implement memory recall API"

# 推送到远程
git push -u origin feat/agent-memory-integration

# 创建 PR (使用 GitHub CLI)
gh pr create --title "feat(agent): implement memory recall" --body "..."

# 合并前更新
git fetch origin
git rebase origin/main
```

### 9.2 处理冲突

```bash
# Rebase 时遇到冲突
git rebase origin/main
# 解决冲突后
git add .
git rebase --continue

# 放弃 rebase
git rebase --abort
```

### 9.3 撤销操作

```bash
# 撤销暂存
git restore --staged <file>

# 撤销工作区修改
git restore <file>

# 撤销最近一次提交 (保留改动)
git reset --soft HEAD~1

# 修改最近一次提交消息
git commit --amend -m "fix(chat): correct message timestamp"
```

### 9.4 Stash 操作

```bash
# 暂存当前改动
git stash push -m "WIP: agent config form"

# 查看暂存列表
git stash list

# 恢复最近的暂存
git stash pop

# 恢复指定暂存
git stash apply stash@{1}
```
