'use client'

import React from 'react'
import { Gantt, Task, ViewMode } from 'gantt-task-react'
import "gantt-task-react/dist/index.css"

// 추가 CSS 스타일
const ganttStyles = `
  .gantt-container {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
  
  .gantt .gantt-task-list {
    background-color: white;
  }
  
  .gantt svg {
    background-color: white;
  }
`

interface GanttChartIsolatedProps {
  tasks: Task[]
  onTaskChange?: (task: Task) => void
  onTaskDelete?: (task: Task) => void
  onProgressChange?: (task: Task) => void
  onDateChange?: (task: Task) => void
}

export default function GanttChartIsolated({
  tasks,
  onTaskChange,
  onTaskDelete,
  onProgressChange,
  onDateChange
}: GanttChartIsolatedProps) {
  const [view, setView] = React.useState<ViewMode>(ViewMode.Month)
  
  // 디버깅용 로그
  React.useEffect(() => {
    console.log('GanttChartIsolated mounted with tasks:', tasks)
    console.log('Tasks length:', tasks.length)
    if (tasks.length > 0) {
      console.log('First task:', tasks[0])
    }
    
    // CSS 스타일 주입
    const style = document.createElement('style')
    style.textContent = ganttStyles
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [tasks])
  
  const columnWidth = view === ViewMode.Year ? 350 : 
                    view === ViewMode.Month ? 300 : 
                    view === ViewMode.Week ? 250 : 65

  return (
    <div style={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      contain: 'layout'
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>프로젝트 간트차트</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['Day', 'Week', 'Month', 'Year'].map(mode => (
            <button
              key={mode}
              onClick={() => setView(ViewMode[mode as keyof typeof ViewMode])}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: view === ViewMode[mode as keyof typeof ViewMode] ? '#4f7eff' : '#f3f4f6',
                color: view === ViewMode[mode as keyof typeof ViewMode] ? 'white' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              {mode === 'Day' ? '일' : mode === 'Week' ? '주' : mode === 'Month' ? '월' : '년'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative',
        minHeight: 0,
        padding: '1rem',
        backgroundColor: '#f9fafb' // 배경색 추가해서 영역 확인
      }}>
        {/* Fixed width container for gantt */}
        <div style={{
          minWidth: '1200px',
          height: '100%',
          position: 'relative',
          backgroundColor: 'white', // 배경색 추가
          border: '1px solid #e5e7eb' // 테두리 추가
        }}>
          {tasks.length > 0 ? (
            <>
              <div style={{ padding: '10px', backgroundColor: '#eee' }}>
                디버깅: {tasks.length}개의 태스크가 있습니다
              </div>
              <div className="gantt-container" style={{ width: '100%', height: 'calc(100% - 40px)' }}>
                <Gantt
              tasks={tasks}
              viewMode={view}
              onDateChange={onDateChange}
              onDelete={onTaskDelete}
              onProgressChange={onProgressChange}
              listCellWidth="155px"
              ganttHeight={Math.max(400, tasks.length * 50 + 100)}
              columnWidth={columnWidth}
              locale="ko"
              barCornerRadius={3}
              barProgressColor="#4f7eff"
              barProgressSelectedColor="#3b5fd1"
              barBackgroundColor="#e5e7eb"
              barBackgroundSelectedColor="#d1d5db"
              handleWidth={8}
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
              fontSize="14px"
              rowHeight={50}
              todayColor="rgba(79, 126, 255, 0.1)"
                />
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: '#6b7280'
            }}>
              작업이 없습니다. 새 작업을 추가해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}