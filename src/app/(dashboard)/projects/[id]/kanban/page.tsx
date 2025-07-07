'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import KanbanBoardPro from '@/components/kanban/KanbanBoardPro'

// Mock 칸반보드 데이터
const mockKanbanColumns = [
  {
    id: 'todo',
    title: '할 일',
    color: '#ef4444',
    limit: 10,
    tasks: [
      {
        id: 'task-1',
        title: 'API 설계 문서 작성',
        description: 'RESTful API 엔드포인트 설계 및 문서화',
        priority: 'high' as const,
        labels: ['백엔드', '문서화'],
        assignee: '김개발',
        dueDate: new Date('2024-02-01'),
        attachments: 2,
        comments: 5,
      },
      {
        id: 'task-2',
        title: '데이터베이스 스키마 설계',
        description: 'MySQL 데이터베이스 테이블 구조 설계',
        priority: 'urgent' as const,
        labels: ['DB', '설계'],
        assignee: '김개발',
        dueDate: new Date('2024-01-25'),
        checklist: [
          { id: 'c1', text: '사용자 테이블', completed: true },
          { id: 'c2', text: '상품 테이블', completed: true },
          { id: 'c3', text: '주문 테이블', completed: false },
          { id: 'c4', text: '결제 테이블', completed: false },
        ]
      },
    ]
  },
  {
    id: 'in-progress',
    title: '진행 중',
    color: '#eab308',
    limit: 5,
    tasks: [
      {
        id: 'task-3',
        title: '홈페이지 UI 디자인',
        description: '메인 페이지 및 서브 페이지 UI 디자인 작업',
        priority: 'medium' as const,
        labels: ['디자인', 'UI/UX'],
        assignee: '이디자인',
        dueDate: new Date('2024-02-10'),
        attachments: 5,
        comments: 12,
        checklist: [
          { id: 'c1', text: '와이어프레임', completed: true },
          { id: 'c2', text: '컬러 팔레트', completed: true },
          { id: 'c3', text: '메인 페이지', completed: true },
          { id: 'c4', text: '서브 페이지', completed: false },
        ]
      },
      {
        id: 'task-4',
        title: '로그인 기능 구현',
        description: 'JWT 기반 사용자 인증 시스템 구현',
        priority: 'high' as const,
        labels: ['프론트엔드', '백엔드'],
        assignee: '최개발',
        dueDate: new Date('2024-02-05'),
      },
    ]
  },
  {
    id: 'review',
    title: '검토',
    color: '#8b5cf6',
    tasks: [
      {
        id: 'task-5',
        title: '회원가입 플로우 검토',
        description: '회원가입 프로세스 UX 개선점 검토',
        priority: 'medium' as const,
        labels: ['UX', '검토'],
        assignee: '박기획',
        comments: 8,
      },
    ]
  },
  {
    id: 'done',
    title: '완료',
    color: '#10b981',
    tasks: [
      {
        id: 'task-6',
        title: '프로젝트 킥오프 미팅',
        description: '프로젝트 시작 미팅 및 요구사항 정리',
        priority: 'low' as const,
        labels: ['미팅'],
        assignee: '박기획',
        checklist: [
          { id: 'c1', text: '요구사항 정리', completed: true },
          { id: 'c2', text: '일정 수립', completed: true },
          { id: 'c3', text: '역할 분담', completed: true },
        ]
      },
      {
        id: 'task-7',
        title: '개발 환경 설정',
        description: 'Next.js, TypeScript, Tailwind CSS 환경 구축',
        priority: 'medium' as const,
        labels: ['설정'],
        assignee: '김개발',
      },
    ]
  }
]

export default function KanbanPage() {
  const params = useParams()
  const projectId = params.id as string
  const [columns, setColumns] = useState(mockKanbanColumns)

  const handleColumnsChange = (newColumns: typeof mockKanbanColumns) => {
    setColumns(newColumns)
    console.log('Columns updated:', newColumns)
  }

  const handleTaskAdd = (columnId: string) => {
    console.log('Add task to column:', columnId)
  }

  const handleTaskEdit = (task: any) => {
    console.log('Edit task:', task)
  }

  const handleTaskDelete = (taskId: string, columnId: string) => {
    console.log('Delete task:', taskId, 'from column:', columnId)
    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          tasks: col.tasks.filter(task => task.id !== taskId)
        }
      }
      return col
    })
    setColumns(newColumns)
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← 프로젝트 목록
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">웹사이트 리뉴얼</h1>
            <div className="flex items-center gap-4 mt-1">
              <Link
                href={`/projects/${projectId}/gantt`}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                간트차트
              </Link>
              <span className="text-gray-400">|</span>
              <Link
                href={`/projects/${projectId}/kanban`}
                className="text-sm font-medium text-primary"
              >
                칸반보드
              </Link>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn btn-secondary">
            <span className="mr-1">⚙️</span> 설정
          </button>
          <button className="btn btn-primary">
            <span className="mr-1">+</span> 작업 추가
          </button>
        </div>
      </div>

      {/* 칸반보드 */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoardPro
          columns={columns}
          onColumnsChange={handleColumnsChange}
          onTaskAdd={handleTaskAdd}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
        />
      </div>
    </div>
  )
}