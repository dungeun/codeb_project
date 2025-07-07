'use client'

import React, { useState } from 'react'

interface FilePreviewProps {
  file: {
    id: string
    name: string
    size: number
    type: string
    url: string
  }
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
}

export default function FilePreview({ file, isOpen, onClose, onDownload }: FilePreviewProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (type.startsWith('video/')) {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    } else if (type.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

  const renderPreviewContent = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-96 rounded-lg shadow-lg"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        </div>
      )
    } else if (file.type.startsWith('video/')) {
      return (
        <div className="flex justify-center">
          <video
            controls
            className="max-w-full max-h-96 rounded-lg shadow-lg"
            onLoadedData={() => setLoading(false)}
          >
            <source src={file.url} type={file.type} />
            브라우저에서 비디오를 지원하지 않습니다.
          </video>
        </div>
      )
    } else if (file.type === 'application/pdf') {
      return (
        <div className="flex justify-center">
          <iframe
            src={file.url}
            className="w-full h-96 rounded-lg border"
            title={file.name}
            onLoad={() => setLoading(false)}
          />
        </div>
      )
    } else if (file.type.startsWith('text/')) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">텍스트 파일 미리보기</p>
          <div className="bg-white p-4 rounded border font-mono text-sm max-h-64 overflow-auto">
            텍스트 파일 내용을 여기에 표시합니다...
          </div>
        </div>
      )
    } else {
      return (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            {getFileTypeIcon(file.type)}
          </div>
          <p className="text-gray-500">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
          <button
            onClick={onDownload}
            className="mt-4 btn btn-primary"
          >
            다운로드하여 보기
          </button>
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            {getFileTypeIcon(file.type)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>다운로드</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 미리보기 내용 */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  )
}