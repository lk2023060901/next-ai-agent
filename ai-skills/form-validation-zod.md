# Skill: Form Validation with Zod Schema

> 生成 Zod 校验 Schema + React Hook Form 集成代码，确保前后端校验一致。

## 触发条件

当用户要求创建表单验证、输入校验、数据校验 Schema 时激活此 Skill。

## 上下文

### 技术栈

- Zod 3.x (Schema 定义与校验)
- React Hook Form 7.x (`@hookform/resolvers/zod`)
- HeroUI 3 Input / Select / Checkbox 组件
- TypeScript 5.6+ (strict 模式)

### 校验规范 (来源: 产品需求)

| 字段 | 规则 |
|------|------|
| 用户名 | 3-30 字符, 仅字母/数字/连字符 |
| 邮箱 | RFC 5322 格式 |
| 密码 | ≥8 字符, 包含大小写字母和数字 |
| 显示名称 | 1-50 字符 |
| 个人简介 | ≤200 字 |
| 手机号 | E.164 格式 (可选) |
| Agent 名称 | 2-50 字符 |
| API Key 名称 | 1-100 字符 |

## 生成规则

### 1. Schema 定义模板

```typescript
import { z } from 'zod';

// Schema 命名: {Entity}{Action}Schema
export const userSignupSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少 3 个字符')
    .max(30, '用户名最多 30 个字符')
    .regex(/^[a-zA-Z0-9-]+$/, '用户名仅支持字母、数字和连字符'),
  email: z
    .string()
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(8, '密码至少 8 个字符')
    .regex(/[a-z]/, '密码需包含小写字母')
    .regex(/[A-Z]/, '密码需包含大写字母')
    .regex(/[0-9]/, '密码需包含数字'),
  confirmPassword: z.string(),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: '请同意服务条款' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次密码输入不一致',
  path: ['confirmPassword'],
});

// 自动推导类型
export type UserSignupInput = z.infer<typeof userSignupSchema>;
```

### 2. 核心原则

- **Schema 复用**: 前端表单和 API Mock 共用同一份 Zod Schema
- **错误信息**: 使用中文，语气简洁直接
- **类型推导**: 始终用 `z.infer<typeof schema>` 推导类型，不手写重复类型
- **渐进校验**: 密码强度等实时反馈用独立 Schema 做即时校验
- **可选字段**: 使用 `.optional()` 或 `.nullable()`，不用 `.default()`（交给后端默认值）

### 3. React Hook Form 集成

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, Checkbox } from '@heroui/react';
import { userSignupSchema, type UserSignupInput } from '@/schemas/user';

export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserSignupInput>({
    resolver: zodResolver(userSignupSchema),
  });

  async function onSubmit(data: UserSignupInput) {
    // API 调用
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        label="用户名"
        placeholder="your-username"
        {...register('username')}
        isInvalid={!!errors.username}
        errorMessage={errors.username?.message}
      />
      {/* 其余字段... */}
      <Button type="submit" color="primary" size="lg" isLoading={isSubmitting} fullWidth>
        创建账户
      </Button>
    </form>
  );
}
```

### 4. 密码强度计算

```typescript
export function getPasswordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}

// 强度配置
const STRENGTH_CONFIG = [
  { label: '', color: '' },         // 0: 无
  { label: '弱', color: 'danger' },  // 1
  { label: '中', color: 'warning' }, // 2
  { label: '强', color: 'primary' }, // 3
  { label: '极强', color: 'success' }, // 4
] as const;
```

### 5. 实时去重校验 (Debounce)

```typescript
import { useDebouncedCallback } from 'use-debounce';

// 在组件中使用
const checkUsername = useDebouncedCallback(async (username: string) => {
  if (username.length < 3) return;
  const res = await fetch(`/api/v1/auth/check-username?username=${username}`);
  const { available } = await res.json();
  if (!available) {
    setError('username', { message: '用户名已被占用' });
  } else {
    clearErrors('username');
  }
}, 500);
```

## 常用 Schema 片段

```typescript
// 分页参数
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// UUID
export const uuidSchema = z.string().uuid('无效的 ID 格式');

// 时间范围
export const dateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
}).refine((d) => d.to >= d.from, { message: '结束时间不能早于开始时间' });

// 文件上传
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= 2 * 1024 * 1024, '文件大小不能超过 2MB')
    .refine(
      (f) => ['image/png', 'image/jpeg', 'image/webp'].includes(f.type),
      '仅支持 PNG、JPEG、WebP 格式',
    ),
});
```
