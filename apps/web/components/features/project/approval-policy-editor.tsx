'use client'

import { useState } from 'react'
import { Check, Zap, Lock, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type {
  ProjectApprovalPolicy,
  ApprovalMode,
  RiskLevel,
  ApprovalAction,
} from '@/types/project'
import { POLICY_TEMPLATES } from '@/types/project'

interface ApprovalPolicyEditorProps {
  value: ProjectApprovalPolicy
  onChange: (policy: ProjectApprovalPolicy) => void
}

const MODE_OPTIONS: { value: ApprovalMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'auto', label: '全自动', desc: '不中断执行', icon: <Zap size={16} /> },
  { value: 'supervised', label: '监督模式', desc: '按风险策略决定', icon: <Sliders size={16} /> },
  { value: 'locked', label: '锁定', desc: '暂停所有执行', icon: <Lock size={16} /> },
]

const RISK_LEVELS: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'low', label: '低风险', color: 'text-[var(--color-success)]' },
  { value: 'medium', label: '中风险', color: 'text-[var(--color-warning)]' },
  { value: 'high', label: '高风险', color: 'text-[var(--color-danger)]' },
  { value: 'critical', label: '严重', color: 'text-[var(--color-danger)]' },
]

const ACTION_OPTIONS: { value: ApprovalAction; label: string; badge: string }[] = [
  { value: 'auto_approve', label: '自动批准', badge: 'bg-[var(--color-success-50)] text-[var(--color-success-700)]' },
  { value: 'notify_only', label: '仅通知', badge: 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' },
  { value: 'require_approval', label: '需审批', badge: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)]' },
  { value: 'always_block', label: '永远阻止', badge: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]' },
]

function ActionBadge({ action }: { action: ApprovalAction }) {
  const opt = ACTION_OPTIONS.find((a) => a.value === action)
  if (!opt) return null
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', opt.badge)}>
      {opt.label}
    </span>
  )
}

export function ApprovalPolicyEditor({ value, onChange }: ApprovalPolicyEditorProps) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  function applyTemplate(key: string) {
    const t = POLICY_TEMPLATES[key]
    if (!t) return
    setActiveTemplate(key)
    onChange(t.policy)
  }

  function setMode(mode: ApprovalMode) {
    onChange({ ...value, mode })
    setActiveTemplate(null)
  }

  function setRiskAction(risk: RiskLevel, action: ApprovalAction) {
    onChange({ ...value, riskPolicies: { ...value.riskPolicies, [risk]: action } })
    setActiveTemplate(null)
  }

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div>
        <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">快速模板</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(POLICY_TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => applyTemplate(key)}
              className={cn(
                'flex flex-col gap-1 rounded-[var(--radius-md)] border p-3 text-left text-sm transition-colors',
                activeTemplate === key
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-600)]'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]',
              )}
            >
              <span className="font-medium">{t.label}</span>
              <span className="text-xs text-[var(--text-tertiary)]">{t.desc}</span>
              {activeTemplate === key && <Check size={12} className="self-end" />}
            </button>
          ))}
        </div>
      </div>

      {/* Global mode */}
      <div>
        <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">全局模式</p>
        <div className="flex gap-2">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm transition-colors',
                value.mode === m.value
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-500)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]',
              )}
            >
              {m.icon}
              <div className="text-left">
                <div className="font-medium">{m.label}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Risk-level policies */}
      {value.mode === 'supervised' && (
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">风险等级策略</p>
          <div className="divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--border)]">
            {RISK_LEVELS.map((risk) => (
              <div key={risk.value} className="flex items-center justify-between px-4 py-3">
                <span className={cn('text-sm font-medium', risk.color)}>{risk.label}</span>
                <div className="flex gap-1.5">
                  {ACTION_OPTIONS.map((action) => (
                    <button
                      key={action.value}
                      onClick={() => setRiskAction(risk.value, action.value)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                        value.riskPolicies[risk.value] === action.value
                          ? `${action.badge} border-transparent`
                          : 'border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--border-hover)]',
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-[var(--radius-md)] bg-[var(--surface)] p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">当前策略摘要</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-[var(--text-secondary)]">模式：</span>
          <span className="font-medium text-[var(--text-primary)]">{MODE_OPTIONS.find((m) => m.value === value.mode)?.label}</span>
          {value.mode === 'supervised' && (
            <>
              <span className="text-[var(--text-tertiary)]">·</span>
              {RISK_LEVELS.map((r) => (
                <span key={r.value} className="flex items-center gap-1">
                  <span className={r.color}>{r.label}:</span>
                  <ActionBadge action={value.riskPolicies[r.value]} />
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
