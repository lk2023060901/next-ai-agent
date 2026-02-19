import { http, HttpResponse, delay } from 'msw'
import type { AuthTokens, User } from '@/types/api'
import { makeUser } from '../factories/user.factory'

const MOCK_USER: User = makeUser({
  id: 'user-1',
  name: '张三',
  email: 'demo@nextai.dev',
})

const makeTokens = (): AuthTokens => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
})

export const authHandlers = [
  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as { email: string; password: string }
    if (body.password.length < 6) {
      return HttpResponse.json(
        { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' },
        { status: 401 },
      )
    }
    return HttpResponse.json({ data: { user: MOCK_USER, tokens: makeTokens() } })
  }),

  // POST /api/auth/signup
  http.post('/api/auth/signup', async () => {
    await delay(500)
    return HttpResponse.json({ data: { user: MOCK_USER, tokens: makeTokens() } }, { status: 201 })
  }),

  // POST /api/auth/refresh
  http.post('/api/auth/refresh', async () => {
    await delay(200)
    return HttpResponse.json({ data: makeTokens() })
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', async () => {
    await delay(100)
    return HttpResponse.json({ data: null })
  }),

  // GET /api/auth/me
  http.get('/api/auth/me', async () => {
    await delay(150)
    return HttpResponse.json({ data: MOCK_USER })
  }),
]
