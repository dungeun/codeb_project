'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import { useAuth } from '@/lib/auth-context'
import { database } from '@/lib/firebase'
import { ref, push, onValue, serverTimestamp, set, off, get } from 'firebase/database'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
  type?: 'text' | 'file' | 'image' | 'system'
  edited?: boolean
  editedAt?: Date
}

interface ChatRoom {
  id: string
  name: string
  participants: string[]
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount?: number
  type: 'direct' | 'group' | 'support'
  projectId?: string
  createdAt: Date
}

function ChatPageContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null)
  const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({})
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  
  const roomId = searchParams.get('room') || ''

  // 채팅방 목록 가져오기
  useEffect(() => {
    if (!user || !userProfile) return

    const chatRoomsRef = ref(database, 'chatRooms')
    const unsubscribeChatRooms = onValue(chatRoomsRef, (snapshot) => {
      const data = snapshot.val() || {}
      const rooms = Object.entries(data)
        .map(([id, room]: [string, any]) => ({
          id,
          ...room,
          lastMessageTime: room.lastMessageTime ? new Date(room.lastMessageTime) : null,
          createdAt: new Date(room.createdAt)
        }))
        .filter((room: ChatRoom) => 
          room.participants.includes(user.uid) ||
          room.type === 'support' ||
          userProfile.role === 'admin'
        )
        .sort((a, b) => {
          const aTime = a.lastMessageTime?.getTime() || a.createdAt.getTime()
          const bTime = b.lastMessageTime?.getTime() || b.createdAt.getTime()
          return bTime - aTime
        })
      
      setChatRooms(rooms)
      setLoading(false)
    })

    // 온라인 사용자 상태 감지
    const onlineRef = ref(database, 'users')
    const unsubscribeOnline = onValue(onlineRef, (snapshot) => {
      const users = snapshot.val() || {}
      const onlineUserIds = Object.entries(users)
        .filter(([_, user]: [string, any]) => user.isOnline)
        .map(([uid]) => uid)
      setOnlineUsers(onlineUserIds)
    })

    return () => {
      unsubscribeChatRooms()
      unsubscribeOnline()
    }
  }, [user, userProfile])

  // 특정 채팅방 메시지 가져오기
  useEffect(() => {
    if (!roomId || !user) return

    const messagesRef = ref(database, `messages/${roomId}`)
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {}
      const messageList = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        ...value,
        timestamp: new Date(value.timestamp)
      }))
      setMessages(messageList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))
      
      // 읽지 않은 메시지 읽음 처리
      Object.entries(data).forEach(([msgId, msg]: [string, any]) => {
        if (!msg.read && msg.senderId !== user.uid) {
          set(ref(database, `messages/${roomId}/${msgId}/read`), true)
        }
      })
    })

    // 현재 채팅방 정보 가져오기
    const currentRoomRef = ref(database, `chatRooms/${roomId}`)
    get(currentRoomRef).then((snapshot) => {
      if (snapshot.exists()) {
        setCurrentRoom({
          id: roomId,
          ...snapshot.val(),
          lastMessageTime: snapshot.val().lastMessageTime ? new Date(snapshot.val().lastMessageTime) : null,
          createdAt: new Date(snapshot.val().createdAt)
        })
      }
    })

    // 타이핑 상태 감지
    const typingRef = ref(database, `typing/${roomId}`)
    const unsubscribeTyping = onValue(typingRef, (snapshot) => {
      const typingData = snapshot.val() || {}
      const typingUsers: { [key: string]: boolean } = {}
      
      Object.entries(typingData).forEach(([uid, timestamp]: [string, any]) => {
        if (uid !== user.uid && timestamp) {
          const typingTime = new Date(timestamp).getTime()
          const now = Date.now()
          // 3초 이내에 타이핑한 경우만 표시
          if (now - typingTime < 3000) {
            typingUsers[uid] = true
          }
        }
      })
      
      setIsTyping(typingUsers)
    })

    return () => {
      unsubscribeMessages()
      unsubscribeTyping()
    }
  }, [roomId, user])

  // 메시지 전송
  const handleSendMessage = async (content: string, files?: AttachedFile[]) => {
    if (!user || !userProfile || !roomId) return

    try {
      const messagesRef = ref(database, `messages/${roomId}`)
      const newMessageRef = push(messagesRef)
      
      await set(newMessageRef, {
        content,
        senderId: user.uid,
        senderName: userProfile.displayName || user.email,
        timestamp: serverTimestamp(),
        read: false,
        type: 'text',
        files: files?.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.preview || ''
        }))
      })

      // 채팅방 최신 메시지 업데이트
      await set(ref(database, `chatRooms/${roomId}/lastMessage`), content)
      await set(ref(database, `chatRooms/${roomId}/lastMessageTime`), serverTimestamp())
      
      // 활동 기록
      const activityRef = ref(database, 'activities')
      const newActivityRef = push(activityRef)
      await set(newActivityRef, {
        type: 'message',
        icon: '💬',
        title: '새 메시지',
        description: `${currentRoom?.name || '채팅방'}에서 메시지를 보냈습니다`,
        time: serverTimestamp(),
        userId: user.uid,
        userName: userProfile.displayName
      })
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      alert('메시지 전송에 실패했습니다.')
    }
  }

  // 타이핑 상태 업데이트
  const handleTyping = (typing: boolean) => {
    if (!user || !roomId) return
    
    const typingRef = ref(database, `typing/${roomId}/${user.uid}`)
    
    if (typing) {
      set(typingRef, serverTimestamp())
      
      // 3초 후 자동으로 타이핑 상태 제거
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        set(typingRef, null)
      }, 3000) as unknown as NodeJS.Timeout
    } else {
      set(typingRef, null)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  // 새 채팅방 생성
  const createNewChatRoom = async (name: string, type: 'direct' | 'group' | 'support', participants: string[]) => {
    if (!user || !userProfile) return

    try {
      const chatRoomsRef = ref(database, 'chatRooms')
      const newRoomRef = push(chatRoomsRef)
      const newRoomId = newRoomRef.key
      
      await set(newRoomRef, {
        name,
        type,
        participants: [...participants, user.uid],
        createdAt: serverTimestamp(),
        createdBy: user.uid
      })
      
      // 시스템 메시지 추가
      const messagesRef = ref(database, `messages/${newRoomId}`)
      const systemMessageRef = push(messagesRef)
      await set(systemMessageRef, {
        content: `${userProfile.displayName}님이 채팅방을 생성했습니다.`,
        senderId: 'system',
        senderName: '시스템',
        timestamp: serverTimestamp(),
        type: 'system',
        read: true
      })
      
      setShowNewChatModal(false)
      router.push(`/chat?room=${newRoomId}`)
    } catch (error) {
      console.error('채팅방 생성 실패:', error)
      alert('채팅방 생성에 실패했습니다.')
    }
  }

  // 메시지 목록 하단으로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* 채팅방 목록 */}
      <div className="w-80 bg-white rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">채팅</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="text-primary hover:text-primary-hover"
            >
              + 새 채팅
            </button>
          </div>
          
          <input
            type="text"
            placeholder="채팅방 검색..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chatRooms.length > 0 ? (
            chatRooms.map(room => (
              <Link
                key={room.id}
                href={`/chat?room=${room.id}`}
                className={`block p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                  roomId === room.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-gray-900">{room.name}</h3>
                  {room.lastMessageTime && (
                    <span className="text-xs text-gray-500">
                      {new Date(room.lastMessageTime).toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  )}
                </div>
                {room.lastMessage && (
                  <p className="text-sm text-gray-600 truncate">{room.lastMessage}</p>
                )}
                {room.unreadCount && room.unreadCount > 0 && (
                  <span className="inline-block mt-1 px-2 py-1 bg-primary text-white text-xs rounded-full">
                    {room.unreadCount}
                  </span>
                )}
              </Link>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">채팅방이 없습니다</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-2 text-primary hover:underline"
              >
                새 채팅 시작하기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 채팅 영역 */}
      {roomId && currentRoom ? (
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm">
          {/* 채팅 헤더 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{currentRoom.name}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {currentRoom.participants.filter(p => p !== user?.uid && onlineUsers.includes(p)).length > 0 ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>온라인</span>
                    </>
                  ) : (
                    <span>오프라인</span>
                  )}
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
            {Object.keys(isTyping).length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-gray-500 px-4 py-2"
              >
                <span>
                  {Object.keys(isTyping).length === 1 
                    ? '상대방이 입력 중' 
                    : `${Object.keys(isTyping).length}명이 입력 중`}
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
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-sm">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">채팅을 시작하세요</h3>
            <p className="text-gray-600">왼쪽에서 채팅방을 선택하거나 새로운 채팅을 시작하세요</p>
          </div>
        </div>
      )}

      {/* 사이드 패널 (파일, 정보 등) */}
      {roomId && currentRoom && (
        <div className="w-80 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">채팅 정보</h3>
          
          <div className="space-y-4">
            {/* 참여자 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">참여자 ({currentRoom.participants.length}명)</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {currentRoom.participants.map((participantId) => {
                  const isOnline = onlineUsers.includes(participantId)
                  const isCurrentUser = participantId === user?.uid
                  
                  return (
                    <div key={participantId} className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                          {isCurrentUser ? (userProfile?.displayName?.charAt(0) || 'U') : '사'}
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {isCurrentUser ? (userProfile?.displayName || '나') : '참여자'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isOnline ? '온라인' : '오프라인'}
                        </p>
                      </div>
                    </div>
                  )
                })}
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
          
          {/* 채팅방 나가기 */}
          <div className="mt-6 pt-6 border-t">
            <button className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              채팅방 나가기
            </button>
          </div>
        </div>
      )}

      {/* 새 채팅방 생성 모달 */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">새 채팅방 만들기</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const name = formData.get('name') as string
              const type = formData.get('type') as 'direct' | 'group' | 'support'
              
              createNewChatRoom(name, type, [])
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    채팅방 이름
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="채팅방 이름을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    채팅방 유형
                  </label>
                  <select
                    name="type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="direct">1:1 채팅</option>
                    <option value="group">그룹 채팅</option>
                    <option value="support">고객 지원</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}