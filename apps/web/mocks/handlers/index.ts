import { authHandlers } from './auth'
import { orgHandlers } from './orgs'
import { agentHandlers } from './agents'
import { sessionHandlers } from './sessions'

export const handlers = [
  ...authHandlers,
  ...orgHandlers,
  ...agentHandlers,
  ...sessionHandlers,
]
