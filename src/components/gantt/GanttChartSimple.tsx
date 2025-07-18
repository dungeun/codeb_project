'use client'

import React from 'react'
import { Gantt, Task, ViewMode } from 'gantt-task-react'
import "gantt-task-react/dist/index.css"

interface GanttChartSimpleProps {
  tasks: Task[]
}

export default function GanttChartSimple({ tasks }: GanttChartSimpleProps) {
  console.log('GanttChartSimple rendering with tasks:', tasks)
  
  if (!tasks || tasks.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        No tasks available
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>간트차트 (태스크 수: {tasks.length})</h2>
      <div style={{ height: '500px', overflow: 'auto' }}>
        <Gantt
          tasks={tasks}
          viewMode={ViewMode.Month}
          locale="ko"
        />
      </div>
    </div>
  )
}