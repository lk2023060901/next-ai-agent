import { http, HttpResponse, delay } from 'msw'
import {
  PLANS,
  makeSubscription,
  makeInvoiceList,
  makePaymentMethodList,
  makeUsageAlerts,
} from '../factories/billing.factory'
import type { Subscription, Invoice, PaymentMethod, UsageAlert } from '@/types/api'

const SUB_STORE: Record<string, Subscription> = {}
const INVOICE_STORE: Record<string, Invoice[]> = {}
const PM_STORE: Record<string, PaymentMethod[]> = {}
const ALERT_STORE: Record<string, UsageAlert[]> = {}

function getSub(orgId: string): Subscription {
  if (!SUB_STORE[orgId]) SUB_STORE[orgId] = makeSubscription(orgId)
  return SUB_STORE[orgId]!
}
function getInvoices(orgId: string): Invoice[] {
  if (!INVOICE_STORE[orgId]) INVOICE_STORE[orgId] = makeInvoiceList(orgId)
  return INVOICE_STORE[orgId]!
}
function getPMs(orgId: string): PaymentMethod[] {
  if (!PM_STORE[orgId]) PM_STORE[orgId] = makePaymentMethodList()
  return PM_STORE[orgId]!
}
function getAlerts(orgId: string): UsageAlert[] {
  if (!ALERT_STORE[orgId]) ALERT_STORE[orgId] = makeUsageAlerts(orgId)
  return ALERT_STORE[orgId]!
}

export const billingHandlers = [
  http.get('/api/pricing/plans', () => {
    return HttpResponse.json({ data: PLANS })
  }),

  http.get('/api/orgs/:orgId/billing/subscription', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: getSub(params.orgId as string) })
  }),

  http.patch('/api/orgs/:orgId/billing/subscription', async ({ params, request }) => {
    await delay(500)
    const body = (await request.json()) as { planId?: string; cycle?: string; cancel?: boolean }
    const orgId = params.orgId as string
    const sub = getSub(orgId)
    if (body.planId) sub.planId = body.planId as Subscription['planId']
    if (body.cycle) sub.cycle = body.cycle as Subscription['cycle']
    if (body.cancel !== undefined) sub.cancelAtPeriodEnd = body.cancel
    return HttpResponse.json({ data: sub })
  }),

  http.get('/api/orgs/:orgId/billing/invoices', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: getInvoices(params.orgId as string) })
  }),

  http.get('/api/orgs/:orgId/billing/payment-methods', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: getPMs(params.orgId as string) })
  }),

  http.post('/api/orgs/:orgId/billing/payment-methods', async ({ params }) => {
    await delay(600)
    const orgId = params.orgId as string
    const newPM: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: 'card',
      brand: 'Visa',
      last4: String(Math.floor(1000 + Math.random() * 9000)),
      expMonth: 12,
      expYear: 2028,
      isDefault: false,
    }
    getPMs(orgId).push(newPM)
    return HttpResponse.json({ data: newPM }, { status: 201 })
  }),

  http.patch('/api/orgs/:orgId/billing/payment-methods/:methodId', async ({ params }) => {
    await delay(300)
    const orgId = params.orgId as string
    const methodId = params.methodId as string
    const pms = getPMs(orgId)
    pms.forEach((pm) => {
      pm.isDefault = pm.id === methodId
    })
    const target = pms.find((pm) => pm.id === methodId)
    if (!target) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ data: target })
  }),

  http.delete('/api/orgs/:orgId/billing/payment-methods/:methodId', async ({ params }) => {
    await delay(300)
    const orgId = params.orgId as string
    const methodId = params.methodId as string
    const pms = getPMs(orgId)
    const idx = pms.findIndex((pm) => pm.id === methodId)
    if (idx !== -1) pms.splice(idx, 1)
    return HttpResponse.json({ data: null })
  }),

  http.get('/api/orgs/:orgId/billing/alerts', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: getAlerts(params.orgId as string) })
  }),

  http.patch('/api/orgs/:orgId/billing/alerts/:alertId', async ({ params, request }) => {
    await delay(300)
    const orgId = params.orgId as string
    const alertId = params.alertId as string
    const body = (await request.json()) as Partial<UsageAlert>
    const alerts = getAlerts(orgId)
    const idx = alerts.findIndex((a) => a.id === alertId)
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    alerts[idx] = { ...alerts[idx]!, ...body }
    return HttpResponse.json({ data: alerts[idx] })
  }),
]
