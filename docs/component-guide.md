# CodeB Platform 컴포넌트 가이드

## 개요

CodeB 플랫폼의 React 컴포넌트 구조와 사용법을 설명하는 가이드입니다.

## 프로젝트 구조

```
src/
├── app/                    # Next.js 13 App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (dashboard)/       # 대시보드 페이지
│   └── globals.css        # 전역 스타일
├── components/            # 재사용 가능한 컴포넌트
│   ├── auth/             # 인증 컴포넌트
│   ├── chat/             # 채팅 컴포넌트
│   ├── dashboard/        # 대시보드 컴포넌트
│   ├── files/            # 파일 관리 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   └── ui/               # 기본 UI 컴포넌트
├── lib/                  # 유틸리티 및 설정
├── types/                # TypeScript 타입 정의
└── utils/                # 헬퍼 함수
```

## 스타일링 가이드

### CSS 변수
전역 CSS 변수를 사용하여 일관된 디자인을 유지합니다.

```css
:root {
  /* 색상 */
  --primary: #4f7eff;
  --primary-hover: #3d6de8;
  --secondary: #6b7280;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #f59e0b;
  
  /* 크기 */
  --sidebar-width: 260px;
  --header-height: 64px;
  
  /* 그림자 */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

### Tailwind CSS 클래스

#### 공통 컴포넌트 클래스
```css
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2;
}

.btn-primary {
  @apply bg-primary text-white hover:bg-primary-hover focus:ring-primary/20;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-200;
}

.card {
  @apply bg-white rounded-xl p-6 shadow-md;
}

.input {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary;
}
```

## 컴포넌트 상세 가이드

### 1. 인증 컴포넌트

#### AuthContext (`lib/auth-context.tsx`)
전역 인증 상태 관리를 담당합니다.

```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'customer' | 'admin' | 'team_member' | 'accountant'
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}
```

**사용법:**
```typescript
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const { user, login, logout } = useAuth()
  
  if (!user) return <div>로그인이 필요합니다</div>
  
  return <div>안녕하세요, {user.name}님!</div>
}
```

#### 로그인 페이지 (`app/(auth)/login/page.tsx`)
- 이메일/비밀번호 입력
- 로그인 상태 유지 옵션
- 비밀번호 재설정 링크
- 테스트 계정 정보 표시

### 2. 레이아웃 컴포넌트

#### Sidebar (`components/layout/Sidebar.tsx`)
사이드바 네비게이션 메뉴를 제공합니다.

**Props:**
```typescript
interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}
```

**특징:**
- 역할 기반 메뉴 표시
- 모바일 반응형 지원
- 활성 페이지 하이라이트

### 3. 대시보드 컴포넌트

#### ProjectProgress (`components/dashboard/ProjectProgress.tsx`)
프로젝트 진행률을 시각화합니다.

**Props:**
```typescript
interface ProjectProgressProps {
  progress: number  // 0-100
  phases: Array<{
    name: string
    status: 'completed' | 'current' | 'pending'
    progress: number
  }>
}
```

#### Timeline (`components/dashboard/Timeline.tsx`)
프로젝트 타임라인을 표시합니다.

**Props:**
```typescript
interface TimelineProps {
  events: Array<{
    id: string
    title: string
    description?: string
    date: Date
    type: 'milestone' | 'task' | 'meeting'
    status: 'completed' | 'current' | 'upcoming'
  }>
}
```

### 4. 파일 관리 컴포넌트

#### FileUpload (`components/files/FileUpload.tsx`)
드래그 앤 드롭 파일 업로드 컴포넌트입니다.

**Props:**
```typescript
interface FileUploadProps {
  onUpload: (files: File[]) => void
  maxSize?: number  // MB 단위
  acceptedTypes?: string[]
  multiple?: boolean
}
```

**특징:**
- 드래그 앤 드롭 지원
- 파일 크기 및 타입 검증
- 업로드 진행률 표시
- 다중 파일 선택 지원

#### FileList (`components/files/FileList.tsx`)
파일 목록을 그리드 형태로 표시합니다.

**Props:**
```typescript
interface FileListProps {
  files: FileItem[]
  onDownload: (file: FileItem) => void
  onDelete?: (file: FileItem) => void
  canDelete?: boolean
}

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  url: string
  category: 'document' | 'image' | 'video' | 'other'
  uploadedBy: string
  createdAt: Date
}
```

**특징:**
- 카테고리별 필터링
- 검색 기능
- 미리보기 지원
- 권한 기반 삭제 버튼

#### FilePreview (`components/files/FilePreview.tsx`)
파일 미리보기 모달 컴포넌트입니다.

**Props:**
```typescript
interface FilePreviewProps {
  file: {
    id: string
    name: string
    size: number
    type: string
    url: string
  }
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
}
```

**지원 파일 타입:**
- 이미지: jpg, png, gif, svg
- 비디오: mp4, webm
- 문서: pdf
- 텍스트: txt, md

### 5. 채팅 컴포넌트

#### ChatInput (`components/chat/ChatInput.tsx`)
메시지 입력 및 파일 첨부 컴포넌트입니다.

**Props:**
```typescript
interface ChatInputProps {
  onSend: (message: string, files?: AttachedFile[]) => void
  onTyping?: (isTyping: boolean) => void
  disabled?: boolean
}

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  preview?: string
}
```

**특징:**
- 멀티라인 텍스트 입력
- 파일 첨부 (최대 10MB)
- 타이핑 상태 관리
- 빠른 답변 버튼

#### ChatMessage (`components/chat/ChatMessage.tsx`)
개별 채팅 메시지를 표시합니다.

**Props:**
```typescript
interface ChatMessageProps {
  message: {
    id: string
    content: string
    senderId: string
    senderName: string
    timestamp: Date
    read?: boolean
    files?: AttachedFile[]
  }
  isOwn: boolean
}
```

**특징:**
- 송신자별 다른 스타일
- 파일 첨부 표시
- 읽음 확인 표시
- 타임스탬프 표시

### 6. 알림 컴포넌트

#### NotificationToast (`components/notification/NotificationToast.tsx`)
토스트 메시지를 표시합니다.

**사용법:**
```typescript
import toast from 'react-hot-toast'

// 성공 메시지
toast.success('파일이 업로드되었습니다.')

// 에러 메시지  
toast.error('업로드에 실패했습니다.')

// 정보 메시지
toast('새 메시지가 도착했습니다.')
```

#### NotificationContext (`lib/notification-context.tsx`)
브라우저 알림 권한 관리를 담당합니다.

## 개발 가이드라인

### 1. 컴포넌트 작성 규칙

#### 파일 구조
```typescript
'use client'  // 클라이언트 컴포넌트인 경우

import React from 'react'
import { motion } from 'framer-motion'  // 애니메이션이 필요한 경우

interface ComponentProps {
  // Props 타입 정의
}

export default function Component({ props }: ComponentProps) {
  // 컴포넌트 로직
  
  return (
    // JSX
  )
}
```

#### 네이밍 컨벤션
- 컴포넌트: PascalCase (`MyComponent`)
- 파일명: PascalCase (`MyComponent.tsx`)
- Props: camelCase (`onItemClick`)
- CSS 클래스: kebab-case (`btn-primary`)

#### 타입 정의
- 모든 Props에 TypeScript 인터페이스 정의
- 공통 타입은 `types/` 폴더에 분리
- 선택적 Props는 `?` 사용

### 2. 상태 관리

#### Local State
컴포넌트 내부 상태는 `useState` 사용:
```typescript
const [isOpen, setIsOpen] = useState(false)
const [data, setData] = useState<DataType[]>([])
```

#### Global State
전역 상태는 Context API 사용:
```typescript
// AuthContext, NotificationContext 등
const { user } = useAuth()
```

### 3. 이벤트 처리

#### 비동기 함수
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  try {
    await api.submit(data)
    toast.success('성공!')
  } catch (error) {
    toast.error('실패!')
  }
}
```

#### 파일 처리
```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || [])
  
  files.forEach(file => {
    if (file.size > MAX_SIZE) {
      toast.error(`파일 크기가 너무 큽니다: ${file.name}`)
      return
    }
    
    // 파일 처리 로직
  })
}
```

### 4. 스타일링

#### Tailwind CSS 우선 사용
```typescript
<div className="flex items-center space-x-4 p-6 bg-white rounded-xl shadow-lg">
  <button className="btn btn-primary">
    클릭하세요
  </button>
</div>
```

#### 조건부 스타일링
```typescript
<div className={`
  base-classes
  ${condition ? 'conditional-classes' : 'alternative-classes'}
`}>
```

### 5. 애니메이션

Framer Motion을 사용한 애니메이션:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  콘텐츠
</motion.div>
```

### 6. 접근성

#### ARIA 속성
```typescript
<button
  aria-label="파일 삭제"
  aria-expanded={isOpen}
  role="button"
  tabIndex={0}
>
```

#### 키보드 네비게이션
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleClick()
  }
}
```

## 테스트 가이드

### 1. 컴포넌트 테스트
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Component from './Component'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Component onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### 2. 권한 테스트
```typescript
it('shows delete button for admin users', () => {
  const adminUser = { role: 'admin' }
  render(<Component user={adminUser} />)
  
  expect(screen.getByText('삭제')).toBeInTheDocument()
})

it('hides delete button for customer users', () => {
  const customerUser = { role: 'customer' }
  render(<Component user={customerUser} />)
  
  expect(screen.queryByText('삭제')).not.toBeInTheDocument()
})
```

## 성능 최적화

### 1. React.memo 사용
```typescript
const ExpensiveComponent = React.memo(({ data }: Props) => {
  // 비싼 렌더링 로직
})
```

### 2. useCallback 사용
```typescript
const handleClick = useCallback(() => {
  // 이벤트 핸들러 로직
}, [dependency])
```

### 3. 지연 로딩
```typescript
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <LazyComponent />
    </Suspense>
  )
}
```

---

이 가이드는 CodeB 플랫폼의 컴포넌트 개발과 유지보수를 위한 기본 지침서입니다. 새로운 컴포넌트를 추가하거나 기존 컴포넌트를 수정할 때 이 가이드를 참고하여 일관성을 유지해주세요.