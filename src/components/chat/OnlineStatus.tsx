'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import socketService from '@/lib/socket'
import { useAuth } from '@/lib/auth-context'

interface User {
  id: string
  name: string
  role: string
  status: 'online' | 'offline'
  lastSeen?: Date
}

interface OnlineStatusProps {
  compact?: boolean
}

export default function OnlineStatus({ compact = false }: OnlineStatusProps) {
  const { user, userProfile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!user || !userProfile) return

    // Socket 연결이 없다면 연결
    if (!socketService.getSocket()?.connected) {
      socketService.connect({
        id: user.uid,
        name: userProfile.displayName,
        role: userProfile.role
      })
    }

    // 온라인 사용자 목록 업데이트
    socketService.on('users-update', (users: User[]) => {
      setOnlineUsers(users.filter(u => u.status === 'online'))
    })

    return () => {
      socketService.off('users-update')
    }
  }, [user])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'border-red-400 bg-red-50'
      case 'team_member': return 'border-blue-400 bg-blue-50'
      case 'customer': return 'border-green-400 bg-green-50'
      default: return 'border-gray-400 bg-gray-50'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑'
      case 'team_member': return '⚡'
      case 'customer': return '👤'
      default: return '👤'
    }
  }

  if (compact) {
    return (
      <div className="fixed top-4 left-16 z-40">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 p-2 bg-white hover:bg-gray-50 rounded-lg shadow-sm border transition-colors"
        >
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium ${getRoleColor(user.role)}`}
                style={{ zIndex: 10 - index }}
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
            {onlineUsers.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium">
                +{onlineUsers.length - 3}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-600">
            {onlineUsers.length}명 온라인
          </span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border p-4 z-50"
            >
              <h3 className="font-semibold text-gray-900 mb-3">온라인 사용자</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${getRoleColor(user.role)}`}>
                        {user.name.charAt(0)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{getRoleIcon(user.role)}</span>
                        {user.role === 'admin' ? '관리자' : 
                         user.role === 'customer' ? '고객' : '팀원'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">온라인 사용자</h3>
        <span className="text-sm text-gray-600">{onlineUsers.length}명</span>
      </div>

      <div className="space-y-3">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👻</div>
            <p>현재 온라인인 사용자가 없습니다</p>
          </div>
        ) : (
          onlineUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${getRoleColor(user.role)}`}>
                  {user.name.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span>{getRoleIcon(user.role)}</span>
                  {user.role === 'admin' ? '관리자' : 
                   user.role === 'customer' ? '고객' : '팀원'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-xs text-gray-400">온라인</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 빠른 액션 */}
      {onlineUsers.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <button className="w-full btn btn-secondary text-sm">
            🎯 모든 사용자에게 알림 보내기
          </button>
        </div>
      )}
    </div>
  )
}