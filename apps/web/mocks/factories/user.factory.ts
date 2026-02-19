import type { User, OrgMember, Org } from '@/types/api'

let seq = 1
const id = () => `id-${seq++}`
const now = () => new Date().toISOString()

export function makeUser(overrides: Partial<User> = {}): User {
  const n = seq
  const base: User = {
    id: id(),
    name: `用户 ${n}`,
    email: `user${n}@example.com`,
    createdAt: now(),
    updatedAt: now(),
  }
  return { ...base, ...overrides }
}

export function makeOrg(overrides: Partial<Org> = {}): Org {
  const n = seq
  return {
    id: id(),
    slug: `org-${n}`,
    name: `组织 ${n}`,
    plan: 'free',
    createdAt: now(),
    ...overrides,
  }
}

export function makeOrgMember(
  overrides: Partial<OrgMember> & { user?: User; orgId?: string } = {},
): OrgMember {
  const user = overrides.user ?? makeUser()
  return {
    id: id(),
    userId: user.id,
    orgId: overrides.orgId ?? id(),
    role: 'member',
    user,
    joinedAt: now(),
    ...overrides,
  }
}
