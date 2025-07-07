'use client'

import React from 'react'

interface StatCardProps {
  icon: string
  iconBg: string
  value: string | number
  label: string
  change?: {
    value: string
    isPositive: boolean
  }
}

function StatCard({ icon, iconBg, value, label, change }: StatCardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${iconBg}`}>
        {icon}
      </div>
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
    </div>
  )
}

export default function DashboardStats() {
  const stats = [
    {
      icon: '📊',
      iconBg: 'bg-blue-100 text-blue-600',
      value: 12,
      label: '완료된 작업',
      change: { value: '15% 증가', isPositive: true }
    },
    {
      icon: '⏱️',
      iconBg: 'bg-green-100 text-green-600',
      value: 8,
      label: '진행 중인 작업',
      change: { value: '2개 추가', isPositive: true }
    },
    {
      icon: '📅',
      iconBg: 'bg-purple-100 text-purple-600',
      value: '15일',
      label: '남은 기간',
      change: { value: '3일 감소', isPositive: false }
    },
    {
      icon: '💰',
      iconBg: 'bg-orange-100 text-orange-600',
      value: '85%',
      label: '예산 사용률',
      change: { value: '정상 범위', isPositive: true }
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}