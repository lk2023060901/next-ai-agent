'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Terminal, FileText, Globe, Cpu, Plug, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ToolCall } from '@/types/api'

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  file: <FileText size={13} />,
  browser: <Globe size={13} />,
  terminal: <Terminal size={13} />,
  system: <Cpu size={13} />,
  api: <Plug size={13} />,
}

const RISK_STYLES: Record<string, string> = {
  low: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
  medium: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20',
  high: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20',
  critical: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

const RISK_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '危险',
}

interface ToolCallCardProps {
  toolCall: ToolCall
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)

  const statusIcon =
    toolCall.status === 'running' ? (
      <Loader2 size={13} className="animate-spin text-[var(--color-warning)]" />
    ) : toolCall.status === 'success' ? (
      <CheckCircle2 size={13} className="text-[var(--color-success)]" />
    ) : (
      <XCircle size={13} className="text-[var(--color-danger)]" />
    )

  return (
    <div className="my-2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--surface-2)] transition-colors"
      >
        <span className="text-[var(--text-tertiary)]">
          {CATEGORY_ICON[toolCall.category] ?? <Plug size={13} />}
        </span>
        <span className="flex-1 truncate font-mono text-xs font-medium text-[var(--text-primary)]">
          {toolCall.name}
        </span>

        {/* Badges */}
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 text-[10px] font-medium',
            RISK_STYLES[toolCall.riskLevel] ?? RISK_STYLES['low'],
          )}
        >
          {RISK_LABELS[toolCall.riskLevel] ?? toolCall.riskLevel}
        </span>
        <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
          {toolCall.isLocal ? '本地' : '云端'}
        </span>

        {statusIcon}

        <span className="text-[var(--text-tertiary)]">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-3 py-2 space-y-2">
          {/* Params */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              参数
            </p>
            <pre className="overflow-x-auto rounded bg-[var(--bg)] p-2 text-xs text-[var(--text-secondary)]">
              {JSON.stringify(toolCall.params, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {(toolCall.result !== undefined || toolCall.errorMessage !== undefined) && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {toolCall.status === 'error' ? '错误' : '结果'}
              </p>
              <pre
                className={cn(
                  'overflow-x-auto rounded p-2 text-xs',
                  toolCall.status === 'error'
                    ? 'bg-[var(--color-danger)]/5 text-[var(--color-danger)]'
                    : 'bg-[var(--bg)] text-[var(--text-secondary)]',
                )}
              >
                {toolCall.errorMessage ?? toolCall.result}
              </pre>
            </div>
          )}

          {toolCall.status === 'running' && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <AlertTriangle size={11} />
              执行中，请稍候…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
