'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TriggerExample } from '@/types/api'

export interface TriggerExampleEditorProps {
  examples: TriggerExample[]
  onChange: (examples: TriggerExample[]) => void
}

const MAX_EXAMPLES = 4

export function TriggerExampleEditor({ examples, onChange }: TriggerExampleEditorProps) {
  function addExample() {
    if (examples.length >= MAX_EXAMPLES) return
    onChange([...examples, { user: '', assistant: '' }])
  }

  function removeExample(index: number) {
    onChange(examples.filter((_, i) => i !== index))
  }

  function updateExample(index: number, field: keyof TriggerExample, value: string) {
    onChange(examples.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)))
  }

  return (
    <div className="space-y-4">
      {examples.map((ex, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">示例 {i + 1}</span>
            <button
              type="button"
              onClick={() => removeExample(i)}
              aria-label={`删除示例 ${i + 1}`}
              className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--color-danger)]"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label
                htmlFor={`trigger-user-${i}`}
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                用户输入
              </label>
              <textarea
                id={`trigger-user-${i}`}
                aria-label={`示例 ${i + 1} 用户输入`}
                value={ex.user}
                onChange={(e) => updateExample(i, 'user', e.target.value)}
                rows={2}
                placeholder="用户会说什么..."
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor={`trigger-assistant-${i}`}
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                期望响应
              </label>
              <textarea
                id={`trigger-assistant-${i}`}
                aria-label={`示例 ${i + 1} 期望响应`}
                value={ex.assistant}
                onChange={(e) => updateExample(i, 'assistant', e.target.value)}
                rows={2}
                placeholder="Agent 应如何回复..."
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      ))}

      {examples.length < MAX_EXAMPLES && (
        <Button type="button" variant="secondary" size="sm" onClick={addExample}>
          <Plus size={14} />
          添加示例
        </Button>
      )}

      {examples.length === 0 && (
        <p className="py-4 text-center text-xs text-[var(--text-tertiary)]">
          添加触发示例帮助 Agent 理解期望的交互模式
        </p>
      )}
    </div>
  )
}
