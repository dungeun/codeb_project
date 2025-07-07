'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import chatService, { ChatRoom } from '@/lib/chat-service'
import ChatWindow from './ChatWindow'

interface Contact {
  id: string
  name: string
  role: string
  lastSeen: string
  isOnline: boolean
}

export default function ChatList() {
  const { user, userProfile } = useAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showNewChatModal, setShowNewChatModal] = useState(false)

  useEffect(() => {
    if (!user || !userProfile) return

    // 채팅방 목록 구독
    const unsubscribe = chatService.subscribeToUserChatRooms(
      user.uid,
      (rooms) => {
        setChatRooms(rooms)
      }
    )

    return unsubscribe
  }, [user, userProfile])

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find(id => id !== user?.uid) || ''
  }

  const formatLastMessageTime = (timestamp: number) => {
    const now = new Date()
    const messageDate = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 60 * 24) return `${Math.floor(diffInMinutes / 60)}시간 전`
    return messageDate.toLocaleDateString('ko-KR')
  }

  const getUnreadCount = (room: ChatRoom) => {
    return room.unreadCount[user?.uid || ''] || 0
  }

  const startNewChat = (contactId: string, contactName: string) => {
    setSelectedChat({ id: contactId, name: contactName })
    setShowNewChatModal(false)
  }

  // Mock 연락처 데이터 (실제로는 API에서 가져와야 함)
  const mockContacts: Contact[] = [
    {
      id: 'admin1',
      name: '관리자',
      role: 'admin',
      lastSeen: '온라인',
      isOnline: true
    },
    {
      id: 'manager1',
      name: '프로젝트 매니저',
      role: 'manager',
      lastSeen: '5분 전',
      isOnline: false
    },
    {
      id: 'dev1',
      name: '개발자',
      role: 'developer',
      lastSeen: '온라인',
      isOnline: true
    }
  ]

  return (
    <div className="flex h-full">
      {/* 채팅 목록 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">메시지</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* 채팅방 목록 */}
        <div className="flex-1 overflow-y-auto">
          {chatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>아직 대화가 없습니다.</p>
              <p className="text-sm mt-1">새 대화를 시작해보세요!</p>
            </div>
          ) : (
            chatRooms.map((room) => {
              const otherParticipant = getOtherParticipant(room)
              const unreadCount = getUnreadCount(room)
              
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedChat({ id: otherParticipant, name: `사용자 ${otherParticipant.slice(-4)}` })}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat?.id === otherParticipant ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                        {otherParticipant.charAt(0).toUpperCase()}
                      </div>
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          사용자 {otherParticipant.slice(-4)}
                        </h3>
                        {room.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(room.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      {room.lastMessage && (
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {room.lastMessage.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 채팅 창 */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow
            receiverId={selectedChat.id}
            receiverName={selectedChat.name}
            onClose={() => setSelectedChat(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium">대화를 선택해주세요</p>
              <p className="text-sm mt-1">왼쪽에서 대화를 선택하거나 새 대화를 시작하세요</p>
            </div>
          </div>
        )}
      </div>

      {/* 새 채팅 모달 */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">새 대화 시작</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              {mockContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => startNewChat(contact.id, contact.name)}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {contact.name.charAt(0)}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.role}</p>
                  </div>
                  <span className="text-xs text-gray-500">{contact.lastSeen}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}