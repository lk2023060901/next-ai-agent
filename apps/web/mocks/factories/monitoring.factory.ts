import type {
  DesktopClient,
  DesktopClientStatus,
  OperationLog,
  OperationLogStatus,
  ApprovalResult,
} from '@/types/api'

let clientSeq = 1
let logSeq = 1

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString()
}

function secondsAgo(n: number): string {
  return new Date(Date.now() - n * 1_000).toISOString()
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

type ToolInfo = { name: string; category: string; risk: 'low' | 'medium' | 'high' | 'critical' }

const TOOL_POOL: ToolInfo[] = [
  { name: 'read_file', category: 'file', risk: 'low' },
  { name: 'bash_exec', category: 'terminal', risk: 'medium' },
  { name: 'write_file', category: 'file', risk: 'medium' },
  { name: 'browser_screenshot', category: 'browser', risk: 'low' },
  { name: 'http_request', category: 'network', risk: 'low' },
  { name: 'create_file', category: 'file', risk: 'medium' },
  { name: 'kill_process', category: 'system', risk: 'high' },
]

const AGENT_NAMES = [
  '前端开发 Agent',
  '后端开发 Agent',
  '测试 Agent',
  '代码审查 Agent',
  '协调 Agent',
]

const CLIENT_SEEDS: Array<{
  name: string
  hostname: string
  platform: string
  status: DesktopClientStatus
  currentTaskSummary?: string
  currentAgentName?: string
}> = [
  {
    name: '开发工作站',
    hostname: 'macbook-pro-liukai',
    platform: 'macOS 14.0',
    status: 'running',
    currentTaskSummary: '正在重构用户认证模块，处理 JWT token 刷新逻辑...',
    currentAgentName: '后端开发 Agent',
  },
  {
    name: '办公电脑',
    hostname: 'desktop-win11',
    platform: 'Windows 11',
    status: 'idle',
  },
  {
    name: '测试服务器',
    hostname: 'ubuntu-test-01',
    platform: 'Ubuntu 22.04',
    status: 'offline',
  },
]

export function makeDesktopClientList(wsId: string): DesktopClient[] {
  return CLIENT_SEEDS.map((seed) => {
    const isOnline = seed.status !== 'offline'
    const base: DesktopClient = {
      id: `client-${clientSeq++}`,
      workspaceId: wsId,
      name: seed.name,
      hostname: seed.hostname,
      platform: seed.platform,
      status: seed.status,
      lastSeenAt: isOnline ? minutesAgo(rand(1, 5)) : minutesAgo(rand(60, 1440)),
      appVersion: '1.2.3',
    }
    if (seed.currentTaskSummary) base.currentTaskSummary = seed.currentTaskSummary
    if (seed.currentAgentName) base.currentAgentName = seed.currentAgentName
    if (isOnline) base.connectedAt = minutesAgo(rand(60, 480))
    return base
  })
}

const PARAMS_TEMPLATES = [
  'path="/src/auth/jwt.ts"',
  'command="npm run test"',
  'path="/src/utils/helper.ts" content="..."',
  'url="localhost:3000/screenshot"',
  'url="https://api.example.com/v1/users"',
  'path="/tmp/output.json"',
  'pid=12345',
]

const LOG_STATUSES: OperationLogStatus[] = [
  'success',
  'success',
  'success',
  'failed',
  'running',
  'blocked',
]
const APPROVAL_RESULTS: ApprovalResult[] = ['auto', 'auto', 'approved', 'denied', 'auto', 'blocked']

export function makeOperationLog(clientId: string): OperationLog {
  const tool = TOOL_POOL[rand(0, TOOL_POOL.length - 1)]!
  const status = LOG_STATUSES[rand(0, LOG_STATUSES.length - 1)]!
  const approval =
    tool.risk === 'low' ? 'auto' : APPROVAL_RESULTS[rand(0, APPROVAL_RESULTS.length - 1)]!
  const started = secondsAgo(rand(5, 3600))
  const durationMs = rand(100, 5000)
  const log: OperationLog = {
    id: `log-${logSeq++}`,
    clientId,
    agentName: AGENT_NAMES[rand(0, AGENT_NAMES.length - 1)]!,
    toolName: tool.name,
    toolCategory: tool.category,
    paramsSummary: PARAMS_TEMPLATES[rand(0, PARAMS_TEMPLATES.length - 1)]!,
    status,
    riskLevel: tool.risk,
    approvalResult: approval,
    startedAt: started,
    ...(status !== 'running'
      ? {
          completedAt: new Date(new Date(started).getTime() + durationMs).toISOString(),
          durationMs,
        }
      : {}),
  }
  return log
}

export function makeOperationLogList(clientId: string, count = 50): OperationLog[] {
  return Array.from({ length: count }, () => makeOperationLog(clientId))
}
