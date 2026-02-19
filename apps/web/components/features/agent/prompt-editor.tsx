'use client'

import { useState } from 'react'
import { Eye, Pencil, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

export interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

interface Template {
  name: string
  category: string
  content: string
}

const TEMPLATES: Template[] = [
  {
    category: 'Analysis',
    name: '需求分析',
    content: `## Role
你是一名需求分析专家。

## Responsibilities
- 理解并拆解用户需求
- 输出结构化需求文档
- 识别潜在的需求冲突

## Process
1. 收集并确认需求背景
2. 分析功能性与非功能性需求
3. 输出优先级排序的需求列表

## Quality Standards
- 每条需求可追溯、可验证
- 使用统一的需求编号格式

## Output Format
Markdown 需求文档，含需求 ID、描述、优先级、验收标准`,
  },
  {
    category: 'Analysis',
    name: '代码审查',
    content: `## Role
你是一名代码审查专家。

## Responsibilities
- 检查代码质量与规范
- 识别潜在 bug 和安全漏洞
- 提出改进建议

## Process
1. 理解代码变更的上下文
2. 逐文件检查变更内容
3. 输出结构化审查报告

## Quality Standards
- 每条建议附带具体代码位置
- 区分 blocker / warning / suggestion

## Output Format
结构化审查报告，按严重程度排序`,
  },
  {
    category: 'Generation',
    name: '前端组件',
    content: `## Role
你是一名前端开发专家，精通 React 和 TypeScript。

## Responsibilities
- 实现高质量的 React 组件
- 确保类型安全和可访问性
- 遵循项目的编码规范

## Process
1. 理解组件需求与设计稿
2. 定义 Props 接口和类型
3. 实现组件逻辑与样式
4. 编写使用示例

## Quality Standards
- TypeScript strict mode 兼容
- 符合 WCAG 2.1 AA 标准
- 响应式设计

## Output Format
完整的 TSX 组件代码`,
  },
  {
    category: 'Generation',
    name: 'API 设计',
    content: `## Role
你是一名后端架构师，专注于 RESTful API 设计。

## Responsibilities
- 设计清晰一致的 API 接口
- 定义请求/响应数据结构
- 处理错误码与鉴权

## Process
1. 梳理业务实体和关系
2. 设计 RESTful 路由和方法
3. 定义数据模型和验证规则
4. 编写 OpenAPI 文档

## Quality Standards
- 遵循 REST 最佳实践
- 统一的分页、过滤、排序接口
- 完整的错误处理

## Output Format
OpenAPI 3.0 YAML 规范`,
  },
  {
    category: 'Validation',
    name: '测试方案',
    content: `## Role
你是一名测试工程师，确保软件质量。

## Responsibilities
- 设计测试策略和用例
- 覆盖功能、边界、异常场景
- 输出可执行的测试脚本

## Process
1. 分析被测功能和需求
2. 设计测试矩阵
3. 编写测试用例
4. 标记优先级和预期结果

## Quality Standards
- 覆盖率 > 80%
- 包含正向和负向测试
- 可重复执行

## Output Format
表格化测试用例文档`,
  },
  {
    category: 'Orchestration',
    name: '任务编排',
    content: `## Role
你是一名任务协调者，负责拆分和分配工作。

## Responsibilities
- 将复杂任务拆分为子任务
- 确定执行顺序和依赖关系
- 分配给合适的 Agent

## Process
1. 理解总体目标
2. 识别关键子任务
3. 建立依赖关系图
4. 按优先级分配

## Quality Standards
- 子任务粒度适中（2-4 小时可完成）
- 依赖关系明确无环
- 每个子任务有明确验收标准

## Output Format
结构化任务列表，含依赖关系和分配方案`,
  },
]

const CATEGORIES = Array.from(new Set(TEMPLATES.map((t) => t.category)))

export function PromptEditor({
  value,
  onChange,
  placeholder = '输入系统提示词...',
  minHeight = 200,
}: PromptEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [showTemplates, setShowTemplates] = useState(false)

  const tokenCount = Math.ceil(value.length / 3)

  function applyTemplate(template: Template) {
    onChange(template.content)
    setShowTemplates(false)
    setMode('edit')
  }

  return (
    <div className="relative flex flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('edit')}
            aria-pressed={mode === 'edit'}
            className={cn(
              'inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium transition-colors',
              mode === 'edit'
                ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-500)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            <Pencil size={12} />
            编辑
          </button>
          <button
            onClick={() => setMode('preview')}
            aria-pressed={mode === 'preview'}
            className={cn(
              'inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium transition-colors',
              mode === 'preview'
                ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-500)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            <Eye size={12} />
            预览
          </button>
        </div>
        <button
          onClick={() => setShowTemplates((v) => !v)}
          aria-label="模板面板"
          aria-expanded={showTemplates}
          className={cn(
            'inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium transition-colors',
            showTemplates
              ? 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          )}
        >
          <Zap size={12} />
          模板
        </button>
      </div>

      {/* Template panel */}
      {showTemplates && (
        <div className="border-b border-[var(--border)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-primary)]">提示词模板</span>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  {cat}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.filter((t) => t.category === cat).map((t) => (
                    <Button
                      key={t.name}
                      variant="secondary"
                      size="sm"
                      onClick={() => applyTemplate(t)}
                    >
                      {t.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor / Preview */}
      {mode === 'edit' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          aria-label="系统提示词"
          className="flex-1 resize-y bg-transparent p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="flex-1 overflow-auto whitespace-pre-wrap p-3 text-sm text-[var(--text-primary)]"
        >
          {value || <span className="text-[var(--text-tertiary)]">暂无内容</span>}
        </div>
      )}

      {/* Token counter */}
      <div className="flex justify-end border-t border-[var(--border)] px-3 py-1.5">
        <span className="text-xs text-[var(--text-tertiary)]">
          ~{tokenCount.toLocaleString()} tokens
        </span>
      </div>
    </div>
  )
}
