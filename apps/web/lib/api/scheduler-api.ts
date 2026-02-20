import { apiClient } from './client'
import type {
  ApiResponse,
  ScheduledTask,
  TaskExecution,
  CreateScheduledTaskBody,
  UpdateScheduledTaskBody,
} from '@/types/api'

export const schedulerApi = {
  listTasks: (wsId: string) =>
    apiClient.get<ApiResponse<ScheduledTask[]>>(`/workspaces/${wsId}/scheduler/tasks`),

  createTask: (wsId: string, body: CreateScheduledTaskBody) =>
    apiClient.post<ApiResponse<ScheduledTask>>(`/workspaces/${wsId}/scheduler/tasks`, body),

  updateTask: (wsId: string, taskId: string, body: UpdateScheduledTaskBody) =>
    apiClient.patch<ApiResponse<ScheduledTask>>(
      `/workspaces/${wsId}/scheduler/tasks/${taskId}`,
      body,
    ),

  deleteTask: (wsId: string, taskId: string) =>
    apiClient.delete<ApiResponse<null>>(`/workspaces/${wsId}/scheduler/tasks/${taskId}`),

  listExecutions: (wsId: string, taskId: string) =>
    apiClient.get<ApiResponse<TaskExecution[]>>(
      `/workspaces/${wsId}/scheduler/tasks/${taskId}/executions`,
    ),

  runNow: (wsId: string, taskId: string) =>
    apiClient.post<ApiResponse<TaskExecution>>(
      `/workspaces/${wsId}/scheduler/tasks/${taskId}/run`,
      {},
    ),
}
