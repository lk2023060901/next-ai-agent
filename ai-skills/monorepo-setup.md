# Skill: Monorepo Project Setup (pnpm workspace)

> 初始化或扩展 pnpm Monorepo，包含工作区配置、共享包、构建管道。

## 触发条件

当用户要求初始化项目、创建新的子包/服务、配置 Monorepo 工作区时激活此 Skill。

## 上下文

### 技术栈

- pnpm 9.x (包管理器)
- Turborepo (构建管道编排)
- TypeScript 5.6+ (项目引用)
- ESLint 9 (Flat Config)
- Prettier 3.x

### Monorepo 结构

```
nextai-agent/
├── apps/           # 应用程序 (web, desktop, miniapp)
├── services/       # 后端微服务
├── packages/       # 共享包 (database, shared-types, ui, logger, config, utils)
├── scripts/        # 脚本工具
├── docker/         # Docker 配置
├── k8s/            # Kubernetes 配置
└── docs/           # 项目文档
```

## 生成规则

### 1. 根配置文件

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'services/*'
```

```json
// package.json (根)
{
  "name": "nextai-agent",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "test:ci": "turbo test -- --coverage",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "clean": "turbo clean && rm -rf node_modules",
    "db:generate": "pnpm --filter @nextai/database generate",
    "db:migrate": "pnpm --filter @nextai/database migrate",
    "db:push": "pnpm --filter @nextai/database push"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "prettier": "^3.3.0",
    "turbo": "^2.3.0",
    "typescript": "^5.6.0"
  },
  "packageManager": "pnpm@9.14.0",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### 2. Turborepo 配置

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env", "tsconfig.base.json"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 3. TypeScript 基础配置

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2024"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 4. 共享包模板

```json
// packages/{package-name}/package.json
{
  "name": "@nextai/{package-name}",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

```json
// packages/{package-name}/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

### 5. ESLint 配置 (Flat Config)

```javascript
// eslint.config.js (根)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { react: reactPlugin, 'react-hooks': hooksPlugin },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    ignores: ['**/dist', '**/.next', '**/node_modules', '**/coverage'],
  },
);
```

### 6. Prettier 配置

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 7. Git Hooks (Husky + lint-staged)

```json
// package.json 中添加
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{md,json,yaml}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
pnpm lint-staged

# .husky/commit-msg
pnpm commitlint --edit $1
```

### 8. 新增子包/服务流程

创建新的共享包：

```bash
mkdir -p packages/{name}/src
# 创建 package.json, tsconfig.json, src/index.ts
# 在其他包中引用: pnpm add @nextai/{name} --filter @nextai/web
```

创建新的服务：

```bash
mkdir -p services/{name}/src
# 创建 package.json, tsconfig.json, Dockerfile, src/index.ts
# 添加到 docker-compose.dev.yml
# 添加到 k8s/base/{name}/
```

## 示例

**输入**: "创建一个新的共享包 @nextai/ai-sdk，封装 Vercel AI SDK 调用"

**输出**: 生成 `packages/ai-sdk/` 目录，包含 package.json、tsconfig.json、src/index.ts 入口和基础导出结构。
