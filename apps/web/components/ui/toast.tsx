'use client'

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

// Re-export toast function with typed helpers
export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, { description }),

  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description }),

  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, { description }),

  info: (message: string, description?: string) =>
    sonnerToast.info(message, { description }),

  loading: (message: string) => sonnerToast.loading(message),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  promise: sonnerToast.promise,
}

// Toaster component to be placed in root layout
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            'group rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] shadow-lg',
          description: 'text-[var(--text-secondary)] text-sm',
          actionButton: 'bg-[var(--color-primary-500)] text-white text-sm rounded-[var(--radius-sm)]',
          cancelButton: 'text-[var(--text-secondary)] text-sm',
          success: 'text-[var(--color-success)]',
          error: 'text-[var(--color-danger)]',
          warning: 'text-[var(--color-warning)]',
          info: 'text-[var(--color-primary-500)]',
        },
      }}
      icons={{
        success: <CheckCircle size={18} className="text-[var(--color-success)]" />,
        error: <XCircle size={18} className="text-[var(--color-danger)]" />,
        warning: <AlertTriangle size={18} className="text-[var(--color-warning)]" />,
        info: <Info size={18} className="text-[var(--color-primary-500)]" />,
      }}
    />
  )
}
