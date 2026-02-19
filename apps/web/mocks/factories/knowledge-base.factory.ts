import type { KnowledgeBase } from '@/types/api'

let seq = 1
const now = () => new Date().toISOString()

const KB_SEEDS: Array<{ name: string; documentCount: number }> = [
  { name: '产品文档', documentCount: 42 },
  { name: '技术规范', documentCount: 18 },
  { name: 'API 参考', documentCount: 35 },
  { name: '用户指南', documentCount: 27 },
]

export function makeKnowledgeBase(overrides: Partial<KnowledgeBase> = {}): KnowledgeBase {
  const seed = KB_SEEDS[0]!
  return {
    id: `kb-${seq++}`,
    name: seed.name,
    workspaceId: 'ws-default',
    documentCount: seed.documentCount,
    createdAt: now(),
    ...overrides,
  }
}

export function makeKnowledgeBaseList(workspaceId: string): KnowledgeBase[] {
  return KB_SEEDS.map((seed) => makeKnowledgeBase({ ...seed, workspaceId }))
}
