'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { PLANS } from '@/mocks/factories/billing.factory'

function formatPrice(cents: number): string {
  if (cents === 0) return '免费'
  return `¥${(cents / 100).toFixed(0)}`
}

export default function PricingPage() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-[var(--text-primary)]">简单透明的定价</h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">
          从免费开始，随着团队成长灵活升级
        </p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          <button
            onClick={() => setCycle('monthly')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              cycle === 'monthly'
                ? 'bg-[var(--bg)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            月付
          </button>
          <button
            onClick={() => setCycle('yearly')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              cycle === 'yearly'
                ? 'bg-[var(--bg)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            年付
            <span className="rounded-full bg-[var(--color-success)] px-1.5 py-0.5 text-xs font-semibold text-white">
              省20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
          const isPopular = plan.popular
          const isEnterprise = plan.id === 'enterprise'

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[var(--radius-xl)] border bg-[var(--bg)] p-6 ${
                isPopular ? 'border-[var(--color-primary-500)] shadow-lg' : 'border-[var(--border)]'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[var(--color-primary-500)] px-3 py-1 text-xs font-semibold text-white">
                    最受欢迎
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{plan.description}</p>
              </div>

              <div className="mb-6">
                {isEnterprise ? (
                  <div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">联系我们</p>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">定制报价</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">
                      {formatPrice(price)}
                      {price > 0 && (
                        <span className="text-base font-normal text-[var(--text-secondary)]">
                          /月
                        </span>
                      )}
                    </p>
                    {cycle === 'yearly' && price > 0 && (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        按年计费 ¥{((price * 12) / 100).toFixed(0)}/年
                      </p>
                    )}
                  </div>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full rounded-[var(--radius-md)] py-2.5 text-sm font-medium transition-colors ${
                  isPopular
                    ? 'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]'
                    : isEnterprise
                      ? 'border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)]'
                      : 'border border-[var(--color-primary-500)] text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)]'
                }`}
              >
                {isEnterprise ? '联系销售' : plan.id === 'free' ? '免费开始' : '立即升级'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
