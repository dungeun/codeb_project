'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import socketService from '@/lib/socket'
import { useAuth } from '@/lib/auth-context'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface Participant {
  id: string
  name: string
  role: string
  status: 'online' | 'offline'
}

interface ChatRoom {
  id: string
  name: string
  participants: Participant[]
}

interface MultiChatRoomProps {
  roomId: string
  roomName: string
}

export default function MultiChatRoom({ roomId, roomName }: MultiChatRoomProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())
  const [isScreenSharing, setIsScreenSharing] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    if (!user) return

    // Socket 연결
    const socket = socketService.connect({
      id: user.id,
      name: user.name,
      role: user.role,
    })

    // 채팅방 참여
    socketService.joinRoom(roomId)

    // 이벤트 리스너 등록
    socketService.on('room-messages', (messages) => {
      setMessages(messages)
    })

    socketService.on('room-participants', (participants) => {
      setParticipants(participants)
    })

    socketService.on('new-message', (message) => {
      setMessages(prev => [...prev, message])
    })

    socketService.on('user-joined', ({ user, timestamp }) => {
      console.log(`${user.name} joined at ${timestamp}`)
    })

    socketService.on('user-left', ({ user, timestamp }) => {
      console.log(`${user.name} left at ${timestamp}`)
    })

    socketService.on('user-typing', ({ userId, userName, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => new Map(prev).set(userId, userName))
        
        // 기존 타임아웃 클리어
        if (typingTimeoutRef.current.has(userId)) {
          clearTimeout(typingTimeoutRef.current.get(userId))
        }
        
        // 3초 후 타이핑 상태 제거
        const timeout = setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev)
            newMap.delete(userId)
            return newMap
          })
        }, 3000)
        
        typingTimeoutRef.current.set(userId, timeout)
      } else {
        setTypingUsers(prev => {
          const newMap = new Map(prev)
          newMap.delete(userId)
          return newMap
        })
      }
    })

    socketService.on('screen-share-started', ({ userId }) => {
      setIsScreenSharing(userId)
    })

    socketService.on('screen-share-stopped', () => {
      setIsScreenSharing(null)
    })

    // Cleanup
    return () => {
      socketService.off('room-messages')
      socketService.off('room-participants')
      socketService.off('new-message')
      socketService.off('user-joined')
      socketService.off('user-left')
      socketService.off('user-typing')
      socketService.off('screen-share-started')
      socketService.off('screen-share-stopped')
    }
  }, [user, roomId])

  // 메시지 전송
  const handleSendMessage = (content: string) => {
    socketService.sendMessage(roomId, { content })
  }

  // 타이핑 상태
  const handleTyping = (isTyping: boolean) => {
    socketService.setTyping(roomId, isTyping)
  }

  // 화면 공유
  const toggleScreenShare = async () => {
    if (isScreenSharing === user?.id) {
      // 화면 공유 중지
      socketService.stopScreenShare(roomId)
      setIsScreenSharing(null)
    } else {
      // 화면 공유 시작
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
        
        socketService.startScreenShare(roomId)
        
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          socketService.stopScreenShare(roomId)
          setIsScreenSharing(null)
        })
      } catch (error) {
        console.error('화면 공유 실패:', error)
      }
    }
  }

  // 메시지 목록 하단으로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 타이핑 중인 사용자 목록
  const typingUsersList = Array.from(typingUsers.values())

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm">
        {/* 채팅 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{roomName}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{participants.length}명 참여 중</span>
                {isScreenSharing && (
                  <span className="text-primary">
                    • {participants.find(p => p.id === isScreenSharing)?.name}님이 화면 공유 중
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={toggleScreenShare}
                className={`p-2 rounded-lg transition-colors ${
                  isScreenSharing === user?.id 
                    ? 'bg-red-100 text-red-600' 
                    : 'hover:bg-gray-100'
                }`}
                title="화면 공유"
              >
                🖥️
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg" title="설정">
                ⚙️
              </button>
            </div>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
              />
            ))}
          </AnimatePresence>
          
          {/* 타이핑 인디케이터 */}
          {typingUsersList.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm text-gray-500 p-2"
            >
              <span>
                {typingUsersList.length === 1 
                  ? `${typingUsersList[0]}님이 입력 중...`
                  : `${typingUsersList.join(', ')}님이 입력 중...`
                }
              </span>
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

      {/* 참여자 목록 */}
      <div className="w-64 ml-4 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">참여자</h3>
        
        <div className="space-y-3">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-3">
              <div className="relative">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-white font-medium
                  ${participant.role === 'admin' ? 'bg-primary' : 'bg-gray-400'}
                `}>
                  {participant.name.charAt(0)}
                </div>
                {participant.status === 'online' && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{participant.name}</p>
                <p className="text-xs text-gray-500">
                  {participant.role === 'admin' ? '관리자' : 
                   participant.role === 'customer' ? '고객' : '팀원'}
                </p>
              </div>
              {participant.id === user?.id && (
                <span className="text-xs text-gray-400">(나)</span>
              )}
            </div>
          ))}
        </div>

        {/* 빠른 액션 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">빠른 액션</h4>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors">
              📎 파일 공유
            </button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors">
              📅 일정 공유
            </button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors">
              📋 작업 할당
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}