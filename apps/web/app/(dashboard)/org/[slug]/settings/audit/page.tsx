'use client'

import { useState } from 'react'
import { Search, UserPlus, Settings, Trash2, LogIn, Key, Terminal, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type AuditAction =
  | 'member_invite'
  | 'member_remove'
  | 'settings_update'
  | 'login'
  | 'api_key_create'
  | 'api_key_delete'
  | 'tool_call'
  | 'bash_exec'

interface AuditEntry {
  id: string
  action: AuditAction
  actor: string
  target?: string
  createdAt: string
  ip: string
  toolName?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  approvalResult?: 'auto' | 'approved' | 'denied' | 'blocked'
}

const ACTION_META: Record<AuditAction, { label: string; icon: React.ReactNode; color: string }> = {
  member_invite: {
    label: '邀请成员',
    icon: <UserPlus size={14} />,
    color: 'text-[var(--color-primary-500)]',
  },
  member_remove: {
    label: '移除成员',
    icon: <Trash2 size={14} />,
    color: 'text-[var(--color-danger)]',
  },
  settings_update: {
    label: '更新设置',
    icon: <Settings size={14} />,
    color: 'text-[var(--text-secondary)]',
  },
  login: { label: '登录', icon: <LogIn size={14} />, color: 'text-[var(--color-success)]' },
  api_key_create: {
    label: '创建 API 密钥',
    icon: <Key size={14} />,
    color: 'text-[var(--color-primary-500)]',
  },
  api_key_delete: {
    label: '删除 API 密钥',
    icon: <Trash2 size={14} />,
    color: 'text-[var(--color-danger)]',
  },
  tool_call: { label: '工具调用', icon: <Globe size={14} />, color: 'text-[var(--color-warning)]' },
  bash_exec: {
    label: '命令执行',
    icon: <Terminal size={14} />,
    color: 'text-[var(--color-danger)]',
  },
}

const RISK_BADGE: Record<string, string> = {
  low: 'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
}
const RISK_LABEL: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '极高' }

const APPROVAL_BADGE: Record<string, string> = {
  auto: 'bg-[var(--surface-2)] text-[var(--text-tertiary)]',
  approved: 'bg-green-50 text-green-700',
  denied: 'bg-red-50 text-red-700',
  blocked: 'bg-red-50 text-red-700',
}
const APPROVAL_LABEL: Record<string, string> = {
  auto: '自动',
  approved: '已批准',
  denied: '已拒绝',
  blocked: '已阻断',
}

const MOCK_LOGS: AuditEntry[] = [
  { id: '1', action: 'login', actor: '张三', createdAt: '2025-12-20 14:32', ip: '192.168.1.1' },
  {
    id: '2',
    action: 'member_invite',
    actor: '张三',
    target: 'newuser@example.com',
    createdAt: '2025-12-20 11:15',
    ip: '192.168.1.1',
  },
  {
    id: '3',
    action: 'settings_update',
    actor: '张三',
    target: '组织名称',
    createdAt: '2025-12-19 16:44',
    ip: '192.168.1.2',
  },
  {
    id: '4',
    action: 'api_key_create',
    actor: '李四',
    target: '生产环境密钥',
    createdAt: '2025-12-18 09:00',
    ip: '10.0.0.5',
  },
  {
    id: '5',
    action: 'member_remove',
    actor: '张三',
    target: '前员工',
    createdAt: '2025-12-17 17:22',
    ip: '192.168.1.1',
  },
  {
    id: '6',
    action: 'api_key_delete',
    actor: '张三',
    target: '旧密钥',
    createdAt: '2025-12-16 10:05',
    ip: '192.168.1.1',
  },
  // Tool call entries with extended fields
  {
    id: '7',
    action: 'tool_call',
    actor: '前端开发 Agent',
    target: '读取配置文件',
    createdAt: '2025-12-20 15:10',
    ip: '127.0.0.1',
    toolName: 'read_file',
    riskLevel: 'low',
    approvalResult: 'auto',
  },
  {
    id: '8',
    action: 'bash_exec',
    actor: '测试 Agent',
    target: '运行测试套件',
    createdAt: '2025-12-20 14:55',
    ip: '127.0.0.1',
    toolName: 'bash_exec',
    riskLevel: 'medium',
    approvalResult: 'approved',
  },
  {
    id: '9',
    action: 'tool_call',
    actor: '后端开发 Agent',
    target: '写入数据库配置',
    createdAt: '2025-12-20 14:20',
    ip: '127.0.0.1',
    toolName: 'write_file',
    riskLevel: 'medium',
    approvalResult: 'approved',
  },
  {
    id: '10',
    action: 'bash_exec',
    actor: '运维 Agent',
    target: '终止进程',
    createdAt: '2025-12-19 22:30',
    ip: '127.0.0.1',
    toolName: 'kill_process',
    riskLevel: 'high',
    approvalResult: 'denied',
  },
  {
    id: '11',
    action: 'tool_call',
    actor: '协调 Agent',
    target: '调用外部 API',
    createdAt: '2025-12-19 18:00',
    ip: '127.0.0.1',
    toolName: 'http_request',
    riskLevel: 'low',
    approvalResult: 'auto',
  },
]

const ACTION_FILTER = [
  { value: '', label: '全部操作' },
  ...Object.entries(ACTION_META).map(([k, v]) => ({ value: k, label: v.label })),
]

const RISK_FILTER = [
  { value: '', label: '全部风险' },
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' },
  { value: 'critical', label: '极高风险' },
]

const APPROVAL_FILTER = [
  { value: '', label: '全部审批' },
  { value: 'auto', label: '自动' },
  { value: 'approved', label: '已批准' },
  { value: 'denied', label: '已拒绝' },
  { value: 'blocked', label: '已阻断' },
]

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')

  const filtered = MOCK_LOGS.filter((log) => {
    const matchSearch =
      !search ||
      log.actor.includes(search) ||
      (log.target ?? '').includes(search) ||
      (log.toolName ?? '').includes(search)
    const matchAction = !actionFilter || log.action === actionFilter
    const matchRisk = !riskFilter || log.riskLevel === riskFilter
    const matchApproval = !approvalFilter || log.approvalResult === approvalFilter
    return matchSearch && matchAction && matchRisk && matchApproval
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">审计日志</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">组织内的所有重要操作记录</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索操作人、目标或工具..."
          leftIcon={<Search size={14} />}
          fullWidth
        />
        <div className="w-36 shrink-0">
          <Select
            options={ACTION_FILTER}
            value={actionFilter}
            onChange={(v) => setActionFilter(String(v))}
            fullWidth
          />
        </div>
        <div className="w-28 shrink-0">
          <Select
            options={RISK_FILTER}
            value={riskFilter}
            onChange={(v) => setRiskFilter(String(v))}
            fullWidth
          />
        </div>
        <div className="w-28 shrink-0">
          <Select
            options={APPROVAL_FILTER}
            value={approvalFilter}
            onChange={(v) => setApprovalFilter(String(v))}
            fullWidth
          />
        </div>
      </div>

      <div className="relative space-y-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">无匹配记录</p>
        ) : (
          filtered.map((log, i) => {
            const meta = ACTION_META[log.action]
            const isToolEntry = !!log.toolName
            return (
              <div
                key={log.id}
                className={`flex items-start gap-4 px-4 py-3 ${
                  i < filtered.length - 1 ? 'border-b border-[var(--border)]' : ''
                } transition-colors hover:bg-[var(--surface)]`}
              >
                <div className={`mt-0.5 shrink-0 ${meta.color}`}>{meta.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-[var(--text-primary)]">
                      <span className="font-medium">{log.actor}</span> {meta.label}
                      {log.target && (
                        <span className="text-[var(--text-secondary)]">：{log.target}</span>
                      )}
                    </p>
                    {isToolEntry && (
                      <>
                        <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs text-[var(--text-primary)]">
                          {log.toolName}
                        </code>
                        {log.riskLevel && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_BADGE[log.riskLevel] ?? ''}`}
                          >
                            {RISK_LABEL[log.riskLevel] ?? log.riskLevel}
                          </span>
                        )}
                        {log.approvalResult && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${APPROVAL_BADGE[log.approvalResult] ?? ''}`}
                          >
                            {APPROVAL_LABEL[log.approvalResult] ?? log.approvalResult}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {log.createdAt} · IP {log.ip}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
