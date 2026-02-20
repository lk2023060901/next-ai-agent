'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import type { NodeTypes, EdgeTypes, NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Maximize2, Map, Loader2 } from 'lucide-react'
import type { Node, Edge } from '@xyflow/react'
import { AgentNode, AnimatedEdge, TaskPanel } from '@/components/features/topology'
import type { AgentNodeData } from '@/components/features/topology'
import type { FlowEdgeData } from '@/components/features/topology'
import { useTopology } from '@/hooks/use-topology'
import { getLayoutedElements } from '@/lib/utils/dagre-layout'
import { cn } from '@/lib/utils/cn'

const nodeTypes: NodeTypes = { agentNode: AgentNode }
const edgeTypes: EdgeTypes = { animatedEdge: AnimatedEdge }

function TopologyCanvas() {
  const params = useParams<{ wsSlug: string }>()
  const wsSlug = params.wsSlug
  const { data: topology, isLoading } = useTopology(wsSlug)
  const { fitView } = useReactFlow()

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [showMinimap, setShowMinimap] = useState(false)

  const { nodes, edges } = useMemo(() => {
    if (!topology) return { nodes: [] as Node<AgentNodeData>[], edges: [] as Edge<FlowEdgeData>[] }
    return getLayoutedElements(topology.agents, topology.connections)
  }, [topology])

  const onNodeClick: NodeMouseHandler<Node<AgentNodeData>> = useCallback((_event, node) => {
    setSelectedAgentId((prev) => (prev === node.id ? null : node.id))
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedAgentId(null)
  }, [])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 })
  }, [fitView])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    )
  }

  if (!topology) return null

  return (
    <div
      className="-m-6 flex"
      style={{ width: 'calc(100% + 48px)', height: 'calc(100vh - var(--topbar-height))' }}
    >
      {/* Canvas */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodesDraggable={false}
          nodesConnectable={false}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
        >
          <Background gap={20} size={1} />
          <Controls showInteractive={false} />
          {showMinimap && <MiniMap nodeStrokeWidth={3} pannable zoomable />}

          {/* Top-left: title + stats */}
          <Panel position="top-left">
            <div className="bg-[var(--surface)]/90 rounded-[var(--radius-md)] px-4 py-2.5 shadow-sm backdrop-blur-sm">
              <h1 className="text-base font-semibold text-[var(--text-primary)]">协作概览</h1>
              <p className="text-xs text-[var(--text-secondary)]">
                {topology.agents.length} 个 Agent &middot; {topology.connections.length} 条连接
              </p>
            </div>
          </Panel>

          {/* Top-right: controls */}
          <Panel position="top-right">
            <div className="flex gap-1.5">
              <button
                onClick={handleFitView}
                className={cn(
                  'bg-[var(--surface)]/90 rounded-[var(--radius-sm)] p-2 text-[var(--text-secondary)] shadow-sm backdrop-blur-sm',
                  'transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                )}
                aria-label="适应视图"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setShowMinimap((v) => !v)}
                className={cn(
                  'bg-[var(--surface)]/90 rounded-[var(--radius-sm)] p-2 shadow-sm backdrop-blur-sm transition-colors',
                  showMinimap
                    ? 'text-[var(--color-primary-500)] hover:bg-[var(--surface-2)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                )}
                aria-label={showMinimap ? '隐藏小地图' : '显示小地图'}
              >
                <Map size={16} />
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Task panel */}
      <TaskPanel
        tasks={topology.tasks}
        agents={topology.agents}
        collapsed={panelCollapsed}
        onToggleCollapse={() => setPanelCollapsed((v) => !v)}
        selectedAgentId={selectedAgentId}
      />
    </div>
  )
}

export default function AgentOverviewPage() {
  return (
    <ReactFlowProvider>
      <TopologyCanvas />
    </ReactFlowProvider>
  )
}
