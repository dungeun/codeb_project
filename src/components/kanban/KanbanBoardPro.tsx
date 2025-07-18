'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { KanbanTask, TaskPriority, TaskStatus } from '@/types/task'

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

const priorityColors: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'bg-gray-100 text-gray-700',
  [TaskPriority.MEDIUM]: 'bg-blue-100 text-blue-700',
  [TaskPriority.HIGH]: 'bg-orange-100 text-orange-700',
  [TaskPriority.URGENT]: 'bg-red-100 text-red-700'
}

const priorityIcons: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: '▼',
  [TaskPriority.MEDIUM]: '■',
  [TaskPriority.HIGH]: '▲',
  [TaskPriority.URGENT]: '🔥'
}

// Sortable Task Item Component
function SortableTaskItem({ task, onEdit, onDelete }: { 
  task: KanbanTask
  onEdit?: (task: KanbanTask) => void
  onDelete?: (taskId: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1">{task.title}</h4>
        <div className="flex gap-1 ml-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(task)
              }}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
              className="text-gray-400 hover:text-red-600 text-xs"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
          {priorityIcons[task.priority]} {task.priority}
        </span>
        
        {task.assignee && (
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
              {task.assignee.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
      
      {task.dueDate && (
        <div className="mt-2 text-xs text-gray-500">
          📅 {new Date(task.dueDate).toLocaleDateString('ko-KR')}
        </div>
      )}
      
      {(task.checklist || task.attachments || task.comments) && (
        <div className="flex gap-3 mt-2 text-xs text-gray-500">
          {task.checklist && task.checklist.length > 0 && (
            <span>✓ {task.checklist.filter(item => item.completed).length}/{task.checklist.length}</span>
          )}
          {((task.attachmentCount && task.attachmentCount > 0) || (task.attachments && task.attachments.length > 0)) && (
            <span>📎 {task.attachmentCount || task.attachments.length}</span>
          )}
          {((task.commentCount && task.commentCount > 0) || (task.comments && task.comments.length > 0)) && (
            <span>💬 {task.commentCount || task.comments?.length || 0}</span>
          )}
        </div>
      )}
    </div>
  )
}

// Droppable Column Component
function DroppableColumn({ 
  column, 
  children, 
  onAddTask, 
  showAddTask,
  setShowAddTask,
  newTaskTitle,
  setNewTaskTitle,
  onCreateTask
}: { 
  column: KanbanColumn
  children: React.ReactNode
  onAddTask?: (columnId: string) => void
  showAddTask: boolean
  setShowAddTask: (show: boolean) => void
  newTaskTitle: string
  setNewTaskTitle: (title: string) => void
  onCreateTask: () => void
}) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 ${
        isOver ? 'ring-2 ring-primary ring-opacity-50' : ''
      }`}
    >
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
            <h3 className="font-semibold text-gray-900">{column.title}</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
              {column.tasks.length}{column.limit && `/${column.limit}`}
            </span>
          </div>
          
          {onAddTask && (
            <button
              onClick={() => {
                setShowAddTask(true)
                setNewTaskTitle('')
              }}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              +
            </button>
          )}
        </div>
        
        {showAddTask && (
          <div className="mb-4">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newTaskTitle.trim()) {
                  onCreateTask()
                }
              }}
              placeholder="새 작업 입력..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={onCreateTask}
                disabled={!newTaskTitle.trim()}
                className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark disabled:opacity-50"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false)
                  setNewTaskTitle('')
                }}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-3 min-h-[100px]">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoardPro({
  columns: initialColumns,
  onColumnsChange,
  onTaskEdit,
  onTaskDelete
}: KanbanBoardProProps) {
  const [columns, setColumns] = useState(initialColumns)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [showAddTask, setShowAddTask] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) return

    const activeColumnId = findColumnByTaskId(active.id as string)
    const overColumnId = over.data.current?.column?.id || findColumnByTaskId(over.id as string)

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
      return
    }

    setColumns((columns) => {
      const activeColumn = columns.find(col => col.id === activeColumnId)
      const overColumn = columns.find(col => col.id === overColumnId)
      
      if (!activeColumn || !overColumn) return columns

      const activeTaskIndex = activeColumn.tasks.findIndex(task => task.id === active.id)
      const activeTask = activeColumn.tasks[activeTaskIndex]

      const newColumns = columns.map(col => {
        if (col.id === activeColumnId) {
          return {
            ...col,
            tasks: col.tasks.filter(task => task.id !== active.id)
          }
        }
        if (col.id === overColumnId) {
          return {
            ...col,
            tasks: [...col.tasks, { ...activeTask, status: col.id as TaskStatus }]
          }
        }
        return col
      })

      return newColumns
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const activeColumnId = findColumnByTaskId(active.id as string)
    const overColumnId = findColumnByTaskId(over.id as string)

    if (!activeColumnId || !overColumnId) return

    if (activeColumnId === overColumnId) {
      // Same column reordering
      setColumns((columns) => {
        const column = columns.find(col => col.id === activeColumnId)
        if (!column) return columns

        const oldIndex = column.tasks.findIndex(task => task.id === active.id)
        const newIndex = column.tasks.findIndex(task => task.id === over.id)

        const newColumns = columns.map(col => {
          if (col.id === activeColumnId) {
            return {
              ...col,
              tasks: arrayMove(col.tasks, oldIndex, newIndex)
            }
          }
          return col
        })

        if (onColumnsChange) {
          onColumnsChange(newColumns)
        }

        return newColumns
      })
    }

    setActiveId(null)
  }

  const findColumnByTaskId = (taskId: string): string | null => {
    for (const column of columns) {
      if (column.tasks.find(task => task.id === taskId)) {
        return column.id
      }
    }
    return null
  }

  const handleAddTask = (columnId: string, title: string) => {
    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      columnId,
      order: 0,
      projectId: 'default',
      title,
      description: '',
      status: columnId as TaskStatus,
      priority: TaskPriority.MEDIUM,
      assignee: '',
      labels: [],
      dueDate: undefined,
      checklist: [],
      attachments: [],
      attachmentCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user'
    }

    setColumns(columns => {
      const newColumns = columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: [...col.tasks, newTask]
          }
        }
        return col
      })

      if (onColumnsChange) {
        onColumnsChange(newColumns)
      }

      return newColumns
    })
  }

  const handleDeleteTask = (taskId: string, columnId: string) => {
    setColumns(columns => {
      const newColumns = columns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskId)
          }
        }
        return col
      })

      if (onColumnsChange) {
        onColumnsChange(newColumns)
      }

      return newColumns
    })

    if (onTaskDelete) {
      onTaskDelete(taskId, columnId)
    }
  }

  // Filter tasks based on search and priority
  const getFilteredTasks = (tasks: KanbanTask[]) => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      
      return matchesSearch && matchesPriority
    })
  }

  const activeTask = activeId
    ? columns.flatMap(col => col.tasks).find(task => task.id === activeId)
    : null

  return (
    <div className="h-full flex flex-col">
      {/* 검색 및 필터 */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="작업 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">모든 우선순위</option>
          <option value={TaskPriority.LOW}>낮음</option>
          <option value={TaskPriority.MEDIUM}>중간</option>
          <option value={TaskPriority.HIGH}>높음</option>
          <option value={TaskPriority.URGENT}>긴급</option>
        </select>
      </div>
      
      {/* 칸반 보드 */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full pb-4">
            {columns.map(column => {
              const filteredTasks = getFilteredTasks(column.tasks)
              const columnWithFilteredTasks = { ...column, tasks: filteredTasks }
              
              return (
                <SortableContext
                  key={column.id}
                  items={filteredTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn
                    column={columnWithFilteredTasks}
                    onAddTask={() => setShowAddTask(column.id)}
                    showAddTask={showAddTask === column.id}
                    setShowAddTask={(show) => setShowAddTask(show ? column.id : null)}
                    newTaskTitle={newTaskTitle}
                    setNewTaskTitle={setNewTaskTitle}
                    onCreateTask={() => {
                      if (newTaskTitle.trim()) {
                        handleAddTask(column.id, newTaskTitle.trim())
                        setNewTaskTitle('')
                        setShowAddTask(null)
                      }
                    }}
                  >
                    {filteredTasks.map(task => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onEdit={onTaskEdit}
                        onDelete={(taskId) => handleDeleteTask(taskId, column.id)}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              )
            })}
          </div>
          
          <DragOverlay>
            {activeTask && (
              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 opacity-90">
                <h4 className="text-sm font-medium text-gray-900">{activeTask.title}</h4>
                {activeTask.description && (
                  <p className="text-xs text-gray-600 mt-1">{activeTask.description}</p>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}