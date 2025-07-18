'use client'

import React, { useEffect, useRef } from 'react'
import { GanttTask } from '@/types/task'

interface FrappeGanttChartProps {
  tasks?: GanttTask[]
  onTaskUpdate?: (task: GanttTask) => void
  onTaskAdd?: () => void
  onTaskDelete?: (taskId: string) => void
  canEdit?: boolean
}

export default function FrappeGanttChart({ 
  tasks, 
  onTaskUpdate, 
  onTaskAdd, 
  onTaskDelete, 
  canEdit = false 
}: FrappeGanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || !tasks || tasks.length === 0) {
      // 기존 간트 인스턴스 정리
      if (ganttRef.current) {
        ganttRef.current = null
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      return
    }

    // 동적으로 Frappe Gantt 라이브러리 로드
    const initGantt = async () => {
      try {
        const FrappeGantt = (await import('frappe-gantt')).default

        // 기존 간트 인스턴스 정리
        if (ganttRef.current) {
          ganttRef.current = null
        }
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }

        // Frappe Gantt 데이터 형식으로 변환
        const ganttTasks = (tasks || [])
          .filter(task => {
            return task && 
                   typeof task === 'object' && 
                   task.id && 
                   task.title && 
                   typeof task.id === 'string' && 
                   typeof task.title === 'string'
          })
          .map(task => ({
            id: String(task.id),
            name: String(task.title || '제목 없음'),
            start: task.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            end: task.dueDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            progress: Number(task.progress || 0),
            custom_class: String(task.priority || 'medium'),
            dependencies: task.dependencies?.join(',') || ''
          }))
          .filter(task => task && task.id && task.name) // 결과 검증

        // 간트 태스크가 비어있으면 초기화하지 않음
        if (ganttTasks.length === 0) {
          console.log('No valid gantt tasks to display')
          return
        }

        // 최종 검증
        console.log('Final gantt tasks before initialization:', ganttTasks)
        const hasInvalidTasks = ganttTasks.some(task => !task || !task.id || !task.name)
        if (hasInvalidTasks) {
          console.error('Found invalid tasks:', ganttTasks.filter(task => !task || !task.id || !task.name))
          return
        }

        // Frappe Gantt 초기화
        if (!containerRef.current) return
        
        console.log('Creating Frappe Gantt with tasks:', ganttTasks)
        
        // DOM이 준비될 때까지 대기
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 컨테이너가 여전히 존재하는지 확인
        if (!containerRef.current) return
        
        try {
          // 최소한의 설정으로 초기화
          ganttRef.current = new FrappeGantt(containerRef.current, ganttTasks, {
            view_mode: 'Day',
            date_format: 'YYYY-MM-DD',
            header_height: 50,
            column_width: 30,
            step: 24,
            bar_height: 20,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            on_click: canEdit ? (task: any) => {
              console.log('Task clicked:', task)
              if (onTaskUpdate) {
                const originalTask = tasks.find(t => String(t.id) === String(task.id))
                if (originalTask) {
                  onTaskUpdate(originalTask)
                }
              }
            } : undefined,
            on_progress_change: canEdit ? (task: any, progress: number) => {
              console.log('Progress changed:', task, progress)
              if (onTaskUpdate) {
                const originalTask = tasks.find(t => String(t.id) === String(task.id))
                if (originalTask) {
                  onTaskUpdate({ ...originalTask, progress })
                }
              }
            } : undefined,
            on_date_change: canEdit ? (task: any, start: Date, end: Date) => {
              console.log('Date changed:', task, start, end)
              if (onTaskUpdate) {
                const originalTask = tasks.find(t => String(t.id) === String(task.id))
                if (originalTask) {
                  onTaskUpdate({ ...originalTask, startDate: start, dueDate: end })
                }
              }
            } : undefined
          })
          
          console.log('Frappe Gantt initialized successfully')
        } catch (error) {
          console.error('Failed to initialize Frappe Gantt:', error)
          // 실패 시 에러 메시지 표시
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="flex flex-col items-center justify-center h-64 text-center p-4">
                <div class="text-red-500 mb-2">
                  <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-1">간트차트를 로드할 수 없습니다</h3>
                <p class="text-sm text-gray-600">페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</p>
              </div>
            `
          }
        }
        
        // CSS 스타일 동적 추가
        const style = document.createElement('style')
        style.textContent = `
          .gantt-container {
            font-family: 'Inter', sans-serif;
          }
          .bar-urgent {
            fill: #ef4444;
          }
          .bar-high {
            fill: #f97316;
          }
          .bar-medium {
            fill: #3b82f6;
          }
          .bar-low {
            fill: #10b981;
          }
          .details-container {
            padding: 10px;
          }
          .details-container h5 {
            margin: 0 0 8px 0;
            font-weight: 600;
          }
          .details-container p {
            margin: 4px 0;
            font-size: 12px;
          }
        `
        document.head.appendChild(style)

      } catch (error) {
        console.error('Error loading Frappe Gantt:', error)
      }
    }

    initGantt()
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      if (ganttRef.current) {
        try {
          // Frappe Gantt 인스턴스 정리
          ganttRef.current = null
        } catch (error) {
          console.error('Error cleaning up Gantt:', error)
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [tasks, canEdit, onTaskUpdate, onTaskAdd])


  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="text-6xl mb-4 opacity-50">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">간트차트가 비어있습니다</h3>
        <p className="text-gray-600 mb-6 text-center">
          시작일과 마감일이 설정된 태스크를 생성하면<br />
          간트차트에서 확인할 수 있습니다.
        </p>
        {canEdit && onTaskAdd && (
          <button
            onClick={onTaskAdd}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            첫 번째 태스크 만들기
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      {/* 간트차트 컨트롤 */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">보기 모드:</span>
          <div className="flex gap-1">
            {['Day', 'Week', 'Month'].map(mode => (
              <button
                key={mode}
                onClick={() => {
                  try {
                    if (ganttRef.current && ganttRef.current.change_view_mode) {
                      ganttRef.current.change_view_mode(mode)
                    }
                  } catch (error) {
                    console.error('Failed to change view mode:', error)
                  }
                }}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                {mode === 'Day' ? '일' : mode === 'Week' ? '주' : '월'}
              </button>
            ))}
          </div>
        </div>
        
        {canEdit && onTaskAdd && (
          <button
            onClick={onTaskAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            + 태스크 추가
          </button>
        )}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">우선순위:</span>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs">긴급</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-xs">높음</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs">보통</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs">낮음</span>
          </div>
        </div>
      </div>

      {/* 간트차트 */}
      <div 
        ref={containerRef} 
        className="gantt-container bg-white border border-gray-200 rounded-lg"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}
