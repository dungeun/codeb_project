'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import { useAuth } from '@/lib/auth-context'
import { database } from '@/lib/firebase'
import { ref, push, onValue, serverTimestamp, set, off } from 'firebase/database'

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  preview?: string
  url?: string
}

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  timestamp: Date
  read: boolean
  files?: AttachedFile[]
}

export default function ChatPage() {
  const { user, userProfile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRoomId = 'demo-room' // 실제로는 프로젝트별 채팅방 ID

  useEffect(() => {
    if (!user) return

    // Firebase 실시간 메시지 리스닝 (실제 Firebase 연결 시 사용)
    // const messagesRef = ref(database, `chats/${chatRoomId}/messages`)
    // const unsubscribe = onValue(messagesRef, (snapshot) => {
    //   const data = snapshot.val()
    //   if (data) {
    //     const messageList = Object.entries(data).map(([key, value]: any) => ({
    //       id: key,
    //       ...value,
    //       timestamp: new Date(value.timestamp)
    //     }))
    //     setMessages(messageList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))
    //   }
    // })

    // Mock 데이터
    setMessages([
      {
        id: '1',
        content: '안녕하세요! 프로젝트 진행 상황을 확인하러 왔습니다.',
        senderId: user.id,
        senderName: user.name,
        timestamp: new Date(Date.now() - 3600000),
        read: true,
      },
      {
        id: '2',
        content: '안녕하세요! 현재 개발 단계 50% 진행되었습니다. 메인 페이지 디자인이 완료되었고, 백엔드 API 개발 중입니다.',
        senderId: 'admin',
        senderName: '담당 매니저',
        timestamp: new Date(Date.now() - 3000000),
        read: true,
      },
      {
        id: '3',
        content: '좋습니다! 예상 완료일은 언제인가요?',
        senderId: user.id,
        senderName: user.name,
        timestamp: new Date(Date.now() - 2400000),
        read: true,
      },
      {
        id: '4',
        content: '현재 진행 속도로는 2주 내 완료 예정입니다. 테스트까지 포함하면 3주 정도 예상됩니다.',
        senderId: 'admin',
        senderName: '담당 매니저',
        timestamp: new Date(Date.now() - 1800000),
        read: false,
      },
    ])

    // 온라인 사용자 상태
    setOnlineUsers(['admin'])

    // Cleanup
    return () => {
      // off(messagesRef)
    }
  }, [user, chatRoomId])

  // 메시지 전송
  const handleSendMessage = async (content: string, files?: AttachedFile[]) => {
    if (!user || !userProfile) return

    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: user.uid,
      senderName: userProfile.displayName,
      timestamp: new Date(),
      read: false,
      files: files?.map(file => ({
        ...file,
        url: file.preview || '#' // Mock URL
      }))
    }

    // 낙관적 업데이트
    setMessages(prev => [...prev, newMessage])

    // Firebase에 메시지 저장 (실제 구현)
    // try {
    //   const messagesRef = ref(database, `chats/${chatRoomId}/messages`)
    //   await push(messagesRef, {
    //     content,
    //     senderId: user.id,
    //     senderName: user.name,
    //     timestamp: serverTimestamp(),
    //     read: false
    //   })
    // } catch (error) {
    //   console.error('메시지 전송 실패:', error)
    // }

    // Mock 응답 (1초 후)
    setTimeout(() => {
      const response: Message = {
        id: `response-${Date.now()}`,
        content: '메시지를 확인했습니다. 곧 답변 드리겠습니다.',
        senderId: 'admin',
        senderName: '담당 매니저',
        timestamp: new Date(),
        read: false,
      }
      setMessages(prev => [...prev, response])
    }, 1000)
  }

  // 타이핑 상태 업데이트
  const handleTyping = (typing: boolean) => {
    // Firebase에 타이핑 상태 업데이트
    // const typingRef = ref(database, `chats/${chatRoomId}/typing/${user?.id}`)
    // set(typingRef, typing ? serverTimestamp() : null)
    
    setIsTyping(typing)
  }

  // 메시지 목록 하단으로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm">
        {/* 채팅 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">프로젝트 채팅</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>담당 매니저 온라인</span>
              </div>
            </div>
            
            <button className="text-gray-400 hover:text-gray-600">
              ⚙️
            </button>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.uid}
              />
            ))}
          </AnimatePresence>
          
          {/* 타이핑 인디케이터 */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <span>담당 매니저가 입력 중</span>
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 */}
        <ChatInput 
          onSend={handleSendMessage}
          onTyping={handleTyping}
        />
      </div>

      {/* 사이드 패널 (파일, 정보 등) */}
      <div className="w-80 ml-4 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">채팅 정보</h3>
        
        <div className="space-y-4">
          {/* 참여자 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">참여자</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                  {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium">{userProfile?.displayName || user?.email || '사용자'}</p>
                  <p className="text-sm text-gray-500">
                    {userProfile?.role === 'admin' ? '관리자' : 
                     userProfile?.role === 'customer' ? '고객' : '팀원'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                  담
                </div>
                <div>
                  <p className="font-medium">담당 매니저</p>
                  <p className="text-sm text-gray-500">관리자</p>
                </div>
              </div>
            </div>
          </div>

          {/* 공유 파일 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">공유 파일</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">프로젝트 기획서.pdf</p>
                  <p className="text-xs text-gray-500">2.5 MB</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <span className="text-2xl">🖼️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">메인페이지 디자인.png</p>
                  <p className="text-xs text-gray-500">5.1 MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}