'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import AIAssistant from '@/components/ai/AIAssistant'
import AIInsights from '@/components/ai/AIInsights'
import { useAuth } from '@/lib/auth-context'
import { AIAnalysis } from '@/services/ai-service'

// 샘플 인사이트 데이터
const sampleInsights: AIAnalysis[] = [
  {
    type: 'project',
    title: '프로젝트 진행 상황',
    summary: '현재 프로젝트가 순조롭게 진행되고 있으며 일정보다 2일 앞서고 있습니다.',
    priority: 'medium',
    details: [
      '전체 진행률 72%로 계획 대비 5% 초과 달성',
      '개발 단계가 예정보다 빠르게 진행 중',
      '품질 지표 모든 항목에서 기준치 이상'
    ],
    metrics: {
      progress: 72,
      efficiency: 88,
      quality: 95
    },
    recommendations: [
      '다음 스프린트 계획 시 리소스 재배치 검토',
      '품질 관리 프로세스 문서화',
      '고객 피드백 수집 주기 단축'
    ]
  },
  {
    type: 'performance',
    title: '팀 성과 분석',
    summary: '팀 생산성이 지난달 대비 15% 향상되었습니다.',
    priority: 'low',
    details: [
      '코드 리뷰 시간 30% 단축',
      '버그 해결 속도 25% 개선',
      '팀 협업 점수 4.5/5.0'
    ],
    metrics: {
      productivity: 115,
      codeQuality: 92,
      collaboration: 90
    }
  },
  {
    type: 'risk',
    title: '잠재적 위험 요소',
    summary: '다음 주 예정된 배포에 대한 준비가 필요합니다.',
    priority: 'high',
    details: [
      '테스트 커버리지 65%로 목표치 미달',
      '핵심 개발자 1명 휴가 예정',
      '외부 API 응답 시간 증가 감지'
    ],
    recommendations: [
      '자동화 테스트 확대 실시',
      '백업 담당자 사전 브리핑',
      'API 캐싱 전략 수립'
    ]
  }
]

// 기능 카드 데이터
const features = [
  {
    icon: '🤖',
    title: 'AI 어시스턴트',
    description: '프로젝트 관련 모든 질문에 즉시 답변',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: '📊',
    title: '스마트 분석',
    description: '실시간 프로젝트 데이터 분석 및 인사이트',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: '🎯',
    title: '예측 모델링',
    description: '프로젝트 완료 시기 및 리스크 예측',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: '💡',
    title: '자동 추천',
    description: '상황에 맞는 최적의 액션 제안',
    color: 'from-green-500 to-emerald-500'
  }
]

export default function AIPage() {
  const { user } = useAuth()
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<AIAnalysis | null>(null)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">AI 인텔리전스</h1>
        <p className="text-white/80 mb-6">
          인공지능이 프로젝트를 분석하고 최적의 솔루션을 제안합니다
        </p>
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          AI 어시스턴트 시작하기
        </button>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setIsAssistantOpen(true)}
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
              {feature.icon}
            </div>
            <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Insights */}
      <AIInsights 
        insights={sampleInsights}
        onInsightClick={setSelectedInsight}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">AI 사용량</h3>
            <span className="text-2xl">📈</span>
          </div>
          <div className="text-3xl font-bold text-primary mb-1">1,234</div>
          <div className="text-sm text-gray-600">이번 달 AI 요청</div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">↑ 23%</span>
            <span className="text-gray-500 ml-1">지난달 대비</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">정확도</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">94.5%</div>
          <div className="text-sm text-gray-600">예측 정확도</div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '94.5%' }}></div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">절감 효과</h3>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-primary mb-1">32%</div>
          <div className="text-sm text-gray-600">시간 절감</div>
          <div className="mt-4 text-sm text-gray-500">
            AI 자동화로 월 160시간 절약
          </div>
        </motion.div>
      </div>

      {/* Recent AI Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold mb-4">최근 AI 활동</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                📊
              </div>
              <div>
                <div className="font-medium">프로젝트 분석 완료</div>
                <div className="text-sm text-gray-500">웹사이트 리뉴얼 프로젝트</div>
              </div>
            </div>
            <span className="text-sm text-gray-500">5분 전</span>
          </div>
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                ✅
              </div>
              <div>
                <div className="font-medium">작업 우선순위 재정렬</div>
                <div className="text-sm text-gray-500">긴급도 기반 자동 정렬</div>
              </div>
            </div>
            <span className="text-sm text-gray-500">1시간 전</span>
          </div>
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                💡
              </div>
              <div>
                <div className="font-medium">코드 리뷰 제안</div>
                <div className="text-sm text-gray-500">성능 개선 포인트 3개 발견</div>
              </div>
            </div>
            <span className="text-sm text-gray-500">2시간 전</span>
          </div>
        </div>
      </motion.div>

      {/* AI Assistant Modal */}
      <AIAssistant 
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedInsight(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{selectedInsight.title}</h3>
              <button
                onClick={() => setSelectedInsight(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">{selectedInsight.summary}</p>
              
              <div>
                <h4 className="font-medium mb-2">상세 내용</h4>
                <ul className="space-y-1">
                  {selectedInsight.details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedInsight.recommendations && (
                <div>
                  <h4 className="font-medium mb-2">추천 액션</h4>
                  <ul className="space-y-1">
                    {selectedInsight.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedInsight.metrics && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {Object.entries(selectedInsight.metrics).map(([key, value]) => (
                    <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{value}%</div>
                      <div className="text-sm text-gray-600 capitalize">{key}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}