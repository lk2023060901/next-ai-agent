'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>
  loading?: boolean
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
]
const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.md,.csv'
const MAX_FILE_SIZE_MB = 50

interface FileItem {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  errorMsg?: string
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`
  return `${bytes} B`
}

export function UploadZone({ onUpload, loading }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [queue, setQueue] = useState<FileItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function validateFile(file: File): string | null {
    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !ACCEPTED_EXTENSIONS.split(',').some((ext) => file.name.endsWith(ext.slice(1)))
    ) {
      return '不支持的文件类型，请上传 PDF/DOCX/TXT/MD/CSV'
    }
    if (file.size > MAX_FILE_SIZE_MB * 1_048_576) {
      return `文件大小超过 ${MAX_FILE_SIZE_MB}MB 限制`
    }
    return null
  }

  function addFiles(files: File[]) {
    const items: FileItem[] = files.map((file) => {
      const err = validateFile(file)
      return { file, status: err ? 'error' : 'pending', ...(err ? { errorMsg: err } : {}) }
    })
    setQueue((q) => [...q, ...items])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handleUpload = useCallback(async () => {
    const pending = queue.filter((item) => item.status === 'pending')
    if (!pending.length) return

    setQueue((q) =>
      q.map((item) =>
        item.status === 'pending' ? { ...item, status: 'uploading' as const } : item,
      ),
    )

    for (const item of pending) {
      try {
        await onUpload([item.file])
        setQueue((q) =>
          q.map((i) => (i.file === item.file ? { ...i, status: 'done' as const } : i)),
        )
      } catch {
        setQueue((q) =>
          q.map((i) =>
            i.file === item.file
              ? { ...i, status: 'error' as const, errorMsg: '上传失败，请重试' }
              : i,
          ),
        )
      }
    }
  }, [queue, onUpload])

  function removeItem(file: File) {
    setQueue((q) => q.filter((i) => i.file !== file))
  }

  const hasPending = queue.some((i) => i.status === 'pending')

  function StatusIcon({ status }: { status: FileItem['status'] }) {
    if (status === 'uploading')
      return <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary-400)]" />
    if (status === 'done') return <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-[var(--color-danger)]" />
    return <File className="h-4 w-4 text-[var(--text-tertiary)]" />
  }

  return (
    <div className="space-y-3">
      {/* Drop area */}
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed p-8 text-center transition-colors duration-[var(--duration-fast)]',
          dragging
            ? 'border-[var(--color-primary-400)] bg-[var(--color-primary-50)]'
            : 'border-[var(--border)] hover:border-[var(--color-primary-300)] hover:bg-[var(--surface)]',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-[var(--text-tertiary)]" />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            拖拽文件至此处，或点击选择
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            支持 PDF、DOCX、TXT、MD、CSV，单文件最大 {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* File queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            >
              <StatusIcon status={item.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--text-primary)]">{item.file.name}</p>
                {item.errorMsg ? (
                  <p className="text-xs text-[var(--color-danger)]">{item.errorMsg}</p>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {formatFileSize(item.file.size)}
                  </p>
                )}
              </div>
              {item.status === 'pending' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeItem(item.file)
                  }}
                  className="text-[var(--text-tertiary)] hover:text-[var(--color-danger)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {hasPending && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleUpload} {...(loading ? { loading: true } : {})}>
                上传 {queue.filter((i) => i.status === 'pending').length} 个文件
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
