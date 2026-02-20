'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, FileText } from 'lucide-react'
import { Tabs } from '@/components/ui/tabs'
import { UploadZone } from '@/components/features/knowledge/upload-zone'
import { DocumentTable } from '@/components/features/knowledge/document-table'
import { SearchTestPanel } from '@/components/features/knowledge/search-test-panel'
import { toast } from '@/components/ui/toast'
import {
  useKnowledgeBases,
  useKbDocuments,
  useUploadDocument,
  useDeleteDocument,
} from '@/hooks/use-knowledge-bases'

const TABS = [
  { key: 'documents', label: '文档管理', icon: <FileText className="h-4 w-4" /> },
  { key: 'search', label: '搜索测试', icon: <BookOpen className="h-4 w-4" /> },
]

export default function KnowledgeDetailPage() {
  const { wsSlug, slug, kbId } = useParams<{ wsSlug: string; slug: string; kbId: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('documents')

  const { data: kbs } = useKnowledgeBases(wsSlug)
  const kb = kbs?.find((k) => k.id === kbId)

  const { data: documents, isLoading: docsLoading } = useKbDocuments(kbId)
  const uploadDoc = useUploadDocument(kbId)
  const deleteDoc = useDeleteDocument(kbId)

  async function handleUpload(files: File[]) {
    for (const file of files) {
      try {
        await uploadDoc.mutateAsync(file)
        toast.success(`${file.name} 已开始处理`)
      } catch {
        toast.error(`${file.name} 上传失败`)
      }
    }
  }

  async function handleDeleteDoc(docId: string) {
    try {
      await deleteDoc.mutateAsync(docId)
      toast.success('文档已删除')
    } catch {
      toast.error('删除失败，请重试')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push(`/org/${slug}/ws/${wsSlug}/knowledge`)}
          className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回知识库列表
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
            <BookOpen className="h-5 w-5 text-[var(--color-primary-500)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {kb?.name ?? kbId}
            </h1>
            {kb?.description && (
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{kb.description}</p>
            )}
            {kb && (
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                {kb.documentCount} 个文档 · {kb.embeddingModel}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <UploadZone onUpload={handleUpload} loading={uploadDoc.isPending} />
          <DocumentTable
            documents={documents ?? []}
            {...(docsLoading ? { loading: true } : {})}
            onDelete={handleDeleteDoc}
            deleting={deleteDoc.isPending}
          />
        </div>
      )}

      {activeTab === 'search' && <SearchTestPanel kbId={kbId} />}
    </div>
  )
}
