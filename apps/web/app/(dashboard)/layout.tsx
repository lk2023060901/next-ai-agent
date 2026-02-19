import type { ReactNode } from 'react'

// The dashboard layout wraps all org/** routes.
// Sidebar + Topbar are rendered by the deeper org/[slug] layout
// because they need access to slug params.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
