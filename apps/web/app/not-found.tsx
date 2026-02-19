import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-[--text-primary]">404</h1>
      <p className="text-[--text-secondary]">页面不存在</p>
      <Link href="/" className="text-[--color-primary-500] hover:underline">
        返回首页
      </Link>
    </div>
  )
}
