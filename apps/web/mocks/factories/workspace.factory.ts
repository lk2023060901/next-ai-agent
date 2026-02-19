import type { Workspace } from '@/types/api'

let seq = 1
const id = () => `ws-${seq++}`
const now = () => new Date().toISOString()

const EMOJIS = ['🏠', '💻', '🔧', '🚀', '📊', '🎯', '🌐', '⚙️']

export function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  const n = seq
  return {
    id: id(),
    slug: `workspace-${n}`,
    name: `工作区 ${n}`,
    emoji: EMOJIS[n % EMOJIS.length] ?? '📁',
    orgId: 'org-default',
    createdAt: now(),
    ...overrides,
  }
}

export function makeWorkspaceList(orgId: string): Workspace[] {
  return [
    makeWorkspace({ slug: 'default', name: '默认工作区', emoji: '🏠', orgId }),
    makeWorkspace({ slug: 'dev', name: '开发团队', emoji: '💻', orgId }),
    makeWorkspace({ slug: 'ops', name: '运维组', emoji: '🔧', orgId }),
  ]
}
