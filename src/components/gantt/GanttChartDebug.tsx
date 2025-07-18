'use client'

import React, { useEffect } from 'react'
import { Gantt, Task, ViewMode } from 'gantt-task-react'
import '@/styles/gantt.css'

export default function GanttChartDebug() {
  useEffect(() => {
    console.log('GanttChartDebug mounted')
    
    // CSS가 로드되었는지 확인
    const styles = document.styleSheets
    for (let i = 0; i < styles.length; i++) {
      try {
        const href = styles[i].href
        if (href && href.includes('gantt')) {
          console.log('Gantt CSS found:', href)
        }
      } catch (e) {
        // Cross-origin 에러 무시
      }
    }
  }, [])

  const tasks: Task[] = [
    {
      start: new Date(2025, 0, 1),
      end: new Date(2025, 0, 15),
      name: 'Task 1',
      id: '1',
      type: 'task',
      progress: 45,
    }
  ]

  return (
    <div>
      <h1 style={{ color: 'red', fontSize: '24px', marginBottom: '20px' }}>
        간트차트 디버그 테스트
      </h1>
      
      <div style={{ 
        width: '100%', 
        height: '400px', 
        border: '3px solid blue',
        padding: '10px',
        backgroundColor: 'yellow'
      }}>
        <p>간트차트가 이 노란 박스 안에 나타나야 합니다</p>
        
        <div style={{ marginTop: '20px' }}>
          <Gantt
            tasks={tasks}
            viewMode={ViewMode.Day}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>디버깅 정보:</h2>
        <ul>
          <li>Task count: {tasks.length}</li>
          <li>ViewMode: {ViewMode.Day}</li>
          <li>Component loaded: Yes</li>
        </ul>
      </div>
    </div>
  )
}