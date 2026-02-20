'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { ChannelCard } from '@/components/features/channels/channel-card'
import { AddChannelWizard } from '@/components/features/channels/add-channel-wizard'
import { toast } from '@/components/ui/toast'
import { useChannels, useCreateChannel, useDeleteChannel } from '@/hooks/use-channels'
import type { Channel, CreateChannelBody } from '@/types/api'

export default function ChannelsPage() {
  const { wsSlug, slug } = useParams<{ wsSlug: string; slug: string }>()
  const router = useRouter()

  const { data: channels, isLoading } = useChannels(wsSlug)
  const createChannel = useCreateChannel(wsSlug)
  const deleteChannel = useDeleteChannel(wsSlug)

  const [wizardOpen, setWizardOpen] = useState(false)
  const [disconnectingChannel, setDisconnectingChannel] = useState<Channel | null>(null)

  async function handleCreate(body: CreateChannelBody) {
    try {
      await createChannel.mutateAsync(body)
      toast.success('渠道已添加')
      setWizardOpen(false)
    } catch {
      toast.error('添加失败，请重试')
    }
  }

  async function handleDisconnectConfirm() {
    if (!disconnectingChannel) return
    try {
      await deleteChannel.mutateAsync(disconnectingChannel.id)
      toast.success('渠道已断开')
      setDisconnectingChannel(null)
    } catch {
      toast.error('操作失败，请重试')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">渠道管理</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            连接消息渠道，让 Agent 接收和发送消息
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          添加渠道
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      ) : !channels || channels.length === 0 ? (
        <EmptyState
          icon={<Radio className="h-6 w-6" />}
          title="还没有渠道"
          description="添加渠道，让 Agent 通过 Slack、Discord、Telegram 等平台与用户交互"
          action={
            <Button size="sm" onClick={() => setWizardOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              添加渠道
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onConfigure={(c) => router.push(`/org/${slug}/ws/${wsSlug}/channels/${c.id}`)}
              onDisconnect={(c) => setDisconnectingChannel(c)}
              onClick={(c) => router.push(`/org/${slug}/ws/${wsSlug}/channels/${c.id}`)}
            />
          ))}
        </div>
      )}

      {/* Add Channel Wizard */}
      <AddChannelWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleCreate}
        {...(createChannel.isPending ? { loading: true } : {})}
        workspaceId={wsSlug}
      />

      {/* Disconnect Confirm */}
      <Modal
        open={!!disconnectingChannel}
        onClose={() => setDisconnectingChannel(null)}
        title="断开渠道"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDisconnectingChannel(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDisconnectConfirm}
              {...(deleteChannel.isPending ? { loading: true } : {})}
            >
              断开
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          确定要断开渠道 <strong>{disconnectingChannel?.name}</strong>{' '}
          吗？所有路由规则将被删除，此操作不可撤销。
        </p>
      </Modal>
    </div>
  )
}
