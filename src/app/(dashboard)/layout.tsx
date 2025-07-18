'use client'

import React, { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import ChatNotifications from '@/components/chat/ChatNotifications'
import AIAssistant from '@/components/ai/AIAssistant'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationProvider } from '@/lib/notification-context'
import NotificationToast from '@/components/notification/NotificationToast'
import { Toaster } from 'react-hot-toast'

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
          <div className="flex-1 lg:ml-[var(--sidebar-width)] flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="p-4 lg:p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
        <NotificationToast />
        <ChatNotifications /> {/* 채팅 알림을 헤더 알림 시스템과 통합 */}
        
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
        
        {/* Toast Notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </NotificationProvider>
    </AuthProvider>
  )
}