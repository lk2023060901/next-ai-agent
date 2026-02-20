import { http, HttpResponse, delay } from 'msw'
import {
  makePluginList,
  makePluginReviews,
  makeInstalledPluginList,
  makeInstalledPlugin,
} from '../factories/plugin.factory'
import type { Plugin, InstalledPlugin } from '@/types/api'

// In-memory stores
const MARKETPLACE_STORE: Plugin[] = makePluginList()
const INSTALLED_STORE: Record<string, InstalledPlugin[]> = {}

function getInstalled(wsId: string): InstalledPlugin[] {
  if (!INSTALLED_STORE[wsId]) INSTALLED_STORE[wsId] = makeInstalledPluginList(wsId)
  return INSTALLED_STORE[wsId]!
}

export const pluginHandlers = [
  // ─── Marketplace ──────────────────────────────────────────────────────────

  http.get('/api/plugins/marketplace', async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const pricingModel = url.searchParams.get('pricingModel')
    const search = url.searchParams.get('search')?.toLowerCase()
    const sort = url.searchParams.get('sort') ?? 'popular'
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 12)

    let plugins = [...MARKETPLACE_STORE]
    if (type) plugins = plugins.filter((p) => p.type === type)
    if (pricingModel) plugins = plugins.filter((p) => p.pricingModel === pricingModel)
    if (search)
      plugins = plugins.filter(
        (p) =>
          p.displayName.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.tags.some((t) => t.toLowerCase().includes(search)),
      )

    if (sort === 'popular') plugins.sort((a, b) => b.installCount - a.installCount)
    else if (sort === 'rating') plugins.sort((a, b) => b.rating - a.rating)
    else if (sort === 'newest')
      plugins.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    const total = plugins.length
    const slice = plugins.slice((page - 1) * pageSize, page * pageSize)
    return HttpResponse.json({
      data: slice,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  }),

  http.get('/api/plugins/marketplace/:pluginId', async ({ params }) => {
    await delay(150)
    const plugin = MARKETPLACE_STORE.find((p) => p.id === params.pluginId)
    if (!plugin) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ data: plugin })
  }),

  http.get('/api/plugins/marketplace/:pluginId/reviews', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: makePluginReviews(params.pluginId as string) })
  }),

  // ─── Installed ────────────────────────────────────────────────────────────

  http.get('/api/workspaces/:wsId/plugins', async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ data: getInstalled(params.wsId as string) })
  }),

  http.post('/api/workspaces/:wsId/plugins', async ({ params, request }) => {
    await delay(500)
    const body = (await request.json()) as { pluginId: string; config: Record<string, unknown> }
    const wsId = params.wsId as string
    const plugin = MARKETPLACE_STORE.find((p) => p.id === body.pluginId)
    if (!plugin) return HttpResponse.json({ message: 'Plugin not found' }, { status: 404 })

    const existing = getInstalled(wsId).find((i) => i.pluginId === body.pluginId)
    if (existing) return HttpResponse.json({ message: 'Already installed' }, { status: 409 })

    const installed = makeInstalledPlugin(wsId, plugin, {
      config: body.config as Record<string, string | number | boolean>,
    })
    getInstalled(wsId).unshift(installed)
    return HttpResponse.json({ data: installed }, { status: 201 })
  }),

  http.delete('/api/workspaces/:wsId/plugins/:pluginId', async ({ params }) => {
    await delay(300)
    const wsId = params.wsId as string
    const pluginId = params.pluginId as string
    const arr = getInstalled(wsId)
    const idx = arr.findIndex((i) => i.pluginId === pluginId || i.id === pluginId)
    if (idx !== -1) arr.splice(idx, 1)
    return HttpResponse.json({ data: null })
  }),

  http.patch('/api/workspaces/:wsId/plugins/:pluginId', async ({ params, request }) => {
    await delay(250)
    const body = (await request.json()) as Partial<InstalledPlugin>
    const wsId = params.wsId as string
    const pluginId = params.pluginId as string
    const arr = getInstalled(wsId)
    const idx = arr.findIndex((i) => i.pluginId === pluginId || i.id === pluginId)
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    arr[idx] = { ...arr[idx]!, ...body }
    return HttpResponse.json({ data: arr[idx] })
  }),

  http.patch('/api/workspaces/:wsId/plugins/:pluginId/config', async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as { config: Record<string, unknown> }
    const wsId = params.wsId as string
    const pluginId = params.pluginId as string
    const arr = getInstalled(wsId)
    const idx = arr.findIndex((i) => i.pluginId === pluginId || i.id === pluginId)
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    arr[idx] = {
      ...arr[idx]!,
      config: body.config as Record<string, string | number | boolean>,
    }
    return HttpResponse.json({ data: arr[idx] })
  }),
]
