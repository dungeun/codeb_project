'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import WorkflowBuilder from '@/components/automation/WorkflowBuilder'
import { Workflow, WorkflowTemplate } from '@/types/automation'
import { useAuth } from '@/lib/auth-context'

// Mock 워크플로우 템플릿
const workflowTemplates: WorkflowTemplate[] = [
  {
    id: '1',
    name: '프로젝트 완료 알림',
    description: '프로젝트가 완료되면 관련자에게 자동으로 알림을 보냅니다',
    category: '프로젝트 관리',
    icon: '📋',
    trigger: { type: 'event' },
    actions: [{ type: 'notification' }, { type: 'email' }]
  },
  {
    id: '2',
    name: '일일 리포트 생성',
    description: '매일 오전 9시에 프로젝트 진행 상황 리포트를 생성합니다',
    category: '리포팅',
    icon: '📊',
    trigger: { type: 'schedule' },
    actions: [{ type: 'api' }]
  },
  {
    id: '3',
    name: '작업 지연 알림',
    description: '작업이 마감일을 지나면 담당자에게 알림을 보냅니다',
    category: '작업 관리',
    icon: '⏰',
    trigger: { type: 'event' },
    actions: [{ type: 'notification' }, { type: 'task' }]
  },
  {
    id: '4',
    name: '신규 고객 온보딩',
    description: '새로운 고객이 등록되면 환영 이메일과 작업을 생성합니다',
    category: '고객 관리',
    icon: '👋',
    trigger: { type: 'event' },
    actions: [{ type: 'email' }, { type: 'task' }]
  }
]

// Mock 워크플로우 데이터
const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: '주간 리포트 자동 생성',
    description: '매주 월요일 오전 9시에 주간 리포트를 생성하고 팀에게 전송',
    status: 'active',
    trigger: {
      id: '1',
      type: 'schedule',
      name: '일정 기반',
      config: { schedule: '0 9 * * 1' }
    },
    actions: [
      {
        id: '1',
        type: 'api',
        name: 'API 호출',
        config: { url: '/api/reports/weekly' }
      },
      {
        id: '2',
        type: 'email',
        name: '이메일 전송',
        config: { to: 'team@company.com', subject: '주간 리포트' }
      }
    ],
    createdBy: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    lastRun: new Date('2024-01-22'),
    runCount: 4
  }
]

export default function AutomationPage() {
  const { userProfile } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | undefined>()
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | undefined>()

  // 권한 체크
  if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'developer') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600">자동화 기능은 팀 멤버 이상만 사용할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  const filteredWorkflows = workflows.filter(workflow => 
    filterStatus === 'all' || workflow.status === filterStatus
  )

  const handleSaveWorkflow = (workflowData: Partial<Workflow>) => {
    if (editingWorkflow) {
      // 수정
      setWorkflows(workflows.map(w => 
        w.id === editingWorkflow.id 
          ? { ...editingWorkflow, ...workflowData, updatedAt: new Date() }
          : w
      ))
    } else {
      // 생성
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        ...workflowData as any,
        createdBy: userProfile?.displayName || 'Unknown',
        createdAt: new Date(),
        updatedAt: new Date(),
        runCount: 0
      }
      setWorkflows([...workflows, newWorkflow])
    }
    setShowBuilder(false)
    setEditingWorkflow(undefined)
  }

  const toggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' }
        : w
    ))
  }

  const deleteWorkflow = (workflowId: string) => {
    if (confirm('정말로 이 워크플로우를 삭제하시겠습니까?')) {
      setWorkflows(workflows.filter(w => w.id !== workflowId))
    }
  }

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowBuilder(false)
              setEditingWorkflow(undefined)
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ← 뒤로
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {editingWorkflow ? '워크플로우 수정' : '워크플로우 생성'}
          </h1>
        </div>

        <WorkflowBuilder
          workflow={editingWorkflow}
          onSave={handleSaveWorkflow}
          onCancel={() => {
            setShowBuilder(false)
            setEditingWorkflow(undefined)
            setSelectedTemplate(undefined)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">자동화 워크플로우</h1>
          <p className="text-gray-600 mt-1">반복적인 작업을 자동화하여 업무 효율성을 높이세요.</p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/automation/runs"
            className="btn btn-secondary"
          >
            실행 이력
          </Link>
          <button
            onClick={() => setShowBuilder(true)}
            className="btn btn-primary"
          >
            + 워크플로우 생성
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 워크플로우</p>
              <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
            </div>
            <span className="text-3xl">🔧</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">활성화</p>
              <p className="text-2xl font-bold text-green-600">
                {workflows.filter(w => w.status === 'active').length}
              </p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번 주 실행</p>
              <p className="text-2xl font-bold text-blue-600">
                {workflows.reduce((sum, w) => sum + w.runCount, 0)}
              </p>
            </div>
            <span className="text-3xl">⚡</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">절약된 시간</p>
              <p className="text-2xl font-bold text-purple-600">42시간</p>
            </div>
            <span className="text-3xl">⏱️</span>
          </div>
        </div>
      </div>

      {/* 템플릿 섹션 */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">빠른 시작 템플릿</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                // 템플릿 기반 워크플로우 생성
                setSelectedTemplate(template)
                setShowBuilder(true)
              }}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all text-left"
            >
              <div className="text-3xl mb-2">{template.icon}</div>
              <h3 className="font-medium text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <div className="mt-3 text-xs text-gray-500">
                {template.category}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">상태:</span>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '전체' : status === 'active' ? '활성' : '비활성'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 워크플로우 목록 */}
      <div className="space-y-4">
        {filteredWorkflows.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              워크플로우가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              첫 번째 워크플로우를 만들어 업무를 자동화해보세요.
            </p>
            <button
              onClick={() => setShowBuilder(true)}
              className="btn btn-primary"
            >
              워크플로우 생성하기
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredWorkflows.map((workflow) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {workflow.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        workflow.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {workflow.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{workflow.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>🔧</span>
                        <span>트리거: {workflow.trigger.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>⚡</span>
                        <span>액션: {workflow.actions.length}개</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🔄</span>
                        <span>실행: {workflow.runCount}회</span>
                      </div>
                      {workflow.lastRun && (
                        <div className="flex items-center gap-1">
                          <span>⏰</span>
                          <span>마지막 실행: {new Date(workflow.lastRun).toLocaleDateString('ko-KR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleWorkflowStatus(workflow.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        workflow.status === 'active'
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={workflow.status === 'active' ? '비활성화' : '활성화'}
                    >
                      {workflow.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setEditingWorkflow(workflow)
                        setShowBuilder(true)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="수정"
                    >
                      ✏️
                    </button>
                    
                    <button
                      onClick={() => deleteWorkflow(workflow.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}