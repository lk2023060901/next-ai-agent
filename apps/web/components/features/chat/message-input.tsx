'use client'

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react'
import { Send, Paperclip, Square } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface MessageInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  disabled?: boolean
  streaming?: boolean
  placeholder?: string
}

const MAX_ROWS = 8

export function MessageInput({
  onSend,
  onStop,
  disabled,
  streaming,
  placeholder = '给 AI 团队发消息... (Enter 发送，Shift+Enter 换行)',
}: MessageInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function adjustHeight() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 20
    const maxHeight = lineHeight * MAX_ROWS
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    requestAnimationFrame(adjustHeight)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled || streaming) return
    onSend(trimmed)
    setValue('')
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    })
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg)] px-4 py-3">
      <div
        className={cn(
          'flex items-end gap-2 rounded-[var(--radius-xl)] border bg-[var(--bg)] px-4 py-3',
          'transition-colors',
          disabled
            ? 'border-[var(--border)] opacity-60'
            : 'border-[var(--border)] focus-within:border-[var(--color-primary-500)] focus-within:ring-1 focus-within:ring-[var(--color-primary-500)]',
        )}
      >
        {/* Attachment button */}
        <button
          type="button"
          disabled={disabled || streaming}
          className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors pb-0.5"
          title="添加附件"
        >
          <Paperclip size={18} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || streaming}
          placeholder={placeholder}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] outline-none',
            'placeholder:text-[var(--text-tertiary)]',
            'max-h-[160px] leading-relaxed',
            'disabled:cursor-not-allowed',
          )}
        />

        {/* Send / Stop button */}
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-700)] transition-colors"
            title="停止生成"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'shrink-0 flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] transition-colors',
              canSend
                ? 'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]'
                : 'bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed',
            )}
            title="发送 (Enter)"
          >
            <Send size={14} />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-center text-xs text-[var(--text-tertiary)]">
        AI 可能会犯错，请核实重要信息
      </p>
    </div>
  )
}
