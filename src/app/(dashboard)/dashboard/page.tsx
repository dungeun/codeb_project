'use client'

import React, { useEffect, useState } from 'react'
import DashboardStats from '@/components/dashboard/DashboardStats'
import ProjectProgress from '@/components/dashboard/ProjectProgress'
import Timeline from '@/components/dashboard/Timeline'
import AIInsights from '@/components/ai/AIInsights'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { getDatabase, ref, onValue, off } from 'firebase/database'
import { app } from '@/lib/firebase'

interface QuickAction {
  icon: string
  label: string
  href: string
  color: string
}

interface RecentActivity {
  id: string
  type: 'project' | 'message' | 'task' | 'file'
  title: string
  description: string
  time: string
  icon: string
}

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  time: string
  read: boolean
}

export default function DashboardPage() {
  const { user, userProfile } = useAuth()
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '좋은 아침입니다'
    if (hour < 18) return '좋은 오후입니다'
    return '좋은 저녁입니다'
  }

  const getQuickActions = (): QuickAction[] => {
    const baseActions: QuickAction[] = [
      {
        icon: '📁',
        label: '새 프로젝트',
        href: '/projects?action=new',
        color: 'bg-blue-500 hover:bg-blue-600'
      },
      {
        icon: '💬',
        label: '채팅 시작',
        href: '/chat',
        color: 'bg-green-500 hover:bg-green-600'
      },
      {
        icon: '📊',
        label: '분석 보기',
        href: '/analytics',
        color: 'bg-purple-500 hover:bg-purple-600'
      }
    ]

    if (userProfile?.role === 'admin' || userProfile?.role === 'manager') {
      baseActions.push({
        icon: '🤖',
        label: 'AI 자동화',
        href: '/automation',
        color: 'bg-indigo-500 hover:bg-indigo-600'
      })
    }

    if (userProfile?.role === 'admin') {
      baseActions.push({
        icon: '💰',
        label: '재무 관리',
        href: '/finance',
        color: 'bg-orange-500 hover:bg-orange-600'
      })
    }

    return baseActions
  }

  useEffect(() => {
    if (!userProfile) return

    const loadData = async () => {
      try {
        // Import services
        const activityService = (await import('@/services/activity-service')).default
        const notificationService = (await import('@/services/notification-service')).default

        // Subscribe to activities
        const unsubscribeActivities = activityService.subscribeToActivities(20, (activities) => {
          // Filter based on user role
          let filteredActivities = activities
          if (userProfile.role === 'customer') {
            filteredActivities = activities.filter(a => 
              a.userId === userProfile.uid || a.projectId
            )
          } else if (userProfile.role === 'developer') {
            filteredActivities = activities.filter(a => 
              a.userId === userProfile.uid || a.type === 'task' || a.type === 'project'
            )
          }
          
          // Convert to RecentActivity type and filter only allowed types
          const recentActivities: RecentActivity[] = filteredActivities
            .filter(a => ['project', 'task', 'message', 'file'].includes(a.type))
            .slice(0, 5)
            .map(a => ({
              id: a.id,
              type: a.type as 'project' | 'task' | 'message' | 'file',
              title: a.title,
              description: a.description,
              time: a.time,
              icon: a.icon
            }))
          
          setRecentActivities(recentActivities)
        })

        // Subscribe to notifications  
        const unsubscribeNotifications = notificationService.subscribeToNotifications(
          userProfile.uid,
          (notifs) => {
            setNotifications(notifs.slice(0, 10))
          }
        )

        setLoading(false)

        // Cleanup
        return () => {
          unsubscribeActivities()
          unsubscribeNotifications()
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [userProfile])

  const unreadNotifications = notifications.filter(n => !n.read).length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        {/* Welcome Section with Quick Actions */}
        <div className="bg-gradient-to-r from-primary to-primary-light text-white rounded-2xl p-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              {getGreeting()}, {userProfile?.displayName || '사용자'}님!
            </h1>
            <p className="text-lg opacity-90 mb-6">
              프로젝트 진행 상황을 한눈에 확인하세요
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              {getQuickActions().map((action, index) => (
                <Link
                  key={index}
                  href={action.href as any}
                  className={`${action.color} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <DashboardStats />

        {/* Project Progress */}
        <ProjectProgress />
        
        {/* Recent Activities */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">최근 활동</h2>
            <Link href={"/activities" as any} className="text-primary hover:underline text-sm">
              전체 보기
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{activity.title}</h3>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">아직 활동 내역이 없습니다</p>
          )}
        </div>
        
        {/* AI Insights */}
        <AIInsights projectId="1" />
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-8">
        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              알림
              {unreadNotifications > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </h2>
            <Link href={"/notifications" as any} className="text-primary hover:underline text-sm">
              전체 보기
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.slice(0, 5).map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  } ${
                    notification.type === 'error' ? 'border-red-200' :
                    notification.type === 'warning' ? 'border-yellow-200' :
                    notification.type === 'success' ? 'border-green-200' :
                    'border-gray-200'
                  }`}
                >
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">새로운 알림이 없습니다</p>
          )}
        </div>

        {/* Timeline */}
        <Timeline />
        
        {/* Compact AI Insights */}
        <AIInsights projectId="1" compact />
      </div>
    </div>
  )
}