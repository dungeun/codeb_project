'use client'

import React from 'react'
import { Task as GanttTask } from 'gantt-task-react'

interface GanttChartSimplifiedProps {
  tasks: GanttTask[]
}

export default function GanttChartSimplified({ tasks }: GanttChartSimplifiedProps) {
  // 날짜 범위 계산
  const dates = tasks.flatMap(t => [t.start, t.end])
  const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date()
  const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date()
  
  // 전체 일수 계산
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (86400000)) + 30
  
  return (
    <div className="h-full bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">프로젝트 간트차트</h2>
      
      <div className="border rounded-lg overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
        <div className="overflow-auto h-full">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-64">작업명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">시작일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">종료일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">진행상황</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map(task => {
                const startOffset = Math.ceil((task.start.getTime() - minDate.getTime()) / 86400000)
                const duration = Math.ceil((task.end.getTime() - task.start.getTime()) / 86400000) + 1
                const leftPercent = (startOffset / totalDays) * 100
                const widthPercent = (duration / totalDays) * 100
                
                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {task.start.toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {task.end.toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative h-8 bg-gray-100 rounded" style={{ minWidth: '600px' }}>
                        <div
                          className="absolute h-full rounded flex items-center px-2 text-white text-xs font-medium"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            backgroundColor: task.styles?.backgroundColor || '#4f7eff',
                            minWidth: '80px'
                          }}
                        >
                          {task.progress}%
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}