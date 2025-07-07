'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Workflow, WorkflowTrigger, WorkflowAction } from '@/types/automation'

// 트리거 타입 설정
const triggerTypes = [
  { value: 'schedule', label: '일정 기반', icon: '📅', description: '정해진 시간에 자동 실행' },
  { value: 'event', label: '이벤트 기반', icon: '⚡', description: '특정 이벤트 발생 시 실행' },
  { value: 'webhook', label: '웹훅', icon: '🔗', description: '외부 시스템 연동' },
  { value: 'manual', label: '수동 실행', icon: '👆', description: '수동으로 트리거' },
]

// 액션 타입 설정
const actionTypes = [
  { value: 'notification', label: '알림 전송', icon: '🔔', description: '사용자에게 알림 전송' },
  { value: 'task', label: '작업 생성', icon: '📋', description: '새로운 작업 자동 생성' },
  { value: 'email', label: '이메일 전송', icon: '📧', description: '이메일 자동 발송' },
  { value: 'api', label: 'API 호출', icon: '🌐', description: '외부 API 연동' },
  { value: 'condition', label: '조건 분기', icon: '🔀', description: '조건에 따른 분기 처리' },
  { value: 'wait', label: '대기', icon: '⏱️', description: '일정 시간 대기' },
]

// 이벤트 타입
const eventTypes = [
  'project.created',
  'project.completed',
  'task.assigned',
  'task.completed',
  'task.overdue',
  'file.uploaded',
  'invoice.created',
  'invoice.paid',
  'chat.message_received',
]

interface WorkflowBuilderProps {
  workflow?: Workflow
  onSave: (workflow: Partial<Workflow>) => void
  onCancel: () => void
}

export default function WorkflowBuilder({ workflow, onSave, onCancel }: WorkflowBuilderProps) {
  const [name, setName] = useState(workflow?.name || '')
  const [description, setDescription] = useState(workflow?.description || '')
  const [triggerType, setTriggerType] = useState<WorkflowTrigger['type']>(workflow?.trigger.type || 'event')
  const [triggerConfig, setTriggerConfig] = useState(workflow?.trigger.config || {})
  const [actions, setActions] = useState<WorkflowAction[]>(workflow?.actions || [])
  const [showActionModal, setShowActionModal] = useState(false)
  const [editingAction, setEditingAction] = useState<WorkflowAction | null>(null)

  // 트리거 설정 업데이트
  const updateTriggerConfig = (key: string, value: string) => {
    setTriggerConfig(prev => ({ ...prev, [key]: value }))
  }

  // 액션 추가
  const addAction = (type: WorkflowAction['type']) => {
    const newAction: WorkflowAction = {
      id: Date.now().toString(),
      type,
      name: actionTypes.find(t => t.value === type)?.label || '',
      config: {},
    }
    setActions([...actions, newAction])
    setEditingAction(newAction)
    setShowActionModal(true)
  }

  // 액션 삭제
  const removeAction = (actionId: string) => {
    setActions(actions.filter(a => a.id !== actionId))
  }

  // 액션 순서 변경
  const moveAction = (index: number, direction: 'up' | 'down') => {
    const newActions = [...actions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < actions.length) {
      [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]]
      setActions(newActions)
    }
  }

  // 저장
  const handleSave = () => {
    if (!name || actions.length === 0) {
      alert('워크플로우 이름과 최소 하나의 액션이 필요합니다.')
      return
    }

    const workflowData: Partial<Workflow> = {
      name,
      description,
      trigger: {
        id: Date.now().toString(),
        type: triggerType,
        name: triggerTypes.find(t => t.value === triggerType)?.label || '',
        config: triggerConfig,
      },
      actions,
      status: 'active',
    }

    onSave(workflowData)
  }

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">워크플로우 정보</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              워크플로우 이름 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="예: 프로젝트 완료 시 알림"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="워크플로우의 목적과 동작을 설명하세요"
            />
          </div>
        </div>
      </div>

      {/* 트리거 설정 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">트리거 설정</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {triggerTypes.map((trigger) => (
            <button
              key={trigger.value}
              onClick={() => setTriggerType(trigger.value as WorkflowTrigger['type'])}
              className={`
                p-4 rounded-lg border-2 transition-all text-center
                ${triggerType === trigger.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="text-2xl mb-2">{trigger.icon}</div>
              <div className="font-medium text-sm">{trigger.label}</div>
              <div className="text-xs text-gray-600 mt-1">{trigger.description}</div>
            </button>
          ))}
        </div>

        {/* 트리거별 설정 */}
        {triggerType === 'schedule' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              실행 일정 (Cron 표현식)
            </label>
            <input
              type="text"
              value={triggerConfig.schedule || ''}
              onChange={(e) => updateTriggerConfig('schedule', e.target.value)}
              className="input"
              placeholder="0 9 * * 1-5 (평일 오전 9시)"
            />
            <p className="text-xs text-gray-500 mt-1">
              예: 0 9 * * 1-5 (평일 오전 9시), */30 * * * * (30분마다)
            </p>
          </div>
        )}

        {triggerType === 'event' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이벤트 타입
            </label>
            <select
              value={triggerConfig.event || ''}
              onChange={(e) => updateTriggerConfig('event', e.target.value)}
              className="input"
            >
              <option value="">이벤트 선택</option>
              {eventTypes.map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>
        )}

        {triggerType === 'webhook' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              웹훅 URL
            </label>
            <input
              type="text"
              value={triggerConfig.webhook || ''}
              onChange={(e) => updateTriggerConfig('webhook', e.target.value)}
              className="input"
              placeholder="https://your-domain.com/webhook"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              생성 후 웹훅 URL이 자동으로 생성됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 액션 설정 */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">액션 설정</h3>
          <button
            onClick={() => setShowActionModal(true)}
            className="btn btn-primary btn-sm"
          >
            + 액션 추가
          </button>
        </div>

        {actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔧</div>
            <p>아직 액션이 없습니다.</p>
            <p className="text-sm">액션을 추가하여 워크플로우를 구성하세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveAction(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveAction(index, 'down')}
                      disabled={index === actions.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {actionTypes.find(t => t.value === action.type)?.icon}
                      </span>
                      <div>
                        <div className="font-medium">
                          {actionTypes.find(t => t.value === action.type)?.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {action.type === 'notification' && action.config.message && 
                            `메시지: ${action.config.message}`}
                          {action.type === 'email' && action.config.to && 
                            `받는 사람: ${action.config.to}`}
                          {action.type === 'task' && action.config.title && 
                            `작업: ${action.config.title}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingAction(action)
                      setShowActionModal(true)
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg"
                  >
                    ✏️
                  </button>
                  
                  <button
                    onClick={() => removeAction(action.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                  >
                    🗑️
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="btn btn-secondary">
          취소
        </button>
        <button onClick={handleSave} className="btn btn-primary">
          {workflow ? '수정' : '생성'}
        </button>
      </div>

      {/* 액션 추가/수정 모달 */}
      {showActionModal && (
        <ActionModal
          action={editingAction}
          actionTypes={actionTypes}
          onSave={(action) => {
            if (editingAction && actions.find(a => a.id === editingAction.id)) {
              setActions(actions.map(a => a.id === action.id ? action : a))
            } else {
              addAction(action.type)
            }
            setShowActionModal(false)
            setEditingAction(null)
          }}
          onClose={() => {
            setShowActionModal(false)
            setEditingAction(null)
          }}
        />
      )}
    </div>
  )
}

// 액션 설정 모달
function ActionModal({ 
  action, 
  actionTypes, 
  onSave, 
  onClose 
}: { 
  action: WorkflowAction | null
  actionTypes: Array<{ value: string; label: string; icon: string; description: string }>
  onSave: (action: WorkflowAction) => void
  onClose: () => void 
}) {
  const [selectedType, setSelectedType] = useState<WorkflowAction['type']>(action?.type || 'notification')
  const [config, setConfig] = useState(action?.config || {})

  const handleSave = () => {
    const newAction: WorkflowAction = {
      id: action?.id || Date.now().toString(),
      type: selectedType,
      name: actionTypes.find(t => t.value === selectedType)?.label || '',
      config,
    }
    onSave(newAction)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">
          {action ? '액션 수정' : '액션 추가'}
        </h3>

        {!action && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {actionTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value as WorkflowAction['type'])}
                className={`
                  p-3 rounded-lg border text-center transition-all
                  ${selectedType === type.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* 액션별 설정 */}
        <div className="space-y-4">
          {selectedType === 'notification' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  알림 메시지
                </label>
                <textarea
                  value={config.message || ''}
                  onChange={(e) => setConfig({ ...config, message: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="사용자에게 표시될 알림 메시지"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  받는 사람
                </label>
                <select
                  value={config.recipient || ''}
                  onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                  className="input"
                >
                  <option value="">선택</option>
                  <option value="assignee">담당자</option>
                  <option value="project_members">프로젝트 멤버</option>
                  <option value="admin">관리자</option>
                  <option value="all">전체</option>
                </select>
              </div>
            </>
          )}

          {selectedType === 'email' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  받는 사람 이메일
                </label>
                <input
                  type="text"
                  value={config.to || ''}
                  onChange={(e) => setConfig({ ...config, to: e.target.value })}
                  className="input"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={config.subject || ''}
                  onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                  className="input"
                  placeholder="이메일 제목"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  value={config.body || ''}
                  onChange={(e) => setConfig({ ...config, body: e.target.value })}
                  className="input"
                  rows={4}
                  placeholder="이메일 내용"
                />
              </div>
            </>
          )}

          {selectedType === 'task' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작업 제목
                </label>
                <input
                  type="text"
                  value={config.title || ''}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="input"
                  placeholder="새로운 작업 제목"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={config.description || ''}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="작업 설명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  담당자
                </label>
                <select
                  value={config.assignee || ''}
                  onChange={(e) => setConfig({ ...config, assignee: e.target.value })}
                  className="input"
                >
                  <option value="">자동 할당</option>
                  <option value="project_manager">프로젝트 매니저</option>
                  <option value="team_lead">팀 리더</option>
                  <option value="specific">특정 사용자</option>
                </select>
              </div>
            </>
          )}

          {selectedType === 'condition' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  조건식
                </label>
                <input
                  type="text"
                  value={config.expression || ''}
                  onChange={(e) => setConfig({ ...config, expression: e.target.value })}
                  className="input"
                  placeholder="예: status === 'completed'"
                />
              </div>
            </>
          )}

          {selectedType === 'wait' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대기 시간 (초)
                </label>
                <input
                  type="number"
                  value={config.duration || ''}
                  onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                  className="input"
                  placeholder="60"
                />
              </div>
            </>
          )}

          {selectedType === 'api' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL
                </label>
                <input
                  type="text"
                  value={config.url || ''}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  className="input"
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Method
                </label>
                <select
                  value={config.method || 'GET'}
                  onChange={(e) => setConfig({ ...config, method: e.target.value })}
                  className="input"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headers (JSON)
                </label>
                <textarea
                  value={config.headers || ''}
                  onChange={(e) => setConfig({ ...config, headers: e.target.value })}
                  className="input font-mono text-sm"
                  rows={3}
                  placeholder='{"Authorization": "Bearer token"}'
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary">
            취소
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            {action ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}