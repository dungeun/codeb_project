'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, userProfile, logout } = useAuth()
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState('chat')

  // 고객용 메뉴 (4개만)
  const customerMenus = [
    { id: 'support', label: '실시간 상담', icon: '💬', href: '/support' }, // 고객 상담 페이지
    { id: 'files', label: '자료 업로드', icon: '📤', href: '/files' }, // 대시보드 파일로 연결
    { id: 'status', label: '현황', icon: '📊', href: '/status' },
    { id: 'review', label: '리뷰', icon: '⭐', href: '/review' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 심플한 상단 바 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-primary">CodeB</h1>
              <span className="text-sm text-gray-500">고객 포털</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">안녕하세요, {userProfile?.displayName || user?.email}님</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 왼쪽: 심플한 네비게이션 */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-4">메뉴</h3>
              <div className="space-y-2">
                {customerMenus.map((menu) => (
                  <Link
                    key={menu.id}
                    href={menu.href as any}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname === menu.href
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{menu.icon}</span>
                    <span className="font-medium">{menu.label}</span>
                  </Link>
                ))}
              </div>

              {/* 프로젝트 정보 */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">진행중인 프로젝트</h4>
                <p className="text-sm text-gray-600 mb-1">웹사이트 리뉴얼</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-gray-500">65% 완료</p>
              </div>
            </nav>
          </div>

          {/* 오른쪽: 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}