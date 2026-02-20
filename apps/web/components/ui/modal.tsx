'use client'

import { useEffect, type ReactNode, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: ModalSize
  children: ReactNode
  footer?: ReactNode
  closeOnBackdrop?: boolean
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full rounded-[var(--radius-xl)] bg-[var(--bg)] shadow-xl',
          'border border-[var(--border)]',
          sizeStyles[size],
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-6">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
              )}
            </div>
            <button
              aria-label="关闭"
              onClick={onClose}
              className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
