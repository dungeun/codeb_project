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
      if (message.senderId === user.uid) return // 자신의 메시지는 알림 제외

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
      if (joinedUser.id === user.uid) return

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
      if (leftUser.id === user.uid) return

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
      if (fileMessage.senderId === user.uid) return

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
      if (userId === user.uid) return

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

  const addNotification = async (notification: ChatNotification) => {
    if (!isEnabled) return

    // 헤더 알림 시스템에 통합
    try {
      const notificationService = (await import('@/services/notification-service')).default
      await notificationService.createNotification({
        userId: user!.uid,
        type: 'info',
        title: notification.title,
        message: notification.content,
        link: `/chat/${notification.roomId}`
      })
    } catch (error) {
      console.error('Failed to create notification:', error)
    }

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


  return (
    <>
      {/* 채팅 알림은 react-hot-toast로만 표시, 헤더의 알림 시스템과 통합 */}
    </>
  )
}