'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getDatabase, ref, onValue, off } from 'firebase/database'
import { app } from '@/lib/firebase'

interface StatCardProps {
  icon: string
  iconBg: string
  value: string | number
  label: string
  change?: {
    value: string
    isPositive: boolean
  }
  loading?: boolean
}

function StatCard({ icon, iconBg, value, label, change, loading }: StatCardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${iconBg}`}>
        {icon}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
          {change && (
            <div className={`inline-flex items-center gap-1 mt-3 px-2 py-1 rounded text-xs ${
              change.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span>{change.isPositive ? '↑' : '↓'}</span>
              <span>{change.value}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface DashboardData {
  completedTasks: number
  activeTasks: number
  totalProjects: number
  activeProjects: number
  totalMessages: number
  unreadMessages: number
  totalRevenue: number
  monthlyRevenue: number
  totalCustomers: number
  activeCustomers: number
}

export default function DashboardStats() {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>({
    completedTasks: 0,
    activeTasks: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalMessages: 0,
    unreadMessages: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    activeCustomers: 0
  })

  useEffect(() => {
    if (!userProfile) return

    const db = getDatabase(app)
    const fetchData = async () => {
      try {
        // Fetch projects data
        const projectsRef = ref(db, 'projects')
        onValue(projectsRef, (snapshot) => {
          const projects = snapshot.val() || {}
          const projectArray = Object.values(projects) as any[]
          
          const totalProjects = projectArray.length
          const activeProjects = projectArray.filter(p => p.status === 'in_progress').length
          const completedTasks = projectArray.reduce((sum, p) => sum + (p.completedTasks || 0), 0)
          const activeTasks = projectArray.reduce((sum, p) => sum + (p.activeTasks || 0), 0)

          setData(prev => ({
            ...prev,
            totalProjects,
            activeProjects,
            completedTasks,
            activeTasks
          }))
        })

        // Fetch messages data for admin/manager
        if (userProfile.role === 'admin' || userProfile.role === 'manager') {
          const messagesRef = ref(db, 'messages')
          onValue(messagesRef, (snapshot) => {
            const messages = snapshot.val() || {}
            let totalMessages = 0
            let unreadMessages = 0

            Object.values(messages).forEach((room: any) => {
              const roomMessages = Object.values(room || {}) as any[]
              totalMessages += roomMessages.length
              unreadMessages += roomMessages.filter(m => !m.read && m.senderId !== userProfile.uid).length
            })

            setData(prev => ({
              ...prev,
              totalMessages,
              unreadMessages
            }))
          })
        }

        // Fetch financial data for admin
        if (userProfile.role === 'admin') {
          const financialRef = ref(db, 'financial')
          onValue(financialRef, (snapshot) => {
            const financial = snapshot.val() || {}
            const totalRevenue = financial.totalRevenue || 0
            const monthlyRevenue = financial.monthlyRevenue || 0

            setData(prev => ({
              ...prev,
              totalRevenue,
              monthlyRevenue
            }))
          })

          // Fetch customers data
          const usersRef = ref(db, 'users')
          onValue(usersRef, (snapshot) => {
            const users = snapshot.val() || {}
            const userArray = Object.values(users) as any[]
            const totalCustomers = userArray.filter(u => u.role === 'customer').length
            const activeCustomers = userArray.filter(u => u.role === 'customer' && u.isOnline).length

            setData(prev => ({
              ...prev,
              totalCustomers,
              activeCustomers
            }))
          })
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoading(false)
      }
    }

    fetchData()

    // Cleanup listeners
    return () => {
      const db = getDatabase(app)
      off(ref(db, 'projects'))
      off(ref(db, 'messages'))
      off(ref(db, 'financial'))
      off(ref(db, 'users'))
    }
  }, [userProfile])

  // Define stats based on user role
  const getStats = () => {
    if (!userProfile) return []

    const baseStats: Array<{
      icon: string
      iconBg: string
      value: string | number
      label: string
      change?: { value: string; isPositive: boolean }
    }> = [
      {
        icon: '📊',
        iconBg: 'bg-blue-100 text-blue-600',
        value: data.completedTasks,
        label: '완료된 작업',
        change: { value: '15% 증가', isPositive: true }
      },
      {
        icon: '⏱️',
        iconBg: 'bg-green-100 text-green-600',
        value: data.activeTasks,
        label: '진행 중인 작업',
        change: { value: '2개 추가', isPositive: true }
      },
      {
        icon: '📁',
        iconBg: 'bg-purple-100 text-purple-600',
        value: data.activeProjects,
        label: '진행중 프로젝트',
        change: { value: `총 ${data.totalProjects}개`, isPositive: true }
      }
    ]

    if (userProfile.role === 'admin' || userProfile.role === 'manager') {
      baseStats.push({
        icon: '💬',
        iconBg: 'bg-indigo-100 text-indigo-600',
        value: data.unreadMessages,
        label: '읽지 않은 메시지',
        change: { value: `총 ${data.totalMessages}개`, isPositive: data.unreadMessages === 0 }
      })
    }

    if (userProfile.role === 'admin') {
      baseStats.push(
        {
          icon: '💰',
          iconBg: 'bg-orange-100 text-orange-600',
          value: `₩${data.monthlyRevenue.toLocaleString()}`,
          label: '이번달 수익',
          change: { value: '12% 증가', isPositive: true }
        },
        {
          icon: '👥',
          iconBg: 'bg-pink-100 text-pink-600',
          value: data.activeCustomers,
          label: '활성 고객',
          change: { value: `총 ${data.totalCustomers}명`, isPositive: true }
        }
      )
    }

    return baseStats.slice(0, 4) // Show only 4 stats
  }

  const stats = getStats()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} loading={loading} />
      ))}
    </div>
  )
}