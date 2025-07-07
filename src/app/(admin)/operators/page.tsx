'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import chatAssignmentService, { OperatorStatus } from '@/lib/chat-assignment'

export default function OperatorsManagementPage() {
  const { user, userProfile } = useAuth()
  const [operators, setOperators] = useState<OperatorStatus[]>([])
  const [newOperator, setNewOperator] = useState({ name: '', maxChats: 5 })
  const [showAddForm, setShowAddForm] = useState(false)

  // 관리자 권한 체크
  if (userProfile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600">이 페이지는 관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    // 운영자 목록 구독
    const unsubscribe = chatAssignmentService.subscribeToOperators((operatorsList) => {
      setOperators(operatorsList)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleAddOperator = async () => {
    if (!newOperator.name.trim()) return

    try {
      // 실제로는 사용자를 생성하고 운영자 권한을 부여해야 함
      // 여기서는 임시로 운영자 상태만 생성
      const operatorId = `operator_${Date.now()}`
      await chatAssignmentService.updateOperatorStatus(operatorId, {
        id: operatorId,
        name: newOperator.name,
        isOnline: false,
        isAvailable: false,
        activeChats: 0,
        maxChats: newOperator.maxChats
      })

      setNewOperator({ name: '', maxChats: 5 })
      setShowAddForm(false)
      alert('운영자가 추가되었습니다.')
    } catch (error) {
      console.error('Error adding operator:', error)
      alert('운영자 추가에 실패했습니다.')
    }
  }

  const handleUpdateMaxChats = async (operatorId: string, maxChats: number) => {
    try {
      await chatAssignmentService.updateOperatorStatus(operatorId, { maxChats })
      alert('최대 채팅 수가 업데이트되었습니다.')
    } catch (error) {
      console.error('Error updating max chats:', error)
      alert('업데이트에 실패했습니다.')
    }
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return '기록 없음'
    
    const date = new Date(lastSeen)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">운영자 관리</h1>
        <p className="text-gray-600">채팅 상담을 담당하는 운영자들을 관리합니다.</p>
      </div>

      {/* 운영자 추가 버튼 */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          + 새 운영자 추가
        </button>
      </div>

      {/* 운영자 추가 폼 */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">새 운영자 추가</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                운영자 이름
              </label>
              <input
                type="text"
                value={newOperator.name}
                onChange={(e) => setNewOperator({ ...newOperator, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 동시 채팅 수
              </label>
              <input
                type="number"
                value={newOperator.maxChats}
                onChange={(e) => setNewOperator({ ...newOperator, maxChats: parseInt(e.target.value) || 1 })}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewOperator({ name: '', maxChats: 5 })
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
            <button
              onClick={handleAddOperator}
              disabled={!newOperator.name.trim()}
              className="btn btn-primary"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* 운영자 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">운영자 목록</h3>
        </div>
        
        {operators.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            등록된 운영자가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    운영자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    활성 채팅
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최대 채팅 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마지막 접속
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {operators.map((operator) => (
                  <tr key={operator.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {(operator.name || operator.displayName || operator.email || 'O').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {operator.name || operator.displayName || operator.email || '운영자'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {operator.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          operator.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm text-gray-900">
                          {operator.isOnline ? '온라인' : '오프라인'}
                        </span>
                        {operator.isOnline && (
                          <span className="text-sm text-gray-500">
                            ({operator.isAvailable ? '상담 가능' : '상담 불가'})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {operator.activeChats}개
                      </div>
                      <div className="text-sm text-gray-500">
                        진행 중
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={operator.maxChats}
                        onChange={(e) => handleUpdateMaxChats(operator.id, parseInt(e.target.value) || 1)}
                        min="1"
                        max="20"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastSeen(operator.lastSeen)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-primary hover:text-primary-dark">
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">전체 운영자</div>
          <div className="text-2xl font-bold text-gray-900">{operators.length}명</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">온라인 운영자</div>
          <div className="text-2xl font-bold text-green-600">
            {operators.filter(op => op.isOnline).length}명
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">진행 중인 채팅</div>
          <div className="text-2xl font-bold text-blue-600">
            {operators.reduce((sum, op) => sum + op.activeChats, 0)}개
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">평균 처리 채팅</div>
          <div className="text-2xl font-bold text-purple-600">
            {operators.length > 0 
              ? (operators.reduce((sum, op) => sum + op.activeChats, 0) / operators.length).toFixed(1)
              : 0
            }개
          </div>
        </div>
      </div>
    </div>
  )
}