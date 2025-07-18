'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import notificationService, { Notification } from '@/services/notification-service'
import toast from 'react-hot-toast'

export default function Header() {
  const { user, userProfile, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 알림 구독
  useEffect(() => {
    if (!user) return

    const unsubscribe = notificationService.subscribeToNotifications(
      user.uid,
      (notifs) => {
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.read).length)
      }
    )

    return () => unsubscribe()
  }, [user])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
      toast.success('로그아웃되었습니다.')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('로그아웃 중 오류가 발생했습니다.')
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // 알림 읽음 처리
    if (!notification.read) {
      await notificationService.markAsRead(user!.uid, notification.id)
    }

    // 링크가 있으면 이동
    if (notification.link) {
      router.push(notification.link)
      setShowNotifications(false)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    await notificationService.markAllAsRead(user.uid)
    toast.success('모든 알림을 읽음으로 표시했습니다.')
  }

  // 페이지 타이틀 가져오기
  const getPageTitle = () => {
    const path = pathname.split('/').filter(Boolean)
    if (path.length === 0 || path[0] === 'dashboard') return '대시보드'
    
    const titleMap: Record<string, string> = {
      'projects': '프로젝트',
      'tasks': '작업 관리',
      'clients': '거래처 관리',
      'marketing': '마케팅',
      'files': '파일 관리',
      'analytics': '분석',
      'automation': 'AI 자동화',
      'finance': '재무 관리',
      'settings': '설정',
      'profile': '프로필'
    }

    return titleMap[path[0]] || path[0]
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '🎉'
      case 'warning': return '⚠️'
      case 'error': return '🔴'
      default: return 'ℹ️'
    }
  }

  const getRelativeTime = (time: string) => {
    const now = new Date()
    const notificationTime = new Date(time)
    const diffMs = now.getTime() - notificationTime.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}일 전`
    if (diffHours > 0) return `${diffHours}시간 전`
    if (diffMins > 0) return `${diffMins}분 전`
    return '방금 전'
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 페이지 타이틀 */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>

          {/* 오른쪽 메뉴 */}
          <div className="flex items-center gap-4">
            {/* 알림 */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 알림 드롭다운 */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden"
                  >
                    <div className="p-4 border-b flex items-center justify-between">
                      <h3 className="font-semibold">알림</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-primary hover:underline"
                        >
                          모두 읽음
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 10).map(notification => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-2">{getRelativeTime(notification.time)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p className="text-sm">새로운 알림이 없습니다</p>
                        </div>
                      )}
                    </div>

                    {notifications.length > 10 && (
                      <Link
                        href="/notifications"
                        className="block p-3 text-center text-sm text-primary hover:bg-gray-50"
                      >
                        모든 알림 보기
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 사용자 메뉴 */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-medium">
                  {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {/* 사용자 메뉴 드롭다운 */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden"
                  >
                    <div className="p-4 border-b">
                      <p className="font-medium text-gray-900">{userProfile?.displayName}</p>
                      <p className="text-sm text-gray-500">{userProfile?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{userProfile?.role}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        👤 프로필
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        ⚙️ 설정
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🚪 로그아웃
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}