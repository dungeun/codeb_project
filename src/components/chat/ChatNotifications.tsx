'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import socketService from '@/lib/socket'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'

interface ChatNotification {
  id: string
  type: 'message' | 'mention' | 'join' | 'leave' | 'file' | 'screen_share'
  title: string
  content: string
  roomId: string
  roomName: string
  senderId: string
  senderName: string
  timestamp: Date
  read: boolean
}

interface ChatNotificationsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export default function ChatNotifications({ 
  position = 'top-right' 
}: ChatNotificationsProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<ChatNotification[]>([])
  const [isEnabled, setIsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    if (!user) return

    // 브라우저 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Socket 이벤트 리스너
    socketService.on('new-message', (message) => {
      if (message.senderId === user.id) return // 자신의 메시지는 알림 제외

      const notification: ChatNotification = {
        id: `notif-${Date.now()}`,
        type: 'message',
        title: `새 메시지 - ${message.senderName}`,
        content: message.content,
        roomId: message.roomId || 'unknown',
        roomName: message.roomName || '채팅방',
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: new Date(message.timestamp),
        read: false
      }

      addNotification(notification)
    })

    socketService.on('user-joined', ({ user: joinedUser, roomId, roomName }) => {
      if (joinedUser.id === user.id) return

      const notification: ChatNotification = {
        id: `notif-${Date.now()}`,
        type: 'join',
        title: `${joinedUser.name}님이 참여했습니다`,
        content: `${roomName}에 참여했습니다`,
        roomId,
        roomName: roomName || '채팅방',
        senderId: joinedUser.id,
        senderName: joinedUser.name,
        timestamp: new Date(),
        read: false
      }

      addNotification(notification)
    })

    socketService.on('user-left', ({ user: leftUser, roomId, roomName }) => {
      if (leftUser.id === user.id) return

      const notification: ChatNotification = {
        id: `notif-${Date.now()}`,
        type: 'leave',
        title: `${leftUser.name}님이 나갔습니다`,
        content: `${roomName}에서 나갔습니다`,
        roomId,
        roomName: roomName || '채팅방',
        senderId: leftUser.id,
        senderName: leftUser.name,
        timestamp: new Date(),
        read: false
      }

      addNotification(notification)
    })

    socketService.on('new-file', (fileMessage) => {
      if (fileMessage.senderId === user.id) return

      const notification: ChatNotification = {
        id: `notif-${Date.now()}`,
        type: 'file',
        title: `파일 공유 - ${fileMessage.senderName}`,
        content: `${fileMessage.file.name} 파일을 공유했습니다`,
        roomId: fileMessage.roomId || 'unknown',
        roomName: fileMessage.roomName || '채팅방',
        senderId: fileMessage.senderId,
        senderName: fileMessage.senderName,
        timestamp: new Date(fileMessage.timestamp),
        read: false
      }

      addNotification(notification)
    })

    socketService.on('screen-share-started', ({ userId, userName, roomId, roomName }) => {
      if (userId === user.id) return

      const notification: ChatNotification = {
        id: `notif-${Date.now()}`,
        type: 'screen_share',
        title: `화면 공유 시작`,
        content: `${userName}님이 화면 공유를 시작했습니다`,
        roomId,
        roomName: roomName || '채팅방',
        senderId: userId,
        senderName: userName,
        timestamp: new Date(),
        read: false
      }

      addNotification(notification)
    })

    return () => {
      socketService.off('new-message')
      socketService.off('user-joined')
      socketService.off('user-left')
      socketService.off('new-file')
      socketService.off('screen-share-started')
    }
  }, [user])

  const addNotification = (notification: ChatNotification) => {
    if (!isEnabled) return

    // 인앱 알림 추가
    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // 최대 5개 유지

    // 브라우저 알림
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification(notification.title, {
        body: notification.content,
        icon: '/favicon.ico',
        tag: notification.roomId,
        requireInteraction: false
      })
    }

    // 토스트 알림
    toast(notification.content, {
      icon: getNotificationIcon(notification.type),
      duration: 4000,
      position: 'top-right'
    })

    // 사운드 재생
    if (soundEnabled) {
      playNotificationSound(notification.type)
    }

    // 자동 제거 (10초 후)
    setTimeout(() => {
      removeNotification(notification.id)
    }, 10000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getNotificationIcon = (type: ChatNotification['type']) => {
    switch (type) {
      case 'message': return '💬'
      case 'mention': return '🔔'
      case 'join': return '👋'
      case 'leave': return '👋'
      case 'file': return '📎'
      case 'screen_share': return '🖥️'
      default: return '📢'
    }
  }

  const getNotificationColor = (type: ChatNotification['type']) => {
    switch (type) {
      case 'message': return 'border-blue-200 bg-blue-50'
      case 'mention': return 'border-red-200 bg-red-50'
      case 'join': return 'border-green-200 bg-green-50'
      case 'leave': return 'border-gray-200 bg-gray-50'
      case 'file': return 'border-purple-200 bg-purple-50'
      case 'screen_share': return 'border-orange-200 bg-orange-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const playNotificationSound = (type: ChatNotification['type']) => {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(e => {
        // 자동재생 정책으로 인한 에러 무시
        console.log('알림음 재생 실패:', e)
      })
    } catch (error) {
      console.log('알림음 파일을 찾을 수 없습니다')
    }
  }

  const getPositionClass = () => {
    switch (position) {
      case 'top-left': return 'top-4 left-4'
      case 'top-right': return 'top-4 right-4'
      case 'bottom-left': return 'bottom-4 left-4'
      case 'bottom-right': return 'bottom-4 right-4'
      default: return 'top-4 right-4'
    }
  }

  return (
    <>
      {/* 알림 설정 버튼 */}
      <div className="fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`p-2 rounded-lg transition-colors ${
            isEnabled 
              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={isEnabled ? '알림 켜짐' : '알림 꺼짐'}
        >
          {isEnabled ? '🔔' : '🔕'}
        </button>
      </div>

      {/* 알림 목록 */}
      <div className={`fixed ${getPositionClass()} w-80 z-50 space-y-2`}>
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.8 }}
              className={`
                p-4 rounded-lg border-2 shadow-lg cursor-pointer
                ${getNotificationColor(notification.type)}
                ${notification.read ? 'opacity-60' : ''}
              `}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {notification.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {notification.roomName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeNotification(notification.id)
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 모두 지우기 버튼 */}
        {notifications.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={clearAll}
            className="w-full p-2 text-sm text-gray-600 hover:text-gray-900 transition-colors text-center"
          >
            모든 알림 지우기
          </motion.button>
        )}
      </div>
    </>
  )
}