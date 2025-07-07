'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { FinancialSummary } from '@/types/finance'
import ExpenseTracker from '@/components/finance/ExpenseTracker'
import BudgetManager from '@/components/finance/BudgetManager'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

// Mock 재무 데이터
const mockFinancialSummary: FinancialSummary = {
  totalRevenue: 458500000,
  totalExpenses: 312300000,
  netProfit: 146200000,
  pendingInvoices: 12,
  overdueInvoices: 3,
  monthlyRevenue: [
    { month: '1월', amount: 35000000 },
    { month: '2월', amount: 42000000 },
    { month: '3월', amount: 38000000 },
    { month: '4월', amount: 45000000 },
    { month: '5월', amount: 52000000 },
    { month: '6월', amount: 48000000 },
    { month: '7월', amount: 55000000 },
    { month: '8월', amount: 51000000 },
    { month: '9월', amount: 47000000 },
    { month: '10월', amount: 43000000 },
    { month: '11월', amount: 49000000 },
    { month: '12월', amount: 53500000 },
  ],
  monthlyExpenses: [
    { month: '1월', amount: 28000000 },
    { month: '2월', amount: 30000000 },
    { month: '3월', amount: 27000000 },
    { month: '4월', amount: 29000000 },
    { month: '5월', amount: 32000000 },
    { month: '6월', amount: 31000000 },
    { month: '7월', amount: 33000000 },
    { month: '8월', amount: 30500000 },
    { month: '9월', amount: 29500000 },
    { month: '10월', amount: 28000000 },
    { month: '11월', amount: 31000000 },
    { month: '12월', amount: 33300000 },
  ],
  revenueByProject: [
    { projectId: '1', projectName: '웹사이트 리뉴얼', revenue: 120000000, percentage: 26.2 },
    { projectId: '2', projectName: '모바일 앱 개발', revenue: 95000000, percentage: 20.7 },
    { projectId: '3', projectName: '이커머스 플랫폼', revenue: 150000000, percentage: 32.7 },
    { projectId: '4', projectName: 'CRM 시스템', revenue: 93500000, percentage: 20.4 },
  ],
  expensesByCategory: [
    { category: '인건비', amount: 180000000, percentage: 57.6 },
    { category: '사무실 임대', amount: 48000000, percentage: 15.4 },
    { category: '장비/소프트웨어', amount: 35000000, percentage: 11.2 },
    { category: '마케팅', amount: 25000000, percentage: 8.0 },
    { category: '기타', amount: 24300000, percentage: 7.8 },
  ],
}

const COLORS = ['#4f7eff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function FinancePage() {
  const { user, userProfile } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('year')
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'budget' | 'invoices'>('overview')
  const [financialData] = useState<FinancialSummary>(mockFinancialSummary)

  // 권한 체크
  if (userProfile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600">재무 관리는 관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 수익률 계산
  const profitMargin = ((financialData.netProfit / financialData.totalRevenue) * 100).toFixed(1)

  // 월별 수익/지출 차트 데이터
  const monthlyChartData = financialData.monthlyRevenue.map((revenue, index) => ({
    month: revenue.month,
    수익: revenue.amount,
    지출: financialData.monthlyExpenses[index].amount,
    순이익: revenue.amount - financialData.monthlyExpenses[index].amount,
  }))

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">재무 관리</h1>
          <p className="text-gray-600 mt-1">수익, 지출, 청구서를 관리하고 재무 현황을 분석합니다.</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="month">이번 달</option>
            <option value="quarter">이번 분기</option>
            <option value="year">올해</option>
          </select>
          <button className="btn btn-primary">
            보고서 다운로드
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-sm p-1">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: '대시보드', icon: '📊' },
            { id: 'expenses', label: '지출 관리', icon: '💳' },
            { id: 'budget', label: '예산 관리', icon: '💰' },
            { id: 'invoices', label: '청구서', icon: '📄' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <>
          {/* 주요 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">총 수익</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(financialData.totalRevenue)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            +12.5% 전년 대비
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">총 지출</span>
            <span className="text-2xl">💸</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(financialData.totalExpenses)}
          </div>
          <div className="text-sm text-red-600 mt-1">
            +8.3% 전년 대비
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">순이익</span>
            <span className="text-2xl">📈</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(financialData.netProfit)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            수익률 {profitMargin}%
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">미수금</span>
            <span className="text-2xl">📋</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {financialData.pendingInvoices}건
          </div>
          <div className="text-sm text-yellow-600 mt-1">
            검토 필요
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">연체</span>
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {financialData.overdueInvoices}건
          </div>
          <div className="text-sm text-red-600 mt-1">
            즉시 확인 필요
          </div>
        </motion.div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 월별 수익/지출 추이 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">월별 수익/지출 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Area type="monotone" dataKey="수익" stackId="1" stroke="#4f7eff" fill="#4f7eff" fillOpacity={0.8} />
              <Area type="monotone" dataKey="지출" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 프로젝트별 수익 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">프로젝트별 수익</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={financialData.revenueByProject}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.projectName} (${entry.percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {financialData.revenueByProject.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 지출 카테고리 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">지출 카테고리</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialData.expensesByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <YAxis dataKey="category" type="category" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#4f7eff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 순이익 추이 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">월별 순이익</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="순이익" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left">
          <div className="text-2xl mb-2">📄</div>
          <h4 className="font-semibold text-gray-900">새 청구서 생성</h4>
          <p className="text-sm text-gray-600 mt-1">프로젝트 청구서를 생성하고 발송합니다</p>
        </button>
        
        <button className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left">
          <div className="text-2xl mb-2">💳</div>
          <h4 className="font-semibold text-gray-900">지출 기록</h4>
          <p className="text-sm text-gray-600 mt-1">새로운 지출 내역을 기록합니다</p>
        </button>
        
        <button className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left">
          <div className="text-2xl mb-2">📊</div>
          <h4 className="font-semibold text-gray-900">상세 보고서</h4>
          <p className="text-sm text-gray-600 mt-1">재무 상세 보고서를 확인합니다</p>
        </button>
          </div>
        </>
      )}

      {activeTab === 'expenses' && <ExpenseTracker />}
      
      {activeTab === 'budget' && <BudgetManager />}
      
      {activeTab === 'invoices' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">청구서 관리</h3>
          <p className="text-gray-600 mb-4">청구서 상세 관리는 별도 페이지에서 확인하세요.</p>
          <a href="/finance/invoices" className="btn btn-primary">
            청구서 페이지로 이동
          </a>
        </div>
      )}
    </div>
  )
}