'use client'

import React from 'react'
import { Task as GanttTask } from 'gantt-task-react'

interface GanttChartFixedProps {
  tasks: GanttTask[]
}

export default function GanttChartFixed({ tasks }: GanttChartFixedProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* 헤더 */}
      <div style={{
        flexShrink: 0,
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
          프로젝트 간트차트
        </h2>
      </div>
      
      {/* 스크롤 가능한 영역 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          minWidth: '1200px',
          padding: '1rem'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ 
                  padding: '0.75rem',
                  textAlign: 'left',
                  borderBottom: '2px solid #e5e7eb',
                  width: '300px',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#f3f4f6',
                  zIndex: 10
                }}>
                  작업명
                </th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb', width: '100px' }}>시작일</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb', width: '100px' }}>종료일</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>1월</span>
                    <span>2월</span>
                    <span>3월</span>
                    <span>4월</span>
                    <span>5월</span>
                    <span>6월</span>
                    <span>7월</span>
                    <span>8월</span>
                    <span>9월</span>
                    <span>10월</span>
                    <span>11월</span>
                    <span>12월</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => {
                const startMonth = task.start.getMonth()
                const endMonth = task.end.getMonth()
                const startDay = task.start.getDate()
                const endDay = task.end.getDate()
                const duration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <tr key={task.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ 
                      padding: '0.75rem',
                      fontWeight: 500,
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'white',
                      borderRight: '1px solid #e5e7eb'
                    }}>
                      {task.name}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                      {task.start.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                      {task.end.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ 
                        position: 'relative',
                        height: '30px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '3px',
                          bottom: '3px',
                          left: `${(startMonth / 12) * 100}%`,
                          width: `${(duration / 365) * 100}%`,
                          backgroundColor: task.styles?.backgroundColor || '#4f7eff',
                          borderRadius: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '8px',
                          color: 'white',
                          fontSize: '0.75rem',
                          overflow: 'hidden'
                        }}>
                          <span style={{ whiteSpace: 'nowrap' }}>{task.progress}%</span>
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