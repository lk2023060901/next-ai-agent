# Skill: RBAC Permission Matrix Enforcer

> 生成基于角色的权限检查代码，包含前端守卫和后端中间件。

## 触发条件

当用户要求实现权限控制、角色检查、页面守卫、API 权限校验时激活此 Skill。

## 上下文

### 角色层级

```
super_admin > org_owner > org_admin > ws_admin > ws_member > ws_guest
```

| 角色 | 代码 | 权限范围 |
|------|------|---------|
| 超级管理员 | `super_admin` | 全局管理 (仅平台方) |
| 组织所有者 | `org_owner` | 组织级全部权限 |
| 组织管理员 | `org_admin` | 组织级管理 (不含删除组织/转让) |
| 工作区管理员 | `ws_admin` | 工作区级全部权限 |
| 工作区成员 | `ws_member` | 使用 Agent、查看自己资源 |
| 访客 | `ws_guest` | 只读访问指定资源 |

### 权限矩阵

| 操作 | super_admin | org_owner | org_admin | ws_admin | ws_member | ws_guest |
|------|:-----------:|:---------:|:---------:|:--------:|:---------:|:--------:|
| 创建组织 | ✓ | ✓ | - | - | - | - |
| 删除组织 | ✓ | ✓ | - | - | - | - |
| 组织设置 | ✓ | ✓ | ✓ | - | - | - |
| 邀请成员 | ✓ | ✓ | ✓ | ✓ | - | - |
| 移除成员 | ✓ | ✓ | ✓ | ✓ | - | - |
| 创建工作区 | ✓ | ✓ | ✓ | - | - | - |
| 删除工作区 | ✓ | ✓ | ✓ | ✓ | - | - |
| 工作区设置 | ✓ | ✓ | ✓ | ✓ | - | - |
| 使用 Agent | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 管理 Agent | ✓ | ✓ | ✓ | ✓ | - | - |
| 查看会话 | ✓ | ✓ | ✓ | ✓ | 自己 | 指定 |
| 管理插件 | ✓ | ✓ | ✓ | ✓ | - | - |
| 查看用量 | ✓ | ✓ | ✓ | ✓ | 自己 | - |
| 计费管理 | ✓ | ✓ | - | - | - | - |
| 查看审计 | ✓ | ✓ | ✓ | - | - | - |

### JWT Payload

```json
{
  "sub": "user_id",
  "org_id": "organization_id",
  "ws_id": "workspace_id",
  "role": "ws_member",
  "permissions": ["agent:use", "session:read:own"]
}
```

## 生成规则

### 1. 权限定义 (共享类型)

```typescript
// packages/shared-types/src/permissions.ts
export const ROLE = {
  SUPER_ADMIN: 'super_admin',
  ORG_OWNER: 'org_owner',
  ORG_ADMIN: 'org_admin',
  WS_ADMIN: 'ws_admin',
  WS_MEMBER: 'ws_member',
  WS_GUEST: 'ws_guest',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const PERMISSION = {
  ORG_CREATE: 'org:create',
  ORG_DELETE: 'org:delete',
  ORG_SETTINGS: 'org:settings',
  MEMBER_INVITE: 'member:invite',
  MEMBER_REMOVE: 'member:remove',
  WS_CREATE: 'workspace:create',
  WS_DELETE: 'workspace:delete',
  WS_SETTINGS: 'workspace:settings',
  AGENT_USE: 'agent:use',
  AGENT_MANAGE: 'agent:manage',
  SESSION_READ: 'session:read',
  SESSION_READ_OWN: 'session:read:own',
  PLUGIN_MANAGE: 'plugin:manage',
  USAGE_VIEW: 'usage:view',
  USAGE_VIEW_OWN: 'usage:view:own',
  BILLING_MANAGE: 'billing:manage',
  AUDIT_VIEW: 'audit:view',
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

// 角色 → 权限映射
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: Object.values(PERMISSION),
  org_owner: Object.values(PERMISSION),
  org_admin: [
    PERMISSION.ORG_SETTINGS, PERMISSION.MEMBER_INVITE, PERMISSION.MEMBER_REMOVE,
    PERMISSION.WS_CREATE, PERMISSION.WS_DELETE, PERMISSION.WS_SETTINGS,
    PERMISSION.AGENT_USE, PERMISSION.AGENT_MANAGE, PERMISSION.SESSION_READ,
    PERMISSION.PLUGIN_MANAGE, PERMISSION.USAGE_VIEW, PERMISSION.AUDIT_VIEW,
  ],
  ws_admin: [
    PERMISSION.MEMBER_INVITE, PERMISSION.MEMBER_REMOVE,
    PERMISSION.WS_DELETE, PERMISSION.WS_SETTINGS,
    PERMISSION.AGENT_USE, PERMISSION.AGENT_MANAGE, PERMISSION.SESSION_READ,
    PERMISSION.PLUGIN_MANAGE, PERMISSION.USAGE_VIEW,
  ],
  ws_member: [
    PERMISSION.AGENT_USE, PERMISSION.SESSION_READ_OWN, PERMISSION.USAGE_VIEW_OWN,
  ],
  ws_guest: [
    PERMISSION.SESSION_READ_OWN,
  ],
};
```

### 2. 前端权限 Hook

```typescript
// hooks/use-permission.ts
import { useAuthStore } from '@/stores/auth';
import { ROLE_PERMISSIONS, type Permission, type Role } from '@nextai/shared-types';

export function usePermission() {
  const { user } = useAuthStore();
  const role = user?.role as Role | undefined;

  function hasPermission(permission: Permission): boolean {
    if (!role) return false;
    return ROLE_PERMISSIONS[role].includes(permission);
  }

  function hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(hasPermission);
  }

  function hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(hasPermission);
  }

  function isAtLeastRole(minRole: Role): boolean {
    const hierarchy: Role[] = ['super_admin', 'org_owner', 'org_admin', 'ws_admin', 'ws_member', 'ws_guest'];
    if (!role) return false;
    return hierarchy.indexOf(role) <= hierarchy.indexOf(minRole);
  }

  return { hasPermission, hasAnyPermission, hasAllPermissions, isAtLeastRole, role };
}
```

### 3. 前端权限组件

```tsx
// components/permission-guard.tsx
'use client';

import { type Permission } from '@nextai/shared-types';
import { usePermission } from '@/hooks/use-permission';

type PermissionGuardProps = {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) return fallback;
  return children;
}
```

```tsx
// 使用示例
<PermissionGuard permission="agent:manage">
  <Button onPress={onCreateAgent}>创建 Agent</Button>
</PermissionGuard>

<PermissionGuard permission="billing:manage" fallback={<p>无权限访问</p>}>
  <BillingDashboard />
</PermissionGuard>
```

### 4. 前端路由守卫

```typescript
// middleware.ts (Next.js Middleware)
import { NextResponse, type NextRequest } from 'next/server';
import { ROLE_PERMISSIONS, type Role, type Permission } from '@nextai/shared-types';

const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/org/*/settings': 'org:settings',
  '/org/*/settings/billing': 'billing:manage',
  '/org/*/settings/audit': 'audit:view',
  '/org/*/ws/*/agents': 'agent:use',
  '/org/*/ws/*/settings': 'workspace:settings',
  '/org/*/ws/*/plugins': 'plugin:manage',
};

export function middleware(request: NextRequest) {
  // JWT 解析 (简化示例)
  const token = request.cookies.get('access_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  const claims = parseJWT(token);
  const role = claims.role as Role;
  const userPermissions = ROLE_PERMISSIONS[role];

  // 匹配路由权限
  for (const [pattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (matchPath(request.nextUrl.pathname, pattern) && !userPermissions.includes(permission)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return NextResponse.next();
}
```

### 5. 后端权限中间件 (TypeScript)

```typescript
// src/middlewares/require-permission.ts
import type { Request, Response, NextFunction } from 'express';
import { ROLE_PERMISSIONS, type Permission, type Role } from '@nextai/shared-types';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role as Role;
    if (!role || !ROLE_PERMISSIONS[role].includes(permission)) {
      res.status(403).json({ code: 40101, message: '无权限执行此操作' });
      return;
    }
    next();
  };
}

// 使用
router.post('/agents', requirePermission('agent:manage'), agentHandler.create);
router.delete('/agents/:id', requirePermission('agent:manage'), agentHandler.remove);
```

### 6. 后端权限中间件 (Go)

```go
// internal/middleware/permission.go
package middleware

import (
	"net/http"
	"nextai-agent/services/api-gateway/internal/types"
)

func RequirePermission(permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserClaimsKey).(*UserClaims)
			if !ok {
				types.Error(w, http.StatusUnauthorized, 40001, "Unauthorized")
				return
			}

			if !hasPermission(claims.Role, permission) {
				types.Error(w, http.StatusForbidden, 40101, "Permission denied")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
```

## 示例

**输入**: "Agent 管理页面需要权限控制，只有 ws_admin 及以上才能创建/编辑/删除"

**输出**: 生成页面级 PermissionGuard 包裹、按钮级条件渲染、后端 `requirePermission('agent:manage')` 中间件应用到 POST/PUT/DELETE 路由。
