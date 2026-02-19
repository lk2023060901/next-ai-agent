# Skill: Code Review Checklist Enforcer

> 按照项目编码规范对代码进行自动化审查，输出结构化的审查报告。

## 触发条件

当用户要求代码审查、代码检查、PR Review 时激活此 Skill。

## 上下文

### 审查维度

1. **正确性**: 逻辑是否正确，边界情况是否覆盖
2. **安全性**: OWASP Top 10 漏洞检查
3. **规范性**: 命名/格式/结构是否符合编码规范
4. **性能**: 是否存在明显性能问题
5. **可维护性**: 代码是否清晰、可扩展
6. **测试**: 是否有充足的测试覆盖

## 审查规则

### 1. TypeScript / React 审查清单

```markdown
## 类型安全
- [ ] 无 `any` 类型（除非有充分理由并注释）
- [ ] 使用 `type` 而非 `interface`（除需 extends/implements）
- [ ] 枚举使用联合类型而非 `enum`
- [ ] 函数公开 API 标注返回类型
- [ ] Zod Schema 用 `z.infer` 推导类型，不手写重复类型

## React 规范
- [ ] 使用命名导出，非默认导出
- [ ] Props 使用 `type` 定义，不使用 `React.FC`
- [ ] 避免在渲染中创建内联函数/对象（用 useCallback/useMemo）
- [ ] 列表渲染使用稳定的 key（不用 index）
- [ ] 副作用在 useEffect 中，依赖数组完整
- [ ] 大组件拆分为子组件，单文件不超过 300 行

## 状态管理
- [ ] 局部状态用 useState，跨组件用 Zustand
- [ ] 服务端数据用 TanStack Query，不放 Zustand
- [ ] 无不必要的状态（可从 props 或其他状态派生的）
- [ ] 表单状态用 React Hook Form，不用 useState 手动管理

## 样式
- [ ] 使用 TailwindCSS，不用内联 style
- [ ] 暗色模式使用 HeroUI 语义色或 `dark:` 前缀
- [ ] 间距使用 Tailwind 标准值（space-1=4px 基准）
- [ ] 无硬编码颜色值（使用设计令牌）

## 安全
- [ ] 用户输入已校验（Zod）
- [ ] 无 `dangerouslySetInnerHTML`（除非内容已消毒）
- [ ] API 调用使用 HTTPS
- [ ] 敏感数据不存入 localStorage（用 httpOnly cookie）
- [ ] 无敏感信息硬编码（密钥、密码）
```

### 2. Go 审查清单

```markdown
## 错误处理
- [ ] 所有 error 都已处理，无 `_ = err`
- [ ] 错误信息小写开头，无标点
- [ ] 使用 `fmt.Errorf("xxx: %w", err)` 包装错误
- [ ] 自定义错误类型实现 `error` 接口

## 并发安全
- [ ] 共享状态使用 sync.Mutex 或 channel
- [ ] goroutine 有退出机制（context.Done）
- [ ] 无 data race（运行 go test -race）

## 性能
- [ ] 大数组传递使用指针
- [ ] 预分配 slice 容量（`make([]T, 0, n)`）
- [ ] 数据库查询使用参数化（防 SQL 注入）
- [ ] HTTP Handler 无阻塞操作

## 规范
- [ ] 导出函数有 GoDoc 注释
- [ ] 接口命名用 -er 后缀
- [ ] 错误变量命名用 Err 前缀
```

### 3. Python 审查清单

```markdown
## 类型
- [ ] 函数签名使用 Type Hints
- [ ] Pydantic Model 用于请求/响应
- [ ] 无 `# type: ignore`（除非有充分理由）

## 异步
- [ ] I/O 操作使用 async/await
- [ ] 无在 async 函数中调用阻塞操作
- [ ] 数据库使用异步驱动（asyncpg）

## 安全
- [ ] SQL 参数化查询
- [ ] 文件路径使用 pathlib，防路径遍历
- [ ] 外部输入已用 Pydantic 校验
```

### 4. 通用安全审查

```markdown
## OWASP Top 10
- [ ] 注入攻击: SQL/NoSQL 使用参数化查询
- [ ] 认证: JWT 校验完整（签名+过期+权限）
- [ ] 授权: API 端点有权限检查中间件
- [ ] XSS: 用户内容已转义/消毒
- [ ] CSRF: 状态修改操作有 CSRF 令牌
- [ ] 敏感数据: 密码用 bcrypt/argon2 哈希
- [ ] 限流: 关键端点（登录/注册）有限流
- [ ] 日志: 不记录敏感信息（密码/Token）
- [ ] 依赖: 无已知漏洞的依赖版本
```

## 输出格式

审查结果按严重级别分类：

```markdown
# Code Review Report

## 🔴 Critical (必须修复)
- **文件**: `src/handler/auth.ts:45`
  - **问题**: SQL 查询使用字符串拼接，存在注入风险
  - **建议**: 使用 Drizzle ORM 的参数化查询

## 🟡 Warning (建议修复)
- **文件**: `components/agent-card.tsx:23`
  - **问题**: 列表渲染使用 index 作为 key
  - **建议**: 使用 `agent.id` 作为 key

## 🔵 Suggestion (可选优化)
- **文件**: `hooks/use-agents.ts:12`
  - **问题**: useQuery 的 staleTime 未设置，默认 0
  - **建议**: 设置合理的 staleTime（如 30s）减少不必要的请求

## ✅ Passed
- 类型安全检查通过
- 暗色模式兼容性通过
- 权限检查中间件已应用
```

## 示例

**输入**: "审查这段 Agent 创建的 Handler 代码"

**输出**: 按上述格式输出审查报告，覆盖类型安全、错误处理、安全性、权限检查、输入校验等维度。
