import { http, HttpResponse, delay } from 'msw'
import {
  makeDashboardStats,
  makeMessageTrend,
  makeAgentWorkload,
  makeActivities,
} from '../factories/dashboard.factory'
import {
  makeUsageOverview,
  makeTokenTrend,
  makeProviderUsage,
  makeAgentRanking,
  makeUsageRecords,
} from '../factories/usage.factory'

const STATS = makeDashboardStats()
const MESSAGE_TREND = makeMessageTrend()
const WORKLOAD = makeAgentWorkload()
const ACTIVITIES = makeActivities()

const USAGE_OVERVIEW = makeUsageOverview()
const TOKEN_TREND = makeTokenTrend()
const PROVIDERS = makeProviderUsage()
const AGENT_RANKING = makeAgentRanking()
const RECORDS = makeUsageRecords()

export const dashboardHandlers = [
  // ─── Dashboard ─────────────────────────────────────────────────────────
  http.get('/api/orgs/:orgId/dashboard/stats', async () => {
    await delay(300)
    return HttpResponse.json({ data: STATS })
  }),

  http.get('/api/orgs/:orgId/dashboard/message-trend', async () => {
    await delay(200)
    return HttpResponse.json({ data: MESSAGE_TREND })
  }),

  http.get('/api/orgs/:orgId/dashboard/workload', async () => {
    await delay(200)
    return HttpResponse.json({ data: WORKLOAD })
  }),

  http.get('/api/orgs/:orgId/dashboard/activities', async () => {
    await delay(250)
    return HttpResponse.json({ data: ACTIVITIES })
  }),

  // ─── Usage ─────────────────────────────────────────────────────────────
  http.get('/api/orgs/:orgId/usage/overview', async () => {
    await delay(300)
    return HttpResponse.json({ data: USAGE_OVERVIEW })
  }),

  http.get('/api/orgs/:orgId/usage/token-trend', async () => {
    await delay(200)
    return HttpResponse.json({ data: TOKEN_TREND })
  }),

  http.get('/api/orgs/:orgId/usage/providers', async () => {
    await delay(200)
    return HttpResponse.json({ data: PROVIDERS })
  }),

  http.get('/api/orgs/:orgId/usage/agent-ranking', async () => {
    await delay(200)
    return HttpResponse.json({ data: AGENT_RANKING })
  }),

  http.get('/api/orgs/:orgId/usage/records', async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = Number(url.searchParams.get('pageSize') ?? '100')
    const start = (page - 1) * pageSize
    const slice = RECORDS.slice(start, start + pageSize)
    return HttpResponse.json({
      data: slice,
      total: RECORDS.length,
      page,
      pageSize,
      totalPages: Math.ceil(RECORDS.length / pageSize),
    })
  }),
]
