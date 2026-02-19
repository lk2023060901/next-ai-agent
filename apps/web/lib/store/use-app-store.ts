import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // Active org / workspace context
  activeOrgSlug: string | null
  activeWsSlug: string | null

  // UI state
  sidebarCollapsed: boolean

  setActiveOrg: (slug: string) => void
  setActiveWs: (slug: string) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeOrgSlug: null,
      activeWsSlug: null,
      sidebarCollapsed: false,

      setActiveOrg: (slug) => set({ activeOrgSlug: slug }),
      setActiveWs: (slug) => set({ activeWsSlug: slug }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'nextai-app',
      partialize: (state) => ({
        activeOrgSlug: state.activeOrgSlug,
        activeWsSlug: state.activeWsSlug,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
)
