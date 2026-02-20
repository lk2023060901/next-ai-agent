import type { ApiError } from '@/types/api'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    let err: ApiError = { code: 'UNKNOWN_ERROR', message: `HTTP ${res.status}` }
    try {
      err = (await res.json()) as ApiError
    } catch {
      // keep default
    }
    throw new ApiClientError(err.code, err.message, res.status, err.details)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

async function requestForm<T>(
  path: string,
  body: FormData,
  init: RequestInit = {},
): Promise<T> {
  const token = getAccessToken()

  // Do NOT set Content-Type — the browser sets it automatically with the
  // correct multipart boundary when the body is a FormData instance.
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    method: 'POST',
    body,
    headers,
  })

  if (!res.ok) {
    let err: ApiError = { code: 'UNKNOWN_ERROR', message: `HTTP ${res.status}` }
    try {
      err = (await res.json()) as ApiError
    } catch {
      // keep default
    }
    throw new ApiClientError(err.code, err.message, res.status, err.details)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'GET' }),

  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  postForm: <T>(path: string, body: FormData, init?: RequestInit) =>
    requestForm<T>(path, body, init),

  patch: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'DELETE' }),
}
