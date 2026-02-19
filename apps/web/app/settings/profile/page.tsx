'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'

const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '(UTC+8) 中国标准时间' },
  { value: 'Asia/Tokyo', label: '(UTC+9) 日本标准时间' },
  { value: 'America/New_York', label: '(UTC-5) 美国东部时间' },
  { value: 'Europe/London', label: '(UTC+0) 格林威治时间' },
]

export default function ProfilePage() {
  const [name, setName] = useState('张三')
  const [bio, setBio] = useState('')
  const [timezone, setTimezone] = useState('Asia/Shanghai')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
    toast.success('个人资料已保存')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">个人资料</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">管理你的公开个人信息</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar name={name} size="xl" />
          <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors">
            <Camera size={12} />
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">头像</p>
          <p className="text-xs text-[var(--text-secondary)]">JPG、PNG，最大 2MB</p>
          <button className="mt-1 text-xs text-[var(--color-primary-500)] hover:underline">
            上传图片
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5 max-w-lg">
        <Input
          label="姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">个人简介</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="介绍一下自己..."
            className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
          />
        </div>

        <Select
          label="时区"
          options={TIMEZONES}
          value={timezone}
          onChange={(v) => setTimezone(String(v))}
          fullWidth
        />

        <Button loading={loading} onClick={handleSave}>
          保存更改
        </Button>
      </div>
    </div>
  )
}
