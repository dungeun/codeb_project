'use client'

import React, { useState, useRef, useEffect } from 'react'
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns'
import { ko } from 'date-fns/locale'
import { GanttTask } from '@/types/project'
import { motion } from 'framer-motion'

interface GanttChartProps {
  tasks: GanttTask[]
  startDate: Date
  endDate: Date
  onTaskUpdate?: (task: GanttTask) => void
  onTaskAdd?: () => void
  onTaskDelete?: (taskId: string) => void
  canEdit?: boolean
}

export default function GanttChart({ 
  tasks, 
  startDate, 
  endDate, 
  onTaskUpdate, 
  onTaskAdd, 
  onTaskDelete, 
  canEdit = false 
}: GanttChartProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  // 날짜 범위 계산
  const totalDays = differenceInDays(endDate, startDate) + 1
  const dayWidth = 40 // 각 날짜 칸의 너비

  // 월별로 날짜 그룹화
  const months = []
  let currentDate = startDate
  while (currentDate <= endDate) {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const start = monthStart < startDate ? startDate : monthStart
    const end = monthEnd > endDate ? endDate : monthEnd
    
    months.push({
      name: format(currentDate, 'yyyy년 MM월', { locale: ko }),
      days: differenceInDays(end, start) + 1,
      dates: eachDayOfInterval({ start, end })
    })
    
    currentDate = addDays(monthEnd, 1)
  }

  // 프로젝트 토글
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  // 태스크 위치와 너비 계산
  const calculateTaskPosition = (task: GanttTask) => {
    const startDiff = differenceInDays(task.startDate, startDate)
    const duration = differenceInDays(task.endDate, task.startDate) + 1
    
    return {
      left: startDiff * dayWidth,
      width: duration * dayWidth
    }
  }

  // 진행률에 따른 색상
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 70) return 'bg-blue-500'
    if (progress >= 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // 오늘 날짜 위치
  const today = new Date()
  const todayPosition = differenceInDays(today, startDate) * dayWidth

  // 우클릭 컨텍스트 메뉴
  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    if (!canEdit) return
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      taskId
    })
  }

  // 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // 태스크 드래그 시작
  const handleDragStart = (taskId: string) => {
    if (!canEdit) return
    setIsDragging(true)
    setDraggedTask(taskId)
  }

  // 태스크 드래그 종료
  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedTask(null)
  }

  // 태스크 진행률 업데이트
  const updateTaskProgress = (taskId: string, progress: number) => {
    if (!onTaskUpdate) return
    const task = findTaskById(taskId)
    if (task) {
      onTaskUpdate({ ...task, progress })
    }
  }

  // 태스크 찾기 (재귀적으로 하위 태스크까지 검색)
  const findTaskById = (taskId: string): GanttTask | null => {
    const searchInTasks = (tasks: GanttTask[]): GanttTask | null => {
      for (const task of tasks) {
        if (task.id === taskId) return task
        if (task.children) {
          const found = searchInTasks(task.children)
          if (found) return found
        }
      }
      return null
    }
    return searchInTasks(tasks)
  }

  // 태스크 렌더링
  const renderTask = (task: GanttTask, level: number = 0) => {
    const position = calculateTaskPosition(task)
    const isExpanded = expandedProjects.has(task.id)
    const hasChildren = task.children && task.children.length > 0

    return (
      <React.Fragment key={task.id}>
        <div className="flex items-center h-12 border-b border-gray-200">
          {/* 태스크 이름 */}
          <div 
            className="w-64 px-4 flex items-center gap-2 border-r border-gray-200"
            style={{ paddingLeft: `${level * 20 + 16}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleProject(task.id)}
                className="w-4 h-4 flex items-center justify-center text-gray-600 hover:text-gray-900"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <span className="truncate font-medium">{task.name}</span>
          </div>

          {/* 간트 바 영역 */}
          <div className="flex-1 relative h-full">
            <motion.div
              className={`
                absolute top-2 h-8 rounded-md cursor-pointer
                ${selectedTask === task.id ? 'ring-2 ring-primary' : ''}
                ${isDragging && draggedTask === task.id ? 'opacity-50' : ''}
              `}
              style={{
                left: `${position.left}px`,
                width: `${position.width}px`,
                backgroundColor: task.color || '#4f7eff'
              }}
              onClick={() => setSelectedTask(task.id)}
              onContextMenu={(e) => handleContextMenu(e, task.id)}
              onMouseDown={() => handleDragStart(task.id)}
              onMouseUp={handleDragEnd}
              whileHover={{ scale: canEdit ? 1.02 : 1 }}
              whileTap={{ scale: canEdit ? 0.98 : 1 }}
              drag={canEdit ? "x" : false}
              dragConstraints={chartRef}
              onDragEnd={() => handleDragEnd()}
            >
              {/* 진행률 바 */}
              <div
                className={`h-full rounded-md ${getProgressColor(task.progress)} opacity-80`}
                style={{ width: `${task.progress}%` }}
              />
              
              {/* 진행률 텍스트 */}
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                {task.progress}%
              </div>

              {/* 마일스톤 표시 */}
              {position.width <= dayWidth && (
                <div className="absolute -top-1 -left-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white" />
              )}
            </motion.div>

            {/* 의존성 화살표 */}
            {task.dependencies?.map(depId => {
              // 실제 구현에서는 의존성 화살표 그리기
              return null
            })}
          </div>
        </div>

        {/* 하위 태스크 */}
        {isExpanded && task.children?.map(child => 
          renderTask(child, level + 1)
        )}
      </React.Fragment>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex border-b border-gray-300">
        <div className="w-64 px-4 py-3 font-semibold bg-gray-50 border-r border-gray-300">
          태스크
        </div>
        <div className="flex-1 overflow-x-auto" ref={chartRef}>
          <div className="flex">
            {/* 월별 헤더 */}
            {months.map((month, idx) => (
              <div
                key={idx}
                className="border-r border-gray-300"
                style={{ width: `${month.days * dayWidth}px` }}
              >
                <div className="px-2 py-2 bg-gray-50 border-b border-gray-300 text-center font-medium">
                  {month.name}
                </div>
                <div className="flex">
                  {month.dates.map((date, i) => (
                    <div
                      key={i}
                      className={`
                        w-10 py-1 text-xs text-center border-r border-gray-200
                        ${isWeekend(date) ? 'bg-gray-50' : ''}
                      `}
                    >
                      {format(date, 'd')}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 태스크 목록 */}
      <div className="flex">
        <div className="flex-1">
          {tasks.map(task => renderTask(task))}
        </div>
      </div>

      {/* 오늘 날짜 표시선 */}
      {todayPosition >= 0 && todayPosition <= totalDays * dayWidth && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
          style={{ left: `${264 + todayPosition}px` }}
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            오늘
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border py-2 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              setSelectedTask(contextMenu.taskId)
              setShowTaskModal(true)
              setContextMenu(null)
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            편집
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              const task = findTaskById(contextMenu.taskId)
              if (task) {
                updateTaskProgress(contextMenu.taskId, Math.min(100, task.progress + 25))
              }
              setContextMenu(null)
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            진행률 +25%
          </button>

          <div className="border-t border-gray-200 my-1"></div>

          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
            onClick={() => {
              if (onTaskDelete && confirm('이 태스크를 삭제하시겠습니까?')) {
                onTaskDelete(contextMenu.taskId)
              }
              setContextMenu(null)
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            삭제
          </button>
        </div>
      )}

      {/* 태스크 세부정보 모달 */}
      {showTaskModal && selectedTask && (
        <TaskDetailModal
          task={findTaskById(selectedTask)}
          onClose={() => {
            setShowTaskModal(false)
            setSelectedTask(null)
          }}
          onUpdate={(updatedTask) => {
            if (onTaskUpdate) {
              onTaskUpdate(updatedTask)
            }
            setShowTaskModal(false)
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}

// 태스크 세부정보 모달 컴포넌트
interface TaskDetailModalProps {
  task: GanttTask | null
  onClose: () => void
  onUpdate: (task: GanttTask) => void
}

function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    progress: task?.progress || 0,
    assignee: task?.assignee || '',
    startDate: task?.startDate ? format(task.startDate, 'yyyy-MM-dd') : '',
    endDate: task?.endDate ? format(task.endDate, 'yyyy-MM-dd') : ''
  })

  if (!task) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      ...task,
      name: formData.name,
      progress: formData.progress,
      assignee: formData.assignee,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">태스크 편집</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태스크 이름
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              담당자
            </label>
            <input
              type="text"
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              진행률: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              취소
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}