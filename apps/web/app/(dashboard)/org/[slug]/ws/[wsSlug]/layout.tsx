import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { WorkspaceSwitcher } from '@/components/features/workspace/workspace-switcher'
import { Breadcrumb } from '@/components/layout/breadcrumb'

interface WsLayoutProps {
  children: ReactNode
  params: Promise<{ slug: string; wsSlug: string }>
}

export default async function WsLayout({ children, params }: WsLayoutProps) {
  const { slug, wsSlug } = await params

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="flex h-full flex-col">
        <WorkspaceSwitcher orgSlug={slug} wsSlug={wsSlug} />
        <div className="flex-1 overflow-hidden">
          <Sidebar orgSlug={slug} wsSlug={wsSlug} />
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--bg)] px-6 py-3">
          <Breadcrumb />
        </div>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
