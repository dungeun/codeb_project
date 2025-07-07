'use client'

import React from 'react'

interface Step {
  id: number
  label: string
  status: 'completed' | 'active' | 'pending'
}

export default function ProjectProgress() {
  const steps: Step[] = [
    { id: 1, label: '기획', status: 'completed' },
    { id: 2, label: '디자인', status: 'completed' },
    { id: 3, label: '개발', status: 'active' },
    { id: 4, label: '테스트', status: 'pending' },
    { id: 5, label: '배포', status: 'pending' },
  ]

  const progress = 45

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold">현재 프로젝트 진행 상황</h2>
        <div className="text-sm text-gray-600">
          전체 진행률 <strong className="text-primary">{progress}%</strong>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative mb-12">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` }}
        />
        
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 relative z-10
                ${step.status === 'completed' ? 'bg-success text-white' : 
                  step.status === 'active' ? 'bg-primary text-white ring-4 ring-primary/20' : 
                  'bg-gray-100 text-gray-400'}
              `}>
                {step.status === 'completed' ? '✓' : step.id}
              </div>
              <span className={`
                mt-2 text-sm
                ${step.status === 'active' ? 'text-gray-900 font-medium' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">프로젝트 완료까지</span>
          <span className="text-sm font-medium text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <a href="#files" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-all text-center">
          <span className="block text-2xl mb-2">📁</span>
          <span className="text-sm font-medium">파일 확인</span>
        </a>
        <a href="#chat" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-all text-center">
          <span className="block text-2xl mb-2">💬</span>
          <span className="text-sm font-medium">문의하기</span>
        </a>
        <a href="#invoice" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-all text-center">
          <span className="block text-2xl mb-2">📄</span>
          <span className="text-sm font-medium">청구서</span>
        </a>
      </div>
    </div>
  )
}