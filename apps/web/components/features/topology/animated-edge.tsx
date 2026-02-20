'use client'

import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { EdgeProps, Edge } from '@xyflow/react'

export interface FlowEdgeData {
  messageCount: number
  active: boolean
  label?: string
  [key: string]: unknown
}

export type FlowEdgeType = Edge<FlowEdgeData, 'animatedEdge'>

function AnimatedEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<FlowEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const active = data?.active ?? false
  const messageCount = data?.messageCount ?? 0
  const strokeColor = active ? 'var(--color-primary-500)' : 'var(--border)'
  const strokeWidth = active ? 2.5 : 1.5

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        {...(markerEnd ? { markerEnd } : {})}
        style={{ stroke: strokeColor, strokeWidth }}
      />

      {/* Animated particle for active edges */}
      {active && (
        <circle r={3} fill="var(--color-primary-400)">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Message count badge */}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute flex items-center gap-1"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {data?.label && (
            <span className="rounded bg-[var(--surface)] px-1 py-0.5 text-[10px] text-[var(--text-secondary)] shadow-sm">
              {data.label}
            </span>
          )}
          {messageCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary-100)] px-1 text-[10px] font-semibold text-[var(--color-primary-600)]">
              {messageCount}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const AnimatedEdge = memo(AnimatedEdgeInner)
