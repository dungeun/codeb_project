'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { motion, AnimatePresence } from 'framer-motion'
import taskService, { Task, KanbanColumn } from '@/services/task-service'
import { TaskStatus, TaskPriority } from '@/types/task'
import { getDatabase, ref, onValue, off } from 'firebase/database'
import { app } from '@/lib/firebase'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  status: string
}

interface TaskWithProject extends Task {
  projectId: string
  projectName: string
}

export default function TasksPage() {
  const { user, userProfile } = useAuth()
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate')
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: TaskPriority.MEDIUM,
    assignee: '',
    startDate: '',
    dueDate: '',
    status: TaskStatus.TODO
  })

  // 프로젝트 목록 가져오기
  useEffect(() => {
    if (!user || !userProfile) return

    const db = getDatabase(app)
    const projectsRef = ref(db, 'projects')
    
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const projectsList = Object.entries(data).map(([id, project]: [string, any]) => ({
          id,
          name: project.name,
          status: project.status
        }))
        
        // 사용자 권한에 따른 필터링
        let filteredProjects = projectsList
        if (userProfile.role === 'customer') {
          filteredProjects = projectsList.filter(p => data[p.id].clientId === user.uid)
        } else if (userProfile.role === 'developer') {
          filteredProjects = projectsList.filter(p => 
            data[p.id].team?.includes(userProfile.email)
          )
        }
        
        setProjects(filteredProjects)
      }
      setLoading(false)
    })

    return () => off(projectsRef)
  }, [user, userProfile])

  // 모든 프로젝트의 태스크 가져오기
  useEffect(() => {
    if (projects.length === 0) {
      setTasks([])
      return
    }

    const allTasks: TaskWithProject[] = []
    let loadedProjects = 0

    projects.forEach(project => {
      const unsubscribe = taskService.subscribeToTasks(project.id, (projectTasks) => {
        // 이전 프로젝트의 태스크 제거
        const otherProjectTasks = allTasks.filter(t => t.projectId !== project.id)
        
        // 현재 프로젝트의 태스크 추가
        const tasksWithProject = projectTasks.map(task => ({
          ...task,
          projectId: project.id,
          projectName: project.name
        }))
        
        allTasks.length = 0
        allTasks.push(...otherProjectTasks, ...tasksWithProject)
        
        loadedProjects++
        if (loadedProjects === projects.length) {
          setTasks([...allTasks])
        }
      })

      return () => unsubscribe()
    })
  }, [projects])

  // 태스크 필터링 및 정렬
  const filteredTasks = React.useMemo(() => {
    let filtered = tasks

    // 프로젝트 필터
    if (selectedProject !== 'all') {
      filtered = filtered.filter(task => task.projectId === selectedProject)
    }

    // 상태 필터
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus)
    }

    // 우선순위 필터
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === selectedPriority)
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 사용자 권한에 따른 필터링
    if (userProfile?.role === 'developer') {
      filtered = filtered.filter(task => 
        task.assignee === userProfile.email || 
        task.assigneeId === user?.uid
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      } else if (sortBy === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [tasks, selectedProject, selectedStatus, selectedPriority, searchTerm, sortBy, userProfile, user])

  // 태스크 생성/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.projectId) {
      toast.error('프로젝트를 선택해주세요.')
      return
    }

    try {
      if (editingTask) {
        // 태스크 수정
        await taskService.updateTask(editingTask.projectId, editingTask.id, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          assignee: formData.assignee,
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          status: formData.status
        })
        
        await taskService.addActivity(editingTask.projectId, {
          type: 'task',
          message: `작업 "${formData.title}"을(를) 수정했습니다`,
          user: userProfile?.displayName || '알 수 없음',
          icon: '✏️'
        })
        
        toast.success('작업이 수정되었습니다.')
      } else {
        // 태스크 생성
        const project = projects.find(p => p.id === formData.projectId)
        if (!project) return

        await taskService.createTask(formData.projectId, {
          projectId: formData.projectId,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          assignee: formData.assignee,
          assigneeId: formData.assignee,
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          status: formData.status,
          columnId: formData.status === TaskStatus.DONE ? 'done' : 
                   formData.status === TaskStatus.REVIEW ? 'review' : 
                   formData.status === TaskStatus.IN_PROGRESS ? 'in-progress' : 'todo',
          createdBy: user?.uid || '',
          order: 0,
          labels: [],
          attachments: []
        })
        
        await taskService.addActivity(formData.projectId, {
          type: 'task',
          message: `새 작업 "${formData.title}"을(를) 생성했습니다`,
          user: userProfile?.displayName || '알 수 없음',
          icon: '✅'
        })
        
        toast.success('작업이 생성되었습니다.')
      }
      
      await taskService.updateProjectProgress(formData.projectId)
      handleCloseModal()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('작업 저장 중 오류가 발생했습니다.')
    }
  }

  // 태스크 삭제
  const handleDelete = async (task: TaskWithProject) => {
    if (!confirm('정말 이 작업을 삭제하시겠습니까?')) return

    try {
      await taskService.deleteTask(task.projectId, task.id)
      await taskService.updateProjectProgress(task.projectId)
      
      await taskService.addActivity(task.projectId, {
        type: 'task',
        message: `작업 "${task.title}"을(를) 삭제했습니다`,
        user: userProfile?.displayName || '알 수 없음',
        icon: '🗑️'
      })
      
      toast.success('작업이 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('작업 삭제 중 오류가 발생했습니다.')
    }
  }

  // 모달 닫기
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      projectId: '',
      priority: TaskPriority.MEDIUM,
      assignee: '',
      startDate: '',
      dueDate: '',
      status: TaskStatus.TODO
    })
  }

  // 수정 모드로 모달 열기
  const handleEdit = (task: TaskWithProject) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      projectId: task.projectId,
      priority: task.priority === 'low' ? TaskPriority.LOW :
                task.priority === 'medium' ? TaskPriority.MEDIUM :
                task.priority === 'high' ? TaskPriority.HIGH :
                task.priority === 'urgent' ? TaskPriority.URGENT : TaskPriority.MEDIUM,
      assignee: task.assignee || '',
      startDate: task.startDate instanceof Date ? task.startDate.toISOString().split('T')[0] : 
                 typeof task.startDate === 'string' ? task.startDate : '',
      dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString().split('T')[0] : 
               typeof task.dueDate === 'string' ? task.dueDate : '',
      status: task.status === 'backlog' ? TaskStatus.BACKLOG :
              task.status === 'todo' ? TaskStatus.TODO :
              task.status === 'in_progress' ? TaskStatus.IN_PROGRESS :
              task.status === 'review' ? TaskStatus.REVIEW :
              task.status === 'done' ? TaskStatus.DONE : TaskStatus.TODO
    })
    setShowModal(true)
  }

  const statusLabels: Record<string, string> = {
    'todo': '할 일',
    'in-progress': '진행 중',
    'in_progress': '진행 중',
    'review': '검토',
    'done': '완료',
    'backlog': '대기'
  }

  const statusColors: Record<string, string> = {
    'todo': 'bg-gray-100 text-gray-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'in_progress': 'bg-blue-100 text-blue-700',
    'review': 'bg-purple-100 text-purple-700',
    'done': 'bg-green-100 text-green-700',
    'backlog': 'bg-gray-100 text-gray-700'
  }

  const priorityColors: Record<string, string> = {
    'low': 'bg-green-100 text-green-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'high': 'bg-orange-100 text-orange-700',
    'urgent': 'bg-red-100 text-red-700'
  }

  const priorityLabels: Record<string, string> = {
    'low': '낮음',
    'medium': '보통',
    'high': '높음',
    'urgent': '긴급'
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
          <h1 className="text-2xl font-bold text-gray-900">작업 관리</h1>
          <p className="text-gray-600 mt-1">모든 프로젝트의 작업을 한눈에 관리합니다.</p>
        </div>
        
        {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + 새 작업
          </button>
        )}
      </div>

      {/* 필터 및 검색 */}
      <div className="space-y-4">
        {/* 검색 */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 작업 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* 프로젝트 필터 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedProject('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedProject === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📁 모든 프로젝트
          </button>
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedProject === project.id 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>

        {/* 상태 및 우선순위 필터 */}
        <div className="flex gap-4 flex-wrap">
          {/* 상태 필터 */}
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 py-2">상태:</span>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedStatus === 'all' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {Object.entries(statusLabels).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedStatus === status 
                    ? `${statusColors[status]}` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 우선순위 필터 */}
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 py-2">우선순위:</span>
            <button
              onClick={() => setSelectedPriority('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedPriority === 'all' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {Object.entries(priorityLabels).map(([priority, label]) => (
              <button
                key={priority}
                onClick={() => setSelectedPriority(priority)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedPriority === priority 
                    ? `${priorityColors[priority]}` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 정렬 옵션 */}
        <div className="flex gap-2">
          <span className="text-sm text-gray-600 py-2">정렬:</span>
          {[
            { value: 'dueDate', label: '마감일순', icon: '📅' },
            { value: 'priority', label: '우선순위순', icon: '⚡' },
            { value: 'createdAt', label: '최신순', icon: '🕐' }
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

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">전체 작업</div>
            <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">진행 중</div>
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => (t.status as any) === 'in-progress' || (t.status as any) === 'in_progress' || t.status === TaskStatus.IN_PROGRESS).length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">오늘 마감</div>
            <div className="text-2xl font-bold text-orange-600">
              {tasks.filter(t => {
                if (!t.dueDate) return false
                const today = new Date().toDateString()
                const dueDate = new Date(t.dueDate).toDateString()
                return today === dueDate
              }).length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">완료</div>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => (t.status as any) === 'done' || t.status === TaskStatus.DONE).length}
            </div>
          </div>
        </div>
      </div>

      {/* 작업 목록 */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedProject !== 'all' || selectedStatus !== 'all' 
              ? '검색 결과가 없습니다' 
              : '작업이 없습니다'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedProject !== 'all' || selectedStatus !== 'all'
              ? '다른 검색 조건을 시도해보세요.'
              : '새로운 작업을 생성해보세요.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={(task.status as any) === 'done' || task.status === TaskStatus.DONE}
                        onChange={async () => {
                          const newStatus = ((task.status as any) === 'done' || task.status === TaskStatus.DONE) ? TaskStatus.TODO : TaskStatus.DONE
                          await taskService.updateTask(task.projectId, task.id, {
                            status: newStatus,
                            columnId: newStatus === TaskStatus.DONE ? 'done' : 'todo'
                          })
                          await taskService.updateProjectProgress(task.projectId)
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${(task.status as any) === 'done' || task.status === TaskStatus.DONE ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColors[task.priority]}`}>
                            {priorityLabels[task.priority]}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[task.status]}`}>
                            {statusLabels[task.status]}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <Link href={`/projects/${task.projectId}`} className="hover:text-primary">
                            📁 {task.projectName}
                          </Link>
                          
                          {task.assignee && (
                            <span>👤 {task.assignee}</span>
                          )}
                          
                          {task.dueDate && (
                            <span className={
                              new Date(task.dueDate) < new Date() && task.status !== 'done'
                                ? 'text-red-600' 
                                : ''
                            }>
                              📅 {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {(userProfile?.role === 'admin' || userProfile?.role === 'manager' || 
                      task.createdBy === user?.uid) && (
                      <>
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 작업 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTask ? '작업 수정' : '새 작업 만들기'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트 *
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                    disabled={!!editingTask}
                  >
                    <option value="">프로젝트를 선택하세요</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    작업 제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="작업 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="작업에 대한 상세 설명을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상태
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: TaskStatus.TODO, label: '📄 할 일' },
                        { value: TaskStatus.IN_PROGRESS, label: '🔄 진행 중' },
                        { value: TaskStatus.REVIEW, label: '🔍 검토' },
                        { value: TaskStatus.DONE, label: '✅ 완료' }
                      ].map(status => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: status.value })}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.status === status.value
                              ? status.value === TaskStatus.TODO ? 'bg-gray-100 text-gray-700' :
                                status.value === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                status.value === TaskStatus.REVIEW ? 'bg-purple-100 text-purple-700' :
                                'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      우선순위
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: TaskPriority.LOW, label: '🟢 낮음' },
                        { value: TaskPriority.MEDIUM, label: '🟡 보통' },
                        { value: TaskPriority.HIGH, label: '🟠 높음' },
                        { value: TaskPriority.URGENT, label: '🔴 긴급' }
                      ].map(priority => (
                        <button
                          key={priority.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: priority.value })}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.priority === priority.value
                              ? priority.value === TaskPriority.LOW ? 'bg-green-100 text-green-700' :
                                priority.value === TaskPriority.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                                priority.value === TaskPriority.HIGH ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {priority.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자
                  </label>
                  <input
                    type="text"
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="담당자 이메일"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작일
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      마감일
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  {editingTask ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}