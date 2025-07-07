'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import ChatWindow from '@/components/chat/ChatWindow'
import { database } from '@/lib/firebase'
import { ref, get, set, onValue, push } from 'firebase/database'
import chatAssignment from '@/lib/chat-assignment'

interface AssignedOperator {
  uid: string
  name: string
  email: string
  status: 'online' | 'offline'
}

export default function CustomerSupportPage() {
  const { user, userProfile } = useAuth()
  const [assignedOperator, setAssignedOperator] = useState<AssignedOperator | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestStatus, setRequestStatus] = useState<'none' | 'waiting' | 'connected'>('none')

  useEffect(() => {
    if (!user) return

    // 기존 배정된 운영자 확인
    checkAssignedOperator()

    // 기존 배정 확인
    checkAssignedOperator()

    // 실시간으로 배정 상태 모니터링
    const assignmentRef = ref(database, `customerAssignments/${user.uid}`)
    const unsubscribe = onValue(assignmentRef, (snapshot) => {
      console.log('Assignment snapshot:', snapshot.exists(), snapshot.val())
      if (snapshot.exists()) {
        const assignment = snapshot.val()
        console.log('Realtime assignment update:', assignment)
        if (assignment.operatorId && assignment.status === 'active') {
          console.log('Loading operator info for:', assignment.operatorId)
          // 운영자 정보 가져오기
          loadOperatorInfo(assignment.operatorId)
          setRequestStatus('connected')
        } else if (assignment.status === 'completed') {
          // 상담이 종료됨
          console.log('Chat has been ended by operator')
          setRequestStatus('none')
          setAssignedOperator(null)
        }
      } else {
        // 할당이 삭제됨 (종료)
        console.log('Assignment removed - chat ended')
        setRequestStatus('none')
        setAssignedOperator(null)
      }
    })

    return () => unsubscribe()
  }, [user])

  const checkAssignedOperator = async () => {
    if (!user) return

    // 두 테이블 모두 확인
    const assignment = await chatAssignment.getAssignmentForCustomer(user.uid)
    console.log('Checking assignment from chatAssignments:', assignment)
    
    if (assignment) {
      console.log('Assignment details:', {
        status: assignment.status,
        operatorId: assignment.operatorId,
        operatorName: assignment.operatorName
      })
    }
    
    if (assignment && assignment.status === 'active' && assignment.operatorId) {
      await loadOperatorInfo(assignment.operatorId)
      setRequestStatus('connected')
      return
    }
    
    // customerAssignments에서도 확인
    const operator = await chatAssignment.getAssignedOperator(user.uid)
    console.log('Checking assigned operator from customerAssignments:', operator)
    if (operator) {
      setAssignedOperator({
        uid: operator.uid,
        name: operator.name || operator.displayName || operator.email,
        email: operator.email,
        status: operator.isOnline ? 'online' : 'offline'
      })
      setRequestStatus('connected')
    }
  }

  const loadOperatorInfo = async (operatorId: string) => {
    console.log('loadOperatorInfo called with:', operatorId)
    try {
      // 먼저 operators 테이블에서 찾기
      const operatorRef = ref(database, `operators/${operatorId}`)
      const operatorSnapshot = await get(operatorRef)
      
      if (operatorSnapshot.exists()) {
        const data = operatorSnapshot.val()
        setAssignedOperator({
          uid: operatorId,
          name: data.name || data.displayName || data.email || '운영자',
          email: data.email || '',
          status: data.isOnline ? 'online' : 'offline'
        })
        return
      }
      
      // operators에 없으면 users 테이블에서 찾기
      const userRef = ref(database, `users/${operatorId}`)
      const userSnapshot = await get(userRef)
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val()
        setAssignedOperator({
          uid: operatorId,
          name: userData.displayName || userData.email || '운영자',
          email: userData.email || '',
          status: userData.isOnline ? 'online' : 'offline'
        })
      }
    } catch (error) {
      console.error('Error loading operator info:', error)
    }
  }

  const requestChat = async () => {
    if (!user || !userProfile) return

    setIsRequesting(true)
    try {
      // 상담 요청 생성
      const requestRef = ref(database, 'chatRequests')
      await push(requestRef, {
        customerId: user.uid,
        customerName: userProfile.displayName,
        customerEmail: userProfile.email,
        message: '상담 요청',
        createdAt: new Date().toISOString(),
        status: 'waiting'
      })

      // 자동 배정 시도
      console.log('Attempting auto assignment for:', user.uid)
      const assigned = await chatAssignment.autoAssignOperatorToCustomer(user.uid)
      console.log('Auto assignment result:', assigned)
      if (assigned) {
        setRequestStatus('connected')
        // 배정된 운영자 정보 바로 가져오기
        checkAssignedOperator()
      } else {
        setRequestStatus('waiting')
      }
    } catch (error) {
      console.error('상담 요청 실패:', error)
      alert('상담 요청에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsRequesting(false)
    }
  }

  if (!user || !userProfile) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      {requestStatus === 'none' && (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">실시간 상담</h2>
            <p className="text-gray-600 mb-8">
              궁금한 사항이 있으신가요?<br />
              전문 상담원이 실시간으로 답변해드립니다.
            </p>
            
            <button
              onClick={requestChat}
              disabled={isRequesting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRequesting ? '요청 중...' : '상담 시작하기'}
            </button>
            
            <div className="mt-8 text-sm text-gray-500">
              <p>운영 시간: 평일 09:00 - 18:00</p>
              <p>주말 및 공휴일은 휴무입니다.</p>
            </div>
          </div>
        </div>
      )}

      {requestStatus === 'waiting' && (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">상담원 연결 중...</h3>
            <p className="text-gray-600">
              잠시만 기다려주세요.<br />
              곧 상담원이 연결됩니다.
            </p>
          </div>
        </div>
      )}

      {requestStatus === 'connected' && assignedOperator ? (
        <div className="h-full flex flex-col">
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {(assignedOperator.name || assignedOperator.email || 'O').charAt(0).toUpperCase()}
                  </div>
                  {assignedOperator.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{assignedOperator.name || assignedOperator.email || '운영자'}</h3>
                  <p className="text-sm text-gray-500">
                    {assignedOperator.status === 'online' ? '온라인' : '오프라인'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (confirm('상담을 종료하시겠습니까?')) {
                    chatAssignment.endChat(user.uid, assignedOperator.uid)
                    setRequestStatus('none')
                    setAssignedOperator(null)
                  }
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                상담 종료
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-gray-50">
            <ChatWindow
              receiverId={assignedOperator.uid}
              receiverName={assignedOperator.name || assignedOperator.email || '운영자'}
            />
          </div>
        </div>
      ) : requestStatus === 'connected' && !assignedOperator ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">운영자 정보를 불러오고 있습니다...</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}