'use client'

import React, { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import ChatNotifications from '@/components/chat/ChatNotifications'
import OnlineStatus from '@/components/chat/OnlineStatus'
import AIAssistant from '@/components/ai/AIAssistant'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationProvider } from '@/lib/notification-context'
import NotificationToast from '@/components/notification/NotificationToast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)

  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 lg:ml-[var(--sidebar-width)] p-4 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto pt-14 lg:pt-0">
              {children}
            </div>
          </main>
        </div>
        <NotificationToast />
        <ChatNotifications />
        <OnlineStatus compact />
        
        {/* AI Assistant 버튼 */}
        <button
          onClick={() => setIsAIAssistantOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 hover:scale-110"
          title="AI 어시스턴트"
        >
          <span className="text-2xl">🤖</span>
        </button>
        
        <AIAssistant 
          isOpen={isAIAssistantOpen} 
          onClose={() => setIsAIAssistantOpen(false)} 
        />
      </NotificationProvider>
    </AuthProvider>
  )
}