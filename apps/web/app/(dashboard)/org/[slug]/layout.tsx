import type { ReactNode } from 'react'
import { Topbar } from '@/components/layout/topbar'

interface OrgLayoutProps {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar orgSlug={slug} />
      <main className="flex-1 overflow-auto bg-[var(--bg)]">
        {children}
      </main>
    </div>
  )
}
