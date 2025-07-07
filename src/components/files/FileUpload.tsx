'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface FileUploadProps {
  onUpload: (files: File[]) => void
  maxSize?: number // MB
  acceptedTypes?: string[]
}

export default function FileUpload({ 
  onUpload, 
  maxSize = 100,
  acceptedTypes = ['*']
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // 파일 크기 검증
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `파일 크기는 ${maxSize}MB를 초과할 수 없습니다.`
    }

    // 파일 타입 검증
    if (acceptedTypes[0] !== '*') {
      const fileType = file.type || 'application/octet-stream'
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''))
        }
        return fileType === type
      })
      
      if (!isAccepted) {
        return '지원하지 않는 파일 형식입니다.'
      }
    }

    return null
  }

  const handleFiles = (files: FileList) => {
    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(files).forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }

    if (validFiles.length > 0) {
      onUpload(validFiles)
      toast.success(`${validFiles.length}개 파일이 추가되었습니다.`)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  return (
    <div className="w-full">
      <motion.div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          accept={acceptedTypes.join(',')}
        />

        <div className="text-center">
          <div className="text-4xl mb-4">
            {isDragging ? '📥' : '☁️'}
          </div>
          
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragging 
              ? '여기에 파일을 놓으세요' 
              : '파일을 드래그하거나 클릭하여 업로드'
            }
          </p>
          
          <p className="text-sm text-gray-500">
            최대 {maxSize}MB, {acceptedTypes[0] === '*' ? '모든 파일 형식' : acceptedTypes.join(', ')}
          </p>
        </div>

        {isDragging && (
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>
    </div>
  )
}