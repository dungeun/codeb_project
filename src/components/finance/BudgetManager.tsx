'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Budget {
  id: string
  projectId?: string
  projectName?: string
  category: string
  allocated: number
  spent: number
  period: 'monthly' | 'quarterly' | 'yearly'
  startDate: Date
  endDate: Date
}

interface BudgetManagerProps {
  projectId?: string
}

const mockBudgets: Budget[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '웹사이트 리뉴얼',
    category: '개발비',
    allocated: 50000000,
    spent: 35000000,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
  },
  {
    id: '2',
    category: '마케팅',
    allocated: 10000000,
    spent: 8500000,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
  },
  {
    id: '3',
    category: '사무용품',
    allocated: 2000000,
    spent: 1200000,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
  },
  {
    id: '4',
    projectId: '2',
    projectName: '모바일 앱 개발',
    category: '개발비',
    allocated: 80000000,
    spent: 45000000,
    period: 'quarterly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31')
  }
]

const categories = [
  '개발비', '마케팅', '사무용품', '교육훈련', '장비구입', '외주비', '기타'
]

const COLORS = ['#4f7eff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']

export default function BudgetManager({ projectId }: BudgetManagerProps) {
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets)
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newBudget, setNewBudget] = useState({
    category: '',
    allocated: '',
    period: 'monthly' as const,
    startDate: '',
    endDate: ''
  })

  // 프로젝트별 필터링
  const filteredBudgets = projectId 
    ? budgets.filter(budget => budget.projectId === projectId)
    : budgets.filter(budget => budget.period === selectedPeriod)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getBudgetStatus = (allocated: number, spent: number) => {
    const percentage = (spent / allocated) * 100
    if (percentage >= 100) return { status: 'over', color: 'text-red-600', bgColor: 'bg-red-100' }
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { status: 'safe', color: 'text-green-600', bgColor: 'bg-green-100' }
  }

  const totalAllocated = filteredBudgets.reduce((sum, budget) => sum + budget.allocated, 0)
  const totalSpent = filteredBudgets.reduce((sum, budget) => sum + budget.spent, 0)
  const totalRemaining = totalAllocated - totalSpent

  // 차트 데이터
  const pieData = filteredBudgets.map(budget => ({
    name: budget.category,
    value: budget.allocated,
    spent: budget.spent,
    remaining: budget.allocated - budget.spent
  }))

  const barData = filteredBudgets.map(budget => ({
    category: budget.category,
    할당예산: budget.allocated,
    사용예산: budget.spent,
    잔여예산: budget.allocated - budget.spent
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const budget: Budget = {
      id: (budgets.length + 1).toString(),
      category: newBudget.category,
      allocated: parseFloat(newBudget.allocated),
      spent: 0,
      period: newBudget.period,
      startDate: new Date(newBudget.startDate),
      endDate: new Date(newBudget.endDate)
    }

    setBudgets(prev => [...prev, budget])
    setNewBudget({
      category: '',
      allocated: '',
      period: 'monthly',
      startDate: '',
      endDate: ''
    })
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">예산 관리</h2>
          {!projectId && (
            <div className="flex gap-2 mt-2">
              {(['monthly', 'quarterly', 'yearly'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period === 'monthly' ? '월별' : period === 'quarterly' ? '분기별' : '연별'}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          + 예산 추가
        </button>
      </div>

      {/* 예산 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 할당 예산</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAllocated)}</p>
            </div>
            <span className="text-2xl">💰</span>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">사용된 예산</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
            </div>
            <span className="text-2xl">📊</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalSpent / totalAllocated) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {((totalSpent / totalAllocated) * 100).toFixed(1)}% 사용
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">잔여 예산</p>
              <p className={`text-xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalRemaining)}
              </p>
            </div>
            <span className="text-2xl">{totalRemaining >= 0 ? '✅' : '⚠️'}</span>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 예산 배분 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">카테고리별 예산 배분</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${formatCurrency(entry.value)})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 예산 사용 현황 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">예산 사용 현황</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="할당예산" fill="#e5e7eb" />
              <Bar dataKey="사용예산" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 예산 목록 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">예산 상세</h3>
        <div className="space-y-4">
          {filteredBudgets.map((budget) => {
            const status = getBudgetStatus(budget.allocated, budget.spent)
            const percentage = (budget.spent / budget.allocated) * 100
            
            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{budget.category}</h4>
                    {budget.projectName && (
                      <p className="text-sm text-gray-600">{budget.projectName}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                    {status.status === 'over' ? '초과' : status.status === 'warning' ? '주의' : '안전'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">할당 예산</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(budget.allocated)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">사용 예산</p>
                    <p className="font-semibold text-red-600">{formatCurrency(budget.spent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">잔여 예산</p>
                    <p className={`font-semibold ${budget.allocated - budget.spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budget.allocated - budget.spent)}
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {percentage.toFixed(1)}% 사용
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 예산 추가 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">새 예산 추가</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={newBudget.category}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">선택하세요</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">할당 예산</label>
                  <input
                    type="number"
                    value={newBudget.allocated}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, allocated: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기간</label>
                  <select
                    value={newBudget.period}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, period: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="monthly">월별</option>
                    <option value="quarterly">분기별</option>
                    <option value="yearly">연별</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                    <input
                      type="date"
                      value={newBudget.startDate}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                    <input
                      type="date"
                      value={newBudget.endDate}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 btn btn-secondary"
                  >
                    취소
                  </button>
                  <button type="submit" className="flex-1 btn btn-primary">
                    추가
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}