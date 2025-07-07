'use client'

import React from 'react'

interface TimelineItem {
  id: string
  title: string
  description: string
  time: string
  status: 'complete' | 'active' | 'warning'
}

export default function Timeline() {
  const items: TimelineItem[] = [
    {
      id: '1',
      title: '메인 페이지 디자인 완료',
      description: '디자이너가 메인 페이지 디자인을 완료했습니다.',
      time: '2시간 전',
      status: 'complete',
    },
    {
      id: '2',
      title: '데이터베이스 구조 설계',
      description: '개발팀에서 DB 스키마를 작성 중입니다.',
      time: '5시간 전',
      status: 'active',
    },
    {
      id: '3',
      title: '클라이언트 피드백 요청',
      description: '로고 디자인에 대한 추가 피드백이 필요합니다.',
      time: '1일 전',
      status: 'warning',
    },
    {
      id: '4',
      title: '프로젝트 킥오프 미팅',
      description: '전체 팀과 프로젝트 시작 미팅을 진행했습니다.',
      time: '3일 전',
      status: 'complete',
    },
  ]

  const getStatusColor = (status: TimelineItem['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-success border-success'
      case 'warning':
        return 'bg-warning border-warning'
      default:
        return 'bg-primary border-primary'
    }
  }

  return (
    <div className="card h-fit">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <span>📋</span>
        <span>최근 활동</span>
      </h3>
      
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className="relative">
            {/* Connecting line */}
            {index < items.length - 1 && (
              <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200" />
            )}
            
            <div className="flex gap-4">
              {/* Timeline dot */}
              <div className={`
                relative z-10 w-4 h-4 rounded-full border-4 bg-white
                ${getStatusColor(item.status)}
              `} />
              
              {/* Content */}
              <div className="flex-1 -mt-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span>🕒</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}