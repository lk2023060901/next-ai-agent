import { apiClient } from './client'
import type {
  ApiResponse,
  KnowledgeBase,
  CreateKnowledgeBaseBody,
  UpdateKnowledgeBaseBody,
  KbDocument,
  SearchResult,
} from '@/types/api'

export const knowledgeBaseApi = {
  // ─── Knowledge Bases ────────────────────────────────────────────────────
  list: (workspaceId: string) =>
    apiClient.get<ApiResponse<KnowledgeBase[]>>(`/workspaces/${workspaceId}/knowledge-bases`),

  create: (workspaceId: string, body: CreateKnowledgeBaseBody) =>
    apiClient.post<ApiResponse<KnowledgeBase>>(`/workspaces/${workspaceId}/knowledge-bases`, body),

  update: (kbId: string, body: UpdateKnowledgeBaseBody) =>
    apiClient.patch<ApiResponse<KnowledgeBase>>(`/knowledge-bases/${kbId}`, body),

  delete: (kbId: string) =>
    apiClient.delete<ApiResponse<null>>(`/knowledge-bases/${kbId}`),

  // ─── Documents ──────────────────────────────────────────────────────────
  listDocuments: (kbId: string) =>
    apiClient.get<ApiResponse<KbDocument[]>>(`/knowledge-bases/${kbId}/documents`),

  uploadDocument: (kbId: string, formData: FormData) =>
    apiClient.post<ApiResponse<KbDocument>>(`/knowledge-bases/${kbId}/documents`, formData),

  deleteDocument: (kbId: string, docId: string) =>
    apiClient.delete<ApiResponse<null>>(`/knowledge-bases/${kbId}/documents/${docId}`),

  // ─── Search ─────────────────────────────────────────────────────────────
  search: (kbId: string, query: string, topK = 5) =>
    apiClient.post<ApiResponse<SearchResult[]>>(`/knowledge-bases/${kbId}/search`, { query, topK }),
}
