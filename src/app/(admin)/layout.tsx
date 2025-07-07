'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const { user, userProfile } = useAuth()

  // 관리자 권한 체크
  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600">이 섹션은 관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  const menuItems = [
    {
      name: '운영자 관리',
      href: '/operators',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
          />
        </svg>
      )
    },
    // 추가 메뉴 아이템을 여기에 추가할 수 있습니다
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 사이드바 */}
        <div className="w-64 bg-white shadow-lg h-screen sticky top-0">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">관리자 패널</h2>
          </div>
          
          <nav className="mt-6">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center px-6 py-3 text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}