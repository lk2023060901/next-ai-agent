'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schedulerApi } from '@/lib/api/scheduler-api'
import type { ScheduledTask, CreateScheduledTaskBody, UpdateScheduledTaskBody } from '@/types/api'

export function useScheduledTasks(wsId: string) {
  return useQuery({
    queryKey: ['scheduler', 'tasks', wsId],
    queryFn: () => schedulerApi.listTasks(wsId).then((r) => r.data),
    enabled: !!wsId,
    staleTime: 30_000,
  })
}

export function useTaskExecutions(wsId: string, taskId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['scheduler', 'executions', wsId, taskId],
    queryFn: () => schedulerApi.listExecutions(wsId, taskId).then((r) => r.data),
    enabled: enabled && !!wsId && !!taskId,
    staleTime: 30_000,
  })
}

export function useCreateTask(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateScheduledTaskBody) =>
      schedulerApi.createTask(wsId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['scheduler', 'tasks', wsId] })
    },
  })
}

export function useUpdateTask(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: UpdateScheduledTaskBody }) =>
      schedulerApi.updateTask(wsId, taskId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['scheduler', 'tasks', wsId] })
    },
  })
}

export function useDeleteTask(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => schedulerApi.deleteTask(wsId, taskId),
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey: ['scheduler', 'tasks', wsId] })
      const previous = qc.getQueryData<ScheduledTask[]>(['scheduler', 'tasks', wsId])
      qc.setQueryData<ScheduledTask[]>(['scheduler', 'tasks', wsId], (old) =>
        old ? old.filter((t) => t.id !== taskId) : [],
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(['scheduler', 'tasks', wsId], ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['scheduler', 'tasks', wsId] })
    },
  })
}

export function useRunNow(wsId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => schedulerApi.runNow(wsId, taskId).then((r) => r.data),
    onSuccess: (_data, taskId) => {
      void qc.invalidateQueries({ queryKey: ['scheduler', 'executions', wsId, taskId] })
      void qc.invalidateQueries({ queryKey: ['scheduler', 'tasks', wsId] })
    },
  })
}
