'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { CreditCard, Download, Shield, Zap, Users, HardDrive } from 'lucide-react'
import { Tabs } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import {
  useSubscription,
  useInvoices,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
  useDeletePaymentMethod,
  useUsageAlerts,
  useUpdateUsageAlert,
} from '@/hooks/use-billing'
import type { PricingPlan, Invoice, UsageAlert } from '@/types/api'
import { PLANS } from '@/mocks/factories/billing.factory'

const STATUS_BADGE: Record<string, string> = {
  active:
    'bg-[var(--color-success-50)] text-[var(--color-success)] border border-[var(--color-success)]',
  trial: 'bg-blue-50 text-blue-600 border border-blue-300',
  past_due: 'bg-red-50 text-red-600 border border-red-300',
  cancelled: 'bg-[var(--surface-2)] text-[var(--text-tertiary)] border border-[var(--border)]',
}

const INVOICE_STATUS_BADGE: Record<string, string> = {
  paid: 'bg-[var(--color-success-50)] text-[var(--color-success)]',
  pending: 'bg-yellow-50 text-yellow-600',
  failed: 'bg-red-50 text-red-600',
}

const METRIC_LABEL: Record<string, string> = {
  tokens: 'Token 用量',
  api_calls: 'API 调用次数',
  cost: '消费金额',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN')
}

function formatAmount(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`
}

function getPlanInfo(planId: string): PricingPlan | undefined {
  return PLANS.find((p) => p.id === planId)
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ orgId }: { orgId: string }) {
  const { data: sub } = useSubscription(orgId)
  const [showCancel, setShowCancel] = useState(false)

  if (!sub)
    return <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">加载中...</div>

  const plan = getPlanInfo(sub.planId)
  const limits = plan?.limits

  const usageItems = [
    {
      icon: <Zap size={14} />,
      label: 'Token 用量',
      used: 650000,
      limit: limits?.tokensPerMonth ?? 0,
      unit: '',
    },
    { icon: <Shield size={14} />, label: 'API 调用', used: 3200, limit: 10000, unit: '' },
    {
      icon: <Users size={14} />,
      label: '团队成员',
      used: 5,
      limit: limits?.members ?? 0,
      unit: '人',
    },
    {
      icon: <HardDrive size={14} />,
      label: '存储空间',
      used: 1200,
      limit: limits?.storageMb ?? 0,
      unit: 'MB',
    },
  ]

  return (
    <div className="space-y-6 pt-6">
      {/* Current Plan */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {plan?.name ?? sub.planId}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[sub.status] ?? ''}`}
              >
                {sub.status === 'active'
                  ? '正常'
                  : sub.status === 'trial'
                    ? '试用中'
                    : sub.status === 'past_due'
                      ? '欠费'
                      : '已取消'}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              当前周期：{formatDate(sub.currentPeriodStart)} — {formatDate(sub.currentPeriodEnd)}
              {sub.cancelAtPeriodEnd && ' · 周期结束后取消'}
            </p>
          </div>
          <Button variant="primary" size="sm">
            升级套餐
          </Button>
        </div>
      </Card>

      {/* Usage */}
      <Card header={<h3 className="text-sm font-medium text-[var(--text-primary)]">用量概览</h3>}>
        <div className="space-y-4">
          {usageItems.map((item) => {
            const unlimited = item.limit === -1
            const pct = unlimited ? 0 : Math.min(100, Math.round((item.used / item.limit) * 100))
            return (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <span className="text-[var(--text-tertiary)]">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-[var(--text-primary)]">
                    {item.used.toLocaleString()}
                    {unlimited ? ' / 无限' : ` / ${item.limit.toLocaleString()}${item.unit}`}
                  </span>
                </div>
                {!unlimited && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-[var(--color-danger)]' : pct > 70 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-primary-500)]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Cancel */}
      {!sub.cancelAtPeriodEnd && (
        <div className="text-right">
          <button
            onClick={() => setShowCancel(true)}
            className="text-xs text-[var(--text-tertiary)] underline hover:text-[var(--color-danger)]"
          >
            取消订阅
          </button>
        </div>
      )}

      <Modal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="取消订阅"
        description="取消后当前周期结束前仍可使用，到期不再续费。确认取消？"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowCancel(false)}>
              返回
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowCancel(false)}>
              确认取消
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          订阅将在 <strong>{formatDate(sub.currentPeriodEnd)}</strong> 到期后自动取消。
        </p>
      </Modal>
    </div>
  )
}

// ─── Invoices Tab ─────────────────────────────────────────────────────────────

function InvoicesTab({ orgId }: { orgId: string }) {
  const { data: invoices, isLoading } = useInvoices(orgId)

  if (isLoading)
    return <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">加载中...</div>
  if (!invoices?.length)
    return <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">暂无账单</div>

  return (
    <div className="pt-6">
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                创建日期
              </th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">账期</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">描述</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">
                金额
              </th>
              <th className="px-4 py-3 text-center font-medium text-[var(--text-secondary)]">
                状态
              </th>
              <th className="px-4 py-3 text-center font-medium text-[var(--text-secondary)]">
                下载
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv: Invoice, i: number) => (
              <tr
                key={inv.id}
                className={`${i < invoices.length - 1 ? 'border-b border-[var(--border)]' : ''} transition-colors hover:bg-[var(--surface)]`}
              >
                <td className="px-4 py-3 text-[var(--text-primary)]">
                  {formatDate(inv.createdAt)}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {formatDate(inv.periodStart)} — {formatDate(inv.periodEnd)}
                </td>
                <td className="px-4 py-3 text-[var(--text-primary)]">{inv.description}</td>
                <td className="px-4 py-3 text-right font-medium text-[var(--text-primary)]">
                  {formatAmount(inv.amount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_BADGE[inv.status] ?? ''}`}
                  >
                    {inv.status === 'paid'
                      ? '已支付'
                      : inv.status === 'pending'
                        ? '待支付'
                        : '支付失败'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
                    <Download size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Payment Methods Tab ──────────────────────────────────────────────────────

function PaymentMethodsTab({ orgId }: { orgId: string }) {
  const { data: methods, isLoading } = usePaymentMethods(orgId)
  const setDefault = useSetDefaultPaymentMethod(orgId)
  const deletePM = useDeletePaymentMethod(orgId)
  const [showAdd, setShowAdd] = useState(false)

  if (isLoading)
    return <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">加载中...</div>

  return (
    <div className="space-y-4 pt-6">
      {methods?.map((pm) => (
        <Card key={pm.id}>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-14 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
              <CreditCard size={18} className="text-[var(--text-tertiary)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {pm.brand} ****{pm.last4}
                {pm.isDefault && (
                  <span className="ml-2 rounded-full bg-[var(--color-primary-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-500)]">
                    默认
                  </span>
                )}
              </p>
              {pm.expMonth && pm.expYear && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  到期 {pm.expMonth}/{pm.expYear}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!pm.isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDefault.mutate(pm.id)}
                  {...(setDefault.isPending ? { loading: true } : {})}
                >
                  设为默认
                </Button>
              )}
              {!pm.isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePM.mutate(pm.id)}
                  {...(deletePM.isPending ? { loading: true } : {})}
                >
                  删除
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}

      <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
        + 添加支付方式
      </Button>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="添加支付方式"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowAdd(false)}>
              确认添加
            </Button>
          </>
        }
      >
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">
          在真实环境中，此处将接入支付 SDK（如 Stripe 或支付宝）进行安全的支付方式绑定。
        </div>
      </Modal>
    </div>
  )
}

// ─── Alerts Tab ───────────────────────────────────────────────────────────────

function AlertsTab({ orgId }: { orgId: string }) {
  const { data: alerts, isLoading } = useUsageAlerts(orgId)
  const update = useUpdateUsageAlert(orgId)
  const [thresholds, setThresholds] = useState<Record<string, string>>({})

  if (isLoading)
    return <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">加载中...</div>

  function save(alert: UsageAlert) {
    const threshold = Number(thresholds[alert.id] ?? alert.threshold)
    update.mutate({ alertId: alert.id, body: { threshold } })
  }

  return (
    <div className="space-y-4 pt-6">
      {alerts?.map((alert: UsageAlert) => (
        <Card key={alert.id}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {METRIC_LABEL[alert.metric] ?? alert.metric}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">当用量超过阈值时发送告警</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32">
                <Input
                  type="number"
                  value={thresholds[alert.id] ?? String(alert.threshold)}
                  onChange={(e) =>
                    setThresholds((prev) => ({ ...prev, [alert.id]: e.target.value }))
                  }
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={alert.notifyEmail}
                  onChange={(e) =>
                    update.mutate({ alertId: alert.id, body: { notifyEmail: e.target.checked } })
                  }
                  className="rounded"
                />
                邮件
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={alert.notifyInApp}
                  onChange={(e) =>
                    update.mutate({ alertId: alert.id, body: { notifyInApp: e.target.checked } })
                  }
                  className="rounded"
                />
                应用内
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={alert.enabled}
                  onChange={(e) =>
                    update.mutate({ alertId: alert.id, body: { enabled: e.target.checked } })
                  }
                  className="rounded"
                />
                启用
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => save(alert)}
                {...(update.isPending ? { loading: true } : {})}
              >
                保存
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview', label: '概览' },
  { key: 'invoices', label: '账单' },
  { key: 'payment', label: '支付方式' },
  { key: 'alerts', label: '用量告警' },
]

export default function BillingPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">账单与套餐</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          管理您的订阅计划、账单和支付方式
        </p>
      </div>

      <Tabs tabs={TABS}>
        {(active) => (
          <>
            {active === 'overview' && <OverviewTab orgId={slug} />}
            {active === 'invoices' && <InvoicesTab orgId={slug} />}
            {active === 'payment' && <PaymentMethodsTab orgId={slug} />}
            {active === 'alerts' && <AlertsTab orgId={slug} />}
          </>
        )}
      </Tabs>
    </div>
  )
}
