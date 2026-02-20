'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { knowledgeBaseApi } from '@/lib/api/knowledge-base-api'
import type {
  CreateKnowledgeBaseBody,
  UpdateKnowledgeBaseBody,
  KnowledgeBase,
} from '@/types/api'

// ─── Knowledge Bases ────────────────────────────────────────────────────────

export function useKnowledgeBases(workspaceId: string) {
  return useQuery({
    queryKey: ['knowledge-bases', workspaceId],
    queryFn: () => knowledgeBaseApi.list(workspaceId).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}

export function useCreateKnowledgeBase(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateKnowledgeBaseBody) =>
      knowledgeBaseApi.create(workspaceId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-bases', workspaceId] })
    },
  })
}

export function useUpdateKnowledgeBase(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateKnowledgeBaseBody }) =>
      knowledgeBaseApi.update(id, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-bases', workspaceId] })
    },
  })
}

export function useDeleteKnowledgeBase(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (kbId: string) => knowledgeBaseApi.delete(kbId),
    onMutate: async (kbId) => {
      await qc.cancelQueries({ queryKey: ['knowledge-bases', workspaceId] })
      const previous = qc.getQueryData<KnowledgeBase[]>(['knowledge-bases', workspaceId])
      qc.setQueryData<KnowledgeBase[]>(['knowledge-bases', workspaceId], (old) =>
        old ? old.filter((kb) => kb.id !== kbId) : [],
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['knowledge-bases', workspaceId], ctx.previous)
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-bases', workspaceId] })
    },
  })
}

// ─── Documents ──────────────────────────────────────────────────────────────

export function useKbDocuments(kbId: string) {
  return useQuery({
    queryKey: ['kb-documents', kbId],
    queryFn: () => knowledgeBaseApi.listDocuments(kbId).then((r) => r.data),
    enabled: !!kbId,
    staleTime: 30_000,
    refetchInterval: (query) => {
      // Poll while any document is still processing
      const docs = query.state.data
      const hasProcessing = docs?.some(
        (d) => d.status === 'pending' || d.status === 'processing',
      )
      return hasProcessing ? 3_000 : false
    },
  })
}

export function useUploadDocument(kbId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return knowledgeBaseApi.uploadDocument(kbId, fd).then((r) => r.data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['kb-documents', kbId] })
    },
  })
}

export function useDeleteDocument(kbId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (docId: string) => knowledgeBaseApi.deleteDocument(kbId, docId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['kb-documents', kbId] })
    },
  })
}

// ─── Search ─────────────────────────────────────────────────────────────────

export function useSearchKb(kbId: string) {
  return useMutation({
    mutationFn: ({ query, topK }: { query: string; topK?: number }) =>
      knowledgeBaseApi.search(kbId, query, topK).then((r) => r.data),
  })
}
