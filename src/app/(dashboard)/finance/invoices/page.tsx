'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Invoice } from '@/types/finance'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

// Mock 청구서 데이터
const mockInvoices: Invoice[] = [
  {
    id: '1',
    projectId: '1',
    projectName: '웹사이트 리뉴얼',
    clientId: '1',
    clientName: '(주)테크컴퍼니',
    invoiceNumber: 'INV-2024-001',
    issueDate: new Date('2024-01-05'),
    dueDate: new Date('2024-02-05'),
    status: 'paid',
    items: [
      { id: '1-1', description: '웹사이트 디자인', quantity: 1, unitPrice: 30000000, amount: 30000000 },
      { id: '1-2', description: '프론트엔드 개발', quantity: 1, unitPrice: 40000000, amount: 40000000 },
      { id: '1-3', description: '백엔드 개발', quantity: 1, unitPrice: 50000000, amount: 50000000 },
    ],
    subtotal: 120000000,
    tax: 12000000,
    total: 132000000,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    projectId: '2',
    projectName: '모바일 앱 개발',
    clientId: '2',
    clientName: '스타트업A',
    invoiceNumber: 'INV-2024-002',
    issueDate: new Date('2024-01-10'),
    dueDate: new Date('2024-02-10'),
    status: 'sent',
    items: [
      { id: '2-1', description: 'iOS 앱 개발', quantity: 1, unitPrice: 45000000, amount: 45000000 },
      { id: '2-2', description: 'Android 앱 개발', quantity: 1, unitPrice: 45000000, amount: 45000000 },
    ],
    subtotal: 90000000,
    tax: 9000000,
    total: 99000000,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    projectId: '3',
    projectName: '이커머스 플랫폼',
    clientId: '3',
    clientName: '온라인몰B',
    invoiceNumber: 'INV-2024-003',
    issueDate: new Date('2023-12-20'),
    dueDate: new Date('2024-01-20'),
    status: 'overdue',
    items: [
      { id: '3-1', description: '플랫폼 개발', quantity: 1, unitPrice: 100000000, amount: 100000000 },
      { id: '3-2', description: '결제 시스템 연동', quantity: 1, unitPrice: 20000000, amount: 20000000 },
      { id: '3-3', description: '관리자 패널', quantity: 1, unitPrice: 30000000, amount: 30000000 },
    ],
    subtotal: 150000000,
    tax: 15000000,
    total: 165000000,
    createdAt: new Date('2023-12-20'),
    updatedAt: new Date('2023-12-20'),
  },
]

const statusConfig: Record<Invoice['status'], { label: string; color: string; icon: string }> = {
  draft: { label: '임시저장', color: 'bg-gray-100 text-gray-700', icon: '📝' },
  sent: { label: '발송됨', color: 'bg-blue-100 text-blue-700', icon: '✉️' },
  paid: { label: '결제완료', color: 'bg-green-100 text-green-700', icon: '✅' },
  overdue: { label: '연체', color: 'bg-red-100 text-red-700', icon: '⚠️' },
  cancelled: { label: '취소됨', color: 'bg-gray-100 text-gray-500', icon: '❌' },
}

export default function InvoicesPage() {
  const [invoices] = useState<Invoice[]>(mockInvoices)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 청구서 필터링
  const filteredInvoices = filterStatus === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filterStatus)

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 통계 계산
  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter(inv => inv.status === 'paid').length,
    pending: invoices.filter(inv => inv.status === 'sent').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/finance" className="hover:text-primary">
              재무 관리
            </Link>
            <span>/</span>
            <span>청구서 관리</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">청구서 관리</h1>
        </div>
        
        <button className="btn btn-primary">
          + 새 청구서
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 청구서</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}건</p>
            </div>
            <span className="text-3xl">📄</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            총 {formatCurrency(stats.totalAmount)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">결제 완료</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}건</p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">대기 중</p>
              <p className="text-2xl font-bold text-blue-600">{stats.pending}건</p>
            </div>
            <span className="text-3xl">⏳</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">연체</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}건</p>
            </div>
            <span className="text-3xl">⚠️</span>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">상태:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 청구서 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                청구서 번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                고객
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                프로젝트
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                발행일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                만기일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => {
              const status = statusConfig[invoice.status]
              return (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.clientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.projectName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {format(invoice.issueDate, 'yyyy-MM-dd', { locale: ko })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {format(invoice.dueDate, 'yyyy-MM-dd', { locale: ko })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button className="text-primary hover:text-primary-hover">
                        보기
                      </button>
                      {invoice.status === 'draft' && (
                        <button className="text-blue-600 hover:text-blue-700">
                          발송
                        </button>
                      )}
                      {invoice.status === 'sent' && (
                        <button className="text-green-600 hover:text-green-700">
                          결제확인
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-900">
                        다운로드
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}