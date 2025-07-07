'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Expense {
  id: string
  date: Date
  category: string
  description: string
  amount: number
  receiptUrl?: string
  projectId?: string
  projectName?: string
  createdBy: string
  status: 'pending' | 'approved' | 'rejected'
}

interface ExpenseTrackerProps {
  onAddExpense?: (expense: Omit<Expense, 'id' | 'status'>) => void
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    category: '사무용품',
    description: '프로젝트 회의용 화이트보드',
    amount: 180000,
    projectId: '1',
    projectName: '웹사이트 리뉴얼',
    createdBy: '김개발',
    status: 'approved'
  },
  {
    id: '2', 
    date: new Date('2024-01-20'),
    category: '교통비',
    description: '클라이언트 미팅 택시비',
    amount: 45000,
    projectId: '2',
    projectName: '모바일 앱 개발',
    createdBy: '이디자인',
    status: 'pending'
  },
  {
    id: '3',
    date: new Date('2024-01-22'),
    category: '소프트웨어',
    description: 'Adobe Creative Suite 구독',
    amount: 59000,
    createdBy: '박매니저',
    status: 'approved'
  }
]

const categories = [
  '사무용품', '교통비', '식비', '소프트웨어', '하드웨어', 
  '교육', '마케팅', '회의비', '숙박비', '기타'
]

export default function ExpenseTracker({ onAddExpense }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [newExpense, setNewExpense] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    description: '',
    amount: '',
    projectId: '',
    receiptFile: null as File | null
  })

  const filteredExpenses = expenses.filter(expense => {
    const categoryMatch = filterCategory === 'all' || expense.category === filterCategory
    const statusMatch = filterStatus === 'all' || expense.status === filterStatus
    return categoryMatch && statusMatch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const expense: Omit<Expense, 'id' | 'status'> = {
      date: new Date(newExpense.date),
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      createdBy: '현재 사용자' // 실제로는 인증된 사용자명
    }

    if (newExpense.projectId) {
      expense.projectId = newExpense.projectId
    }

    const newId = (expenses.length + 1).toString()
    setExpenses(prev => [{
      ...expense,
      id: newId,
      status: 'pending'
    }, ...prev])

    if (onAddExpense) {
      onAddExpense(expense)
    }

    setNewExpense({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      description: '',
      amount: '',
      projectId: '',
      receiptFile: null
    })
    setIsModalOpen(false)
  }

  const handleApprove = (id: string) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, status: 'approved' as const } : exp
    ))
  }

  const handleReject = (id: string) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, status: 'rejected' as const } : exp
    ))
  }

  const getStatusColor = (status: Expense['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'approved': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: Expense['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'approved': return '✅'
      case 'rejected': return '❌'
      default: return '📄'
    }
  }

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const approvedExpenses = filteredExpenses.filter(exp => exp.status === 'approved').reduce((sum, exp) => sum + exp.amount, 0)
  const pendingExpenses = filteredExpenses.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">지출 관리</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          + 지출 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 지출</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            </div>
            <span className="text-2xl">💰</span>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인된 지출</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(approvedExpenses)}</p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(pendingExpenses)}</p>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">전체</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">전체</option>
              <option value="pending">승인 대기</option>
              <option value="approved">승인됨</option>
              <option value="rejected">반려됨</option>
            </select>
          </div>
        </div>
      </div>

      {/* 지출 목록 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">날짜</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">카테고리</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">설명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">금액</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">프로젝트</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">작성자</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {format(expense.date, 'MM/dd', { locale: ko })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {expense.projectName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{expense.createdBy}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                      {getStatusIcon(expense.status)} {expense.status === 'pending' ? '대기' : expense.status === 'approved' ? '승인' : '반려'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {expense.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(expense.id)}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(expense.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          반려
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 지출 추가 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">새 지출 추가</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="지출 내역을 입력하세요"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                    min="0"
                    required
                  />
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