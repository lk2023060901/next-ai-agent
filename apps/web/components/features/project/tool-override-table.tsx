'use client'

import { useState } from 'react'
import { Search, Monitor, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ApprovalAction } from '@/types/project'

interface ToolDef {
  id: string
  name: string
  category: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  isLocal: boolean
  description: string
}

const TOOLS: ToolDef[] = [
  { id: 'screenshot', name: 'screenshot', category: '屏幕控制', riskLevel: 'low', isLocal: true, description: '截取屏幕图像' },
  { id: 'mouse_click', name: 'mouse_click', category: '屏幕控制', riskLevel: 'medium', isLocal: true, description: '鼠标点击操作' },
  { id: 'keyboard_type', name: 'keyboard_type', category: '键盘输入', riskLevel: 'medium', isLocal: true, description: '模拟键盘输入' },
  { id: 'terminal_exec', name: 'terminal_exec', category: '终端', riskLevel: 'high', isLocal: true, description: '执行 Shell 命令' },
  { id: 'file_read', name: 'file_read', category: '文件系统', riskLevel: 'low', isLocal: true, description: '读取文件内容' },
  { id: 'file_write', name: 'file_write', category: '文件系统', riskLevel: 'high', isLocal: true, description: '写入文件内容' },
  { id: 'file_delete', name: 'file_delete', category: '文件系统', riskLevel: 'critical', isLocal: true, description: '删除文件或目录' },
  { id: 'browser_navigate', name: 'browser_navigate', category: '浏览器', riskLevel: 'low', isLocal: true, description: '浏览器导航' },
  { id: 'http_request', name: 'http_request', category: '网络', riskLevel: 'medium', isLocal: false, description: '发起 HTTP 请求' },
  { id: 'code_execute', name: 'code_execute', category: '代码执行', riskLevel: 'high', isLocal: false, description: '执行代码片段' },
]

const CATEGORIES = ['全部', ...Array.from(new Set(TOOLS.map((t) => t.category)))]

const RISK_COLORS = {
  low: 'bg-[var(--color-success-50)] text-[var(--color-success-700)]',
  medium: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)]',
  high: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]',
  critical: 'bg-[var(--color-danger)] text-white',
}
const RISK_LABELS = { low: '低', medium: '中', high: '高', critical: '严重' }

const ACTION_OPTIONS: { value: ApprovalAction | 'inherit'; label: string }[] = [
  { value: 'inherit', label: '继承' },
  { value: 'auto_approve', label: '自动批准' },
  { value: 'notify_only', label: '仅通知' },
  { value: 'require_approval', label: '需审批' },
  { value: 'always_block', label: '阻止' },
]

interface ToolOverrideTableProps {
  overrides: Record<string, ApprovalAction>
  onChange: (overrides: Record<string, ApprovalAction>) => void
}

export function ToolOverrideTable({ overrides, onChange }: ToolOverrideTableProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')

  const filtered = TOOLS.filter((t) => {
    const matchSearch = !search || t.name.includes(search) || t.description.includes(search)
    const matchCat = category === '全部' || t.category === category
    return matchSearch && matchCat
  })

  function setOverride(toolId: string, action: ApprovalAction | 'inherit') {
    if (action === 'inherit') {
      const next = { ...overrides }
      delete next[toolId]
      onChange(next)
    } else {
      onChange({ ...overrides, [toolId]: action })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工具..."
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] py-2 pl-8 pr-3 text-sm outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={cn('rounded-full border px-3 py-1 text-xs transition-colors',
                category === cat
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-500)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]',
              )}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">工具</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">分类</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">风险</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">执行位置</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">审批覆盖</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tool) => {
              const override = overrides[tool.id]
              return (
                <tr key={tool.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono font-medium text-[var(--text-primary)]">{tool.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{tool.description}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{tool.category}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', RISK_COLORS[tool.riskLevel])}>
                      {RISK_LABELS[tool.riskLevel]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      {tool.isLocal ? <><Monitor size={12} />本地</> : <><Cloud size={12} />云端</>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={override ?? 'inherit'}
                      onChange={(e) => setOverride(tool.id, e.target.value as ApprovalAction | 'inherit')}
                      className={cn(
                        'rounded-[var(--radius-sm)] border px-2 py-1 text-xs outline-none',
                        override
                          ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-600)]'
                          : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)]',
                      )}
                    >
                      {ACTION_OPTIONS.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
