# Skill: Design System Token Implementation (TailwindCSS)

> 将设计令牌转化为 TailwindCSS 4 配置和 CSS 变量，确保代码与设计系统一致。

## 触发条件

当用户要求实现设计令牌、配置主题、调整颜色/字体/间距、实现暗色模式时激活此 Skill。

## 上下文

### 技术栈

- TailwindCSS 4 (CSS-first 配置)
- HeroUI 3 (主题系统基于 CSS 变量)
- next-themes (主题切换: Light / Dark / System)
- CSS 自定义属性 (Design Tokens 映射)

### 主题模式

- **Light**: 亮色主题
- **Dark**: 暗色主题
- **System**: 默认值，跟随操作系统 `prefers-color-scheme`
- 存储: `localStorage` key `theme`，值 `light` | `dark` | `system`
- System 模式下实时响应 OS 偏好变化

## 设计令牌

### 颜色

```css
/* 品牌色 */
--primary-50:  #E6F1FE;
--primary-100: #CCE3FD;
--primary-200: #99C7FB;
--primary-300: #66AAF9;
--primary-400: #338EF7;
--primary-500: #006FEE;  /* 主色 */
--primary-600: #005BC4;
--primary-700: #004493;
--primary-800: #002E62;
--primary-900: #001731;

/* 语义色 */
--success:  #17C964;
--warning:  #F5A524;
--danger:   #F31260;

/* 中性色 (Light) */
--background:     #FFFFFF;
--surface:        #F4F4F5;
--surface-2:      #E4E4E7;
--border:         #E4E4E7;
--border-hover:   #D4D4D8;
--text-primary:   #11181C;
--text-secondary: #71717A;
--text-tertiary:  #A1A1AA;
--disabled:       #D4D4D8;

/* 中性色 (Dark) */
--background:     #000000;
--surface:        #18181B;
--surface-2:      #27272A;
--border:         #3F3F46;
--border-hover:   #52525B;
--text-primary:   #ECEDEE;
--text-secondary: #A1A1AA;
--text-tertiary:  #71717A;
--disabled:       #3F3F46;
```

### 字体

```css
--font-sans: "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace;
```

| 名称 | 大小 | 行高 | 字重 |
|------|------|------|------|
| Display | 36px | 44px | 700 |
| H1 | 30px | 38px | 700 |
| H2 | 24px | 32px | 600 |
| H3 | 20px | 28px | 600 |
| H4 | 16px | 24px | 600 |
| Body-lg | 16px | 24px | 400 |
| Body | 14px | 20px | 400 |
| Body-sm | 13px | 18px | 400 |
| Caption | 12px | 16px | 400 |
| Tiny | 11px | 14px | 500 |
| Code | 13px | 20px | 400 |

### 间距 (基准 4px)

```
space-0: 0px    space-1: 4px    space-2: 8px    space-3: 12px
space-4: 16px   space-5: 20px   space-6: 24px   space-7: 28px
space-8: 32px   space-10: 40px  space-12: 48px  space-16: 64px
```

### 圆角

```
radius-sm: 8px   radius-md: 12px   radius-lg: 14px   radius-full: 9999px
```

### 布局尺寸

```
侧边栏: 240px (展开) / 64px (折叠)
顶栏高度: 64px
内容区最大宽度: 1280px
```

## 生成规则

### 1. TailwindCSS 4 主题配置

```css
/* app/globals.css */
@import "tailwindcss";
@import "@heroui/theme/css";

@theme {
  --font-family-sans: "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: "JetBrains Mono", "Fira Code", monospace;

  --color-primary-50:  #E6F1FE;
  --color-primary-100: #CCE3FD;
  --color-primary-200: #99C7FB;
  --color-primary-300: #66AAF9;
  --color-primary-400: #338EF7;
  --color-primary-500: #006FEE;
  --color-primary-600: #005BC4;
  --color-primary-700: #004493;
  --color-primary-800: #002E62;
  --color-primary-900: #001731;

  --color-success: #17C964;
  --color-warning: #F5A524;
  --color-danger:  #F31260;

  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   14px;
  --radius-full: 9999px;
}
```

### 2. 主题切换实现

```tsx
// app/providers.tsx
'use client';

import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </ThemeProvider>
  );
}
```

```tsx
// components/theme-switcher.tsx
'use client';

import { useTheme } from 'next-themes';
import { RadioGroup, Radio } from '@heroui/react';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <RadioGroup
      value={theme}
      onValueChange={setTheme}
      orientation="horizontal"
      label="主题"
    >
      <Radio value="light" description="亮色"><Sun className="h-4 w-4" /> Light</Radio>
      <Radio value="dark" description="暗色"><Moon className="h-4 w-4" /> Dark</Radio>
      <Radio value="system" description="跟随系统"><Monitor className="h-4 w-4" /> System</Radio>
    </RadioGroup>
  );
}
```

### 3. 暗色适配规则

- 优先使用 HeroUI 语义颜色 (`text-foreground`, `bg-content1`, `bg-default-100`)，自动适配暗色
- 自定义颜色使用 `dark:` 前缀: `bg-white dark:bg-zinc-900`
- 图片/图标避免纯黑纯白，使用 `text-default-500` 等中性色
- 投影: Light 用 `shadow-md`，Dark 用 `shadow-none` + 边框代替

### 4. 字体加载

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansSC = localFont({
  src: '../public/fonts/NotoSansSC-VF.woff2',
  variable: '--font-noto',
});
const jetbrainsMono = localFont({
  src: '../public/fonts/JetBrainsMono-VF.woff2',
  variable: '--font-jetbrains',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansSC.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## 示例

**输入**: "实现紧凑模式，减少间距 25%"

**输出**:

```tsx
// hooks/use-compact-mode.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CompactModeStore = {
  isCompact: boolean;
  toggle: () => void;
};

export const useCompactMode = create<CompactModeStore>()(
  persist(
    (set) => ({
      isCompact: false,
      toggle: () => set((s) => ({ isCompact: !s.isCompact })),
    }),
    { name: 'compact-mode' },
  ),
);
```

```tsx
// app/layout.tsx 中根据紧凑模式添加 CSS class
<body className={cn(
  'font-sans',
  isCompact && 'compact'
)}>
```

```css
/* globals.css */
.compact {
  --spacing-base: 3px; /* 4px * 0.75 = 3px */
}

.compact .gap-4 { gap: 12px; }
.compact .p-4 { padding: 12px; }
.compact .py-3 { padding-top: 9px; padding-bottom: 9px; }
```
