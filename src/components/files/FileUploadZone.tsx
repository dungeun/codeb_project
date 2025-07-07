'use client'

import { useState, useRef, useCallback } from 'react'
import storageService, { FileUploadProgress, UploadedFile } from '@/lib/storage-service'

interface FileUploadZoneProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadProgress?: (progress: { [fileName: string]: FileUploadProgress }) => void
  maxFileSize?: number // MB
  allowedTypes?: string[]
  multiple?: boolean
  uploadPath: string
  className?: string
}

export default function FileUploadZone({
  onUploadComplete,
  onUploadProgress,
  maxFileSize = 100,
  allowedTypes = ['*/*'],
  multiple = true,
  uploadPath,
  className = ''
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: FileUploadProgress }>({})
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFiles = (files: File[]): { validFiles: File[]; errors: string[] } => {
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of files) {
      // 파일 크기 검증
      if (!storageService.validateFileSize(file, maxFileSize)) {
        errors.push(`${file.name}: 파일 크기가 ${maxFileSize}MB를 초과합니다.`)
        continue
      }

      // 파일 타입 검증
      if (!allowedTypes.includes('*/*') && !storageService.validateFileType(file, allowedTypes)) {
        errors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`)
        continue
      }

      validFiles.push(file)
    }

    return { validFiles, errors }
  }

  const handleFileUpload = useCallback(async (files: File[]) => {
    const { validFiles, errors } = validateFiles(files)
    
    if (errors.length > 0) {
      setErrors(errors)
      return
    }

    setErrors([])
    setUploading(true)
    setUploadProgress({})

    try {
      const uploadedFiles: UploadedFile[] = []

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        
        const uploadedFile = await storageService.uploadFile(
          file,
          uploadPath,
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }))
            
            if (onUploadProgress) {
              onUploadProgress({
                ...uploadProgress,
                [file.name]: progress
              })
            }
          }
        )

        uploadedFiles.push(uploadedFile)
      }

      if (onUploadComplete) {
        onUploadComplete(uploadedFiles)
      }

      // 업로드 완료 후 상태 초기화
      setTimeout(() => {
        setUploadProgress({})
      }, 2000)

    } catch (error) {
      console.error('파일 업로드 실패:', error)
      setErrors(['파일 업로드 중 오류가 발생했습니다.'])
    } finally {
      setUploading(false)
    }
  }, [uploadPath, maxFileSize, allowedTypes, onUploadComplete, onUploadProgress, uploadProgress])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) {
      handleFileUpload(files)
    }
    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileUpload])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const getAcceptAttribute = () => {
    if (allowedTypes.includes('*/*')) return undefined
    return allowedTypes.join(',')
  }

  return (
    <div className={`w-full ${className}`}>
      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${uploading ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptAttribute()}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto">
              <svg className="animate-spin w-full h-full text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
              </svg>
            </div>
            <p className="text-blue-600 font-medium">파일 업로드 중...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                파일을 드래그하거나 클릭해서 업로드
              </p>
              <p className="text-sm text-gray-500 mt-1">
                최대 {maxFileSize}MB, {allowedTypes.includes('*/*') ? '모든 파일 형식' : allowedTypes.join(', ')} 지원
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 업로드 진행률 */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-900">업로드 진행률</h4>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">
                  {fileName}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(progress.progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {storageService.formatFileSize(progress.bytesTransferred)} / {storageService.formatFileSize(progress.totalBytes)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 오류 메시지 */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">업로드 오류</h4>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-600">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}