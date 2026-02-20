import type {
  Channel,
  ChannelType,
  ChannelStatus,
  ChannelMessage,
  MessageDirection,
  ChannelMessageStatus,
  RoutingRule,
  RuleField,
  RuleOperator,
  ChannelStats,
} from '@/types/api'

let channelSeq = 1
let msgSeq = 1
let ruleSeq = 1

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString()
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const CHANNEL_SEEDS: Array<{
  type: ChannelType
  name: string
  status: ChannelStatus
  connectedChannels: number
}> = [
  { type: 'slack', name: 'My Team Slack', status: 'connected', connectedChannels: 3 },
  { type: 'discord', name: 'Community Discord', status: 'connected', connectedChannels: 5 },
  { type: 'telegram', name: 'Support Bot', status: 'connected', connectedChannels: 1 },
  { type: 'webchat', name: 'Website Chat', status: 'connected', connectedChannels: 1 },
  { type: 'feishu', name: '飞书办公', status: 'disconnected', connectedChannels: 0 },
]

export function makeChannel(workspaceId: string, overrides: Partial<Channel> = {}): Channel {
  const seed = CHANNEL_SEEDS[(channelSeq - 1) % CHANNEL_SEEDS.length]!
  return {
    id: `ch-${channelSeq++}`,
    workspaceId,
    type: seed.type,
    name: seed.name,
    status: seed.status,
    connectedChannels: seed.connectedChannels,
    lastActiveAt: minutesAgo(rand(1, 120)),
    defaultAgentId: 'agent-1',
    config: {},
    createdAt: daysAgo(rand(10, 60)),
    updatedAt: daysAgo(rand(0, 5)),
    ...overrides,
  }
}

export function makeChannelList(workspaceId: string): Channel[] {
  return CHANNEL_SEEDS.map((seed) => makeChannel(workspaceId, { ...seed }))
}

const SENDERS = ['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace']
const MSG_CONTENTS = [
  '你好，我想了解一下产品功能',
  '如何配置 API 密钥？',
  '我遇到了一个 Bug，应用无法启动',
  '能帮我分析这段代码吗？',
  '你好！有什么可以帮助你的？',
  '根据您的描述，这个问题可以通过以下步骤解决...',
  '请稍等，我正在查询相关文档...',
  '已为您找到解决方案，请参考以下步骤',
]

export function makeChannelMessage(
  channelId: string,
  overrides: Partial<ChannelMessage> = {},
): ChannelMessage {
  const direction: MessageDirection = Math.random() > 0.5 ? 'inbound' : 'outbound'
  const status: ChannelMessageStatus = Math.random() > 0.1 ? 'success' : 'failed'
  return {
    id: `msg-${msgSeq++}`,
    channelId,
    direction,
    senderName: direction === 'inbound' ? SENDERS[rand(0, SENDERS.length - 1)]! : 'AI Agent',
    content: MSG_CONTENTS[rand(0, MSG_CONTENTS.length - 1)]!,
    ...(direction === 'outbound' ? { agentId: 'agent-1', agentName: '协调 Agent' } : {}),
    status,
    ...(status === 'failed' ? { errorDetail: 'Network timeout' } : {}),
    processingMs: rand(50, 2000),
    createdAt: minutesAgo(rand(1, 1440)),
    ...overrides,
  }
}

export function makeChannelMessageList(channelId: string, count = 50): ChannelMessage[] {
  return Array.from({ length: count }, () => makeChannelMessage(channelId)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

const RULE_SEEDS: Array<{
  field: RuleField
  operator: RuleOperator
  value: string
  targetAgentName: string
}> = [
  { field: 'sender', operator: 'contains', value: '@admin', targetAgentName: '协调 Agent' },
  { field: 'content', operator: 'contains', value: '/bug', targetAgentName: '测试 Agent' },
  {
    field: 'content',
    operator: 'regex',
    value: '.*帮助.*|.*help.*',
    targetAgentName: '客服 Agent',
  },
]

export function makeRoutingRule(
  channelId: string,
  overrides: Partial<RoutingRule> = {},
): RoutingRule {
  const seed = RULE_SEEDS[(ruleSeq - 1) % RULE_SEEDS.length]!
  return {
    id: `rule-${ruleSeq++}`,
    channelId,
    priority: ruleSeq,
    field: seed.field,
    operator: seed.operator,
    value: seed.value,
    targetAgentId: `agent-${rand(1, 3)}`,
    targetAgentName: seed.targetAgentName,
    enabled: true,
    ...overrides,
  }
}

export function makeRoutingRuleList(channelId: string): RoutingRule[] {
  return RULE_SEEDS.map((seed) => makeRoutingRule(channelId, { ...seed }))
}

export function makeChannelStats(): ChannelStats {
  return {
    todayInbound: rand(50, 500),
    todayOutbound: rand(40, 480),
    avgResponseMs: rand(200, 1500),
    activeUsers: rand(5, 50),
    failedMessages: rand(0, 10),
    hourlyTrend: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      inbound: rand(0, 30),
      outbound: rand(0, 25),
    })),
  }
}
