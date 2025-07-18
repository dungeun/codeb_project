'use client'

import React, { useState, useEffect } from 'react'
import FileUpload from '@/components/files/FileUpload'
import FileList, { FileItem } from '@/components/files/FileList'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import fileService from '@/services/file-service'

interface DownloadHistory {
  id: string
  fileId: string
  fileName: string
  downloadedBy: string
  downloadedAt: Date
  userAgent?: string
}

export default function FilesPage() {
  const { user, userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'files' | 'history'>('files')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([])

  // Firebase에서 파일 목록 로드
  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const filesList = await fileService.getFiles()
      
      // FileMetadata를 FileItem으로 변환
      const fileItems: FileItem[] = filesList.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        category: file.category,
        uploadedBy: file.uploadedByName,
        createdAt: new Date(file.createdAt)
      }))
      
      setFiles(fileItems)
    } catch (error) {
      console.error('Failed to load files:', error)
      toast.error('파일 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (newFiles: File[]) => {
    if (!user || !userProfile) return
    
    try {
      // Firebase Storage에 업로드
      const uploadedFiles = await fileService.uploadFiles(
        newFiles,
        user.uid,
        userProfile.displayName || userProfile.email
      )
      
      // 업로드된 파일을 목록에 추가
      const fileItems: FileItem[] = uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        category: file.category,
        uploadedBy: file.uploadedByName,
        createdAt: new Date(file.createdAt)
      }))

      setFiles(prev => [...fileItems, ...prev])
      toast.success('파일이 업로드되었습니다.')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('파일 업로드에 실패했습니다.')
    }
  }

  const getFileCategory = (type: string): FileItem['category'] => {
    if (type.startsWith('image/')) return 'image'
    if (type.startsWith('video/')) return 'video'
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document'
    return 'other'
  }

  const handleDownload = async (file: FileItem) => {
    if (!user || !userProfile) return
    
    try {
      // 다운로드 이력 기록
      await fileService.recordDownload(
        file.id,
        user.uid,
        userProfile.displayName || userProfile.email
      )
      
      // 다운로드 이력 추가 (UI 업데이트용)
      const newDownload: DownloadHistory = {
        id: `dl-${Date.now()}`,
        fileId: file.id,
        fileName: file.name,
        downloadedBy: userProfile?.displayName || '알 수 없음',
        downloadedAt: new Date(),
        userAgent: navigator.userAgent.split(' ').pop() || 'Unknown'
      }
      
      setDownloadHistory(prev => [newDownload, ...prev])
      
      toast.success(`${file.name} 다운로드를 시작합니다.`)
      
      // 파일 다운로드
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.target = '_blank'
      link.click()
    } catch (error) {
      console.error('Download error:', error)
      toast.error('파일 다운로드에 실패했습니다.')
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (confirm(`${file.name} 파일을 삭제하시겠습니까?`)) {
      try {
        // Firebase Storage에서 파일 삭제
        await fileService.deleteFile(file.id)
        
        setFiles(prev => prev.filter(f => f.id !== file.id))
        toast.success('파일이 삭제되었습니다.')
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('파일 삭제에 실패했습니다.')
      }
    }
  }

  const canDelete = userProfile?.role === 'admin' || userProfile?.role === 'manager' || userProfile?.role === 'developer'
  const canViewHistory = userProfile?.role === 'admin' || userProfile?.role === 'manager' || userProfile?.role === 'developer'

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">파일 관리</h1>
        <p className="text-gray-600">프로젝트 관련 파일을 업로드하고 관리합니다.</p>
      </div>

      {/* 탭 네비게이션 */}
      {canViewHistory && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              파일 목록
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              다운로드 이력
            </button>
          </nav>
        </div>
      )}

      {/* 파일 관리 탭 */}
      {activeTab === 'files' && (
        <>
          {/* 업로드 영역 */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'manager' || userProfile?.role === 'developer') && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">파일 업로드</h2>
              <FileUpload 
                onUpload={handleUpload}
                maxSize={100}
                acceptedTypes={['*']}
              />
            </div>
          )}

          {/* 파일 목록 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-6">파일 목록</h2>
            <FileList 
              files={files}
              onDownload={handleDownload}
              onDelete={handleDelete}
              canDelete={canDelete}
            />
          </div>
        </>
      )}

      {/* 다운로드 이력 탭 */}
      {activeTab === 'history' && canViewHistory && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-6">다운로드 이력</h2>
          
          {downloadHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>다운로드 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      파일명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      다운로드한 사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      다운로드 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      브라우저
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {downloadHistory.map((history) => (
                    <tr key={history.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">{history.fileName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.downloadedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(history.downloadedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {history.userAgent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}