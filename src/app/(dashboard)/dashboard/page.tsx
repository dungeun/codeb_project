'use client'

import React from 'react'
import DashboardStats from '@/components/dashboard/DashboardStats'
import ProjectProgress from '@/components/dashboard/ProjectProgress'
import Timeline from '@/components/dashboard/Timeline'
import AIInsights from '@/components/ai/AIInsights'
import { useAuth } from '@/lib/auth-context'

export default function DashboardPage() {
  const { user, userProfile } = useAuth()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '좋은 아침입니다'
    if (hour < 18) return '좋은 오후입니다'
    return '좋은 저녁입니다'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-primary-light text-white rounded-2xl p-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-white/10 rounded-full" />
          <h1 className="text-3xl font-bold mb-2 relative z-10">
            {getGreeting()}, {userProfile?.displayName || '사용자'}님!
          </h1>
          <p className="text-lg opacity-90 relative z-10">
            프로젝트 진행 상황을 한눈에 확인하세요
          </p>
        </div>

        {/* Project Progress */}
        <ProjectProgress />

        {/* Stats Grid */}
        <DashboardStats />
        
        {/* AI Insights */}
        <AIInsights projectId="1" />
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-8">
        <Timeline />
        
        {/* Compact AI Insights */}
        <AIInsights projectId="1" compact />
      </div>
    </div>
  )
}