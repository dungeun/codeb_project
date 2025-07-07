'use client'

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { motion } from 'framer-motion'

interface KanbanTask {
  id: string
  title: string
  description?: string
  assignee?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  labels?: string[]
  dueDate?: Date
  attachments?: number
  comments?: number
  checklist?: { id: string; text: string; completed: boolean }[]
}

interface KanbanColumn {
  id: string
  title: string
  color: string
  limit?: number
  tasks: KanbanTask[]
}

interface KanbanBoardProProps {
  columns: KanbanColumn[]
  onColumnsChange?: (columns: KanbanColumn[]) => void
  onTaskAdd?: (columnId: string) => void
  onTaskEdit?: (task: KanbanTask) => void
  onTaskDelete?: (taskId: string, columnId: string) => void
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
}

const priorityIcons = {
  low: '▼',
  medium: '■',
  high: '▲',
  urgent: '🔥'
}

// StrictMode 이슈 해결을 위한 래퍼 컴포넌트
function StrictModeDroppable({ children, ...props }: { children: (provided: any, snapshot: any) => React.ReactElement; droppableId: string; [key: string]: any }) {
  const [enabled, setEnabled] = useState(false)
  
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true))
    return () => {
      cancelAnimationFrame(animation)
      setEnabled(false)
    }
  }, [])
  
  if (!enabled) {
    return null
  }
  
  return <Droppable {...props}>{children}</Droppable>
}

export default function KanbanBoardPro({
  columns: initialColumns,
  onColumnsChange,
  onTaskDelete
}: KanbanBoardProProps) {
  const [columns, setColumns] = useState(initialColumns)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showAddTask, setShowAddTask] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const { source, destination } = result

    // 같은 컬럼 내에서 이동
    if (source.droppableId === destination.droppableId) {
      const column = columns.find(col => col.id === source.droppableId)
      if (!column) return

      const newTasks = Array.from(column.tasks)
      const [removed] = newTasks.splice(source.index, 1)
      newTasks.splice(destination.index, 0, removed)

      const newColumns = columns.map(col =>
        col.id === source.droppableId ? { ...col, tasks: newTasks } : col
      )
      
      setColumns(newColumns)
      onColumnsChange?.(newColumns)
    } else {
      // 다른 컬럼으로 이동
      const sourceColumn = columns.find(col => col.id === source.droppableId)
      const destColumn = columns.find(col => col.id === destination.droppableId)
      
      if (!sourceColumn || !destColumn) return

      // 컬럼 제한 확인
      if (destColumn.limit && destColumn.tasks.length >= destColumn.limit) {
        alert(`${destColumn.title} 컬럼은 최대 ${destColumn.limit}개의 작업만 가질 수 있습니다.`)
        return
      }

      const sourceTasks = Array.from(sourceColumn.tasks)
      const destTasks = Array.from(destColumn.tasks)
      const [removed] = sourceTasks.splice(source.index, 1)
      destTasks.splice(destination.index, 0, removed)

      const newColumns = columns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, tasks: sourceTasks }
        }
        if (col.id === destination.droppableId) {
          return { ...col, tasks: destTasks }
        }
        return col
      })

      setColumns(newColumns)
      onColumnsChange?.(newColumns)
    }
  }

  const handleAddTask = (columnId: string) => {
    if (!newTaskTitle.trim()) return

    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      priority: 'medium'
    }

    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        return { ...col, tasks: [...col.tasks, newTask] }
      }
      return col
    })

    setColumns(newColumns)
    onColumnsChange?.(newColumns)
    setNewTaskTitle('')
    setShowAddTask(null)
  }

  const filteredColumns = columns.map(column => ({
    ...column,
    tasks: column.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      return matchesSearch && matchesPriority
    })
  }))

  const totalTasks = columns.reduce((acc, col) => acc + col.tasks.length, 0)
  const completedTasks = columns.find(col => col.id === 'done')?.tasks.length || 0

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">칸반보드</h2>
            <p className="text-sm text-gray-600 mt-1">
              전체 {totalTasks}개 작업 • 완료 {completedTasks}개 ({Math.round((completedTasks / totalTasks) * 100) || 0}%)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 검색 */}
            <div className="relative">
              <input
                type="text"
                placeholder="작업 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>

            {/* 우선순위 필터 */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">모든 우선순위</option>
              <option value="urgent">긴급</option>
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
          </div>
        </div>
      </div>

      {/* 칸반보드 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {filteredColumns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-gray-50 rounded-xl p-4"
            >
              {/* 컬럼 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-medium text-gray-900">{column.title}</h3>
                  <span className="text-sm text-gray-500">
                    ({column.tasks.length}
                    {column.limit && `/${column.limit}`})
                  </span>
                </div>
                <button
                  onClick={() => setShowAddTask(column.id)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  +
                </button>
              </div>

              {/* 새 작업 추가 폼 */}
              {showAddTask === column.id && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3"
                >
                  <input
                    type="text"
                    placeholder="작업 제목 입력..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTask(column.id)
                      }
                    }}
                    onBlur={() => {
                      if (!newTaskTitle) setShowAddTask(null)
                    }}
                    autoFocus
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </motion.div>
              )}

              {/* 작업 목록 */}
              <StrictModeDroppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] ${
                      snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
                    }`}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-move ${
                              snapshot.isDragging ? 'shadow-lg rotate-3 opacity-90' : ''
                            }`}
                          >
                            {/* 우선순위 표시 */}
                            {task.priority && (
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                                  <span>{priorityIcons[task.priority]}</span>
                                  <span>{task.priority === 'urgent' ? '긴급' : 
                                         task.priority === 'high' ? '높음' :
                                         task.priority === 'medium' ? '보통' : '낮음'}</span>
                                </span>
                                <button
                                  onClick={() => onTaskDelete?.(task.id, column.id)}
                                  className="text-gray-400 hover:text-red-600 opacity-0 hover:opacity-100 transition-opacity"
                                >
                                  ✕
                                </button>
                              </div>
                            )}

                            {/* 작업 제목 */}
                            <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                            
                            {/* 작업 설명 */}
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* 라벨 */}
                            {task.labels && task.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {task.labels.map((label, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* 하단 정보 */}
                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                              <div className="flex items-center gap-3">
                                {task.dueDate && (
                                  <span className="flex items-center gap-1">
                                    📅 {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                                  </span>
                                )}
                                {task.attachments && task.attachments > 0 && (
                                  <span className="flex items-center gap-1">
                                    📎 {task.attachments}
                                  </span>
                                )}
                                {task.comments && task.comments > 0 && (
                                  <span className="flex items-center gap-1">
                                    💬 {task.comments}
                                  </span>
                                )}
                              </div>
                              {task.assignee && (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                                  {task.assignee.charAt(0)}
                                </div>
                              )}
                            </div>

                            {/* 체크리스트 진행률 */}
                            {task.checklist && task.checklist.length > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>체크리스트</span>
                                  <span>
                                    {task.checklist.filter(item => item.completed).length}/{task.checklist.length}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-green-500 h-1.5 rounded-full transition-all"
                                    style={{
                                      width: `${(task.checklist.filter(item => item.completed).length / task.checklist.length) * 100}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </StrictModeDroppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}