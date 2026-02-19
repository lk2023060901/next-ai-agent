export type ApprovalMode = 'auto' | 'supervised' | 'locked'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ApprovalAction = 'auto_approve' | 'notify_only' | 'require_approval' | 'always_block'

export interface RiskPolicy {
  low: ApprovalAction
  medium: ApprovalAction
  high: ApprovalAction
  critical: ApprovalAction
}

export interface ProjectApprovalPolicy {
  mode: ApprovalMode
  riskPolicies: RiskPolicy
  toolOverrides: Record<string, ApprovalAction>
  categoryOverrides: Record<string, ApprovalAction>
}

export const POLICY_TEMPLATES: Record<string, { label: string; desc: string; policy: ProjectApprovalPolicy }> = {
  full_auto: {
    label: '全自动模式',
    desc: '所有操作自动执行，适合受信任的开发环境',
    policy: {
      mode: 'auto',
      riskPolicies: { low: 'auto_approve', medium: 'auto_approve', high: 'notify_only', critical: 'require_approval' },
      toolOverrides: {},
      categoryOverrides: {},
    },
  },
  dev_mode: {
    label: '开发模式',
    desc: '中低风险自动执行，高风险需审批',
    policy: {
      mode: 'supervised',
      riskPolicies: { low: 'auto_approve', medium: 'notify_only', high: 'require_approval', critical: 'always_block' },
      toolOverrides: {},
      categoryOverrides: {},
    },
  },
  strict: {
    label: '严格模式',
    desc: '所有操作都需人工确认',
    policy: {
      mode: 'supervised',
      riskPolicies: { low: 'notify_only', medium: 'require_approval', high: 'require_approval', critical: 'always_block' },
      toolOverrides: {},
      categoryOverrides: {},
    },
  },
  observe: {
    label: '观察模式',
    desc: '仅查看，禁止执行任何操作',
    policy: {
      mode: 'locked',
      riskPolicies: { low: 'always_block', medium: 'always_block', high: 'always_block', critical: 'always_block' },
      toolOverrides: {},
      categoryOverrides: {},
    },
  },
}

export const DEFAULT_POLICY: ProjectApprovalPolicy = POLICY_TEMPLATES['dev_mode']!.policy
