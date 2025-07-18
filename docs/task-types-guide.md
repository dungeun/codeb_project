# Task 타입 가이드

## 개요
프로젝트의 Task 관련 타입이 통합되었습니다. 이 문서는 새로운 통합 타입 시스템을 설명합니다.

## 통합된 타입 구조

### 기본 타입 (`/src/types/task.ts`)

```typescript
// Task 상태
enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',  // 주의: 언더스코어 사용
  REVIEW = 'review',
  DONE = 'done'
}

// Task 우선순위
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 기본 Task 인터페이스
interface BaseTask {
  id: string
  projectId: string
  title: string
  description?: string
  assignee?: string
  assigneeId?: string
  status: TaskStatus
  priority: TaskPriority
  startDate?: Date
  dueDate?: Date
  labels: string[]
  attachments: TaskAttachment[]
  checklist?: ChecklistItem[]
  comments?: TaskComment[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
```

### 특화된 타입

1. **KanbanTask**: 칸반보드용
   - `columnId`: 속한 컬럼 ID
   - `order`: 정렬 순서

2. **GanttTask**: 간트차트용
   - `progress`: 진행률 (0-100)
   - `dependencies`: 의존성 작업 ID들
   - `children`: 하위 작업들

## 마이그레이션 가이드

### 1. 기존 코드 수정

**변경 전:**
```typescript
interface Task {
  status: 'in-progress'  // 하이픈 사용
  tags: string[]         // tags 사용
}
```

**변경 후:**
```typescript
import { BaseTask, TaskStatus } from '@/types/task'

interface Task extends BaseTask {
  status: TaskStatus.IN_PROGRESS  // 언더스코어 사용
  labels: string[]                 // labels로 변경
}
```

### 2. 데이터 마이그레이션

기존 데이터베이스의 status 값을 업데이트하려면:

```bash
npm run migrate-task-status
```

### 3. 컴포넌트 수정

```typescript
// 이전
import { Task } from './types'

// 이후
import { KanbanTask, TaskPriority } from '@/types/task'
```

## 유틸리티 함수

### 타입 변환
```typescript
import { 
  taskToFirebase,      // Task -> Firebase 저장용
  taskFromFirebase,    // Firebase -> Task 객체
  stringToTaskStatus,  // 문자열 -> TaskStatus
  stringToTaskPriority // 문자열 -> TaskPriority
} from '@/types/task'
```

### 사용 예시
```typescript
// Firebase에 저장
const firebaseData = taskToFirebase(task)
await set(ref, firebaseData)

// Firebase에서 읽기
const snapshot = await get(ref)
const task = taskFromFirebase(snapshot.val())
```

## 주의사항

1. **status 값**: `in-progress` → `in_progress` 변경됨
2. **날짜 타입**: Date 객체 사용 (Firebase는 string으로 자동 변환)
3. **필수 필드**: `labels`는 빈 배열이라도 필수
4. **enum 사용**: 문자열 대신 enum 상수 사용 권장

## 타입 안정성

TypeScript의 enum을 사용하여 타입 안정성이 향상되었습니다:

```typescript
// 잘못된 사용 - 컴파일 에러
task.status = 'in-progress'  

// 올바른 사용
task.status = TaskStatus.IN_PROGRESS
```

## 향후 계획

1. 모든 컴포넌트의 타입 통합 완료
2. API 응답 타입 통합
3. 테스트 코드 업데이트