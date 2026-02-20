'use client'

import { useState } from 'react'
import { CheckCircle, ExternalLink, Copy, Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import { useTestConnection } from '@/hooks/use-channels'
import type { ChannelType, CreateChannelBody } from '@/types/api'

// ─── Channel Metadata ─────────────────────────────────────────────────────────

interface ChannelMeta {
  type: ChannelType
  label: string
  description: string
  color: string
  available: boolean
  fields: Array<{
    key: string
    label: string
    placeholder: string
    secret?: boolean
    readonly?: boolean
  }>
}

const CHANNEL_META: ChannelMeta[] = [
  {
    type: 'webchat',
    label: 'WebChat',
    description: '网站内嵌聊天组件',
    color: 'bg-[var(--color-primary-500)]',
    available: true,
    fields: [],
  },
  {
    type: 'slack',
    label: 'Slack',
    description: '团队协作工具',
    color: 'bg-[#4A154B]',
    available: true,
    fields: [
      { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-...' },
      { key: 'appToken', label: 'App Token', placeholder: 'xapp-...' },
      { key: 'signingSecret', label: 'Signing Secret', placeholder: '签名密钥', secret: true },
    ],
  },
  {
    type: 'discord',
    label: 'Discord',
    description: '游戏与社区平台',
    color: 'bg-[#5865F2]',
    available: true,
    fields: [
      { key: 'botToken', label: 'Bot Token', placeholder: '机器人 Token' },
      { key: 'applicationId', label: 'Application ID', placeholder: '应用 ID' },
    ],
  },
  {
    type: 'telegram',
    label: 'Telegram',
    description: '即时通讯工具',
    color: 'bg-[#229ED9]',
    available: true,
    fields: [
      { key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-DEF...' },
      { key: 'webhookUrl', label: 'Webhook URL', placeholder: '自动生成', readonly: true },
    ],
  },
  {
    type: 'feishu',
    label: '飞书',
    description: '字节跳动企业协作',
    color: 'bg-[#3370FF]',
    available: true,
    fields: [
      { key: 'appId', label: 'App ID', placeholder: 'cli_...' },
      { key: 'appSecret', label: 'App Secret', placeholder: 'App Secret', secret: true },
      { key: 'verificationToken', label: 'Verification Token', placeholder: '验证令牌' },
    ],
  },
  {
    type: 'dingtalk',
    label: '钉钉',
    description: '阿里巴巴企业协作',
    color: 'bg-[#1677FF]',
    available: false,
    fields: [],
  },
  {
    type: 'wecom',
    label: '企业微信',
    description: '腾讯企业协作工具',
    color: 'bg-[#07C160]',
    available: false,
    fields: [],
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    description: 'Meta 即时通讯',
    color: 'bg-[#25D366]',
    available: false,
    fields: [],
  },
  {
    type: 'teams',
    label: 'Microsoft Teams',
    description: '微软企业协作',
    color: 'bg-[#6264A7]',
    available: false,
    fields: [],
  },
  {
    type: 'email',
    label: 'Email',
    description: 'IMAP/SMTP 邮件',
    color: 'bg-[var(--text-secondary)]',
    available: false,
    fields: [],
  },
]

const DM_OPTIONS = [
  { value: 'paired', label: '配对模式（推荐）' },
  { value: 'open', label: '开放模式' },
  { value: 'allowlist', label: '仅允许列表' },
]

const GROUP_OPTIONS = [
  { value: 'mention', label: '提及触发（推荐）' },
  { value: 'always', label: '始终响应' },
  { value: 'keyword', label: '关键词触发' },
]

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['选择渠道', '配置连接', '路由设置']
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
                  step > num + 1
                    ? 'bg-[var(--color-success)]'
                    : step > num
                      ? 'bg-[var(--color-primary-500)]'
                      : 'bg-[var(--border)]',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AddChannelWizardProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateChannelBody) => void
  loading?: boolean
  workspaceId: string
}

export function AddChannelWizard({
  open,
  onClose,
  onSubmit,
  loading = false,
}: AddChannelWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null)
  const [config, setConfig] = useState<Record<string, string>>({})
  const [channelName, setChannelName] = useState('')
  const [dmPolicy, setDmPolicy] = useState('paired')
  const [groupPolicy, setGroupPolicy] = useState('mention')
  const [defaultAgentId] = useState('agent-1')
  const [testResult, setTestResult] = useState<{
    success: boolean
    botName?: string
    error?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const testConn = useTestConnection('preview')
  const selectedMeta = CHANNEL_META.find((m) => m.type === selectedType)

  function handleClose() {
    setStep(1)
    setSelectedType(null)
    setConfig({})
    setChannelName('')
    setTestResult(null)
    onClose()
  }

  function handleSelectType(type: ChannelType) {
    const meta = CHANNEL_META.find((m) => m.type === type)
    if (!meta?.available) return
    setSelectedType(type)
    setChannelName(`My ${CHANNEL_META.find((m) => m.type === type)?.label ?? ''} Channel`)
    setConfig({})
    setTestResult(null)
  }

  function handleNext() {
    if (step === 1 && selectedType) setStep(2)
    else if (step === 2) setStep(3)
  }

  async function handleTest() {
    const result = await testConn.mutateAsync()
    setTestResult(result)
  }

  function handleCopyWebhook() {
    void navigator.clipboard.writeText(
      `https://app.nextai-agent.com/webhooks/${selectedType ?? 'channel'}/xxx`,
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSubmit() {
    if (!selectedType) return
    onSubmit({
      type: selectedType,
      name: channelName,
      config,
      ...(defaultAgentId ? { defaultAgentId } : {}),
    })
  }

  const canProceedStep1 = !!selectedType
  const canProceedStep2 = selectedMeta?.fields.every((f) => f.readonly || !!config[f.key]) ?? true

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="添加渠道"
      size="lg"
      footer={
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as 1 | 2 | 3)}
          >
            {step === 1 ? '取消' : '上一步'}
          </Button>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              >
                下一步
              </Button>
            ) : (
              <Button onClick={handleSubmit} {...(loading ? { loading: true } : {})}>
                完成
              </Button>
            )}
          </div>
        </div>
      }
    >
      <StepIndicator step={step} />

      {/* Step 1: Select channel type */}
      {step === 1 && (
        <div className="grid grid-cols-3 gap-3">
          {CHANNEL_META.map((meta) => (
            <button
              key={meta.type}
              disabled={!meta.available}
              onClick={() => handleSelectType(meta.type)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-[var(--radius-md)] border p-4 text-center transition-colors',
                !meta.available && 'cursor-not-allowed opacity-40',
                meta.available && selectedType === meta.type
                  ? 'border-2 border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : meta.available
                    ? 'border-[var(--border)] hover:border-[var(--color-primary-300)]'
                    : 'border-[var(--border)]',
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] text-xs font-bold text-white',
                  meta.color,
                )}
              >
                {meta.label.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{meta.label}</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">{meta.description}</p>
              </div>
              {!meta.available && (
                <span className="absolute right-2 top-2 rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                  即将推出
                </span>
              )}
              {selectedType === meta.type && (
                <CheckCircle className="absolute right-2 top-2 h-4 w-4 text-[var(--color-primary-500)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Configure connection */}
      {step === 2 && selectedMeta && (
        <div className="space-y-4">
          <Input
            label="渠道名称"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            fullWidth
          />

          {selectedMeta.type === 'webchat' ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                WebChat 无需额外配置，创建后即可获得嵌入代码。
              </p>
            </div>
          ) : (
            <>
              {selectedMeta.fields.map((field) => (
                <div key={field.key} className="relative">
                  {field.readonly ? (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                        {field.label}
                      </label>
                      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                        <span className="flex-1 truncate font-mono text-xs text-[var(--text-secondary)]">
                          https://app.nextai-agent.com/webhooks/{selectedMeta.type}/xxx
                        </span>
                        <button
                          onClick={handleCopyWebhook}
                          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-[var(--color-success)]" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Input
                      label={field.label}
                      placeholder={field.placeholder}
                      type={field.secret ? 'password' : 'text'}
                      value={config[field.key] ?? ''}
                      onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                      fullWidth
                    />
                  )}
                </div>
              ))}

              {/* Test connection */}
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={handleTest}
                  disabled={!canProceedStep2}
                  {...(testConn.isPending ? { loading: true } : {})}
                >
                  测试连接
                </Button>
                {testResult &&
                  (testResult.success ? (
                    <span className="flex items-center gap-1 text-sm text-[var(--color-success)]">
                      <CheckCircle className="h-4 w-4" />
                      连接成功{testResult.botName && ` · ${testResult.botName}`}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-[var(--color-danger)]">
                      连接失败: {testResult.error}
                    </span>
                  ))}
              </div>

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-1 text-xs text-[var(--color-primary-500)] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                如何创建 {selectedMeta.label} App？
              </a>
            </>
          )}
        </div>
      )}

      {/* Step 3: Routing settings */}
      {step === 3 && (
        <div className="space-y-5">
          <Select
            label="默认 Agent"
            options={[
              { value: 'agent-1', label: '协调 Agent' },
              { value: 'agent-2', label: '客服 Agent' },
              { value: 'agent-3', label: '技术支持 Agent' },
            ]}
            value={defaultAgentId}
            onChange={() => {}}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              私信策略
            </label>
            <div className="space-y-2">
              {DM_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="dmPolicy"
                    value={opt.value}
                    checked={dmPolicy === opt.value}
                    onChange={(e) => setDmPolicy(e.target.value)}
                    className="accent-[var(--color-primary-500)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              群组策略
            </label>
            <div className="space-y-2">
              {GROUP_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="groupPolicy"
                    value={opt.value}
                    checked={groupPolicy === opt.value}
                    onChange={(e) => setGroupPolicy(e.target.value)}
                    className="accent-[var(--color-primary-500)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
