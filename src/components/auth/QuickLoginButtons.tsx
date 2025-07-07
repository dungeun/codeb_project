'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface TestAccount {
  email: string
  password: string
  name: string
  role: string
  description: string
}

const testAccounts: TestAccount[] = [
  {
    email: 'customer@test.com',
    password: 'customer123!',
    name: '테스트 고객',
    role: 'customer',
    description: '고객 계정 (상담 요청)'
  },
  {
    email: 'admin@codeb.com',
    password: 'admin123!',
    name: '관리자',
    role: 'admin',
    description: '관리자 계정 (멀티 채팅)'
  },
  {
    email: 'manager@codeb.com',
    password: 'manager123!',
    name: '매니저',
    role: 'manager',
    description: '매니저 계정 (멀티 채팅)'
  },
  {
    email: 'support@codeb.com',
    password: 'support123!',
    name: '지원팀',
    role: 'team_member',
    description: '지원팀 계정 (멀티 채팅)'
  }
]

export default function QuickLoginButtons() {
  const { signIn, logout, userProfile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  const handleQuickLogin = async (account: TestAccount) => {
    setIsLoading(true)
    try {
      // 현재 로그인된 사용자가 있으면 로그아웃
      if (userProfile) {
        await logout()
        // 로그아웃 후 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // 새 계정으로 로그인
      await signIn(account.email, account.password)
      
      // 역할에 따라 적절한 페이지로 이동
      if (account.role === 'customer') {
        router.push('/support')
      } else {
        router.push('/chat/multi')
      }
    } catch (error) {
      console.error('Quick login failed:', error)
      alert('로그인 실패: ' + (error as any).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        title="테스트 계정 전환"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {/* 계정 전환 패널 */}
      {showPanel && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">테스트 계정 전환</h3>
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {userProfile && (
              <p className="text-sm text-gray-600 mt-1">
                현재: {userProfile.displayName} ({userProfile.role})
              </p>
            )}
          </div>

          <div className="p-2 max-h-96 overflow-y-auto">
            {testAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleQuickLogin(account)}
                disabled={isLoading || userProfile?.email === account.email}
                className={`w-full text-left p-3 rounded-lg transition-colors mb-1 ${
                  userProfile?.email === account.email
                    ? 'bg-blue-50 border border-blue-200 cursor-default'
                    : 'hover:bg-gray-50 border border-transparent'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {account.name}
                      {userProfile?.email === account.email && (
                        <span className="ml-2 text-xs text-blue-600">(현재)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{account.description}</div>
                    <div className="text-xs text-gray-400 mt-1">{account.email}</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    account.role === 'customer' ? 'bg-green-500' : 
                    account.role === 'admin' ? 'bg-red-500' : 
                    'bg-yellow-500'
                  }`} />
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600">
              💡 클릭하면 자동으로 로그인됩니다.<br />
              고객: 상담 요청 페이지로 이동<br />
              운영자: 멀티 채팅 페이지로 이동
            </p>
          </div>
        </div>
      )}

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">계정 전환 중...</span>
          </div>
        </div>
      )}
    </>
  )
}