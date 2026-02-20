import type { ReactNode } from 'react'
import { WsLayoutClient } from '@/components/layout/ws-layout-client'

interface WsLayoutProps {
  children: ReactNode
  params: Promise<{ slug: string; wsSlug: string }>
}

export default async function WsLayout({ children, params }: WsLayoutProps) {
  const { slug, wsSlug } = await params
  return (
    <WsLayoutClient orgSlug={slug} wsSlug={wsSlug}>
      {children}
    </WsLayoutClient>
  )
}
