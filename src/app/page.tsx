import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-primary mb-4">CodeB Platform</h1>
        <p className="text-xl text-gray-600 mb-8">AI 기반 웹 에이전시 플랫폼</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="btn btn-primary">
            로그인
          </Link>
          <Link href="/dashboard" className="btn btn-secondary">
            대시보드
          </Link>
        </div>
      </div>
    </main>
  )
}
