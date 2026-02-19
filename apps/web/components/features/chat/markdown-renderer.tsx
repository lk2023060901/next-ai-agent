import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils/cn'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none',
        // Headings
        '[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-[var(--text-primary)]',
        '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[var(--text-primary)]',
        '[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)]',
        // Paragraph
        '[&_p]:mb-2 [&_p]:leading-relaxed [&_p:last-child]:mb-0',
        // Lists
        '[&_ul]:mb-2 [&_ul]:ml-4 [&_ul]:list-disc',
        '[&_ol]:mb-2 [&_ol]:ml-4 [&_ol]:list-decimal',
        '[&_li]:mb-0.5',
        // Inline code
        '[&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:bg-[var(--surface-2)] [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:font-mono [&_code:not(pre_code)]:text-xs [&_code:not(pre_code)]:text-[var(--text-primary)]',
        // Code block
        '[&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-[var(--radius-md)] [&_pre]:bg-[#1e1e2e] [&_pre]:p-4',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-xs [&_pre_code]:text-[#cdd6f4]',
        // Blockquote
        '[&_blockquote]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-primary-300)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--text-secondary)]',
        // Table
        '[&_table]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
        '[&_th]:border [&_th]:border-[var(--border)] [&_th]:bg-[var(--surface)] [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold',
        '[&_td]:border [&_td]:border-[var(--border)] [&_td]:px-3 [&_td]:py-1.5',
        // Links
        '[&_a]:text-[var(--color-primary-500)] [&_a]:underline [&_a:hover]:text-[var(--color-primary-600)]',
        // HR
        '[&_hr]:my-3 [&_hr]:border-[var(--border)]',
        // Strong / em
        '[&_strong]:font-semibold [&_strong]:text-[var(--text-primary)]',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
