'use client'

import React from 'react'

export default function GanttChartHTML() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        간트차트 HTML 테스트
      </h1>
      
      <div style={{ 
        width: '100%', 
        height: '200px', 
        position: 'relative',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc'
      }}>
        {/* 수동으로 간트차트 모양 구현 */}
        <div style={{ display: 'flex', height: '100%' }}>
          {/* 태스크 목록 */}
          <div style={{ 
            width: '200px', 
            borderRight: '1px solid #ccc',
            padding: '10px'
          }}>
            <div style={{ padding: '5px 0' }}>Task 1</div>
            <div style={{ padding: '5px 0' }}>Task 2</div>
          </div>
          
          {/* 간트 바 영역 */}
          <div style={{ flex: 1, position: 'relative', padding: '10px' }}>
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '150px',
              height: '30px',
              backgroundColor: '#4f7eff',
              borderRadius: '4px'
            }} />
            <div style={{
              position: 'absolute',
              top: '45px',
              left: '50px',
              width: '200px',
              height: '30px',
              backgroundColor: '#10b981',
              borderRadius: '4px'
            }} />
          </div>
        </div>
      </div>
      
      <p style={{ marginTop: '20px' }}>
        위에 간단한 간트차트 모양이 보인다면, HTML/CSS는 정상적으로 렌더링됩니다.
      </p>
    </div>
  )
}