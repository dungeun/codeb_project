'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WorkflowRun, WorkflowLog } from '@/types/automation'
import workflowService from '@/services/workflow-service'

interface WorkflowMonitorProps {
  workflowId?: string
  compact?: boolean
}

export default function WorkflowMonitor({ workflowId, compact = false }: WorkflowMonitorProps) {
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRuns()
    const interval = setInterval(loadRuns, 5000) // 5초마다 갱신
    return () => clearInterval(interval)
  }, [workflowId])

  const loadRuns = async () => {
    setIsLoading(true)
    try {
      // 실시간 실행 중인 워크플로우
      const runningWorkflows = workflowService.getRunningWorkflows()
      
      // 과거 실행 이력 (실제 구현에서는 API 호출)
      const history = await workflowService.getWorkflowHistory(workflowId || '', 10)
      
      // Mock 데이터
      const mockHistory: WorkflowRun[] = [
        {
          id: '1',
          workflowId: workflowId || '1',
          status: 'completed',
          startedAt: new Date('2024-01-22T09:00:00'),
          completedAt: new Date('2024-01-22T09:00:15'),
          logs: [
            {
              timestamp: new Date('2024-01-22T09:00:00'),
              actionId: 'system',
              status: 'success',
              message: '워크플로우 실행 시작'
            },
            {
              timestamp: new Date('2024-01-22T09:00:05'),
              actionId: 'action-1',
              status: 'success',
              message: 'API 호출 성공'
            },
            {
              timestamp: new Date('2024-01-22T09:00:10'),
              actionId: 'action-2',
              status: 'success',
              message: '이메일 전송 완료'
            },
            {
              timestamp: new Date('2024-01-22T09:00:15'),
              actionId: 'system',
              status: 'success',
              message: '워크플로우 실행 완료'
            }
          ]
        },
        {
          id: '2',
          workflowId: workflowId || '1',
          status: 'failed',
          startedAt: new Date('2024-01-21T09:00:00'),
          completedAt: new Date('2024-01-21T09:00:08'),
          error: 'API 호출 실패',
          logs: [
            {
              timestamp: new Date('2024-01-21T09:00:00'),
              actionId: 'system',
              status: 'success',
              message: '워크플로우 실행 시작'
            },
            {
              timestamp: new Date('2024-01-21T09:00:05'),
              actionId: 'action-1',
              status: 'error',
              message: 'API 호출 실패: Connection timeout'
            }
          ]
        }
      ]
      
      setRuns([...runningWorkflows, ...mockHistory])
    } catch (error) {
      console.error('Failed to load workflow runs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: WorkflowRun['status']) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: WorkflowRun['status']) => {
    switch (status) {
      case 'running': return '🔄'
      case 'completed': return '✅'
      case 'failed': return '❌'
      default: return '❓'
    }
  }

  const getLogIcon = (log: WorkflowLog) => {
    if (log.actionId === 'system') return '⚙️'
    if (log.status === 'error') return '❌'
    if (log.status === 'success') return '✅'
    return '⏭️'
  }

  const formatDuration = (start: Date, end?: Date) => {
    const duration = (end || new Date()).getTime() - start.getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`
    }
    return `${seconds}초`
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-3">최근 실행</h3>
        <div className="space-y-2">
          {runs.slice(0, 3).map((run) => (
            <div key={run.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(run.status)}`}>
                  {getStatusIcon(run.status)} {run.status === 'running' ? '실행 중' : run.status === 'completed' ? '완료' : '실패'}
                </span>
                <span className="text-sm text-gray-600">
                  {formatDuration(run.startedAt, run.completedAt)}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(run.startedAt).toLocaleTimeString('ko-KR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">워크플로우 실행 모니터</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl">🔄</div>
            <p className="text-gray-600 mt-2">로딩 중...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>실행 이력이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedRun?.id === run.id ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRun(run)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(run.status)}`}>
                        {getStatusIcon(run.status)} {run.status === 'running' ? '실행 중' : run.status === 'completed' ? '완료' : '실패'}
                      </span>
                      <span className="text-sm text-gray-600">
                        실행 시간: {formatDuration(run.startedAt, run.completedAt)}
                      </span>
                    </div>
                    {run.error && (
                      <p className="text-sm text-red-600 mt-1">오류: {run.error}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(run.startedAt).toLocaleString('ko-KR')}
                  </span>
                </div>

                {run.status === 'running' && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-pulse">●</div>
                      <span>실행 중...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 실행 로그 상세 */}
      <AnimatePresence>
        {selectedRun && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4">실행 로그</h3>
            <div className="space-y-2">
              {selectedRun.logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    log.status === 'error' ? 'bg-red-50' : 'bg-gray-50'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{getLogIcon(log)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${log.status === 'error' ? 'text-red-700' : 'text-gray-700'}`}>
                      {log.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                    </p>
                    {log.data && (
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}