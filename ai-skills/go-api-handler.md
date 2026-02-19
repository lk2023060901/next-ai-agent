# Skill: Go API Handler & Router Setup

> 生成 Go API Gateway 的 Handler、Router 和中间件代码。

## 触发条件

当用户要求创建 Go API 端点、网关路由、Go 中间件时激活此 Skill。

## 上下文

### 技术栈

- Go 1.23+
- Chi Router v5 (HTTP 路由)
- sqlc (SQL → Go 代码生成)
- Zap (结构化日志)
- golang-jwt/jwt/v5 (JWT 解析)
- Testify (测试断言)

### 网关职责

API Gateway (`services/api-gateway/`) 负责：
- 请求路由与版本控制
- JWT 认证与权限校验
- 请求限流 (令牌桶)
- 请求/响应日志
- CORS 处理
- 反向代理到下游微服务

### 命名约定

| 类型 | 风格 | 示例 |
|------|------|------|
| 包名 | 小写单词 | `handler`, `middleware` |
| 文件名 | snake_case | `agent_handler.go` |
| 导出函数/类型 | PascalCase | `CreateAgent`, `AgentHandler` |
| 私有函数 | camelCase | `parseToken` |
| 常量 | PascalCase 或 ALL_CAPS | `MaxRetryCount` |
| 接口 | PascalCase + er 后缀 | `AgentCreator` |
| HTTP 方法命名 | 动词 + 资源 | `ListAgents`, `CreateAgent`, `GetAgentByID` |

## 生成规则

### 1. 项目结构

```
services/api-gateway/
├── cmd/
│   └── server/
│       └── main.go               # 入口
├── internal/
│   ├── config/
│   │   └── config.go             # 配置加载
│   ├── handler/
│   │   ├── agent.go              # Agent 路由 Handler
│   │   ├── auth.go               # 认证 Handler
│   │   └── health.go             # 健康检查
│   ├── middleware/
│   │   ├── auth.go               # JWT 认证
│   │   ├── cors.go               # CORS
│   │   ├── logger.go             # 请求日志
│   │   ├── ratelimit.go          # 限流
│   │   └── recover.go            # Panic 恢复
│   ├── proxy/
│   │   └── reverse_proxy.go      # 反向代理
│   ├── router/
│   │   └── router.go             # 路由注册
│   └── types/
│       ├── request.go            # 请求类型
│       └── response.go           # 响应类型
├── go.mod
├── go.sum
├── Dockerfile
└── Makefile
```

### 2. 路由注册

```go
// internal/router/router.go
package router

import (
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"nextai-agent/services/api-gateway/internal/handler"
	"nextai-agent/services/api-gateway/internal/middleware"
)

func New(h *handler.Handler) chi.Router {
	r := chi.NewRouter()

	// 全局中间件
	r.Use(chimw.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recover)
	r.Use(middleware.CORS)
	r.Use(middleware.RateLimit)

	// 健康检查 (无需认证)
	r.Get("/health", h.Health.Check)

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		// 认证 (公开)
		r.Route("/auth", func(r chi.Router) {
			r.Post("/login", h.Auth.Login)
			r.Post("/signup", h.Auth.Signup)
			r.Post("/refresh", h.Auth.Refresh)
		})

		// 需要认证的路由
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth)

			// 工作区
			r.Route("/workspaces/{wsId}", func(r chi.Router) {
				r.Get("/", h.Workspace.Get)
				r.Put("/", h.Workspace.Update)

				// Agent
				r.Route("/agents", func(r chi.Router) {
					r.Get("/", h.Agent.List)
					r.Post("/", h.Agent.Create)
					r.Get("/{agentId}", h.Agent.GetByID)
					r.Put("/{agentId}", h.Agent.Update)
					r.Delete("/{agentId}", h.Agent.Delete)
				})

				// 会话
				r.Route("/sessions", func(r chi.Router) {
					r.Get("/", h.Session.List)
					r.Post("/", h.Session.Create)
				})

				// 渠道
				r.Route("/channels", func(r chi.Router) {
					r.Get("/", h.Channel.List)
					r.Post("/", h.Channel.Create)
				})
			})
		})
	})

	return r
}
```

### 3. Handler 模板

```go
// internal/handler/agent.go
package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"nextai-agent/services/api-gateway/internal/types"
)

type AgentHandler struct {
	// 下游服务客户端
}

func (h *AgentHandler) List(w http.ResponseWriter, r *http.Request) {
	wsID := chi.URLParam(r, "wsId")
	limit := r.URL.Query().Get("limit")
	cursor := r.URL.Query().Get("cursor")

	// 代理到 agent-service
	// 或直接查询
	_ = wsID
	_ = limit
	_ = cursor

	types.JSON(w, http.StatusOK, types.Response{
		Code:    0,
		Message: "success",
		Data:    nil, // 填充实际数据
	})
}

func (h *AgentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req types.CreateAgentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		types.Error(w, http.StatusBadRequest, 40200, "Invalid request body")
		return
	}

	// 业务逻辑...

	types.JSON(w, http.StatusCreated, types.Response{
		Code:    0,
		Message: "success",
		Data:    nil,
	})
}

func (h *AgentHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	agentID := chi.URLParam(r, "agentId")
	_ = agentID
	types.JSON(w, http.StatusOK, types.Response{Code: 0, Message: "success"})
}

func (h *AgentHandler) Update(w http.ResponseWriter, r *http.Request) {
	agentID := chi.URLParam(r, "agentId")
	_ = agentID
	types.JSON(w, http.StatusOK, types.Response{Code: 0, Message: "success"})
}

func (h *AgentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	agentID := chi.URLParam(r, "agentId")
	_ = agentID
	types.JSON(w, http.StatusNoContent, nil)
}
```

### 4. 统一响应

```go
// internal/types/response.go
package types

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

type Meta struct {
	RequestID string `json:"requestId"`
	Timestamp string `json:"timestamp"`
}

func JSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		if resp, ok := v.(Response); ok && resp.Meta == nil {
			resp.Meta = &Meta{
				RequestID: uuid.NewString(),
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			}
			v = resp
		}
		json.NewEncoder(w).Encode(v)
	}
}

func Error(w http.ResponseWriter, status int, code int, message string) {
	JSON(w, status, Response{
		Code:    code,
		Message: message,
	})
}
```

### 5. JWT 认证中间件

```go
// internal/middleware/auth.go
package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"nextai-agent/services/api-gateway/internal/config"
	"nextai-agent/services/api-gateway/internal/types"
)

type contextKey string

const UserClaimsKey contextKey = "user_claims"

type UserClaims struct {
	UserID      string   `json:"sub"`
	OrgID       string   `json:"org_id"`
	WorkspaceID string   `json:"ws_id"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
	jwt.RegisteredClaims
}

func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			types.Error(w, http.StatusUnauthorized, 40001, "Missing authorization token")
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims := &UserClaims{}

		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(config.Get().JWTSecret), nil
		})
		if err != nil || !token.Valid {
			types.Error(w, http.StatusUnauthorized, 40001, "Invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

## 示例

**输入**: "为计费系统添加订阅管理的 API Handler"

**输出**: 生成 `handler/subscription.go`，包含 List/Create/Update/Cancel 四个 Handler 方法，以及对应的请求类型定义和路由注册代码。
