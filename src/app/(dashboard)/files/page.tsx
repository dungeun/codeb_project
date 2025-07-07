'use client'

import React, { useState } from 'react'
import FileUpload from '@/components/files/FileUpload'
import FileList, { FileItem } from '@/components/files/FileList'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'

interface DownloadHistory {
  id: string
  fileId: string
  fileName: string
  downloadedBy: string
  downloadedAt: Date
  userAgent?: string
}

export default function FilesPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'files' | 'history'>('files')
  const [files, setFiles] = useState<FileItem[]>([
    // Mock 데이터
    {
      id: '1',
      name: '프로젝트 기획서.pdf',
      size: 2548576,
      type: 'application/pdf',
      url: '#',
      category: 'document',
      uploadedBy: '김기획',
      createdAt: new Date('2024-01-05'),
    },
    {
      id: '2',
      name: '메인페이지 디자인.png',
      size: 5242880,
      type: 'image/png',
      url: '#',
      category: 'image',
      uploadedBy: '이디자인',
      createdAt: new Date('2024-01-04'),
    },
    {
      id: '3',
      name: '프로모션 비디오.mp4',
      size: 15728640,
      type: 'video/mp4',
      url: '#',
      category: 'video',
      uploadedBy: '박영상',
      createdAt: new Date('2024-01-03'),
    },
  ])

  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([
    // Mock 다운로드 이력 데이터
    {
      id: 'dl1',
      fileId: '1',
      fileName: '프로젝트 기획서.pdf',
      downloadedBy: '김고객',
      downloadedAt: new Date('2024-01-06T09:30:00'),
      userAgent: 'Chrome/120.0.0.0'
    },
    {
      id: 'dl2',
      fileId: '2',
      fileName: '메인페이지 디자인.png',
      downloadedBy: '이디자인',
      downloadedAt: new Date('2024-01-05T14:20:00'),
      userAgent: 'Safari/17.2.1'
    },
    {
      id: 'dl3',
      fileId: '1',
      fileName: '프로젝트 기획서.pdf',
      downloadedBy: '박관리자',
      downloadedAt: new Date('2024-01-04T16:45:00'),
      userAgent: 'Chrome/120.0.0.0'
    },
  ])

  const handleUpload = (newFiles: File[]) => {
    // 실제 구현에서는 서버에 업로드 후 결과를 받아야 함
    const uploadedFiles: FileItem[] = newFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // 임시 URL
      category: getFileCategory(file.type),
      uploadedBy: user?.name || '알 수 없음',
      createdAt: new Date(),
    }))

    setFiles(prev => [...uploadedFiles, ...prev])
  }

  const getFileCategory = (type: string): FileItem['category'] => {
    if (type.startsWith('image/')) return 'image'
    if (type.startsWith('video/')) return 'video'
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document'
    return 'other'
  }

  const handleDownload = (file: FileItem) => {
    // 다운로드 이력 추가
    const newDownload: DownloadHistory = {
      id: `dl-${Date.now()}`,
      fileId: file.id,
      fileName: file.name,
      downloadedBy: user?.name || '알 수 없음',
      downloadedAt: new Date(),
      userAgent: navigator.userAgent.split(' ').pop() || 'Unknown'
    }
    
    setDownloadHistory(prev => [newDownload, ...prev])
    
    // 실제 구현에서는 서버에서 다운로드
    toast.success(`${file.name} 다운로드를 시작합니다.`)
    
    // Mock 다운로드
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.click()
  }

  const handleDelete = (file: FileItem) => {
    if (confirm(`${file.name} 파일을 삭제하시겠습니까?`)) {
      setFiles(prev => prev.filter(f => f.id !== file.id))
      toast.success('파일이 삭제되었습니다.')
    }
  }

  const canDelete = user?.role === 'admin' || user?.role === 'team_member'
  const canViewHistory = user?.role === 'admin' || user?.role === 'team_member'

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
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
          {(user?.role === 'admin' || user?.role === 'team_member') && (
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