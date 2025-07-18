'use client'

import React, { useState } from 'react'
import { Task as GanttTask } from 'gantt-task-react'

interface GanttChartFinalProps {
  tasks: GanttTask[]
  onTaskChange?: (task: GanttTask) => void
  onTaskDelete?: (task: GanttTask) => void
  onProgressChange?: (task: GanttTask) => void
  onDateChange?: (task: GanttTask) => void
}

export default function GanttChartFinal({
  tasks,
  onTaskChange,
  onTaskDelete,
  onProgressChange,
  onDateChange
}: GanttChartFinalProps) {
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('month')
  
  // 날짜 범위 계산
  const allDates = tasks.flatMap(task => [task.start, task.end])
  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date()
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date()
  
  // 날짜 범위에 여유 추가
  minDate.setDate(minDate.getDate() - 7)
  maxDate.setDate(maxDate.getDate() + 7)
  
  const getDaysInRange = () => {
    const days = []
    const current = new Date(minDate)
    while (current <= maxDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }
  
  const getMonthsInRange = () => {
    const months = []
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    while (current <= maxDate) {
      months.push({
        date: new Date(current),
        days: new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
      })
      current.setMonth(current.getMonth() + 1)
    }
    return months
  }
  
  const calculateTaskPosition = (task: GanttTask) => {
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    const startDays = Math.ceil((task.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    const left = (startDays / totalDays) * 100
    const width = (duration / totalDays) * 100
    
    return { left: `${left}%`, width: `${width}%` }
  }
  
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
  
  const days = getDaysInRange()
  const months = getMonthsInRange()
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          프로젝트 간트차트
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['day', 'week', 'month', 'year'].map(v => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: view === v ? '#4f7eff' : '#f3f4f6',
                color: view === v ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {v === 'day' ? '일' : v === 'week' ? '주' : v === 'month' ? '월' : '년'}
            </button>
          ))}
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'auto'
      }}>
        {/* 태스크 리스트 */}
        <div style={{
          width: '300px',
          borderRight: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          {/* 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 100px',
            padding: '0.75rem 1rem',
            borderBottom: '2px solid #e5e7eb',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#4b5563',
            position: 'sticky',
            top: 0,
            backgroundColor: '#f9fafb'
          }}>
            <div>작업명</div>
            <div>시작일</div>
            <div>종료일</div>
          </div>
          
          {/* 태스크 행 */}
          {tasks.map((task, index) => (
            <div
              key={task.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
              }}
            >
              <div style={{ fontWeight: 500 }}>{task.name}</div>
              <div style={{ color: '#6b7280' }}>
                {task.start.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
              </div>
              <div style={{ color: '#6b7280' }}>
                {task.end.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
        
        {/* 간트 차트 영역 */}
        <div style={{
          flex: 1,
          position: 'relative',
          minWidth: '800px'
        }}>
          {/* 날짜 헤더 */}
          <div style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            borderBottom: '2px solid #e5e7eb',
            zIndex: 10
          }}>
            {/* 월 표시 */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {months.map((month, index) => (
                <div
                  key={index}
                  style={{
                    flex: month.days,
                    padding: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRight: '1px solid #e5e7eb'
                  }}
                >
                  {month.date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                </div>
              ))}
            </div>
            
            {/* 일 표시 */}
            <div style={{
              display: 'flex',
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              {days.map((day, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    minWidth: '30px',
                    padding: '0.25rem',
                    textAlign: 'center',
                    borderRight: '1px solid #f3f4f6',
                    backgroundColor: day.getDay() === 0 || day.getDay() === 6 ? '#f9fafb' : 'white'
                  }}
                >
                  {day.getDate()}
                </div>
              ))}
            </div>
          </div>
          
          {/* 태스크 바 */}
          {tasks.map((task, index) => {
            const position = calculateTaskPosition(task)
            return (
              <div
                key={task.id}
                style={{
                  height: '44px',
                  borderBottom: '1px solid #e5e7eb',
                  position: 'relative',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                }}
              >
                {/* 주말 배경 */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex'
                }}>
                  {days.map((day, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor: (day.getDay() === 0 || day.getDay() === 6) ? 'rgba(0,0,0,0.02)' : 'transparent'
                      }}
                    />
                  ))}
                </div>
                
                {/* 태스크 바 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    height: '28px',
                    left: position.left,
                    width: position.width,
                    backgroundColor: task.styles?.backgroundColor || '#4f7eff',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '8px',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap' }}>{task.name}</span>
                  {task.progress !== undefined && (
                    <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                      {task.progress}%
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 범례 */}
      <div style={{
        padding: '0.75rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '1rem',
        fontSize: '0.75rem',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }}></div>
          <span>긴급</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '12px', backgroundColor: '#f97316', borderRadius: '2px' }}></div>
          <span>높음</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
          <span>보통</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
          <span>낮음</span>
        </div>
      </div>
    </div>
  )
}