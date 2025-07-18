'use client'

import React from 'react'
import { Gantt, Task, ViewMode } from 'gantt-task-react'
import "gantt-task-react/dist/index.css"

interface GanttChartContainerProps {
  tasks: Task[]
  onTaskChange?: (task: Task) => void
  onTaskDelete?: (task: Task) => void
  onProgressChange?: (task: Task) => void
  onDateChange?: (task: Task) => void
}

export default function GanttChartContainer({
  tasks,
  onTaskChange,
  onTaskDelete,
  onProgressChange,
  onDateChange
}: GanttChartContainerProps) {
  const [view, setView] = React.useState<ViewMode>(ViewMode.Month)
  
  // 디버깅용 로그
  console.log('GanttChartContainer received tasks:', tasks)
  console.log('Tasks length:', tasks.length)
  
  const columnWidth = view === ViewMode.Year ? 350 : 
                    view === ViewMode.Month ? 300 : 
                    view === ViewMode.Week ? 250 : 65

  return (
    <div className="h-full bg-white rounded-xl shadow-sm p-6 flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">프로젝트 간트차트</h2>
          <div className="flex gap-2">
            {['Day', 'Week', 'Month', 'Year'].map(mode => (
              <button
                key={mode}
                onClick={() => setView(ViewMode[mode as keyof typeof ViewMode])}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  view === ViewMode[mode as keyof typeof ViewMode]
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode === 'Day' ? '일' : mode === 'Week' ? '주' : mode === 'Month' ? '월' : '년'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 간트차트 스크롤 영역 */}
      <div 
        className="flex-1 border rounded-lg overflow-auto"
        style={{
          // 스크롤바 스타일
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}
      >
        {/* 간트차트가 들어갈 실제 컨테이너 */}
        <div style={{ 
          minWidth: '1200px', // 최소 너비 보장
          padding: '20px',
          height: '100%'
        }}>
          {tasks.length > 0 ? (
            <Gantt
              tasks={tasks}
              viewMode={view}
              onDateChange={onDateChange}
              onDelete={onTaskDelete}
              onProgressChange={onProgressChange}
              listCellWidth="155px"
              ganttHeight={Math.max(400, tasks.length * 60 + 100)} // 동적 높이
              columnWidth={columnWidth}
              locale="ko"
              barCornerRadius={3}
              barProgressColor="#4f7eff"
              barProgressSelectedColor="#3b5fd1"
              barBackgroundColor="#e5e7eb"
              barBackgroundSelectedColor="#d1d5db"
              handleWidth={8}
              fontFamily="Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
              fontSize="14px"
              rowHeight={50}
              todayColor="rgba(79, 126, 255, 0.1)"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              작업이 없습니다. 새 작업을 추가해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}