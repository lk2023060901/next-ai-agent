'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import type { Agent } from '@/types/api'
import { ROLE_LABELS, ROLE_AVATARS, STATUS_MAP } from '@/lib/constants/agent'
import { cn } from '@/lib/utils/cn'

export interface AgentNodeData {
  agent: Agent
  [key: string]: unknown
}

export type AgentNodeType = Node<AgentNodeData, 'agentNode'>

function AgentNodeInner({ data }: NodeProps<AgentNodeType>) {
  const { agent } = data
  const avatar = agent.avatar ?? ROLE_AVATARS[agent.role]
  const roleLabel = ROLE_LABELS[agent.role]
  const statusInfo = STATUS_MAP[agent.status]
  const isRunning = agent.status === 'running'

  return (
    <div
      className={cn(
        'flex w-[200px] flex-col items-center gap-1.5 rounded-[var(--radius-md)] border-2 bg-[var(--surface)] px-3 py-3 shadow-sm transition-shadow hover:shadow-md',
        isRunning && 'animate-pulse-subtle',
      )}
      style={{ borderColor: `var(--color-agent-${agent.role})` }}
      aria-label={`${agent.name} - ${roleLabel} - ${statusInfo.label}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--border)]" />

      {/* Avatar */}
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-2)] text-lg">
        {avatar}
      </span>

      {/* Name */}
      <span className="w-full truncate text-center text-sm font-semibold text-[var(--text-primary)]">
        {agent.name}
      </span>

      {/* Role badge + Status dot */}
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: `var(--color-agent-${agent.role})` }}
        >
          {roleLabel}
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <span className={cn('h-2 w-2 rounded-full', statusInfo.dot)} />
          {statusInfo.label}
        </span>
      </div>

      {/* Model tag */}
      <span className="text-[10px] text-[var(--text-tertiary)]">{agent.model}</span>

      <Handle type="source" position={Position.Bottom} className="!bg-[var(--border)]" />
    </div>
  )
}

export const AgentNode = memo(AgentNodeInner)
