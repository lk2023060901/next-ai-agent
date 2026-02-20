import type {
  PricingPlan,
  Subscription,
  Invoice,
  PaymentMethod,
  UsageAlert,
  InvoiceStatus,
} from '@/types/api'

let invoiceSeq = 1

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: '免费版',
    description: '适合个人探索与小型项目',
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    limits: { agents: 3, tokensPerMonth: 100_000, members: 3, storageMb: 500 },
    features: ['3 个 Agent', '10万 Token/月', '3 名成员', '500MB 存储', '社区支持'],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: '适合快速增长的团队',
    monthlyPrice: 9900,
    yearlyPrice: 7900,
    popular: true,
    limits: { agents: 10, tokensPerMonth: 1_000_000, members: 10, storageMb: 5000 },
    features: [
      '10 个 Agent',
      '100万 Token/月',
      '10 名成员',
      '5GB 存储',
      '优先邮件支持',
      '高级分析',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    description: '适合大型研发团队',
    monthlyPrice: 29900,
    yearlyPrice: 23900,
    popular: false,
    limits: { agents: 50, tokensPerMonth: 5_000_000, members: -1, storageMb: 50_000 },
    features: [
      '50 个 Agent',
      '500万 Token/月',
      '无限成员',
      '50GB 存储',
      'RBAC 权限',
      'SSO',
      '专属支持',
    ],
  },
  {
    id: 'enterprise',
    name: '企业版',
    description: '适合大型企业与私有部署',
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    limits: { agents: -1, tokensPerMonth: -1, members: -1, storageMb: -1 },
    features: [
      '无限 Agent',
      '无限 Token',
      '无限成员',
      '无限存储',
      '私有部署',
      'SLA 99.9%',
      '专属客户经理',
    ],
  },
]

export function makeSubscription(orgId: string): Subscription {
  return {
    id: `sub-${orgId}`,
    orgId,
    planId: 'pro',
    status: 'active',
    cycle: 'monthly',
    currentPeriodStart: daysAgo(15),
    currentPeriodEnd: daysFromNow(15),
    cancelAtPeriodEnd: false,
  }
}

const INVOICE_DESCRIPTIONS = [
  'Pro 套餐 - 月度订阅',
  'Pro 套餐 - 月度订阅',
  'Pro 套餐 - 月度订阅',
  'Free → Pro 升级差价',
  'Pro 套餐 - 月度订阅',
  'Pro 套餐 - 月度订阅',
]

const INVOICE_STATUSES: InvoiceStatus[] = ['paid', 'paid', 'paid', 'paid', 'pending', 'paid']

export function makeInvoiceList(orgId: string, count = 6): Invoice[] {
  return Array.from({ length: count }, (_, i) => {
    const daysBack = i * 30
    const status = INVOICE_STATUSES[i % INVOICE_STATUSES.length]!
    return {
      id: `inv-${invoiceSeq++}`,
      orgId,
      amount: 9900,
      status,
      description: INVOICE_DESCRIPTIONS[i % INVOICE_DESCRIPTIONS.length]!,
      periodStart: daysAgo(daysBack + 30),
      periodEnd: daysAgo(daysBack),
      ...(status === 'paid' ? { paidAt: daysAgo(daysBack) } : {}),
      createdAt: daysAgo(daysBack + 30),
    }
  })
}

export function makePaymentMethodList(): PaymentMethod[] {
  return [
    {
      id: 'pm-1',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2027,
      isDefault: true,
    },
    {
      id: 'pm-2',
      type: 'card',
      brand: 'Mastercard',
      last4: '5353',
      expMonth: 8,
      expYear: 2026,
      isDefault: false,
    },
  ]
}

export function makeUsageAlerts(orgId: string): UsageAlert[] {
  return [
    {
      id: `alert-${orgId}-1`,
      orgId,
      metric: 'tokens',
      threshold: 800000,
      notifyEmail: true,
      notifyInApp: true,
      enabled: true,
    },
    {
      id: `alert-${orgId}-2`,
      orgId,
      metric: 'api_calls',
      threshold: 10000,
      notifyEmail: false,
      notifyInApp: true,
      enabled: false,
    },
    {
      id: `alert-${orgId}-3`,
      orgId,
      metric: 'cost',
      threshold: 8000,
      notifyEmail: true,
      notifyInApp: false,
      enabled: true,
    },
  ]
}
