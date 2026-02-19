import { http, HttpResponse, delay } from 'msw'
import { makeOrg, makeUser, makeOrgMember } from '../factories/user.factory'
import { makeWorkspaceList } from '../factories/workspace.factory'

const ORG = makeOrg({ id: 'org-1', slug: 'acme', name: 'Acme Corp', plan: 'pro' })
const MEMBERS = [
  makeOrgMember({ role: 'owner', orgId: ORG.id, user: makeUser({ id: 'user-1', name: '张三', email: 'demo@nextai.dev' }) }),
  makeOrgMember({ role: 'admin', orgId: ORG.id, user: makeUser({ name: '李四' }) }),
  makeOrgMember({ role: 'member', orgId: ORG.id, user: makeUser({ name: '王五' }) }),
]
const WORKSPACES = makeWorkspaceList(ORG.id)

export const orgHandlers = [
  // GET /api/orgs
  http.get('/api/orgs', async () => {
    await delay(200)
    return HttpResponse.json({ data: [ORG] })
  }),

  // GET /api/orgs/:slug
  http.get('/api/orgs/:slug', async () => {
    await delay(150)
    return HttpResponse.json({ data: ORG })
  }),

  // GET /api/orgs/:slug/members
  http.get('/api/orgs/:slug/members', async () => {
    await delay(200)
    return HttpResponse.json({
      data: MEMBERS,
      total: MEMBERS.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })
  }),

  // GET /api/orgs/:slug/workspaces
  http.get('/api/orgs/:slug/workspaces', async () => {
    await delay(200)
    return HttpResponse.json({ data: WORKSPACES })
  }),
]
