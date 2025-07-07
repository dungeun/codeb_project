'use client'

import React from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion } from 'framer-motion'

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  preview?: string
  url?: string
}

interface ChatMessageProps {
  message: {
    id: string
    content: string
    senderId: string
    senderName: string
    timestamp: Date
    read?: boolean
    files?: AttachedFile[]
  }
  isOwn: boolean
}

export default function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.includes('pdf')) return '📄'
    if (type.includes('document') || type.includes('text')) return '📄'
    return '📎'
  }

  const handleFileDownload = (file: AttachedFile) => {
    // Mock 다운로드 - 실제 구현에서는 서버에서 파일을 다운로드
    if (file.url) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.click()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="text-sm text-gray-600 mb-1">{message.senderName}</div>
        )}
        
        <div className={`
          relative px-4 py-3 rounded-2xl
          ${isOwn 
            ? 'bg-primary text-white' 
            : 'bg-gray-100 text-gray-900'
          }
        `}>
          {message.content && (
            <p className="break-words mb-2">{message.content}</p>
          )}
          
          {/* 첨부 파일 표시 */}
          {message.files && message.files.length > 0 && (
            <div className="space-y-2 mt-2">
              {message.files.map((file) => (
                <div
                  key={file.id}
                  className={`
                    border rounded-lg p-2 cursor-pointer transition-colors
                    ${isOwn 
                      ? 'border-white/30 hover:border-white/50 bg-white/10' 
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                    }
                  `}
                  onClick={() => handleFileDownload(file)}
                >
                  <div className="flex items-center space-x-2">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <span className="text-xl">{getFileIcon(file.type)}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isOwn ? 'text-white' : 'text-gray-900'
                      }`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${
                        isOwn ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <svg 
                      className={`w-4 h-4 ${
                        isOwn ? 'text-white/70' : 'text-gray-400'
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className={`
            text-xs mt-1 flex items-center gap-2
            ${isOwn ? 'text-white/70' : 'text-gray-500'}
          `}>
            <span>
              {format(new Date(message.timestamp), 'HH:mm', { locale: ko })}
            </span>
            {isOwn && message.read && <span>✓✓</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}