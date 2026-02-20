import { http, HttpResponse, delay } from 'msw'
import { makeDesktopClientList, makeOperationLogList } from '../factories/monitoring.factory'
import type { DesktopClient, OperationLog } from '@/types/api'

const CLIENT_STORE: Record<string, DesktopClient[]> = {}
const LOG_STORE: Record<string, OperationLog[]> = {}

function getClients(wsId: string): DesktopClient[] {
  if (!CLIENT_STORE[wsId]) CLIENT_STORE[wsId] = makeDesktopClientList(wsId)
  return CLIENT_STORE[wsId]!
}

function getLogs(clientId: string): OperationLog[] {
  if (!LOG_STORE[clientId]) LOG_STORE[clientId] = makeOperationLogList(clientId, 50)
  return LOG_STORE[clientId]!
}

export const monitoringHandlers = [
  http.get('/api/workspaces/:wsId/monitoring/clients', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: getClients(params.wsId as string) })
  }),

  http.get('/api/monitoring/clients/:clientId/status', async ({ params }) => {
    await delay(100)
    const clientId = params.clientId as string
    for (const wsClients of Object.values(CLIENT_STORE)) {
      const client = wsClients.find((c) => c.id === clientId)
      if (client) return HttpResponse.json({ data: client })
    }
    return HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  http.get('/api/monitoring/clients/:clientId/logs', async ({ params, request }) => {
    await delay(200)
    const clientId = params.clientId as string
    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status')
    const riskFilter = url.searchParams.get('riskLevel')
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20', 10)

    let logs = getLogs(clientId)
    if (statusFilter) logs = logs.filter((l) => l.status === statusFilter)
    if (riskFilter) logs = logs.filter((l) => l.riskLevel === riskFilter)

    const total = logs.length
    const start = (page - 1) * pageSize
    const slice = logs.slice(start, start + pageSize)

    return HttpResponse.json({
      data: slice,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  }),

  http.post('/api/monitoring/clients/:clientId/commands', async () => {
    await delay(500)
    if (Math.random() < 0.1) {
      return HttpResponse.json(
        { message: 'Command failed: client not responding' },
        { status: 500 },
      )
    }
    return HttpResponse.json({ data: { success: true } })
  }),
]
