'use client'

import { useState } from 'react'
import { Trash2, FileText, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { KbDocument, DocumentStatus } from '@/types/api'

interface DocumentTableProps {
  documents: KbDocument[]
  loading?: boolean
  onDelete?: (docId: string) => void
  deleting?: boolean
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: { label: '等待处理', icon: Clock, className: 'text-[var(--text-tertiary)]' },
  processing: { label: '处理中', icon: Loader2, className: 'text-[var(--color-primary-400)]' },
  indexed: { label: '已索引', icon: CheckCircle, className: 'text-[var(--color-success)]' },
  failed: { label: '处理失败', icon: AlertCircle, className: 'text-[var(--color-danger)]' },
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-red-50 text-red-600',
  docx: 'bg-blue-50 text-blue-600',
  txt: 'bg-gray-50 text-gray-600',
  md: 'bg-purple-50 text-purple-600',
  csv: 'bg-green-50 text-green-600',
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`
  return `${bytes} B`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function DocumentTable({ documents, loading, onDelete, deleting }: DocumentTableProps) {
  const [deletingDoc, setDeletingDoc] = useState<KbDocument | null>(null)

  function handleDeleteConfirm() {
    if (!deletingDoc || !onDelete) return
    onDelete(deletingDoc.id)
    setDeletingDoc(null)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]"
          />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[var(--text-tertiary)]">
        暂无文档，请上传文件
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface)]">
            <tr>
              <th className="border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                文件名
              </th>
              <th className="w-16 border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                类型
              </th>
              <th className="w-24 border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                大小
              </th>
              <th className="w-28 border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                状态
              </th>
              <th className="w-20 border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                分块数
              </th>
              <th className="w-28 border-b border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                上传时间
              </th>
              <th className="w-12 border-b border-[var(--border)] px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const statusCfg = STATUS_CONFIG[doc.status]
              const StatusIcon = statusCfg.icon
              return (
                <tr
                  key={doc.id}
                  className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--surface)]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                      <span className="max-w-xs truncate text-[var(--text-primary)]">
                        {doc.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-medium uppercase',
                        FILE_TYPE_COLORS[doc.fileType] ?? 'bg-gray-50 text-gray-600',
                      )}
                    >
                      {doc.fileType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('flex items-center gap-1.5', statusCfg.className)}>
                      <StatusIcon
                        className={cn('h-3.5 w-3.5', doc.status === 'processing' && 'animate-spin')}
                      />
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {doc.chunkCount != null ? doc.chunkCount : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDate(doc.uploadedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {onDelete && (
                      <button
                        onClick={() => setDeletingDoc(doc)}
                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--color-danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        title="删除文档"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletingDoc(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              {...(deleting ? { loading: true } : {})}
            >
              删除
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          确定要删除文档 <strong>{deletingDoc?.name}</strong> 吗？此操作不可撤销。
        </p>
      </Modal>
    </>
  )
}
