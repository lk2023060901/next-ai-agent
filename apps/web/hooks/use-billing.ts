'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingApi } from '@/lib/api/billing-api'
import type { PaymentMethod, UsageAlert } from '@/types/api'

export function usePlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: () => billingApi.getPlans().then((r) => r.data),
    staleTime: 3_600_000,
  })
}

export function useSubscription(orgId: string) {
  return useQuery({
    queryKey: ['billing', 'subscription', orgId],
    queryFn: () => billingApi.getSubscription(orgId).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 60_000,
  })
}

export function useUpdateSubscription(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof billingApi.updateSubscription>[1]) =>
      billingApi.updateSubscription(orgId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing', 'subscription', orgId] })
    },
  })
}

export function useInvoices(orgId: string) {
  return useQuery({
    queryKey: ['billing', 'invoices', orgId],
    queryFn: () => billingApi.getInvoices(orgId).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 300_000,
  })
}

export function usePaymentMethods(orgId: string) {
  return useQuery({
    queryKey: ['billing', 'payment-methods', orgId],
    queryFn: () => billingApi.getPaymentMethods(orgId).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 60_000,
  })
}

export function useAddPaymentMethod(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { type: string; token: string }) =>
      billingApi.addPaymentMethod(orgId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing', 'payment-methods', orgId] })
    },
  })
}

export function useSetDefaultPaymentMethod(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (methodId: string) =>
      billingApi.setDefaultPaymentMethod(orgId, methodId).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing', 'payment-methods', orgId] })
    },
  })
}

export function useDeletePaymentMethod(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (methodId: string) => billingApi.deletePaymentMethod(orgId, methodId),
    onMutate: async (methodId) => {
      await qc.cancelQueries({ queryKey: ['billing', 'payment-methods', orgId] })
      const previous = qc.getQueryData<PaymentMethod[]>(['billing', 'payment-methods', orgId])
      qc.setQueryData<PaymentMethod[]>(['billing', 'payment-methods', orgId], (old) =>
        old ? old.filter((pm) => pm.id !== methodId) : [],
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(['billing', 'payment-methods', orgId], ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['billing', 'payment-methods', orgId] })
    },
  })
}

export function useUsageAlerts(orgId: string) {
  return useQuery({
    queryKey: ['billing', 'alerts', orgId],
    queryFn: () => billingApi.getUsageAlerts(orgId).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 30_000,
  })
}

export function useUpdateUsageAlert(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ alertId, body }: { alertId: string; body: Partial<UsageAlert> }) =>
      billingApi.updateUsageAlert(orgId, alertId, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing', 'alerts', orgId] })
    },
  })
}
