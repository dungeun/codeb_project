'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { Project } from '@/types'
import { getDatabase, ref, onValue, off } from 'firebase/database'
import { app } from '@/lib/firebase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ProjectPhase {
  id: string
  name: string
  status: 'completed' | 'in_progress' | 'pending'
  progress: number
  startDate: string
  endDate: string
  description: string
}

interface ProjectUpdate {
  id: string
  projectId: string
  projectName: string
  title: string
  description: string
  date: string
  type: 'development' | 'design' | 'planning' | 'testing'
}

export default function CustomerStatusPage() {
  const { user, userProfile } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activities, setActivities] = useState<ProjectUpdate[]>([])
  const router = useRouter()

  // 고객이 아닌 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'customer') {
      router.push('/dashboard')
    }
  }, [userProfile, loading, router])

  // Firebase에서 프로젝트 데이터 로드
  useEffect(() => {
    if (!user || !userProfile) return

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
        
        // 고객은 자신의 그룹에 속한 프로젝트를 모두 볼 수 있음
        let filteredProjects = projectsList
        if (userProfile.role === 'customer') {
          filteredProjects = projectsList.filter(p => 
            // 자신의 프로젝트이거나
            p.clientId === user.uid ||
            // 같은 그룹의 프로젝트
            (userProfile.group && p.clientGroup === userProfile.group)
          )
        }
        
        setProjects(filteredProjects)
        if (filteredProjects.length > 0 && !selectedProject) {
          setSelectedProject(filteredProjects[0])
        }
      } else {
        setProjects([])
      }
      setLoading(false)
    })

    return () => off(projectsRef)
  }, [user, userProfile, selectedProject])

  // 활동 내역 로드
  useEffect(() => {
    if (!user) return

    const db = getDatabase(app)
    const activitiesRef = ref(db, 'activities')
    
    const unsubscribe = onValue(activitiesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const activitiesList = Object.entries(data)
          .map(([id, activity]: [string, any]) => ({
            ...activity,
            id,
            date: activity.timestamp
          }))
          .filter(activity => {
            // 선택된 프로젝트의 활동만 표시
            if (selectedProject && activity.projectId === selectedProject.id) {
              return true
            }
            // 그룹의 모든 프로젝트 활동 표시
            if (userProfile?.group && projects.some(p => p.id === activity.projectId)) {
              return true
            }
            return false
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)
        
        setActivities(activitiesList)
      }
    })

    return () => off(activitiesRef)
  }, [user, userProfile, projects, selectedProject])

  const getProjectPhases = (project: Project): ProjectPhase[] => {
    const totalDays = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysPassed = Math.ceil((new Date().getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100))

    const phases: ProjectPhase[] = [
      {
        id: '1',
        name: '요구사항 분석',
        status: project.status !== 'planning' ? 'completed' : progress > 20 ? 'completed' : 'in_progress',
        progress: project.status !== 'planning' ? 100 : Math.min(100, progress * 5),
        startDate: project.startDate.toISOString().split('T')[0],
        endDate: new Date(project.startDate.getTime() + totalDays * 0.2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '프로젝트 요구사항 분석 및 기획'
      },
      {
        id: '2',
        name: '디자인',
        status: ['development', 'testing', 'completed'].includes(project.status) ? 'completed' : 
                project.status === 'design' ? 'in_progress' : 'pending',
        progress: ['development', 'testing', 'completed'].includes(project.status) ? 100 : 
                  project.status === 'design' ? (progress - 20) * 2.5 : 0,
        startDate: new Date(project.startDate.getTime() + totalDays * 0.2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(project.startDate.getTime() + totalDays * 0.4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'UI/UX 디자인 및 시안 작업'
      },
      {
        id: '3',
        name: '개발',
        status: ['testing', 'completed'].includes(project.status) ? 'completed' : 
                project.status === 'development' ? 'in_progress' : 'pending',
        progress: ['testing', 'completed'].includes(project.status) ? 100 : 
                  project.status === 'development' ? (progress - 40) * 1.67 : 0,
        startDate: new Date(project.startDate.getTime() + totalDays * 0.4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(project.startDate.getTime() + totalDays * 0.8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '프론트엔드 및 백엔드 개발'
      },
      {
        id: '4',
        name: '테스트',
        status: project.status === 'completed' ? 'completed' : 
                project.status === 'testing' ? 'in_progress' : 'pending',
        progress: project.status === 'completed' ? 100 : 
                  project.status === 'testing' ? (progress - 80) * 5 : 0,
        startDate: new Date(project.startDate.getTime() + totalDays * 0.8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(project.startDate.getTime() + totalDays * 0.95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '기능 테스트 및 버그 수정'
      },
      {
        id: '5',
        name: '배포',
        status: project.status === 'completed' ? 'completed' : 'pending',
        progress: project.status === 'completed' ? 100 : 0,
        startDate: new Date(project.startDate.getTime() + totalDays * 0.95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: project.endDate.toISOString().split('T')[0],
        description: '서버 배포 및 서비스 오픈'
      }
    ]

    return phases
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'pending': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'in_progress': return '🔄'
      case 'pending': return '⏳'
      default: return '⏳'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'in_progress': return '진행중'
      case 'pending': return '대기중'
      default: return '대기중'
    }
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'development': return '💻'
      case 'design': return '🎨'
      case 'planning': return '📋'
      case 'testing': return '🧪'
      default: return '📌'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">프로젝트 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">진행 중인 프로젝트가 없습니다</h2>
          <p className="text-gray-600">프로젝트가 시작되면 여기에서 진행 상황을 확인할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">프로젝트 현황</h1>
        <p className="text-gray-600 mt-1">
          {userProfile?.group ? `${userProfile.company || '우리 회사'}의 모든 프로젝트 진행 상황을 확인하세요` : '프로젝트의 진행 상황을 확인하세요'}
        </p>
      </div>

      {/* 프로젝트 선택 탭 */}
      {projects.length > 1 && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${selectedProject?.id === project.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {project.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {selectedProject && (
        <>
          {/* 프로젝트 정보 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedProject.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
              </div>
              <span className="text-2xl font-bold text-primary">{selectedProject.progress}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-3 mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${selectedProject.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-primary to-purple-600 h-3 rounded-full"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatDate(selectedProject.startDate)}
                </div>
                <div className="text-sm text-gray-600">시작일</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {Math.ceil((new Date().getTime() - selectedProject.startDate.getTime()) / (1000 * 60 * 60 * 24))}일
                </div>
                <div className="text-sm text-gray-600">진행일</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {formatDate(selectedProject.endDate)}
                </div>
                <div className="text-sm text-gray-600">완료 예정일</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 프로젝트 단계별 진행상황 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">단계별 진행상황</h3>
              <div className="space-y-4">
                {getProjectPhases(selectedProject).map((phase, index) => (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getStatusIcon(phase.status)}</span>
                        <h4 className="font-medium text-gray-900">{phase.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getStatusColor(phase.status)}`}>
                          {getStatusLabel(phase.status)}
                        </span>
                        <span className="text-sm text-gray-500">{phase.progress}%</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${phase.progress}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-2 rounded-full ${
                          phase.status === 'completed' ? 'bg-green-500' :
                          phase.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>{phase.startDate}</span>
                      <span>{phase.endDate}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{phase.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 최근 업데이트 및 팀 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 업데이트</h3>
              <div className="space-y-4 mb-8">
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((update, index) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{getUpdateIcon(update.type)}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{update.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{update.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(update.date).toLocaleDateString('ko-KR')}
                            </span>
                            {update.projectId !== selectedProject.id && (
                              <span className="text-xs text-blue-600 font-medium">
                                {update.projectName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    아직 업데이트가 없습니다
                  </div>
                )}
              </div>

              {/* 프로젝트 상세 정보 */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">프로젝트 정보</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">예산</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat('ko-KR', {
                        style: 'currency',
                        currency: 'KRW',
                        maximumFractionDigits: 0,
                      }).format(selectedProject.budget)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">팀 규모</span>
                    <span className="font-medium text-gray-900">
                      {selectedProject.team?.length || 0}명
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">현재 상태</span>
                    <span className="font-medium text-gray-900">
                      {selectedProject.status === 'planning' && '기획'}
                      {selectedProject.status === 'design' && '디자인'}
                      {selectedProject.status === 'development' && '개발'}
                      {selectedProject.status === 'testing' && '테스트'}
                      {selectedProject.status === 'completed' && '완료'}
                    </span>
                  </div>
                </div>

                {/* 프로젝트 상세 보기 링크 */}
                <Link
                  href={`/support?project=${selectedProject.id}`}
                  className="mt-4 block w-full text-center bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  문의하기
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}