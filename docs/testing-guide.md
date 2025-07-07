# CodeB Platform 테스트 가이드

## 개요

CodeB 플랫폼의 테스트 구조와 실행 방법을 설명하는 가이드입니다.

## 테스트 환경 설정

### 설치된 테스트 도구
- **Jest**: JavaScript 테스트 프레임워크
- **React Testing Library**: React 컴포넌트 테스트 라이브러리
- **@testing-library/jest-dom**: Jest DOM matcher 확장
- **@testing-library/user-event**: 사용자 상호작용 시뮬레이션

### 설정 파일
- `jest.config.js`: Jest 설정
- `jest.setup.js`: 테스트 환경 초기화
- `package.json`: 테스트 스크립트 정의

## 테스트 구조

```
src/
├── components/
│   └── __tests__/           # 컴포넌트 단위 테스트
│       ├── ChatInput.test.tsx
│       ├── FileUpload.test.tsx
│       └── FileList.test.tsx
├── lib/
│   └── __tests__/           # 유틸리티 및 컨텍스트 테스트
│       └── auth-context.test.tsx
└── __tests__/               # 통합 테스트
    ├── login.integration.test.tsx
    └── file-management.integration.test.tsx
```

## 테스트 실행

### 모든 테스트 실행
```bash
npm test
```

### 특정 테스트 파일 실행
```bash
npm test -- ChatInput.test.tsx
```

### 감시 모드로 실행
```bash
npm run test:watch
```

### 커버리지 리포트 생성
```bash
npm run test:coverage
```

## 테스트 유형

### 1. 단위 테스트 (Unit Tests)

개별 컴포넌트와 함수의 기능을 테스트합니다.

#### 컴포넌트 테스트 예시
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import ChatInput from '../ChatInput'

describe('ChatInput', () => {
  it('renders correctly', () => {
    render(<ChatInput onSend={jest.fn()} />)
    expect(screen.getByPlaceholderText('메시지를 입력하세요...')).toBeInTheDocument()
  })
  
  it('sends message when submitted', async () => {
    const mockOnSend = jest.fn()
    render(<ChatInput onSend={mockOnSend} />)
    
    // 사용자 상호작용 시뮬레이션
    const input = screen.getByPlaceholderText('메시지를 입력하세요...')
    await userEvent.type(input, '테스트 메시지')
    await userEvent.click(screen.getByRole('button', { name: /전송/i }))
    
    expect(mockOnSend).toHaveBeenCalledWith('테스트 메시지', undefined)
  })
})
```

### 2. 통합 테스트 (Integration Tests)

여러 컴포넌트가 함께 작동하는 것을 테스트합니다.

#### 페이지 레벨 테스트 예시
```typescript
import { render, screen } from '@testing-library/react'
import LoginPage from '../app/(auth)/login/page'
import { AuthProvider } from '../lib/auth-context'

describe('Login Integration', () => {
  it('handles successful login flow', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )
    
    // 로그인 폼 작성 및 제출
    await userEvent.type(screen.getByLabelText('이메일'), 'admin@codeb.com')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'admin123!')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))
    
    // 리다이렉션 확인
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
  })
})
```

### 3. 접근성 테스트

컴포넌트의 접근성을 확인합니다.

```typescript
it('has proper accessibility attributes', () => {
  render(<FileUpload onUpload={jest.fn()} />)
  
  const fileInput = screen.getByLabelText(/파일 선택/)
  expect(fileInput).toHaveAttribute('aria-describedby')
  expect(fileInput).toHaveAttribute('accept')
})
```

## 테스트 작성 가이드라인

### 1. 테스트 명명 규칙

#### Describe 블록
```typescript
describe('ComponentName', () => {
  // 컴포넌트별 테스트 그룹화
})

describe('Feature: User Authentication', () => {
  // 기능별 테스트 그룹화
})
```

#### Test 케이스
```typescript
it('renders correctly', () => {})
it('handles user input', () => {})
it('shows error message when validation fails', () => {})
it('calls callback function when button is clicked', () => {})
```

### 2. 테스트 구조 (AAA 패턴)

```typescript
it('calculates total price correctly', () => {
  // Arrange: 테스트 준비
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ]
  
  // Act: 실행
  const total = calculateTotal(items)
  
  // Assert: 검증
  expect(total).toBe(250)
})
```

### 3. Mock 사용

#### 외부 의존성 Mock
```typescript
// Next.js 라우터 Mock
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  })
}))

// Firebase Mock
jest.mock('../lib/firebase', () => ({
  auth: {},
  database: {},
}))
```

#### 함수 Mock
```typescript
const mockOnClick = jest.fn()

// 함수가 호출되었는지 확인
expect(mockOnClick).toHaveBeenCalled()

// 특정 인자로 호출되었는지 확인
expect(mockOnClick).toHaveBeenCalledWith('expected-argument')

// 호출 횟수 확인
expect(mockOnClick).toHaveBeenCalledTimes(1)
```

### 4. 비동기 테스트

```typescript
it('loads data asynchronously', async () => {
  render(<AsyncComponent />)
  
  // 로딩 상태 확인
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  
  // 데이터 로드 완료까지 대기
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

### 5. 사용자 상호작용 테스트

```typescript
import userEvent from '@testing-library/user-event'

it('handles user interactions', async () => {
  const user = userEvent.setup()
  render(<InteractiveComponent />)
  
  // 클릭
  await user.click(screen.getByRole('button'))
  
  // 타이핑
  await user.type(screen.getByLabelText('Input'), 'test text')
  
  // 키보드 입력
  await user.keyboard('{Enter}')
  
  // 파일 업로드
  const file = new File(['content'], 'test.txt', { type: 'text/plain' })
  await user.upload(screen.getByLabelText('File input'), file)
})
```

## 권한 기반 테스트

### 역할별 UI 테스트
```typescript
describe('Role-based UI', () => {
  it('shows admin features for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'admin', ...otherProps }
    })
    
    render(<ComponentWithRoleBasedUI />)
    
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
  })
  
  it('hides admin features for customer users', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'customer', ...otherProps }
    })
    
    render(<ComponentWithRoleBasedUI />)
    
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
  })
})
```

## 파일 업로드 테스트

### File API Mock
```typescript
// jest.setup.js에서 전역 설정
global.File = class MockFile {
  constructor(chunks, filename, options = {}) {
    this.chunks = chunks
    this.name = filename
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    this.type = options.type || ''
  }
}

// 테스트에서 사용
it('handles file upload', async () => {
  const file = new File(['content'], 'test.txt', { type: 'text/plain' })
  const user = userEvent.setup()
  
  render(<FileUploadComponent />)
  
  await user.upload(screen.getByLabelText('File input'), file)
  
  expect(screen.getByText('test.txt')).toBeInTheDocument()
})
```

## 에러 처리 테스트

### 에러 경계 테스트
```typescript
it('handles errors gracefully', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )
  
  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
})
```

### API 에러 테스트
```typescript
it('shows error message when API fails', async () => {
  // API Mock에서 에러 반환하도록 설정
  mockApiCall.mockRejectedValue(new Error('API Error'))
  
  render(<ComponentWithApiCall />)
  
  await waitFor(() => {
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })
})
```

## 커버리지 목표

- **라인 커버리지**: 80% 이상
- **함수 커버리지**: 90% 이상
- **브랜치 커버리지**: 75% 이상
- **구문 커버리지**: 80% 이상

### 커버리지 확인
```bash
npm run test:coverage
```

커버리지 리포트는 `coverage/` 폴더에 생성되며, `coverage/lcov-report/index.html`을 브라우저에서 열어 상세한 리포트를 확인할 수 있습니다.

## CI/CD 통합

### GitHub Actions 예시
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v1
```

## 성능 테스트

### 렌더링 성능 테스트
```typescript
it('renders large lists efficiently', () => {
  const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }))
  
  const start = performance.now()
  render(<LargeList items={largeDataSet} />)
  const end = performance.now()
  
  expect(end - start).toBeLessThan(100) // 100ms 이내
})
```

## 트러블슈팅

### 자주 발생하는 문제들

#### 1. 테스트가 실행되지 않음
```bash
# Jest 캐시 클리어
npm test -- --clearCache
```

#### 2. DOM 요소를 찾을 수 없음
```typescript
// getBy 대신 findBy 사용 (비동기 요소의 경우)
const element = await screen.findByText('Async content')

// queryBy 사용 (존재하지 않을 수 있는 요소)
const element = screen.queryByText('Optional content')
```

#### 3. 타이머 관련 테스트 문제
```typescript
// Fake timers 사용
jest.useFakeTimers()

// 시간 진행
jest.advanceTimersByTime(1000)

// Real timers로 복원
jest.useRealTimers()
```

#### 4. 메모리 누수 경고
```typescript
// cleanup 함수 사용
afterEach(() => {
  cleanup()
  jest.clearAllMocks()
})
```

## 추가 리소스

- [React Testing Library 공식 문서](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

이 가이드를 따라 일관되고 효과적인 테스트를 작성하여 코드 품질을 향상시키고 버그를 사전에 방지할 수 있습니다.