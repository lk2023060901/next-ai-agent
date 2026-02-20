'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Lazy-load the entire topology canvas (brings in @xyflow/react + dagre)
const TopologyCanvas = dynamic(
  () =>
    import('@/components/features/topology/topology-canvas').then((m) => ({
      default: m.TopologyCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    ),
  },
)

export default function AgentOverviewPage() {
  return <TopologyCanvas />
}
