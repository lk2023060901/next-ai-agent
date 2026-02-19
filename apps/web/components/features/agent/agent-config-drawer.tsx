'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { PromptEditor } from './prompt-editor'
import { ToolSelector } from './tool-selector'
import { TriggerExampleEditor } from './trigger-example-editor'
import { useUpdateAgent } from '@/hooks/use-agents'
import { useTools, useKnowledgeBases } from '@/hooks/use-tools'
import { toast } from '@/components/ui/toast'
import { ROLE_LABELS, MODELS, AGENT_COLORS, COLOR_LABELS } from '@/lib/constants/agent'
import type { Agent, TriggerExample } from '@/types/api'

export interface AgentConfigDrawerProps {
  agent: Agent
  onClose: () => void
  workspaceId: string
}

interface DrawerState {
  name: string
  description: string
  avatar: string
  color: string
  model: string
  temperature: number
  systemPrompt: string
  responsibilities: string[]
  knowledgeBases: string[]
  tools: string[]
  qualityStandards: string[]
  outputFormat: string
  edgeCases: string[]
  constraints: string[]
  triggerExamples: TriggerExample[]
}

const DRAWER_TABS = [
  { key: 'identity', label: '身份' },
  { key: 'prompt', label: '提示词' },
  { key: 'tools', label: '工具' },
  { key: 'constraints', label: '约束' },
  { key: 'advanced', label: '高级' },
]

function stateFromAgent(agent: Agent): DrawerState {
  return {
    name: agent.name,
    description: agent.description ?? '',
    avatar: agent.avatar ?? '🤖',
    color: agent.color ?? 'blue',
    model: agent.model,
    temperature: agent.temperature ?? 0.7,
    systemPrompt: agent.systemPrompt ?? '',
    responsibilities: agent.responsibilities ?? [],
    knowledgeBases: agent.knowledgeBases ?? [],
    tools: agent.tools,
    qualityStandards: agent.qualityStandards ?? [],
    outputFormat: agent.outputFormat ?? '',
    edgeCases: agent.edgeCases ?? [],
    constraints: agent.constraints ?? [],
    triggerExamples: agent.triggerExamples ?? [],
  }
}

export function AgentConfigDrawer({ agent, onClose, workspaceId }: AgentConfigDrawerProps) {
  const [state, setState] = useState<DrawerState>(() => stateFromAgent(agent))
  const [activeTab, setActiveTab] = useState('identity')
  const updateAgent = useUpdateAgent(workspaceId)
  const { data: allTools } = useTools(workspaceId)
  const { data: allKbs } = useKnowledgeBases(workspaceId)

  const drawerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Capture the element that opened the drawer
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement
    return () => {
      // Restore focus on close
      triggerRef.current?.focus()
    }
  }, [])

  // Focus trap + Escape
  useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer) return

    // Focus first focusable element
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusable[0]?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && drawer) {
        const focusableEls = drawer.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const first = focusableEls[0]
        const last = focusableEls[focusableEls.length - 1]
        if (!first || !last) return

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Reset state when agent changes
  useEffect(() => {
    setState(stateFromAgent(agent))
  }, [agent])

  const isDirty = useCallback(() => {
    const orig = stateFromAgent(agent)
    return (
      state.name !== orig.name ||
      state.description !== orig.description ||
      state.avatar !== orig.avatar ||
      state.color !== orig.color ||
      state.model !== orig.model ||
      state.temperature !== orig.temperature ||
      state.systemPrompt !== orig.systemPrompt ||
      state.outputFormat !== orig.outputFormat ||
      JSON.stringify(state.responsibilities) !== JSON.stringify(orig.responsibilities) ||
      JSON.stringify(state.knowledgeBases) !== JSON.stringify(orig.knowledgeBases) ||
      JSON.stringify(state.tools) !== JSON.stringify(orig.tools) ||
      JSON.stringify(state.qualityStandards) !== JSON.stringify(orig.qualityStandards) ||
      JSON.stringify(state.edgeCases) !== JSON.stringify(orig.edgeCases) ||
      JSON.stringify(state.constraints) !== JSON.stringify(orig.constraints) ||
      JSON.stringify(state.triggerExamples) !== JSON.stringify(orig.triggerExamples)
    )
  }, [agent, state])

  function update<K extends keyof DrawerState>(key: K, value: DrawerState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    updateAgent.mutate(
      {
        id: agent.id,
        body: {
          name: state.name,
          description: state.description,
          model: state.model,
          temperature: state.temperature,
          systemPrompt: state.systemPrompt,
          knowledgeBases: state.knowledgeBases,
          tools: state.tools,
          responsibilities: state.responsibilities,
          qualityStandards: state.qualityStandards,
          outputFormat: state.outputFormat,
          edgeCases: state.edgeCases,
          constraints: state.constraints,
          triggerExamples: state.triggerExamples,
        },
      },
      {
        onSuccess: () => {
          toast.success('Agent 配置已保存')
          onClose()
        },
        onError: () => toast.error('保存失败'),
      },
    )
  }

  function toggleKb(kbId: string) {
    const current = state.knowledgeBases
    const next = current.includes(kbId) ? current.filter((id) => id !== kbId) : [...current, kbId]
    update('knowledgeBases', next)
  }

  function handleClose() {
    if (isDirty()) {
      // Simple confirm for unsaved changes
      if (!window.confirm('有未保存的更改，确定要关闭吗？')) return
    }
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative z-10 flex h-full w-full max-w-[520px] flex-col bg-[var(--bg)] shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{agent.avatar ?? '🤖'}</span>
            <div>
              <h2 id="drawer-title" className="text-base font-semibold text-[var(--text-primary)]">
                {agent.name}
              </h2>
              <span
                className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: `var(--color-agent-${agent.role})` }}
              >
                {ROLE_LABELS[agent.role]}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="关闭配置面板"
            className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <Tabs tabs={DRAWER_TABS} activeKey={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'identity' && (
            <TabIdentity state={state} agent={agent} onUpdate={update} />
          )}
          {activeTab === 'prompt' && (
            <TabPrompt
              state={state}
              onUpdate={update}
              allKbs={allKbs ?? []}
              onToggleKb={toggleKb}
            />
          )}
          {activeTab === 'tools' && (
            <ToolSelector
              tools={allTools ?? []}
              selected={state.tools}
              onChange={(selected) => update('tools', selected)}
            />
          )}
          {activeTab === 'constraints' && <TabConstraints state={state} onUpdate={update} />}
          {activeTab === 'advanced' && <TabAdvanced state={state} onUpdate={update} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
          <Button variant="ghost" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!isDirty()} loading={updateAgent.isPending}>
            保存
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Tab Components ─────────────────────────────────────────────────────────

interface TabProps {
  state: DrawerState
  onUpdate: <K extends keyof DrawerState>(key: K, value: DrawerState[K]) => void
}

function TabIdentity({ state, agent, onUpdate }: TabProps & { agent: Agent }) {
  return (
    <div className="space-y-4">
      <Input label="名称" value={state.name} onChange={(e) => onUpdate('name', e.target.value)} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">描述</label>
        <textarea
          value={state.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          rows={3}
          aria-label="Agent 描述"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
        />
      </div>
      <div className="flex gap-4">
        <div className="w-20">
          <Input
            label="头像"
            value={state.avatar}
            onChange={(e) => onUpdate('avatar', e.target.value)}
            className="text-center text-lg"
          />
        </div>
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
      {agent.identifier && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            标识符
          </label>
          <p className="font-mono text-sm text-[var(--text-secondary)]">{agent.identifier}</p>
        </div>
      )}
    </div>
  )
}

function TabPrompt({
  state,
  onUpdate,
  allKbs,
  onToggleKb,
}: TabProps & {
  allKbs: Array<{ id: string; name: string; documentCount: number }>
  onToggleKb: (kbId: string) => void
}) {
  return (
    <div className="space-y-5">
      <PromptEditor
        value={state.systemPrompt}
        onChange={(v) => onUpdate('systemPrompt', v)}
        minHeight={240}
      />

      {/* Responsibilities */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          核心职责
        </label>
        <textarea
          value={state.responsibilities.join('\n')}
          onChange={(e) => onUpdate('responsibilities', e.target.value.split('\n'))}
          placeholder="每行一条职责..."
          rows={4}
          aria-label="核心职责列表"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
        />
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">每行一条</p>
      </div>

      {allKbs.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            知识库
          </label>
          <div className="space-y-1.5">
            {allKbs.map((kb) => (
              <label
                key={kb.id}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--surface)]"
              >
                <input
                  type="checkbox"
                  checked={state.knowledgeBases.includes(kb.id)}
                  onChange={() => onToggleKb(kb.id)}
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

function TabConstraints({ state, onUpdate }: TabProps) {
  return (
    <div className="space-y-5">
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

function TabAdvanced({ state, onUpdate }: TabProps) {
  return (
    <div className="space-y-6">
      {/* Model */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">模型</label>
        <div className="space-y-2">
          {MODELS.map((m) => (
            <label
              key={m.id}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2',
                state.model === m.id
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]',
              )}
            >
              <input
                type="radio"
                name="model"
                value={m.id}
                checked={state.model === m.id}
                onChange={() => onUpdate('model', m.id)}
                className="accent-[var(--color-primary-500)]"
              />
              <span className="text-sm text-[var(--text-primary)]">{m.label}</span>
              <span className="text-xs text-[var(--text-secondary)]">{m.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Temperature */}
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

      {/* Trigger Examples */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          触发示例
        </label>
        <TriggerExampleEditor
          examples={state.triggerExamples}
          onChange={(examples) => onUpdate('triggerExamples', examples)}
        />
      </div>
    </div>
  )
}
