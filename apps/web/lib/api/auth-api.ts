import { apiClient } from './client'
import type { ApiResponse, AuthTokens, LoginRequest, SignupRequest, User } from '@/types/api'

interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', body),

  signup: (body: SignupRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/signup', body),

  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout', {}),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  me: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),
}
