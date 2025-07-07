'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import aiService, { AIAnalysis } from '@/services/ai-service'
import { useAuth } from '@/lib/auth-context'

interface AIInsightsProps {
  projectId?: string
  compact?: boolean
}

export default function AIInsights({ projectId, compact = false }: AIInsightsProps) {
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [prediction, setPrediction] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'analysis' | 'prediction' | 'recommendations'>('analysis')

  useEffect(() => {
    loadInsights()
  }, [projectId])

  const loadInsights = async () => {
    setIsLoading(true)
    try {
      // 프로젝트 분석 로드
      const projectAnalysis = await aiService.analyzeProject(projectId || 'default')
      setAnalysis(projectAnalysis)

      // 완료 예측 로드
      const completionPrediction = await aiService.predictProjectCompletion(projectId || 'default')
      setPrediction(completionPrediction)
    } catch (error) {
      console.error('Failed to load AI insights:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">AI 인사이트</h3>
          <span className="text-2xl">🤖</span>
        </div>
        
        {analysis && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(analysis.priority || 'medium')}`}>
                {analysis.priority === 'high' ? '중요' : analysis.priority === 'medium' ? '보통' : '낮음'}
              </span>
              <p className="text-sm font-medium text-gray-900">{analysis.title}</p>
            </div>
            
            <p className="text-sm text-gray-600">{analysis.summary}</p>
            
            {analysis.metrics && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="text-center">
                  <p className="text-xs text-gray-600">진행률</p>
                  <p className="text-lg font-bold text-primary">{analysis.metrics.progress}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">품질 점수</p>
                  <p className="text-lg font-bold text-green-600">{analysis.metrics.quality}점</p>
                </div>
              </div>
            )}
            
            <button className="w-full btn btn-secondary text-sm mt-3">
              상세 분석 보기
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* 헤더 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">AI 프로젝트 인사이트</h2>
            <p className="text-sm text-gray-600 mt-1">인공지능이 분석한 프로젝트 현황과 예측</p>
          </div>
          <button
            onClick={loadInsights}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="새로고침"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b">
        <div className="flex">
          {[
            { id: 'analysis', label: '현황 분석', icon: '📊' },
            { id: 'prediction', label: '예측', icon: '🔮' },
            { id: 'recommendations', label: '권장사항', icon: '💡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'analysis' && analysis && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <span className={`px-3 py-1 text-sm rounded-full ${getPriorityColor(analysis.priority || 'medium')}`}>
                  {analysis.priority === 'high' ? '높은 중요도' : analysis.priority === 'medium' ? '중간 중요도' : '낮은 중요도'}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{analysis.title}</h3>
                <p className="text-gray-600">{analysis.summary}</p>
              </div>

              {analysis.details && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">상세 분석</h4>
                  <ul className="space-y-1">
                    {analysis.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                  {Object.entries(analysis.metrics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-xs text-gray-600 capitalize">{key}</p>
                      <p className="text-xl font-bold text-gray-900">
                        {typeof value === 'number' ? 
                          (key.includes('progress') || key.includes('efficiency') || key.includes('budget') ? `${value}%` : value) 
                          : value
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'prediction' && prediction && (
            <motion.div
              key="prediction"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">프로젝트 완료 예측</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">예상 완료일</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatDate(new Date(prediction.estimatedDate))}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">예측 신뢰도</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${prediction.confidence * 100}%` }}
                        />
                      </div>
                      <span className={`font-bold ${getConfidenceColor(prediction.confidence)}`}>
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {prediction.risks && prediction.risks.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">잠재적 위험 요소</h4>
                  <div className="space-y-2">
                    {prediction.risks.map((risk: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <span className="text-red-500">⚠️</span>
                        <p className="text-sm text-gray-700">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'recommendations' && analysis?.recommendations && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">AI 권장사항</h3>
                <p className="text-sm text-gray-600 mb-4">
                  프로젝트 성공을 위한 AI의 맞춤형 제안입니다.
                </p>
              </div>

              <div className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                  >
                    <span className="text-xl flex-shrink-0">
                      {idx === 0 ? '🎯' : idx === 1 ? '📈' : '✨'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{rec}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  💡 <strong>팁:</strong> AI 권장사항은 프로젝트 데이터와 업계 베스트 프랙티스를 기반으로 생성됩니다.
                  정기적으로 확인하여 프로젝트 효율성을 극대화하세요.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}