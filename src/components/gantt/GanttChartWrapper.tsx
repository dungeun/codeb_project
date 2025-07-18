'use client'

import React from 'react'
import GanttChartPro from './GanttChartPro'
import { Task } from 'gantt-task-react'

interface GanttChartWrapperProps {
  tasks: Task[]
  onTaskChange?: (task: Task) => void
  onTaskDelete?: (task: Task) => void
  onProgressChange?: (task: Task) => void
  onDateChange?: (task: Task) => void
}

export default function GanttChartWrapper(props: GanttChartWrapperProps) {
  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm">
      {/* 간트차트 스크롤 컨테이너 - iframe처럼 작동 */}
      <div 
        className="flex-1 overflow-auto"
        style={{
          // 스크롤 영역 격리
          contain: 'layout size style',
          // 최대 높이 제한
          maxHeight: 'calc(100vh - 400px)'
        }}
      >
        {/* 간트차트 내부 컨테이너 - 실제 너비 */}
        <div style={{ minWidth: '1500px', padding: '1rem' }}>
          <GanttChartPro {...props} />
        </div>
      </div>
    </div>
  )
}