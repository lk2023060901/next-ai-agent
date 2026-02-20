import { authHandlers } from './auth'
import { orgHandlers } from './orgs'
import { agentHandlers } from './agents'
import { sessionHandlers } from './sessions'
import { toolHandlers } from './tools'
import { knowledgeBaseHandlers } from './knowledge-bases'
import { topologyHandlers } from './topology'
import { dashboardHandlers } from './dashboard'
import { channelHandlers } from './channels'
import { pluginHandlers } from './plugins'

export const handlers = [
  ...authHandlers,
  ...orgHandlers,
  ...agentHandlers,
  ...sessionHandlers,
  ...toolHandlers,
  ...knowledgeBaseHandlers,
  ...topologyHandlers,
  ...dashboardHandlers,
  ...channelHandlers,
  ...pluginHandlers,
]
