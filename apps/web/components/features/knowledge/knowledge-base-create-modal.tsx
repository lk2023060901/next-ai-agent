'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { KnowledgeBase, EmbeddingModel } from '@/types/api'

interface KnowledgeBaseCreateModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description?: string; embeddingModel: EmbeddingModel }) => void
  loading?: boolean
  /** Pass existing KB to enable edit mode */
  editing?: KnowledgeBase | null
}

const EMBEDDING_OPTIONS = [
  { value: 'text-embedding-3-small', label: 'OpenAI text-embedding-3-small（均衡）' },
  { value: 'text-embedding-3-large', label: 'OpenAI text-embedding-3-large（高精度）' },
  { value: 'embed-english-v3.0', label: 'Cohere embed-english-v3.0（英文优化）' },
]

export function KnowledgeBaseCreateModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  editing = null,
}: KnowledgeBaseCreateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [embeddingModel, setEmbeddingModel] = useState<EmbeddingModel>('text-embedding-3-small')
  const [nameError, setNameError] = useState('')

  const isEdit = !!editing

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setDescription(editing.description ?? '')
      setEmbeddingModel(editing.embeddingModel)
    } else {
      setName('')
      setDescription('')
      setEmbeddingModel('text-embedding-3-small')
    }
    setNameError('')
  }, [editing, open])

  function handleSubmit() {
    if (!name.trim()) {
      setNameError('名称不能为空')
      return
    }
    onSubmit({
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      embeddingModel,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? '编辑知识库' : '创建知识库'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEdit ? '保存' : '创建'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="名称"
          placeholder="例：产品文档、技术规范"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError('') }}
          error={nameError}
          fullWidth
        />
        <Input
          label="描述（可选）"
          placeholder="简要说明该知识库的内容和用途"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
        />
        {!isEdit && (
          <Select
            label="嵌入模型"
            options={EMBEDDING_OPTIONS}
            value={embeddingModel}
            onChange={(v) => setEmbeddingModel(v as EmbeddingModel)}
          />
        )}
        {!isEdit && (
          <p className="text-xs text-[var(--text-tertiary)]">
            嵌入模型创建后不可更改，请根据文档语言和精度要求选择。
          </p>
        )}
      </div>
    </Modal>
  )
}
