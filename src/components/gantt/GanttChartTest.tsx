'use client'

import React from 'react'
import { Gantt, Task, ViewMode } from 'gantt-task-react'
import "gantt-task-react/dist/index.css"

export default function GanttChartTest() {
  // 하드코딩된 테스트 데이터
  const testTasks: Task[] = [
    {
      start: new Date(2025, 0, 1),
      end: new Date(2025, 0, 15),
      name: '테스트 태스크 1',
      id: 'Task 0',
      type: 'task',
      progress: 45,
      isDisabled: false,
      styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d' }
    },
    {
      start: new Date(2025, 0, 10),
      end: new Date(2025, 0, 20),
      name: '테스트 태스크 2',
      id: 'Task 1',
      type: 'task',
      progress: 25,
      isDisabled: false,
      styles: { progressColor: '#4f7eff', progressSelectedColor: '#3b5fd1' }
    }
  ]

  return (
    <div style={{ 
      width: '100%', 
      height: '600px', 
      padding: '20px',
      backgroundColor: 'white',
      border: '2px solid red'
    }}>
      <h2 style={{ marginBottom: '20px' }}>간트차트 테스트</h2>
      <div style={{ 
        width: '100%', 
        height: '500px',
        border: '1px solid #ccc'
      }}>
        <Gantt
          tasks={testTasks}
          viewMode={ViewMode.Month}
        />
      </div>
    </div>
  )
}