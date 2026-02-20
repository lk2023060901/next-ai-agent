import { apiClient } from './client'
import type {
  ApiResponse,
  PricingPlan,
  Subscription,
  Invoice,
  PaymentMethod,
  UsageAlert,
  PlanId,
  BillingCycle,
} from '@/types/api'

export const billingApi = {
  getPlans: () => apiClient.get<ApiResponse<PricingPlan[]>>('/pricing/plans'),

  getSubscription: (orgId: string) =>
    apiClient.get<ApiResponse<Subscription>>(`/orgs/${orgId}/billing/subscription`),

  updateSubscription: (
    orgId: string,
    body: { planId?: PlanId; cycle?: BillingCycle; cancel?: boolean },
  ) => apiClient.patch<ApiResponse<Subscription>>(`/orgs/${orgId}/billing/subscription`, body),

  getInvoices: (orgId: string) =>
    apiClient.get<ApiResponse<Invoice[]>>(`/orgs/${orgId}/billing/invoices`),

  getPaymentMethods: (orgId: string) =>
    apiClient.get<ApiResponse<PaymentMethod[]>>(`/orgs/${orgId}/billing/payment-methods`),

  addPaymentMethod: (orgId: string, body: { type: string; token: string }) =>
    apiClient.post<ApiResponse<PaymentMethod>>(`/orgs/${orgId}/billing/payment-methods`, body),

  setDefaultPaymentMethod: (orgId: string, methodId: string) =>
    apiClient.patch<ApiResponse<PaymentMethod>>(
      `/orgs/${orgId}/billing/payment-methods/${methodId}`,
      { isDefault: true },
    ),

  deletePaymentMethod: (orgId: string, methodId: string) =>
    apiClient.delete<ApiResponse<null>>(`/orgs/${orgId}/billing/payment-methods/${methodId}`),

  getUsageAlerts: (orgId: string) =>
    apiClient.get<ApiResponse<UsageAlert[]>>(`/orgs/${orgId}/billing/alerts`),

  updateUsageAlert: (orgId: string, alertId: string, body: Partial<UsageAlert>) =>
    apiClient.patch<ApiResponse<UsageAlert>>(`/orgs/${orgId}/billing/alerts/${alertId}`, body),
}
