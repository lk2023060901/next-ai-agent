import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthTokens } from '@/types/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  setAuth: (user: User, tokens: AuthTokens) => void
  clearAuth: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, tokens) => {
        if (typeof window !== 'undefined') {
          // localStorage — for API client Authorization header
          localStorage.setItem('access_token', tokens.accessToken)
          // Cookie — for middleware (server-side auth guard)
          const maxAge = tokens.expiresIn ?? 60 * 60 * 24 * 7 // default 7 days
          document.cookie = `access_token=${tokens.accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`
        }
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        })
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          // Expire the cookie immediately
          document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax'
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'nextai-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
