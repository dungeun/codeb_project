'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'

interface Activity {
  id: string
  type: 'message' | 'file' | 'project' | 'task' | 'meeting'
  title: string
  description: string
  time: string
  user?: string
  icon: string
}

interface AIInsight {
  id: string
  type: 'suggestion' | 'warning' | 'info'
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'message',
    title: '새 메시지',
    description: '김개발님이 메시지를 보냈습니다',
    time: '5분 전',
    user: '김개발',
    icon: '💬'
  },
  {
    id: '2',
    type: 'file',
    title: '파일 업로드',
    description: '디자인_v2.pdf가 업로드되었습니다',
    time: '15분 전',
    user: '이디자인',
    icon: '📎'
  },
  {
    id: '3',
    type: 'project',
    title: '프로젝트 업데이트',
    description: '웹사이트 리뉴얼 진행률이 72%로 업데이트되었습니다',
    time: '1시간 전',
    icon: '📊'
  },
  {
    id: '4',
    type: 'task',
    title: '작업 완료',
    description: 'API 설계 문서 작성이 완료되었습니다',
    time: '2시간 전',
    user: '박기획',
    icon: '✅'
  },
  {
    id: '5',
    type: 'meeting',
    title: '미팅 일정',
    description: '내일 오후 2시 클라이언트 미팅이 예정되어 있습니다',
    time: '3시간 전',
    icon: '📅'
  }
]

const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    type: 'suggestion',
    title: '진행률 향상 제안',
    content: '현재 개발 속도로는 목표일보다 3일 늦어질 수 있습니다. 추가 리소스 투입을 고려해보세요.',
    priority: 'medium'
  },
  {
    id: '2',
    type: 'warning',
    title: '예산 초과 경고',
    content: '현재 지출 패턴을 유지할 경우 예산을 15% 초과할 가능성이 있습니다.',
    priority: 'high'
  },
  {
    id: '3',
    type: 'info',
    title: '품질 개선',
    content: '코드 리뷰 시간이 평균보다 30% 단축되었습니다. 좋은 성과입니다!',
    priority: 'low'
  }
]

interface RightSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'activity' | 'chat' | 'insights'>('activity')
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { id: '1', user: '김개발', message: '안녕하세요! 프로젝트 진행 상황 공유드립니다.', time: '14:30', isMe: false },
    { id: '2', user: '나', message: '감사합니다. 확인해보겠습니다.', time: '14:32', isMe: true },
    { id: '3', user: '이디자인', message: '디자인 수정사항 반영 완료했습니다.', time: '14:45', isMe: false }
  ])

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return
    
    const newMessage = {
      id: Date.now().toString(),
      user: '나',
      message: chatMessage,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    }
    
    setChatMessages([...chatMessages, newMessage])
    setChatMessage('')
  }

  const getInsightColor = (type: AIInsight['type'], priority: AIInsight['priority']) => {
    if (type === 'warning') return 'border-l-red-500 bg-red-50'
    if (type === 'suggestion') return 'border-l-blue-500 bg-blue-50'
    if (priority === 'high') return 'border-l-orange-500 bg-orange-50'
    return 'border-l-green-500 bg-green-50'
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'message': return '💬'
      case 'file': return '📎'
      case 'project': return '📊'
      case 'task': return '✅'
      case 'meeting': return '📅'
      default: return '📌'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* 사이드바 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col border-l"
          >
            {/* 헤더 */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">활동 패널</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* 탭 */}
              <div className="flex gap-1 bg-white rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'activity' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  최근 활동
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'chat' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  채팅
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'insights' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  AI 인사이트
                </button>
              </div>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'activity' && (
                <div className="p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">최근 활동</h4>
                  {mockActivities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>{activity.time}</span>
                          {activity.user && (
                            <>
                              <span>•</span>
                              <span>{activity.user}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  {/* 채팅 메시지 */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          msg.isMe 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {!msg.isMe && (
                            <p className="text-xs font-medium mb-1">{msg.user}</p>
                          )}
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.isMe ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 메시지 입력 */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage()
                          }
                        }}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim()}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          chatMessage.trim()
                            ? 'bg-primary text-white hover:bg-primary-hover'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        전송
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">AI 프로젝트 인사이트</h4>
                    <span className="text-xs text-gray-500">{mockAIInsights.length}개</span>
                  </div>
                  
                  {mockAIInsights.map((insight) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border-l-4 ${getInsightColor(insight.type, insight.priority)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-900">{insight.title}</h5>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                          insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {insight.priority === 'high' ? '높음' :
                           insight.priority === 'medium' ? '중간' : '낮음'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{insight.content}</p>
                      
                      <div className="flex gap-2 mt-3">
                        <button className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 transition-colors">
                          자세히
                        </button>
                        <button className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                          닫기
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* AI 도우미 */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <h5 className="text-sm font-medium text-gray-900">AI 도우미</h5>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      프로젝트 진행에 도움이 필요하시나요?
                    </p>
                    <button className="w-full px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover transition-colors">
                      AI와 상담하기
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>마지막 업데이트: 방금 전</span>
                <button className="text-primary hover:text-primary-hover">
                  새로고침
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}