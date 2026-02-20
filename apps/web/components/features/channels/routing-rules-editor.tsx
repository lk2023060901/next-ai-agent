'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/components/ui/toast'
import { useRoutingRules, useCreateRoutingRule, useDeleteRoutingRule } from '@/hooks/use-channels'
import type { RuleField, RuleOperator, CreateRoutingRuleBody } from '@/types/api'

const FIELD_OPTIONS = [
  { value: 'sender', label: '发送者' },
  { value: 'content', label: '内容' },
  { value: 'group', label: '群组' },
  { value: 'channel', label: '渠道' },
]

const OPERATOR_OPTIONS = [
  { value: 'equals', label: '等于' },
  { value: 'contains', label: '包含' },
  { value: 'regex', label: '正则匹配' },
  { value: 'in_list', label: '属于列表' },
]

const AGENT_OPTIONS = [
  { value: 'agent-1', label: '协调 Agent' },
  { value: 'agent-2', label: '客服 Agent' },
  { value: 'agent-3', label: '技术支持 Agent' },
]

const FIELD_LABEL: Record<RuleField, string> = {
  sender: '发送者',
  content: '内容',
  group: '群组',
  channel: '渠道',
}

const OP_LABEL: Record<RuleOperator, string> = {
  equals: '等于',
  contains: '包含',
  regex: '正则',
  in_list: '属于列表',
}

interface RoutingRulesEditorProps {
  channelId: string
}

export function RoutingRulesEditor({ channelId }: RoutingRulesEditorProps) {
  const { data: rules, isLoading } = useRoutingRules(channelId)
  const createRule = useCreateRoutingRule(channelId)
  const deleteRule = useDeleteRoutingRule(channelId)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<CreateRoutingRuleBody>({
    field: 'content',
    operator: 'contains',
    value: '',
    targetAgentId: 'agent-1',
    priority: 10,
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd() {
    if (!form.value.trim()) {
      toast.error('请输入匹配值')
      return
    }
    try {
      await createRule.mutateAsync(form)
      toast.success('规则已添加')
      setAddOpen(false)
      setForm({
        field: 'content',
        operator: 'contains',
        value: '',
        targetAgentId: 'agent-1',
        priority: 10,
      })
    } catch {
      toast.error('添加失败')
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteRule.mutateAsync(deletingId)
      toast.success('规则已删除')
      setDeletingId(null)
    } catch {
      toast.error('删除失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          添加规则
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      ) : !rules || rules.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-5 w-5" />}
          title="还没有路由规则"
          description="添加规则，将特定消息路由到指定 Agent"
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
          {rules.map((rule, idx) => {
            const agentName =
              AGENT_OPTIONS.find((a) => a.value === rule.targetAgentId)?.label ?? rule.targetAgentId
            return (
              <div
                key={rule.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)]',
                  idx < rules.length - 1 && 'border-b border-[var(--border)]',
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                <div className="flex-1 text-sm">
                  <span className="text-[var(--text-tertiary)]">当 </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    [{FIELD_LABEL[rule.field]}]
                  </span>
                  <span className="text-[var(--text-tertiary)]"> {OP_LABEL[rule.operator]} </span>
                  <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs">
                    {rule.value}
                  </code>
                  <span className="text-[var(--text-tertiary)]"> → 路由到 </span>
                  <span className="font-medium text-[var(--color-primary-500)]">{agentName}</span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">优先级 {rule.priority}</span>
                <button
                  onClick={() => setDeletingId(rule.id)}
                  className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--color-danger)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
          <div className="flex items-center gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-tertiary)]">
            默认: 路由到{' '}
            <span className="ml-1 font-medium text-[var(--text-primary)]">协调 Agent</span>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="添加路由规则"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAdd} {...(createRule.isPending ? { loading: true } : {})}>
              添加
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <Select
              label="字段"
              options={FIELD_OPTIONS}
              value={form.field}
              onChange={(v) => setForm((f) => ({ ...f, field: v as RuleField }))}
            />
            <Select
              label="操作符"
              options={OPERATOR_OPTIONS}
              value={form.operator}
              onChange={(v) => setForm((f) => ({ ...f, operator: v as RuleOperator }))}
            />
          </div>
          <Input
            label="匹配值"
            placeholder="输入匹配内容..."
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            fullWidth
          />
          <Select
            label="目标 Agent"
            options={AGENT_OPTIONS}
            value={form.targetAgentId}
            onChange={(v) => setForm((f) => ({ ...f, targetAgentId: v as string }))}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="删除规则"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletingId(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              {...(deleteRule.isPending ? { loading: true } : {})}
            >
              删除
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          确定要删除该路由规则吗？此操作不可撤销。
        </p>
      </Modal>
    </div>
  )
}
