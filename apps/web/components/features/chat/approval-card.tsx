'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, ShieldCheck, ShieldX, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ApprovalRequest } from '@/types/api'

const RISK_STYLES: Record<string, { border: string; bg: string; icon: string; label: string }> = {
  medium: {
    border: 'border-[var(--color-warning)]/40',
    bg: 'bg-[var(--color-warning)]/5',
    icon: 'text-[var(--color-warning)]',
    label: '中风险',
  },
  high: {
    border: 'border-[var(--color-danger)]/40',
    bg: 'bg-[var(--color-danger)]/5',
    icon: 'text-[var(--color-danger)]',
    label: '高风险',
  },
  critical: {
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/5',
    icon: 'text-purple-500',
    label: '危险',
  },
}

function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  )

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [remaining])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return { remaining, label: `${minutes}:${String(seconds).padStart(2, '0')}` }
}

interface ApprovalCardProps {
  approval: ApprovalRequest
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}

export function ApprovalCard({ approval, onApprove, onReject }: ApprovalCardProps) {
  const style = RISK_STYLES[approval.riskLevel] ?? RISK_STYLES['medium']!
  const { remaining, label: countdown } = useCountdown(approval.expiresAt)

  const expired = remaining === 0 && approval.status === 'pending'
  const effectiveStatus = expired ? 'expired' : approval.status

  return (
    <div
      className={cn(
        'my-2 overflow-hidden rounded-[var(--radius-md)] border',
        style.border,
        style.bg,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <ShieldAlert size={14} className={style.icon} />
        <span className="flex-1 text-xs font-semibold text-[var(--text-primary)]">
          需要审批 · <span className="font-mono">{approval.toolName}</span>
        </span>
        {/* Risk badge */}
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 text-[10px] font-medium',
            style.icon,
            style.border,
          )}
        >
          {style.label}
        </span>
        {/* Policy source */}
        <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
          {approval.policySource}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2">
        <p className="text-xs text-[var(--text-secondary)]">{approval.reason}</p>

        {/* Params preview */}
        <pre className="overflow-x-auto rounded bg-[var(--bg)] p-2 text-xs text-[var(--text-secondary)]">
          {JSON.stringify(approval.params, null, 2)}
        </pre>

        {/* Footer: countdown + buttons */}
        {effectiveStatus === 'pending' && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex flex-1 items-center gap-1 text-xs text-[var(--text-tertiary)]">
              <Clock size={11} />
              <span>
                {remaining > 0 ? `剩余 ${countdown}` : '已超时'}
              </span>
            </div>
            <button
              onClick={() => onReject?.(approval.id)}
              className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <ShieldX size={12} />
              拒绝
            </button>
            <button
              onClick={() => onApprove?.(approval.id)}
              className="flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--color-success)] px-3 py-1.5 text-xs text-white hover:opacity-90 transition-opacity"
            >
              <ShieldCheck size={12} />
              批准
            </button>
          </div>
        )}

        {effectiveStatus === 'approved' && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-[var(--color-success)]">
            <ShieldCheck size={13} />
            已批准
          </div>
        )}

        {effectiveStatus === 'rejected' && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-[var(--color-danger)]">
            <ShieldX size={13} />
            已拒绝
          </div>
        )}

        {effectiveStatus === 'expired' && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-[var(--text-tertiary)]">
            <Clock size={13} />
            已超时，操作取消
          </div>
        )}
      </div>
    </div>
  )
}
