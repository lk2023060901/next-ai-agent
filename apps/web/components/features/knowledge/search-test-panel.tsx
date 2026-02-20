'use client'

import { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSearchKb } from '@/hooks/use-knowledge-bases'
import type { SearchResult } from '@/types/api'

interface SearchTestPanelProps {
  kbId: string
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    score >= 0.8
      ? 'var(--color-success)'
      : score >= 0.6
        ? 'var(--color-warning)'
        : 'var(--text-tertiary)'
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {pct}%
    </span>
  )
}

function ResultCard({ result }: { result: SearchResult }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ScoreBadge score={result.score} />
            <span className="truncate text-xs text-[var(--text-tertiary)]">
              {result.documentName} · 第 {result.chunkIndex + 1} 块
            </span>
          </div>
          <p
            className={
              expanded
                ? 'mt-2 text-sm text-[var(--text-primary)]'
                : 'mt-2 line-clamp-2 text-sm text-[var(--text-primary)]'
            }
          >
            {result.content}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export function SearchTestPanel({ kbId }: SearchTestPanelProps) {
  const [query, setQuery] = useState('')
  const search = useSearchKb(kbId)

  function handleSearch() {
    if (!query.trim()) return
    search.mutate({ query: query.trim(), topK: 5 })
  }

  return (
    <Card
      header={<h3 className="text-base font-semibold text-[var(--text-primary)]">搜索测试</h3>}
      padding="md"
    >
      <div className="space-y-4">
        {/* Query input */}
        <div className="flex gap-2">
          <Input
            placeholder="输入查询语句，测试知识库检索效果..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            leftIcon={<Search className="h-4 w-4" />}
            fullWidth
          />
          <Button onClick={handleSearch} loading={search.isPending} className="shrink-0">
            检索
          </Button>
        </div>

        {/* Results */}
        {search.data && search.data.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-tertiary)]">
              找到 {search.data.length} 个相关片段
            </p>
            {search.data.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        )}

        {search.data && search.data.length === 0 && (
          <p className="text-center text-sm text-[var(--text-tertiary)]">未找到相关内容</p>
        )}
      </div>
    </Card>
  )
}
