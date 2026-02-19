'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/toast'

interface NotifChannel {
  key: string
  label: string
  desc: string
}

interface NotifType {
  key: string
  label: string
  email: boolean
  inApp: boolean
  push: boolean
}

const CHANNELS: NotifChannel[] = [
  { key: 'email', label: '邮件通知', desc: '通过邮件接收重要通知' },
  { key: 'inApp', label: '应用内通知', desc: '在应用内显示通知角标' },
  { key: 'push', label: '推送通知', desc: '浏览器推送通知（需授权）' },
]

const INIT_TYPES: NotifType[] = [
  { key: 'agent_complete', label: 'Agent 任务完成', email: true, inApp: true, push: false },
  { key: 'agent_error', label: 'Agent 运行错误', email: true, inApp: true, push: true },
  { key: 'approval_required', label: '需要人工审批', email: true, inApp: true, push: true },
  { key: 'member_invite', label: '成员邀请', email: true, inApp: false, push: false },
  { key: 'mention', label: '被@提及', email: false, inApp: true, push: false },
]

type ChannelKey = 'email' | 'inApp' | 'push'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--border)]'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function NotificationsPage() {
  const [types, setTypes] = useState(INIT_TYPES)

  function toggle(typeKey: string, channel: ChannelKey) {
    setTypes((prev) =>
      prev.map((t) => (t.key === typeKey ? { ...t, [channel]: !t[channel] } : t)),
    )
    toast.success('通知设置已保存')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">通知设置</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">选择你希望接收的通知方式</p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">事件</th>
              {CHANNELS.map((ch) => (
                <th key={ch.key} className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">
                  <div>{ch.label}</div>
                  <div className="text-xs font-normal text-[var(--text-tertiary)]">{ch.desc}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type.key} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{type.label}</td>
                {(['email', 'inApp', 'push'] as ChannelKey[]).map((ch) => (
                  <td key={ch} className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <Toggle checked={type[ch]} onChange={() => toggle(type.key, ch)} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
