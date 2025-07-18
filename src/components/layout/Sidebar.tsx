'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface MenuItem {
  href: string
  label: string
  icon: string
  roles?: string[]
}

const menuItems: MenuItem[] = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/projects', label: '프로젝트', icon: '📁' },
  { href: '/tasks', label: '작업', icon: '✅', roles: ['admin', 'manager', 'developer'] },
  { href: '/status', label: '프로젝트 현황', icon: '📈', roles: ['customer'] },
  { href: '/support', label: '실시간 상담', icon: '💬', roles: ['customer'] },
  { href: '/review', label: '프로젝트 리뷰', icon: '⭐', roles: ['customer'] },
  { href: '/marketing', label: '마케팅', icon: '🎯', roles: ['admin', 'manager'] },
  { href: '/clients', label: '거래처', icon: '🏢', roles: ['admin', 'manager'] },
  { href: '/files', label: '파일 관리', icon: '📄' },
  { href: '/chat', label: '채팅', icon: '💬', roles: ['admin', 'manager', 'developer'] },
  { href: '/chat/multi', label: '멀티 채팅', icon: '💭', roles: ['admin', 'manager', 'developer'] },
  // { href: '/ai', label: 'AI 어시스턴트', icon: '🤖' },
  { href: '/automation', label: '자동화', icon: '⚡', roles: ['admin', 'manager', 'developer'] },
  { href: '/analytics', label: '예측 분석', icon: '🔮', roles: ['admin', 'manager'] },
  { href: '/finance', label: '재무 관리', icon: '💰', roles: ['admin'] },
  { href: '/operators', label: '운영자 관리', icon: '👥', roles: ['admin'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { userProfile, logout } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userProfile?.role || '')
  })

  return (
    <>
      {/* 모바일 메뉴 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark text-white rounded-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        fixed left-0 top-0 h-full bg-dark text-white flex flex-col z-40
        transition-transform duration-300 ease-in-out
        w-[280px] lg:w-[var(--sidebar-width)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold">CodeB</h1>
        </div>
      
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href as any}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${pathname === item.href 
                    ? 'bg-primary text-white' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="mb-4">
          <p className="font-medium">{userProfile?.displayName}</p>
          <p className="text-sm text-gray-400">
            {userProfile?.role === 'admin' ? '관리자' : 
             userProfile?.role === 'customer' ? '고객' : 
             userProfile?.role === 'external' ? '외부 사용자' : '팀원'}
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              await logout()
            } catch (error) {
              console.error('로그아웃 실패:', error)
            }
          }}
          className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>🚪</span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
    </>
  )
}