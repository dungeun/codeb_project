'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import FilePreview from './FilePreview'

export interface FileItem {
  id: string
  name: string
  size: number
  type: string
  url: string
  category: 'document' | 'image' | 'video' | 'other'
  uploadedBy: string
  createdAt: Date
}

interface FileListProps {
  files: FileItem[]
  onDownload: (file: FileItem) => void
  onDelete?: (file: FileItem) => void
  canDelete?: boolean
}

export default function FileList({ 
  files, 
  onDownload, 
  onDelete,
  canDelete = false 
}: FileListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  const categories = [
    { value: 'all', label: '전체', icon: '📁' },
    { value: 'document', label: '문서', icon: '📄' },
    { value: 'image', label: '이미지', icon: '🖼️' },
    { value: 'video', label: '동영상', icon: '🎥' },
    { value: 'other', label: '기타', icon: '📎' },
  ]

  const getFileIcon = (category: FileItem['category']) => {
    switch (category) {
      case 'document': return '📄'
      case 'image': return '🖼️'
      case 'video': return '🎥'
      default: return '📎'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeColor = (category: FileItem['category']) => {
    switch (category) {
      case 'document': return 'bg-blue-100 text-blue-600'
      case 'image': return 'bg-green-100 text-green-600'
      case 'video': return 'bg-purple-100 text-purple-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="파일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${selectedCategory === category.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* 파일 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredFiles.map((file) => (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                  ${getFileTypeColor(file.category)}
                `}>
                  {getFileIcon(file.category)}
                </div>
                
                {canDelete && onDelete && (
                  <button
                    onClick={() => onDelete(file)}
                    className="text-gray-400 hover:text-danger transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              <h3 className="font-medium text-gray-900 mb-2 truncate" title={file.name}>
                {file.name}
              </h3>

              <div className="space-y-1 text-sm text-gray-600">
                <p>크기: {formatFileSize(file.size)}</p>
                <p>업로드: {file.uploadedBy}</p>
                <p>
                  {format(new Date(file.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setPreviewFile(file)}
                  className="w-full btn btn-secondary"
                >
                  미리보기
                </button>
                <button
                  onClick={() => onDownload(file)}
                  className="w-full btn btn-primary"
                >
                  다운로드
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600">
            {searchTerm || selectedCategory !== 'all' 
              ? '검색 결과가 없습니다.' 
              : '아직 업로드된 파일이 없습니다.'}
          </p>
        </div>
      )}

      {/* 파일 미리보기 모달 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={() => {
            onDownload(previewFile)
            setPreviewFile(null)
          }}
        />
      )}
    </div>
  )
}