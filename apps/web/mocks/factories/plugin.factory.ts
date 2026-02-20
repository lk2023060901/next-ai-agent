import type {
  Plugin,
  PluginType,
  PluginPricingModel,
  InstalledPlugin,
  PluginReview,
  PluginConfigField,
} from '@/types/api'

let pluginSeq = 1
let installedSeq = 1
let reviewSeq = 1

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const TYPE_ICONS: Record<PluginType, string> = {
  tool: '🔧',
  channel: '📡',
  memory: '🧠',
  hook: '🪝',
  skill: '⚡',
  'agent-template': '🤖',
  observability: '📊',
}

const PLUGIN_SEEDS: Array<{
  name: string
  displayName: string
  description: string
  longDescription: string
  author: string
  type: PluginType
  pricingModel: PluginPricingModel
  price?: number
  monthlyPrice?: number
  trialDays?: number
  tags: string[]
  permissions: string[]
  configSchema: PluginConfigField[]
}> = [
  {
    name: 'github-integration',
    displayName: 'GitHub Integration',
    description: '让 Agent 读写 GitHub 仓库、管理 Issue 和 PR',
    longDescription:
      'GitHub Integration 插件为 Agent 提供完整的 GitHub API 访问能力，包括仓库管理、Issue 跟踪、Pull Request 操作、CI/CD 触发等。支持 OAuth 和 Personal Access Token 两种认证方式。',
    author: 'NextAI Official',
    type: 'tool',
    pricingModel: 'free',
    tags: ['开发工具', 'GitHub', '代码管理'],
    permissions: ['read:agents', 'write:tools', 'http:external'],
    configSchema: [
      {
        key: 'accessToken',
        label: 'Personal Access Token',
        type: 'password',
        required: true,
        placeholder: 'ghp_...',
        description: '需要 repo, issues, pull_requests 权限',
      },
      {
        key: 'defaultOrg',
        label: '默认组织',
        type: 'text',
        required: false,
        placeholder: 'your-org',
      },
    ],
  },
  {
    name: 'jira-integration',
    displayName: 'Jira Integration',
    description: '与 Jira 项目管理系统深度集成',
    longDescription:
      '通过 Jira Integration，Agent 可以自动创建和更新 Issue、管理 Sprint、追踪项目进度。支持 Jira Cloud 和 Server 版本。',
    author: 'NextAI Official',
    type: 'tool',
    pricingModel: 'subscription',
    monthlyPrice: 2900,
    trialDays: 14,
    tags: ['项目管理', 'Jira', '敏捷'],
    permissions: ['read:agents', 'write:tools', 'http:external'],
    configSchema: [
      {
        key: 'baseUrl',
        label: 'Jira Base URL',
        type: 'text',
        required: true,
        placeholder: 'https://yourcompany.atlassian.net',
      },
      {
        key: 'email',
        label: '账号邮箱',
        type: 'text',
        required: true,
        placeholder: 'user@example.com',
      },
      {
        key: 'apiToken',
        label: 'API Token',
        type: 'password',
        required: true,
        placeholder: 'Atlassian API Token',
      },
    ],
  },
  {
    name: 'web-search',
    displayName: '网页搜索',
    description: '为 Agent 提供实时网页搜索能力',
    longDescription:
      '网页搜索插件集成 Bing Search API，让 Agent 能够获取最新的网络信息。支持普通搜索、新闻搜索、图片搜索等多种模式。',
    author: 'NextAI Official',
    type: 'tool',
    pricingModel: 'usage_based',
    tags: ['搜索', '信息获取', '网络'],
    permissions: ['http:external'],
    configSchema: [
      {
        key: 'apiKey',
        label: 'Bing Search API Key',
        type: 'password',
        required: true,
        placeholder: 'API Key',
      },
      {
        key: 'resultsCount',
        label: '默认返回数量',
        type: 'number',
        required: false,
        default: 5,
      },
    ],
  },
  {
    name: 'pinecone-memory',
    displayName: 'Pinecone 记忆',
    description: '使用 Pinecone 作为向量记忆存储后端',
    longDescription:
      '替换默认记忆存储，使用 Pinecone 托管向量数据库。提供更高的检索性能和存储容量，适合大规模部署场景。',
    author: 'Pinecone Labs',
    type: 'memory',
    pricingModel: 'free',
    tags: ['记忆', '向量数据库', 'Pinecone'],
    permissions: ['write:memory', 'read:memory'],
    configSchema: [
      {
        key: 'apiKey',
        label: 'Pinecone API Key',
        type: 'password',
        required: true,
        placeholder: 'pc-...',
      },
      {
        key: 'environment',
        label: '环境',
        type: 'text',
        required: true,
        placeholder: 'us-east-1-aws',
      },
      {
        key: 'indexName',
        label: 'Index 名称',
        type: 'text',
        required: true,
        placeholder: 'nextai-memory',
      },
    ],
  },
  {
    name: 'audit-hook',
    displayName: '审计日志钩子',
    description: '记录所有 Agent 操作到外部系统',
    longDescription:
      '通过 Webhook 将所有 Agent 操作（工具调用、消息收发、记忆读写）发送到您的审计系统。支持 Splunk、Datadog、自定义 HTTP 端点。',
    author: 'Security Team',
    type: 'hook',
    pricingModel: 'free',
    tags: ['安全', '审计', 'Webhook'],
    permissions: ['read:logs', 'http:external'],
    configSchema: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'text',
        required: true,
        placeholder: 'https://your-siem.example.com/events',
      },
      {
        key: 'secret',
        label: 'Signing Secret',
        type: 'password',
        required: false,
        placeholder: '用于验证请求来源',
      },
    ],
  },
  {
    name: 'code-review-skill',
    displayName: '代码审查技能',
    description: '专业的代码审查 Agent 模板',
    longDescription:
      '预训练的代码审查技能包，包含代码质量分析、安全漏洞检测、性能优化建议等完整提示词配置。开箱即用，支持 10+ 编程语言。',
    author: 'DevTools Community',
    type: 'skill',
    pricingModel: 'one_time',
    price: 9900,
    tags: ['代码审查', '开发工具', '质量'],
    permissions: ['read:agents'],
    configSchema: [],
  },
  {
    name: 'customer-service-template',
    displayName: '客服 Agent 模板',
    description: '企业级客服 Agent 完整配置模板',
    longDescription:
      '包含完整客服 Agent 配置：欢迎语、FAQ 知识库集成、工单创建、情感分析、人工转接逻辑。可根据企业品牌定制。',
    author: 'Enterprise Solutions',
    type: 'agent-template',
    pricingModel: 'subscription',
    monthlyPrice: 9900,
    trialDays: 7,
    tags: ['客服', 'Agent 模板', '企业'],
    permissions: ['read:agents', 'write:agents', 'write:memory'],
    configSchema: [
      {
        key: 'brandName',
        label: '品牌名称',
        type: 'text',
        required: true,
        placeholder: '您的公司名称',
      },
      {
        key: 'language',
        label: '主要语言',
        type: 'select',
        required: true,
        options: [
          { value: 'zh', label: '中文' },
          { value: 'en', label: 'English' },
          { value: 'bilingual', label: '中英双语' },
        ],
        default: 'zh',
      },
    ],
  },
  {
    name: 'grafana-observability',
    displayName: 'Grafana 监控',
    description: '将 Agent 指标推送到 Grafana',
    longDescription:
      '通过 Prometheus Remote Write 协议，将 Agent 运行指标（响应时间、Token 用量、错误率）实时推送到您的 Grafana 监控系统。内置 Agent 专用 Dashboard 模板。',
    author: 'Observability Team',
    type: 'observability',
    pricingModel: 'free',
    tags: ['监控', 'Grafana', 'Prometheus'],
    permissions: ['read:metrics'],
    configSchema: [
      {
        key: 'remoteWriteUrl',
        label: 'Remote Write URL',
        type: 'text',
        required: true,
        placeholder: 'https://prometheus.example.com/api/v1/write',
      },
      {
        key: 'bearerToken',
        label: 'Bearer Token',
        type: 'password',
        required: false,
      },
    ],
  },
]

export function makePlugin(overrides: Partial<Plugin> = {}): Plugin {
  const seed = PLUGIN_SEEDS[(pluginSeq - 1) % PLUGIN_SEEDS.length]!
  const id = `plugin-${pluginSeq++}`
  return {
    id,
    name: seed.name,
    displayName: seed.displayName,
    description: seed.description,
    longDescription: seed.longDescription,
    author: seed.author,
    icon: TYPE_ICONS[seed.type],
    type: seed.type,
    version: `${rand(1, 3)}.${rand(0, 9)}.${rand(0, 9)}`,
    pricingModel: seed.pricingModel,
    ...(seed.price != null ? { price: seed.price } : {}),
    ...(seed.monthlyPrice != null ? { monthlyPrice: seed.monthlyPrice } : {}),
    ...(seed.trialDays != null ? { trialDays: seed.trialDays } : {}),
    rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
    reviewCount: rand(5, 200),
    installCount: rand(100, 5000),
    tags: seed.tags,
    permissions: seed.permissions,
    configSchema: seed.configSchema,
    screenshots: [],
    publishedAt: daysAgo(rand(30, 365)),
    updatedAt: daysAgo(rand(1, 30)),
    ...overrides,
  }
}

export function makePluginList(): Plugin[] {
  return PLUGIN_SEEDS.map((_, i) => {
    pluginSeq = i + 1
    return makePlugin()
  })
}

const REVIEW_TEXTS = [
  '非常好用，大幅提升了团队效率！',
  '配置简单，文档清晰，强烈推荐。',
  '功能完整，偶尔有小 Bug，但整体体验很好。',
  '对接了我们的内部系统，效果超出预期。',
  '试用期内就决定购买了，值得投资。',
  '响应速度很快，支持团队也很专业。',
]

const REVIEWER_NAMES = ['张三', '李四', '王五', 'Alice', 'Bob', 'Charlie']

export function makePluginReviews(pluginId: string, count = 5): PluginReview[] {
  return Array.from({ length: count }, () => ({
    id: `review-${reviewSeq++}`,
    pluginId,
    authorName: REVIEWER_NAMES[rand(0, REVIEWER_NAMES.length - 1)]!,
    rating: rand(3, 5),
    content: REVIEW_TEXTS[rand(0, REVIEW_TEXTS.length - 1)]!,
    createdAt: daysAgo(rand(1, 90)),
  }))
}

export function makeInstalledPlugin(
  workspaceId: string,
  plugin: Plugin,
  overrides: Partial<InstalledPlugin> = {},
): InstalledPlugin {
  return {
    id: `installed-${installedSeq++}`,
    workspaceId,
    pluginId: plugin.id,
    plugin,
    status: 'enabled',
    config: {},
    installedAt: daysAgo(rand(1, 30)),
    installedBy: 'user-1',
    ...overrides,
  }
}

export function makeInstalledPluginList(workspaceId: string): InstalledPlugin[] {
  const allPlugins = makePluginList()
  return allPlugins.slice(0, 3).map((p) => makeInstalledPlugin(workspaceId, p))
}
