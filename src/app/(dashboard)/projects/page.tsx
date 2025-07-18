'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Project } from '@/types'
import ProjectCreateWizard from '@/components/projects/ProjectCreateWizard'
import { getDatabase, ref, onValue, off, set, push } from 'firebase/database'
import { app } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

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
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'completed'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<Project['status'] | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'progress'>('date')

  // Firebase에서 프로젝트 데이터 로드
  useEffect(() => {
    if (!user) return

    const db = getDatabase(app)
    const projectsRef = ref(db, 'projects')
    
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const projectsList = Object.entries(data).map(([id, project]: [string, any]) => ({
          ...project,
          id,
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }))
        
        // 사용자 역할에 따른 필터링
        let filteredProjects = projectsList
        if (userProfile?.role === 'customer') {
          // 고객은 자신의 프로젝트 또는 같은 그룹의 프로젝트를 볼 수 있음
          filteredProjects = projectsList.filter(p => 
            p.clientId === user.uid ||
            (userProfile.group && p.clientGroup === userProfile.group)
          )
        } else if (userProfile?.role === 'developer') {
          // 개발자는 자신이 팀에 포함된 프로젝트만 볼 수 있음
          filteredProjects = projectsList.filter(p => 
            p.team && p.team.includes(userProfile.email)
          )
        }
        
        setProjects(filteredProjects)
      } else {
        setProjects([])
      }
      setLoading(false)
    })

    return () => off(projectsRef)
  }, [user, userProfile])

  // 프로젝트 필터링 및 검색
  const filteredProjects = useMemo(() => {
    let filtered = projects
    
    // 탭 필터링
    if (selectedTab === 'active') {
      filtered = filtered.filter(project => project.status !== 'completed')
    } else if (selectedTab === 'completed') {
      filtered = filtered.filter(project => project.status === 'completed')
    }
    
    // 상태 필터링
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus)
    }
    
    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'progress') {
        return b.progress - a.progress
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    return filtered
  }, [projects, selectedTab, filterStatus, searchTerm, sortBy])

  // 예산 포맷팅
  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 프로젝트 생성 핸들러
  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const db = getDatabase(app)
      const projectsRef = ref(db, 'projects')
      const newProjectRef = push(projectsRef)
      
      const newProject = {
        ...projectData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid,
        progress: 0,
        activeTasks: 0,
        completedTasks: 0,
        totalTasks: 0,
        team: projectData.team || []
      }
      
      await set(newProjectRef, newProject)
      
      // 활동 로그 추가
      const activitiesRef = ref(db, 'activities')
      const newActivityRef = push(activitiesRef)
      await set(newActivityRef, {
        type: 'project',
        icon: '📁',
        title: '새 프로젝트 생성',
        description: `${projectData.name} 프로젝트가 생성되었습니다`,
        time: new Date().toISOString(),
        userId: user?.uid,
        userName: userProfile?.displayName || '알 수 없음'
      })
      
      setShowCreateModal(false)
      router.push(`/projects/${newProjectRef.key}`)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('프로젝트 생성 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
          <p className="text-gray-600 mt-1">전체 프로젝트를 관리하고 진행 상황을 확인합니다.</p>
        </div>
        
        {userProfile?.role === 'admin' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + 새 프로젝트
          </button>
        )}
      </div>

      {/* 필터 및 뷰 모드 */}
      <div className="space-y-4">
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
                {tab === 'all' ? `전체 (${projects.length})` : 
                 tab === 'active' ? `진행 중 (${projects.filter(p => p.status !== 'completed').length})` : 
                 `완료 (${projects.filter(p => p.status === 'completed').length})`}
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

        {/* 검색 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 프로젝트 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        {/* 상태 필터 탭 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'all' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {Object.entries(statusLabels).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === status 
                  ? `${statusColors[status as Project['status']]}` 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 정렬 옵션 */}
        <div className="flex gap-2">
          <span className="text-sm text-gray-600 py-2">정렬:</span>
          {[
            { value: 'date', label: '최신순', icon: '📅' },
            { value: 'name', label: '이름순', icon: '🔤' },
            { value: 'progress', label: '진행률순', icon: '📊' }
          ].map(sort => (
            <button
              key={sort.value}
              onClick={() => setSortBy(sort.value as any)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === sort.value 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sort.icon} {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* 프로젝트 목록 */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? '검색 결과가 없습니다' : '프로젝트가 없습니다'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? '다른 검색어나 필터를 시도해보세요.' 
              : userProfile?.role === 'admin' 
                ? '첫 번째 프로젝트를 생성해보세요.'
                : '아직 할당된 프로젝트가 없습니다.'}
          </p>
          {userProfile?.role === 'admin' && !searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary mx-auto"
            >
              새 프로젝트 만들기
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
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
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
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
                      {project.team?.slice(0, 3).map((member, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white"
                        >
                          {member.charAt(0)}
                        </div>
                      )) || <span className="text-sm text-gray-500">팀 미배정</span>}
                      {project.team && project.team.length > 3 && (
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
                      {userProfile?.role === 'admin' && (
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}`)}
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
                    {project.team?.slice(0, 3).map((member, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white"
                      >
                        {member.charAt(0)}
                      </div>
                    )) || <span className="text-sm text-gray-500">팀 미배정</span>}
                    {project.team && project.team.length > 3 && (
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
      )
      }

      {/* 프로젝트 생성 위자드 */}
      <ProjectCreateWizard
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}