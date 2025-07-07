'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics'
import { useAuth } from '@/lib/auth-context'
import analyticsService from '@/services/analytics-service'
import { AnalyticsMetric, TrendData } from '@/types/analytics'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([])
  const [insights, setInsights] = useState<string[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const [metricsData, insightsData, trendsData] = await Promise.all([
        analyticsService.getKeyMetrics(),
        analyticsService.generateInsights({}),
        analyticsService.getProjectTrends('1', 'progress')
      ])

      setMetrics(metricsData)
      setInsights(insightsData)
      setTrendData(trendsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMetricIcon = (metricName: string) => {
    if (metricName.includes('완료')) return '📈'
    if (metricName.includes('예산')) return '💰'
    if (metricName.includes('리소스')) return '👥'
    if (metricName.includes('품질')) return '⭐'
    return '📊'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '→'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📊</div>
          <p className="text-gray-600">분석 데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">예측 분석 대시보드</h1>
        <p className="text-gray-600 mt-1">AI 기반 프로젝트 예측 분석 및 인사이트</p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">{metric.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-900">{metric.value}%</p>
                  <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                    {getTrendIcon(metric.trend)} {Math.abs(metric.change)}%
                  </span>
                </div>
              </div>
              <span className="text-2xl">{getMetricIcon(metric.name)}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">예측값</span>
                <span className="font-medium text-primary">{metric.prediction}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metric.confidence * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">
                신뢰도 {Math.round(metric.confidence * 100)}%
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI 인사이트 */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🤖</span>
          <h2 className="text-lg font-semibold text-gray-900">AI 인사이트</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-4 bg-white/70 backdrop-blur-sm rounded-lg"
            >
              <span className="text-purple-500 mt-0.5">💡</span>
              <p className="text-sm text-gray-700">{insight}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 트렌드 차트 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 진행 트렌드</h2>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f7eff" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4f7eff" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value}%`}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#4f7eff" 
              fillOpacity={1} 
              fill="url(#trendGradient)"
              strokeDasharray={(data: any) => data.predicted ? "5 5" : "0"}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary"></div>
            <span>실제 데이터</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary border-dashed" style={{ borderBottom: '2px dashed' }}></div>
            <span>예측 데이터</span>
          </div>
        </div>
      </div>

      {/* 상세 예측 분석 */}
      <PredictiveAnalytics projectId="1" />
    </div>
  )
}