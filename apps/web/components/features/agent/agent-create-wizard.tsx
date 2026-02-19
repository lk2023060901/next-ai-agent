'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PromptEditor } from './prompt-editor'
import { ToolSelector } from './tool-selector'
import { TriggerExampleEditor } from './trigger-example-editor'
import { AgentCard } from './agent-card'
import { useCreateAgent } from '@/hooks/use-agents'
import { useTools, useKnowledgeBases } from '@/hooks/use-tools'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils/cn'
import { validateIdentifier, suggestIdentifier } from '@/lib/utils/identifier'
import { ROLES, MODELS, AGENT_COLORS, COLOR_LABELS, ROLE_LABELS } from '@/lib/constants/agent'
import type { AgentRole, AgentColor, TriggerExample } from '@/types/api'

export interface AgentCreateWizardProps {
  open: boolean
  onClose: () => void
  workspaceId: string
}

interface WizardState {
  // Step 1: Extract Intent
  name: string
  role: AgentRole
  description: string
  // Step 2: Design Persona
  avatar: string
  color: AgentColor
  model: string
  temperature: number
  // Step 3: Architect Instructions
  systemPrompt: string
  responsibilities: string[]
  knowledgeBases: string[]
  // Step 4: Optimize
  qualityStandards: string[]
  outputFormat: string
  edgeCases: string[]
  constraints: string[]
  // Step 5: Create Identifier
  identifier: string
  // Step 6: Craft Examples
  triggerExamples: TriggerExample[]
  // Step 3/4: Tools (shared)
  tools: string[]
}

const INITIAL_STATE: WizardState = {
  name: '',
  role: 'frontend',
  description: '',
  avatar: '🎨',
  color: 'green',
  model: 'claude-sonnet-4-6',
  temperature: 0.7,
  systemPrompt: '',
  responsibilities: [],
  knowledgeBases: [],
  qualityStandards: [],
  outputFormat: '',
  edgeCases: [],
  constraints: [],
  identifier: '',
  triggerExamples: [],
  tools: [],
}

const STEPS = [
  { title: '提取意图', desc: 'Extract Intent' },
  { title: '设计人格', desc: 'Design Persona' },
  { title: '架构指令', desc: 'Architect Instructions' },
  { title: '优化约束', desc: 'Optimize' },
  { title: '创建标识', desc: 'Create Identifier' },
  { title: '编写示例', desc: 'Craft Examples' },
]

export function AgentCreateWizard({ open, onClose, workspaceId }: AgentCreateWizardProps) {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const createAgent = useCreateAgent(workspaceId)
  const {
    data: tools,
    isLoading: toolsLoading,
    error: toolsError,
    refetch: refetchTools,
  } = useTools(workspaceId)
  const {
    data: knowledgeBases,
    isLoading: kbsLoading,
    error: kbsError,
    refetch: refetchKbs,
  } = useKnowledgeBases(workspaceId)

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function selectRole(r: (typeof ROLES)[number]) {
    setState((prev) => ({
      ...prev,
      role: r.role,
      avatar: r.emoji,
      color: r.color,
    }))
  }

  function canNext(): boolean {
    switch (step) {
      case 0:
        return state.name.trim().length > 0
      case 4:
        return validateIdentifier(state.identifier) === null
      default:
        return true
    }
  }

  function handleClose() {
    setState(INITIAL_STATE)
    setStep(0)
    onClose()
  }

  function handleCreate() {
    createAgent.mutate(
      {
        name: state.name,
        role: state.role,
        model: state.model,
        avatar: state.avatar,
        description: state.description,
        color: state.color,
        temperature: state.temperature,
        systemPrompt: state.systemPrompt,
        knowledgeBases: state.knowledgeBases,
        tools: state.tools,
        responsibilities: state.responsibilities,
        qualityStandards: state.qualityStandards,
        outputFormat: state.outputFormat,
        edgeCases: state.edgeCases,
        constraints: state.constraints,
        identifier: state.identifier,
        triggerExamples: state.triggerExamples,
      },
      {
        onSuccess: () => {
          toast.success('Agent 创建成功')
          handleClose()
        },
        onError: () => toast.error('创建失败，请重试'),
      },
    )
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg" closeOnBackdrop={false}>
      {/* Step progress */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--border)] px-6 py-4">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex shrink-0 items-center gap-1.5">
            {i > 0 && <div className="h-px w-4 bg-[var(--border)]" />}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  i < step
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : i === step
                      ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-500)] ring-1 ring-[var(--color-primary-500)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-tertiary)]',
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-xs',
                  i === step
                    ? 'font-medium text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)]',
                )}
              >
                {s.title}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="max-h-[60vh] min-h-[360px] overflow-auto px-6 py-5">
        {step === 0 && (
          <StepExtractIntent state={state} onSelectRole={selectRole} onUpdate={update} />
        )}
        {step === 1 && <StepDesignPersona state={state} onUpdate={update} />}
        {step === 2 && (
          <StepArchitectInstructions
            state={state}
            onUpdate={update}
            knowledgeBases={knowledgeBases ?? []}
            tools={tools ?? []}
            isLoading={toolsLoading || kbsLoading}
            error={toolsError || kbsError}
            onRetry={() => {
              void refetchTools()
              void refetchKbs()
            }}
          />
        )}
        {step === 3 && <StepOptimize state={state} onUpdate={update} />}
        {step === 4 && <StepCreateIdentifier state={state} onUpdate={update} />}
        {step === 5 && <StepCraftExamples state={state} onUpdate={update} />}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
        <Button variant="ghost" onClick={step === 0 ? handleClose : () => setStep((s) => s - 1)}>
          {step === 0 ? '取消' : '上一步'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            下一步
          </Button>
        ) : (
          <Button onClick={handleCreate} loading={createAgent.isPending}>
            创建 Agent
          </Button>
        )}
      </div>
    </Modal>
  )
}

// ─── Step Components ────────────────────────────────────────────────────────

interface StepProps {
  state: WizardState
  onUpdate: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void
}

// Step 1: Extract Intent
function StepExtractIntent({
  state,
  onSelectRole,
  onUpdate,
}: StepProps & { onSelectRole: (r: (typeof ROLES)[number]) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm text-[var(--text-secondary)]">确定 Agent 的核心职责和角色定位</p>
      </div>

      {/* Role grid */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          角色类型
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => onSelectRole(r)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border p-3 text-center transition-colors',
                state.role === r.role
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface)]',
              )}
            >
              <span className="text-xl">{r.emoji}</span>
              <span className="text-xs font-medium text-[var(--text-primary)]">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Input
        label="名称"
        value={state.name}
        onChange={(e) => onUpdate('name', e.target.value)}
        placeholder="给 Agent 取个名字"
        aria-required="true"
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">描述</label>
        <textarea
          value={state.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="简要描述这个 Agent 的职责..."
          rows={2}
          aria-label="Agent 描述"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
        />
      </div>
    </div>
  )
}

// Step 2: Design Persona
function StepDesignPersona({ state, onUpdate }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm text-[var(--text-secondary)]">塑造 Agent 的外观与模型参数</p>
      </div>

      <div className="flex gap-4">
        {/* Emoji */}
        <div className="w-20">
          <Input
            label="头像"
            value={state.avatar}
            onChange={(e) => onUpdate('avatar', e.target.value)}
            className="text-center text-lg"
          />
        </div>

        {/* Color */}
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            主题色
          </label>
          <div className="flex gap-2">
            {AGENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onUpdate('color', c)}
                title={COLOR_LABELS[c]}
                aria-label={COLOR_LABELS[c]}
                className={cn(
                  'h-8 w-8 rounded-full border-2 transition-all',
                  state.color === c
                    ? 'scale-110 border-[var(--text-primary)]'
                    : 'border-transparent hover:border-[var(--border)]',
                )}
                style={{
                  backgroundColor: `var(--color-agent-${c === 'blue' ? 'coordinator' : c === 'cyan' ? 'architecture' : c === 'green' ? 'frontend' : c === 'yellow' ? 'backend' : c === 'red' ? 'testing' : 'requirements'})`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Model selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          模型选择
        </label>
        <div className="grid grid-cols-3 gap-3">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => onUpdate('model', m.id)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-[var(--radius-md)] border p-4 text-left transition-colors',
                state.model === m.id
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]',
              )}
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">{m.label}</span>
              <span className="text-xs text-[var(--text-secondary)]">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Temperature slider */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          Temperature: {state.temperature.toFixed(1)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={state.temperature}
          onChange={(e) => onUpdate('temperature', parseFloat(e.target.value))}
          aria-label="Temperature"
          className="w-full accent-[var(--color-primary-500)]"
        />
        <div className="mt-1 flex justify-between text-xs text-[var(--text-tertiary)]">
          <span>精确 (0.0)</span>
          <span>创意 (1.0)</span>
        </div>
      </div>
    </div>
  )
}

// Step 3: Architect Instructions
function StepArchitectInstructions({
  state,
  onUpdate,
  knowledgeBases,
  tools,
  isLoading,
  error,
  onRetry,
}: StepProps & {
  knowledgeBases: Array<{ id: string; name: string; documentCount: number }>
  tools: Array<import('@/types/api').Tool>
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}) {
  function toggleKb(kbId: string) {
    const current = state.knowledgeBases
    const next = current.includes(kbId) ? current.filter((id) => id !== kbId) : [...current, kbId]
    onUpdate('knowledgeBases', next)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-[var(--color-danger)]">加载数据失败</p>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          重试
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-2)]"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm text-[var(--text-secondary)]">
          定义系统提示词、核心职责和可用资源
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          系统提示词
        </label>
        <PromptEditor
          value={state.systemPrompt}
          onChange={(v) => onUpdate('systemPrompt', v)}
          minHeight={160}
        />
      </div>

      {/* Responsibilities */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          核心职责
        </label>
        <textarea
          value={state.responsibilities.join('\n')}
          onChange={(e) => {
            const lines = e.target.value.split('\n')
            onUpdate('responsibilities', lines)
          }}
          placeholder="每行一条职责..."
          rows={4}
          aria-label="核心职责列表"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
        />
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">每行一条</p>
      </div>

      {/* Tool selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          选择工具
        </label>
        <ToolSelector
          tools={tools}
          selected={state.tools}
          onChange={(selected) => onUpdate('tools', selected)}
        />
      </div>

      {/* Knowledge bases */}
      {knowledgeBases.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            知识库
          </label>
          <div className="space-y-1.5">
            {knowledgeBases.map((kb) => (
              <label
                key={kb.id}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--surface)]"
              >
                <input
                  type="checkbox"
                  checked={state.knowledgeBases.includes(kb.id)}
                  onChange={() => toggleKb(kb.id)}
                  className="h-4 w-4 rounded border-[var(--border)] accent-[var(--color-primary-500)]"
                />
                <span className="text-sm text-[var(--text-primary)]">{kb.name}</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {kb.documentCount} 篇文档
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Step 4: Optimize
function StepOptimize({ state, onUpdate }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm text-[var(--text-secondary)]">
          细化质量标准、输出格式和边界约束
        </p>
      </div>

      {/* Quality Standards */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          质量标准
        </label>
        <textarea
          value={state.qualityStandards.join('\n')}
          onChange={(e) => onUpdate('qualityStandards', e.target.value.split('\n'))}
          placeholder="每行一条标准..."
          rows={3}
          aria-label="质量标准列表"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
        />
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">每行一条</p>
      </div>

      {/* Output Format */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          输出格式
        </label>
        <textarea
          value={state.outputFormat}
          onChange={(e) => onUpdate('outputFormat', e.target.value)}
          placeholder="描述期望的输出格式..."
          rows={3}
          aria-label="输出格式"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
        />
      </div>

      {/* Edge Cases */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          边界情况
        </label>
        <textarea
          value={state.edgeCases.join('\n')}
          onChange={(e) => onUpdate('edgeCases', e.target.value.split('\n'))}
          placeholder="每行一个需处理的边界场景..."
          rows={3}
          aria-label="边界情况列表"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
        />
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">每行一条</p>
      </div>

      {/* Constraints */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          约束条件
        </label>
        <textarea
          value={state.constraints.join('\n')}
          onChange={(e) => onUpdate('constraints', e.target.value.split('\n'))}
          placeholder="每行一条约束..."
          rows={3}
          aria-label="约束条件列表"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
        />
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">每行一条</p>
      </div>
    </div>
  )
}

// Step 5: Create Identifier
function StepCreateIdentifier({ state, onUpdate }: StepProps) {
  const error = validateIdentifier(state.identifier)
  const suggested = suggestIdentifier(state.name)

  function handleAutoSuggest() {
    onUpdate('identifier', suggested)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm text-[var(--text-secondary)]">
          创建唯一标识符，用于系统内部引用
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          标识符
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              value={state.identifier}
              onChange={(e) => onUpdate('identifier', e.target.value.toLowerCase())}
              placeholder="my-agent"
              aria-label="Agent 标识符"
              aria-describedby="identifier-hint"
              aria-invalid={state.identifier.length > 0 && error !== null}
              className={cn(
                'h-10 w-full rounded-[var(--radius-md)] border bg-[var(--bg)] px-3 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none',
                state.identifier.length > 0 && error
                  ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
                  : 'border-[var(--border)] focus:border-[var(--color-primary-500)]',
              )}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleAutoSuggest}>
            自动生成
          </Button>
        </div>
        {state.identifier.length > 0 && error ? (
          <p id="identifier-hint" className="mt-1 text-xs text-[var(--color-danger)]">
            {error}
          </p>
        ) : (
          <p id="identifier-hint" className="mt-1 text-xs text-[var(--text-tertiary)]">
            小写字母、数字和连字符，以字母开头
          </p>
        )}
      </div>

      {/* Preview card */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">预览</label>
        <AgentCard
          agent={{
            id: 'preview',
            name: state.name || '未命名',
            role: state.role,
            status: 'idle',
            workspaceId: '',
            model: state.model,
            tools: state.tools,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            avatar: state.avatar,
            description: state.description,
            color: state.color,
            identifier: state.identifier,
          }}
        />
      </div>
    </div>
  )
}

// Step 6: Craft Examples
function StepCraftExamples({ state, onUpdate }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm text-[var(--text-secondary)]">
          添加触发示例，帮助 Agent 理解预期的交互模式
        </p>
      </div>

      <TriggerExampleEditor
        examples={state.triggerExamples}
        onChange={(examples) => onUpdate('triggerExamples', examples)}
      />

      {/* Final summary */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h4 className="mb-3 text-sm font-medium text-[var(--text-primary)]">创建摘要</h4>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-[var(--text-tertiary)]">名称</dt>
            <dd className="text-[var(--text-primary)]">{state.name || '—'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-[var(--text-tertiary)]">角色</dt>
            <dd className="text-[var(--text-primary)]">{ROLE_LABELS[state.role]}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-[var(--text-tertiary)]">标识符</dt>
            <dd className="font-mono text-[var(--text-primary)]">{state.identifier || '—'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-[var(--text-tertiary)]">模型</dt>
            <dd className="text-[var(--text-primary)]">{state.model}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-[var(--text-tertiary)]">工具</dt>
            <dd className="text-[var(--text-primary)]">{state.tools.length} 个</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-[var(--text-tertiary)]">示例</dt>
            <dd className="text-[var(--text-primary)]">{state.triggerExamples.length} 个</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
