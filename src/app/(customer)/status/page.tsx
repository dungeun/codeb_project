'use client'

import React from 'react'
import { motion } from 'framer-motion'

const projectPhases = [
  {
    id: 1,
    name: '요구사항 분석',
    status: 'completed',
    progress: 100,
    startDate: '2024-01-15',
    endDate: '2024-01-19',
    description: '프로젝트 요구사항 분석 및 기획 완료'
  },
  {
    id: 2,
    name: '디자인',
    status: 'completed',
    progress: 100,
    startDate: '2024-01-20',
    endDate: '2024-01-26',
    description: 'UI/UX 디자인 시안 완성 및 승인'
  },
  {
    id: 3,
    name: '개발',
    status: 'in_progress',
    progress: 65,
    startDate: '2024-01-27',
    endDate: '2024-02-16',
    description: '프론트엔드 및 백엔드 개발 진행중'
  },
  {
    id: 4,
    name: '테스트',
    status: 'pending',
    progress: 0,
    startDate: '2024-02-17',
    endDate: '2024-02-23',
    description: '기능 테스트 및 버그 수정'
  },
  {
    id: 5,
    name: '배포',
    status: 'pending',
    progress: 0,
    startDate: '2024-02-24',
    endDate: '2024-02-28',
    description: '서버 배포 및 도메인 연결'
  }
]

const recentUpdates = [
  {
    id: '1',
    title: '홈페이지 메인 섹션 개발 완료',
    description: '반응형 디자인으로 메인 섹션 구현이 완료되었습니다.',
    date: '2024-01-22',
    type: 'development'
  },
  {
    id: '2',
    title: '관리자 페이지 기능 추가',
    description: '콘텐츠 관리를 위한 관리자 페이지가 추가되었습니다.',
    date: '2024-01-21',
    type: 'development'
  },
  {
    id: '3',
    title: '디자인 시안 승인 완료',
    description: '2차 수정 디자인 시안이 최종 승인되었습니다.',
    date: '2024-01-20',
    type: 'design'
  }
]

export default function CustomerStatusPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'pending': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'in_progress': return '🔄'
      case 'pending': return '⏳'
      default: return '⏳'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'in_progress': return '진행중'
      case 'pending': return '대기중'
      default: return '대기중'
    }
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'development': return '💻'
      case 'design': return '🎨'
      case 'planning': return '📋'
      default: return '📌'
    }
  }

  const overallProgress = Math.round(
    projectPhases.reduce((acc, phase) => acc + phase.progress, 0) / projectPhases.length
  )

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">프로젝트 현황</h2>
        <p className="text-sm text-gray-600 mt-1">웹사이트 리뉴얼 프로젝트의 진행 상황을 확인하세요</p>
      </div>

      {/* 전체 진행률 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">전체 진행률</h3>
          <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
        </div>
        <div className="w-full bg-white rounded-full h-3 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-primary to-purple-600 h-3 rounded-full"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">45일</div>
            <div className="text-sm text-gray-600">총 기간</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">28일</div>
            <div className="text-sm text-gray-600">진행일</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">17일</div>
            <div className="text-sm text-gray-600">남은 기간</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 프로젝트 단계별 진행상황 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">단계별 진행상황</h3>
          <div className="space-y-4">
            {projectPhases.map((phase, index) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getStatusIcon(phase.status)}</span>
                    <h4 className="font-medium text-gray-900">{phase.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getStatusColor(phase.status)}`}>
                      {getStatusLabel(phase.status)}
                    </span>
                    <span className="text-sm text-gray-500">{phase.progress}%</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${phase.progress}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-2 rounded-full ${
                      phase.status === 'completed' ? 'bg-green-500' :
                      phase.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{phase.startDate}</span>
                  <span>{phase.endDate}</span>
                </div>
                
                <p className="text-sm text-gray-600">{phase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 최근 업데이트 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 업데이트</h3>
          <div className="space-y-4">
            {recentUpdates.map((update, index) => (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getUpdateIcon(update.type)}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{update.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{update.description}</p>
                    <span className="text-xs text-gray-500">{update.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 팀 정보 */}
          <div className="mt-8 bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">담당 팀</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">김</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">김개발</p>
                  <p className="text-xs text-gray-600">풀스택 개발자</p>
                </div>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-700">이</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">이디자인</p>
                  <p className="text-xs text-gray-600">UI/UX 디자이너</p>
                </div>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-700">박</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">박PM</p>
                  <p className="text-xs text-gray-600">프로젝트 매니저</p>
                </div>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}