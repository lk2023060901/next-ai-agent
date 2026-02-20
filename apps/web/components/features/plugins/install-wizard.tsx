'use client'

import { useState } from 'react'
import { Shield, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import type { Plugin, InstallPluginBody } from '@/types/api'

interface InstallWizardProps {
  plugin: Plugin | null
  open: boolean
  onClose: () => void
  onInstall: (body: InstallPluginBody) => void
  loading?: boolean
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = ['权限确认', '参数配置']
  return (
    <div className="mb-6 flex items-center justify-center gap-0">
      {steps.map((label, idx) => {
        const num = idx + 1
        const done = step > num
        const active = step === num
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                  done && 'bg-[var(--color-success)] text-white',
                  active && 'bg-[var(--color-primary-500)] text-white',
                  !done && !active && 'bg-[var(--surface-2)] text-[var(--text-tertiary)]',
                )}
              >
                {done ? <CheckCircle className="h-4 w-4" /> : num}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px]',
                  active && 'font-semibold text-[var(--color-primary-500)]',
                  done && 'text-[var(--color-success)]',
                  !done && !active && 'text-[var(--text-tertiary)]',
                )}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 mb-4 h-0.5 w-16',
                  step > num ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--border)]',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function InstallWizard({
  plugin,
  open,
  onClose,
  onInstall,
  loading = false,
}: InstallWizardProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [config, setConfig] = useState<Record<string, string | number | boolean>>({})

  if (!plugin) return null

  const hasConfig = plugin.configSchema.length > 0

  function handleClose() {
    setStep(1)
    setConfig({})
    onClose()
  }

  function handleNext() {
    if (step === 1) {
      if (!hasConfig) {
        onInstall({ pluginId: plugin!.id, config: {} })
        return
      }
      setStep(2)
    }
  }

  function handleInstall() {
    onInstall({ pluginId: plugin!.id, config })
  }

  function formatPrice(): string {
    if (plugin!.pricingModel === 'free') return '免费'
    if (plugin!.pricingModel === 'one_time' && plugin!.price != null)
      return `¥${(plugin!.price / 100).toFixed(2)} 一次性`
    if (plugin!.pricingModel === 'subscription' && plugin!.monthlyPrice != null)
      return `¥${(plugin!.monthlyPrice / 100).toFixed(2)}/月`
    if (plugin!.pricingModel === 'usage_based') return '按用量计费'
    return '免费'
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`安装 ${plugin.displayName}`}
      size="md"
      footer={
        <div className="flex justify-between">
          <Button variant="ghost" onClick={step === 1 ? handleClose : () => setStep(1)}>
            {step === 1 ? '取消' : '上一步'}
          </Button>
          {step === 1 ? (
            <Button onClick={handleNext}>{hasConfig ? '下一步' : '确认安装'}</Button>
          ) : (
            <Button onClick={handleInstall} {...(loading ? { loading: true } : {})}>
              安装
            </Button>
          )}
        </div>
      }
    >
      {hasConfig && <StepIndicator step={step} />}

      {/* Step 1: Permissions */}
      {step === 1 && (
        <div className="space-y-4">
          {plugin.pricingModel !== 'free' && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-700">
                💰 {formatPrice()}
                {plugin.trialDays ? `（${plugin.trialDays} 天免费试用）` : ''}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
              <Shield className="mr-1 inline h-4 w-4" />
              此插件将获得以下权限：
            </p>
            <ul className="space-y-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3">
              {plugin.permissions.map((perm) => (
                <li
                  key={perm}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />
                  <code className="font-mono text-xs">{perm}</code>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-[var(--text-tertiary)]">
            by {plugin.author} · v{plugin.version} · 已安装 {plugin.installCount.toLocaleString()}{' '}
            次
          </p>
        </div>
      )}

      {/* Step 2: Config */}
      {step === 2 && (
        <div className="space-y-3">
          {plugin.configSchema.map((field) => {
            const value = config[field.key]
            if (field.type === 'select') {
              return (
                <Select
                  key={field.key}
                  label={field.label}
                  options={field.options ?? []}
                  value={
                    value != null
                      ? String(value)
                      : field.default != null
                        ? String(field.default)
                        : ''
                  }
                  onChange={(v) => setConfig((c) => ({ ...c, [field.key]: v as string }))}
                  fullWidth
                />
              )
            }
            if (field.type === 'boolean') {
              return (
                <div key={field.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{field.label}</p>
                    {field.description && (
                      <p className="text-xs text-[var(--text-tertiary)]">{field.description}</p>
                    )}
                  </div>
                  <button
                    role="switch"
                    aria-checked={Boolean(value ?? field.default)}
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        [field.key]: !Boolean(c[field.key] ?? field.default),
                      }))
                    }
                    className={cn(
                      'relative h-5 w-9 rounded-full transition-colors',
                      Boolean(value ?? field.default)
                        ? 'bg-[var(--color-success)]'
                        : 'bg-[var(--surface-2)]',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                        Boolean(value ?? field.default) ? 'left-[18px]' : 'left-0.5',
                      )}
                    />
                  </button>
                </div>
              )
            }
            return (
              <Input
                key={field.key}
                label={field.label}
                {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                type={
                  field.type === 'password'
                    ? 'password'
                    : field.type === 'number'
                      ? 'number'
                      : 'text'
                }
                value={value != null ? String(value) : ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                  }))
                }
                {...(field.description ? { hint: field.description } : {})}
                fullWidth
              />
            )
          })}
        </div>
      )}
    </Modal>
  )
}
