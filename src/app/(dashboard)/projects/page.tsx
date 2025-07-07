'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Project } from '@/types'
import ProjectCreateModal from '@/components/projects/ProjectCreateModal'

// Mock 프로젝트 데이터
const mockProjects: Project[] = [
  {
    id: '1',
    name: '웹사이트 리뉴얼',
    description: '기업 홈페이지 전면 리뉴얼 프로젝트',
    clientId: '1',
    status: 'development',
    progress: 65,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    team: ['김개발', '이디자인', '박기획'],
    budget: 50000000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: '모바일 앱 개발',
    description: 'iOS/Android 크로스플랫폼 앱 개발',
    clientId: '2',
    status: 'planning',
    progress: 20,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-06-30'),
    team: ['최개발', '강디자인'],
    budget: 80000000,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: '이커머스 플랫폼',
    description: '온라인 쇼핑몰 구축',
    clientId: '3',
    status: 'testing',
    progress: 85,
    startDate: new Date('2023-11-01'),
    endDate: new Date('2024-01-31'),
    team: ['김개발', '최개발', '이디자인'],
    budget: 120000000,
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2024-01-18'),
  },
]

const statusLabels: Record<Project['status'], string> = {
  planning: '기획',
  design: '디자인',
  development: '개발',
  testing: '테스트',
  completed: '완료',
}

const statusColors: Record<Project['status'], string> = {
  planning: 'bg-gray-100 text-gray-700',
  design: 'bg-blue-100 text-blue-700',
  development: 'bg-yellow-100 text-yellow-700',
  testing: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'completed'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // 프로젝트 필터링
  const filteredProjects = projects.filter(project => {
    if (selectedTab === 'active') return project.status !== 'completed'
    if (selectedTab === 'completed') return project.status === 'completed'
    return true
  })

  // 예산 포맷팅
  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 프로젝트 생성 핸들러
  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setProjects([...projects, newProject])
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
          <p className="text-gray-600 mt-1">전체 프로젝트를 관리하고 진행 상황을 확인합니다.</p>
        </div>
        
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + 새 프로젝트
          </button>
        )}
      </div>

      {/* 필터 및 뷰 모드 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* 탭 필터 */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {['all', 'active', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`
                px-4 py-2 rounded-md font-medium transition-all
                ${selectedTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {tab === 'all' ? '전체' : tab === 'active' ? '진행 중' : '완료'}
            </button>
          ))}
        </div>

        {/* 뷰 모드 전환 */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            📋
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            🔲
          </button>
        </div>
      </div>

      {/* 프로젝트 목록 */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  프로젝트
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  진행률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  팀
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  예산
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500">{project.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 3).map((member, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white"
                        >
                          {member.charAt(0)}
                        </div>
                      ))}
                      {project.team.length > 3 && (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                          +{project.team.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatBudget(project.budget)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {project.startDate.toLocaleDateString('ko-KR')} - {project.endDate.toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/projects/${project.id}/gantt`} className="text-primary hover:text-primary-hover">
                        간트차트
                      </Link>
                      <Link href={`/projects/${project.id}/kanban`} className="text-purple-600 hover:text-purple-700">
                        칸반보드
                      </Link>
                      {user?.role === 'admin' && (
                        <button className="text-gray-600 hover:text-gray-900">
                          수정
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{project.description}</p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">예산</span>
                  <span className="font-medium">{formatBudget(project.budget)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">팀원</span>
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white"
                      >
                        {member.charAt(0)}
                      </div>
                    ))}
                    {project.team.length > 3 && (
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-4 border-t flex gap-2">
                <Link 
                  href={`/projects/${project.id}/gantt`}
                  className="flex-1 text-center px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
                >
                  간트차트
                </Link>
                <Link 
                  href={`/projects/${project.id}/kanban`}
                  className="flex-1 text-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  칸반보드
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 프로젝트 생성 모달 */}
      <ProjectCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}