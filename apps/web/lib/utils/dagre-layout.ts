import dagre from '@dagrejs/dagre'
import { MarkerType } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import type { Agent, AgentConnection } from '@/types/api'
import type { AgentNodeData } from '@/components/features/topology/agent-node'
import type { FlowEdgeData } from '@/components/features/topology/animated-edge'

const NODE_WIDTH = 200
const NODE_HEIGHT = 120

interface LayoutOptions {
  rankdir?: 'TB' | 'BT' | 'LR' | 'RL'
  nodesep?: number
  ranksep?: number
}

export function getLayoutedElements(
  agents: Agent[],
  connections: AgentConnection[],
  options: LayoutOptions = {},
): { nodes: Node<AgentNodeData>[]; edges: Edge<FlowEdgeData>[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: options.rankdir ?? 'TB',
    nodesep: options.nodesep ?? 80,
    ranksep: options.ranksep ?? 100,
  })

  // Add nodes
  for (const agent of agents) {
    g.setNode(agent.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  // Add edges
  for (const conn of connections) {
    g.setEdge(conn.sourceAgentId, conn.targetAgentId)
  }

  dagre.layout(g)

  // Map dagre output to XY Flow nodes (dagre gives center coords, XY Flow uses top-left)
  const nodes: Node<AgentNodeData>[] = agents.map((agent) => {
    const pos = g.node(agent.id)
    return {
      id: agent.id,
      type: 'agentNode',
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      data: { agent },
    }
  })

  // Map connections to XY Flow edges
  const edges: Edge<FlowEdgeData>[] = connections.map((conn) => ({
    id: conn.id,
    source: conn.sourceAgentId,
    target: conn.targetAgentId,
    type: 'animatedEdge',
    data: {
      messageCount: conn.messageCount,
      active: conn.active,
      ...(conn.label ? { label: conn.label } : {}),
    },
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  }))

  return { nodes, edges }
}
