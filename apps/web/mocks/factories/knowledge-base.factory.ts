import type {
  KnowledgeBase,
  KbDocument,
  DocumentStatus,
  EmbeddingModel,
  SearchResult,
} from '@/types/api'

let kbSeq = 1
let docSeq = 1

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const KB_SEEDS: Array<{
  name: string
  description: string
  documentCount: number
  embeddingModel: EmbeddingModel
}> = [
  {
    name: '产品文档',
    description: '产品功能说明、用户手册和 FAQ',
    documentCount: 42,
    embeddingModel: 'text-embedding-3-small',
  },
  {
    name: '技术规范',
    description: '系统架构、接口规范和开发规范',
    documentCount: 18,
    embeddingModel: 'text-embedding-3-large',
  },
  {
    name: 'API 参考',
    description: 'REST API 接口文档和 SDK 使用指南',
    documentCount: 35,
    embeddingModel: 'text-embedding-3-small',
  },
  {
    name: '用户指南',
    description: '新手入门教程和最佳实践',
    documentCount: 27,
    embeddingModel: 'embed-english-v3.0',
  },
]

export function makeKnowledgeBase(overrides: Partial<KnowledgeBase> = {}): KnowledgeBase {
  const seed = KB_SEEDS[(kbSeq - 1) % KB_SEEDS.length]!
  return {
    id: `kb-${kbSeq++}`,
    name: seed.name,
    description: seed.description,
    workspaceId: 'ws-default',
    documentCount: seed.documentCount,
    embeddingModel: seed.embeddingModel,
    createdAt: daysAgo(rand(10, 60)),
    updatedAt: daysAgo(rand(0, 9)),
    ...overrides,
  }
}

export function makeKnowledgeBaseList(workspaceId: string): KnowledgeBase[] {
  return KB_SEEDS.map((seed) => makeKnowledgeBase({ ...seed, workspaceId }))
}

const DOC_NAMES = [
  '快速入门指南.pdf',
  '系统架构设计.docx',
  'API接口规范v2.md',
  '数据库设计方案.pdf',
  '前端开发规范.md',
  '测试用例说明.docx',
  '部署运维手册.pdf',
  '用户反馈汇总.csv',
  '性能优化报告.pdf',
  '安全审计记录.txt',
]

const DOC_STATUSES: DocumentStatus[] = [
  'indexed',
  'indexed',
  'indexed',
  'processing',
  'pending',
  'failed',
]

export function makeKbDocument(kbId: string, overrides: Partial<KbDocument> = {}): KbDocument {
  const name = DOC_NAMES[(docSeq - 1) % DOC_NAMES.length]!
  const ext = name.split('.').pop() as KbDocument['fileType']
  const status = DOC_STATUSES[rand(0, DOC_STATUSES.length - 1)]!
  return {
    id: `doc-${docSeq++}`,
    kbId,
    name,
    fileType: ext ?? 'pdf',
    fileSize: rand(50_000, 5_000_000),
    status,
    ...(status === 'indexed' ? { chunkCount: rand(10, 200) } : {}),
    uploadedAt: daysAgo(rand(1, 30)),
    ...(status === 'indexed' || status === 'failed' ? { processedAt: daysAgo(rand(0, 1)) } : {}),
    ...overrides,
  }
}

export function makeKbDocumentList(kbId: string, count = 8): KbDocument[] {
  return Array.from({ length: count }, () => makeKbDocument(kbId))
}

const CHUNK_TEMPLATES = [
  '本系统采用微服务架构，各服务通过 REST API 进行通信。核心服务包括用户服务、Agent 服务、知识库服务和任务调度服务。',
  '用户认证采用 JWT Token 机制，AccessToken 有效期为 1 小时，RefreshToken 有效期为 7 天。Token 需存储在 HttpOnly Cookie 中以防止 XSS 攻击。',
  '知识库的向量检索基于 Milvus 实现，支持余弦相似度和内积两种距离度量方式。查询时默认返回相关性最高的 5 个文档片段。',
  'Agent 工作流采用有向无环图（DAG）进行任务编排。协调者 Agent 负责分析任务并分配给专业 Agent，各 Agent 完成后汇报结果。',
  '数据库采用 PostgreSQL 作为主存储，Redis 用于缓存热点数据。所有写操作通过事务保证一致性，读操作可路由到只读副本。',
]

export function makeSearchResults(_query: string, count = 5): SearchResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `sr-${i + 1}`,
    documentId: `doc-${rand(1, 8)}`,
    documentName: DOC_NAMES[rand(0, DOC_NAMES.length - 1)]!,
    content: CHUNK_TEMPLATES[i % CHUNK_TEMPLATES.length]!,
    score: Number((1 - i * 0.12 - Math.random() * 0.05).toFixed(3)),
    chunkIndex: rand(0, 50),
  }))
}
