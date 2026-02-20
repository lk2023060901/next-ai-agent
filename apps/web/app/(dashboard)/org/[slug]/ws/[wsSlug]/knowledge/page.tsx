'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Search, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { KnowledgeBaseCard } from '@/components/features/knowledge/knowledge-base-card'
import { KnowledgeBaseCreateModal } from '@/components/features/knowledge/knowledge-base-create-modal'
import { toast } from '@/components/ui/toast'
import {
  useKnowledgeBases,
  useCreateKnowledgeBase,
  useUpdateKnowledgeBase,
  useDeleteKnowledgeBase,
} from '@/hooks/use-knowledge-bases'
import type { KnowledgeBase, EmbeddingModel } from '@/types/api'

export default function KnowledgePage() {
  const { wsSlug, slug } = useParams<{ wsSlug: string; slug: string }>()
  const router = useRouter()

  const { data: kbs, isLoading } = useKnowledgeBases(wsSlug)
  const createKb = useCreateKnowledgeBase(wsSlug)
  const updateKb = useUpdateKnowledgeBase(wsSlug)
  const deleteKb = useDeleteKnowledgeBase(wsSlug)

  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null)
  const [deletingKb, setDeletingKb] = useState<KnowledgeBase | null>(null)

  const filtered = useMemo(() => {
    if (!kbs) return []
    if (!search) return kbs
    return kbs.filter((kb) => kb.name.toLowerCase().includes(search.toLowerCase()))
  }, [kbs, search])

  async function handleCreate(data: {
    name: string
    description?: string
    embeddingModel: EmbeddingModel
  }) {
    try {
      await createKb.mutateAsync(data)
      toast.success('知识库已创建')
      setCreateOpen(false)
    } catch {
      toast.error('创建失败，请重试')
    }
  }

  async function handleUpdate(data: {
    name: string
    description?: string
    embeddingModel: EmbeddingModel
  }) {
    if (!editingKb) return
    try {
      await updateKb.mutateAsync({ id: editingKb.id, body: { name: data.name, ...(data.description ? { description: data.description } : {}) } })
      toast.success('已保存')
      setEditingKb(null)
    } catch {
      toast.error('保存失败，请重试')
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingKb) return
    try {
      await deleteKb.mutateAsync(deletingKb.id)
      toast.success('知识库已删除')
      setDeletingKb(null)
    } catch {
      toast.error('删除失败，请重试')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">知识库</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">上传文档，为 Agent 提供领域知识</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          创建知识库
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="搜索知识库..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
        className="max-w-xs"
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={search ? '未找到匹配的知识库' : '还没有知识库'}
          description={search ? '尝试其他关键词' : '创建知识库，为 Agent 提供专业领域知识'}
          {...(!search
            ? {
                action: (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    创建知识库
                  </Button>
                ),
              }
            : {})}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((kb) => (
            <KnowledgeBaseCard
              key={kb.id}
              kb={kb}
              onEdit={(k) => setEditingKb(k)}
              onDelete={(k) => setDeletingKb(k)}
              onClick={(k) =>
                router.push(`/org/${slug}/ws/${wsSlug}/knowledge/${k.id}`)
              }
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <KnowledgeBaseCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        loading={createKb.isPending}
      />

      {/* Edit Modal */}
      <KnowledgeBaseCreateModal
        open={!!editingKb}
        onClose={() => setEditingKb(null)}
        onSubmit={handleUpdate}
        loading={updateKb.isPending}
        {...(editingKb ? { editing: editingKb } : {})}
      />

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deletingKb}
        onClose={() => setDeletingKb(null)}
        title="删除知识库"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletingKb(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleteKb.isPending}
            >
              删除
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          确定要删除知识库 <strong>{deletingKb?.name}</strong> 吗？
          该知识库下的所有文档将被永久删除，此操作不可撤销。
        </p>
      </Modal>
    </div>
  )
}
