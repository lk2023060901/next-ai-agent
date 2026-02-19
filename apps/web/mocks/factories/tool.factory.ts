import type { Tool, ToolRiskLevel, ToolPlatform } from '@/types/api'

interface ToolSeed {
  name: string
  category: string
  description: string
  riskLevel: ToolRiskLevel
  platform: ToolPlatform
  requiresApproval: boolean
}

const TOOL_SEEDS: ToolSeed[] = [
  // file
  {
    name: 'file-read',
    category: 'file',
    description: '读取文件内容',
    riskLevel: 'low',
    platform: 'local',
    requiresApproval: false,
  },
  {
    name: 'file-write',
    category: 'file',
    description: '写入或创建文件',
    riskLevel: 'medium',
    platform: 'local',
    requiresApproval: true,
  },
  // network
  {
    name: 'http-request',
    category: 'network',
    description: '发送 HTTP 请求',
    riskLevel: 'medium',
    platform: 'both',
    requiresApproval: true,
  },
  {
    name: 'web-scraper',
    category: 'network',
    description: '抓取网页内容',
    riskLevel: 'medium',
    platform: 'cloud',
    requiresApproval: true,
  },
  // code
  {
    name: 'code-exec',
    category: 'code',
    description: '执行代码片段',
    riskLevel: 'high',
    platform: 'local',
    requiresApproval: true,
  },
  {
    name: 'code-lint',
    category: 'code',
    description: '代码静态分析与 lint',
    riskLevel: 'low',
    platform: 'local',
    requiresApproval: false,
  },
  // system
  {
    name: 'shell-exec',
    category: 'system',
    description: '执行 shell 命令',
    riskLevel: 'high',
    platform: 'local',
    requiresApproval: true,
  },
  {
    name: 'env-read',
    category: 'system',
    description: '读取环境变量',
    riskLevel: 'low',
    platform: 'local',
    requiresApproval: false,
  },
  // database
  {
    name: 'db-query',
    category: 'database',
    description: '执行数据库查询',
    riskLevel: 'medium',
    platform: 'cloud',
    requiresApproval: true,
  },
  {
    name: 'db-migrate',
    category: 'database',
    description: '执行数据库迁移',
    riskLevel: 'high',
    platform: 'cloud',
    requiresApproval: true,
  },
  // communication
  {
    name: 'send-notification',
    category: 'communication',
    description: '发送通知消息',
    riskLevel: 'low',
    platform: 'cloud',
    requiresApproval: false,
  },
  // integration
  {
    name: 'github-api',
    category: 'integration',
    description: '调用 GitHub API',
    riskLevel: 'medium',
    platform: 'cloud',
    requiresApproval: true,
  },
]

let seq = 1

export function makeTool(overrides: Partial<Tool> = {}): Tool {
  const seed = TOOL_SEEDS[0]!
  return {
    id: `tool-${seq++}`,
    name: seed.name,
    category: seed.category,
    description: seed.description,
    riskLevel: seed.riskLevel,
    platform: seed.platform,
    requiresApproval: seed.requiresApproval,
    ...overrides,
  }
}

export function makeToolRegistry(): Tool[] {
  return TOOL_SEEDS.map((seed) => makeTool(seed))
}
