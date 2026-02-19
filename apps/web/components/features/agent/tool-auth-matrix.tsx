'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { useToolAuth, useUpdateToolAuth } from '@/hooks/use-tools'
import { toast } from '@/components/ui/toast'
import { ALL_ROLES, ROLE_LABELS } from '@/lib/constants/agent'
import type { AgentRole, Tool } from '@/types/api'

export interface ToolAuthMatrixProps {
  workspaceId: string
  tools: Tool[]
}

export function ToolAuthMatrix({ workspaceId, tools }: ToolAuthMatrixProps) {
  const { data: authData } = useToolAuth(workspaceId)
  const updateAuth = useUpdateToolAuth(workspaceId)
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({})

  const categories = Array.from(new Set(tools.map((t) => t.category))).sort()

  useEffect(() => {
    if (authData) {
      setMatrix(structuredClone(authData))
    }
  }, [authData])

  const isDirty = useCallback(() => {
    return JSON.stringify(matrix) !== JSON.stringify(authData)
  }, [matrix, authData])

  function toggleCell(role: AgentRole, cat: string) {
    setMatrix((prev) => {
      const next = { ...prev }
      if (!next[role]) next[role] = {}
      const roleAuth = { ...next[role]! }
      roleAuth[cat] = !roleAuth[cat]
      next[role] = roleAuth
      return next
    })
  }

  function toggleRow(role: AgentRole) {
    const current = matrix[role] ?? {}
    const allEnabled = categories.every((c) => current[c] !== false)
    setMatrix((prev) => {
      const next = { ...prev }
      const roleAuth: Record<string, boolean> = {}
      for (const cat of categories) {
        roleAuth[cat] = !allEnabled
      }
      next[role] = roleAuth
      return next
    })
  }

  function toggleColumn(cat: string) {
    const allEnabled = ALL_ROLES.every((r) => {
      const roleAuth = matrix[r]
      return roleAuth ? roleAuth[cat] !== false : true
    })
    setMatrix((prev) => {
      const next = { ...prev }
      for (const role of ALL_ROLES) {
        if (!next[role]) next[role] = {}
        next[role] = { ...next[role]!, [cat]: !allEnabled }
      }
      return next
    })
  }

  function getCellState(role: AgentRole, cat: string): boolean {
    const roleAuth = matrix[role]
    if (!roleAuth) return true
    return roleAuth[cat] !== false
  }

  function getRowState(role: AgentRole): 'all' | 'some' | 'none' {
    const states = categories.map((c) => getCellState(role, c))
    const trueCount = states.filter(Boolean).length
    if (trueCount === categories.length) return 'all'
    if (trueCount === 0) return 'none'
    return 'some'
  }

  function getColumnState(cat: string): 'all' | 'some' | 'none' {
    const states = ALL_ROLES.map((r) => getCellState(r, cat))
    const trueCount = states.filter(Boolean).length
    if (trueCount === ALL_ROLES.length) return 'all'
    if (trueCount === 0) return 'none'
    return 'some'
  }

  function handleSave() {
    updateAuth.mutate(matrix, {
      onSuccess: () => toast.success('工具权限已保存'),
      onError: () => toast.error('保存失败'),
    })
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-2)]">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-[var(--surface-2)] px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]"
              >
                角色
              </th>
              {categories.map((cat) => {
                const colState = getColumnState(cat)
                return (
                  <th key={cat} scope="col" className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggleColumn(cat)}
                      className="text-xs font-medium capitalize text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {cat}
                    </button>
                    <IndeterminateCheckbox
                      state={colState}
                      onChange={() => toggleColumn(cat)}
                      ariaLabel={`全选 ${cat} 列`}
                      className="mx-auto mt-1"
                    />
                  </th>
                )
              })}
              <th
                scope="col"
                className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]"
              >
                全选
              </th>
            </tr>
          </thead>
          <tbody>
            {ALL_ROLES.map((role) => {
              const rowState = getRowState(role)
              return (
                <tr
                  key={role}
                  className="border-t border-[var(--border)] hover:bg-[var(--surface)]"
                >
                  <td scope="row" className="sticky left-0 z-10 bg-[var(--bg)] px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: `var(--color-agent-${role})` }}
                      />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {ROLE_LABELS[role]}
                      </span>
                    </span>
                  </td>
                  {categories.map((cat) => (
                    <td key={cat} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={getCellState(role, cat)}
                        onChange={() => toggleCell(role, cat)}
                        aria-label={`${ROLE_LABELS[role]} - ${cat}`}
                        className="h-4 w-4 rounded border-[var(--border)] accent-[var(--color-primary-500)]"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    <IndeterminateCheckbox
                      state={rowState}
                      onChange={() => toggleRow(role)}
                      ariaLabel={`${ROLE_LABELS[role]} 全选`}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty()} loading={updateAuth.isPending} size="sm">
          保存权限
        </Button>
      </div>
    </div>
  )
}

function IndeterminateCheckbox({
  state,
  onChange,
  ariaLabel,
  className,
}: {
  state: 'all' | 'some' | 'none'
  onChange: () => void
  ariaLabel?: string
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = state === 'some'
    }
  }, [state])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === 'all'}
      onChange={onChange}
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      className={cn(
        'h-4 w-4 rounded border-[var(--border)] accent-[var(--color-primary-500)]',
        className,
      )}
    />
  )
}
