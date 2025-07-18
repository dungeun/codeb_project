import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push, set, get } from 'firebase/database'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import * as dotenv from 'dotenv'
import * as path from 'path'

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const auth = getAuth(app)

// 프로젝트별 작업 데이터
const projectTasks = {
  // CRM 시스템 구축 프로젝트
  'crm-system': {
    name: 'CRM 시스템 구축',
    tasks: [
      // 할 일 (todo)
      {
        title: '데이터베이스 스키마 최종 검토',
        description: '고객 데이터 관리를 위한 DB 스키마 최종 점검 및 인덱스 최적화',
        status: 'todo',
        priority: 'high',
        assignee: '박민수',
        dueDate: '2025-07-15',
        labels: ['backend', 'database'],
        columnId: 'todo',
        order: 0
      },
      {
        title: 'API 문서 작성',
        description: 'Swagger를 사용한 REST API 문서화 작업',
        status: 'todo',
        priority: 'medium',
        assignee: '이지은',
        dueDate: '2025-07-16',
        labels: ['documentation', 'api'],
        columnId: 'todo',
        order: 1
      },
      {
        title: '보안 감사 준비',
        description: 'OWASP Top 10 체크리스트 기반 보안 점검',
        status: 'todo',
        priority: 'urgent',
        assignee: '김철수',
        dueDate: '2025-07-12',
        labels: ['security', 'compliance'],
        columnId: 'todo',
        order: 2
      },

      // 진행 중 (in-progress)
      {
        title: '고객 대시보드 UI 개발',
        description: 'React를 사용한 고객 분석 대시보드 컴포넌트 구현',
        status: 'in-progress',
        priority: 'high',
        assignee: '정수민',
        dueDate: '2025-07-14',
        startDate: '2025-07-05',
        labels: ['frontend', 'react', 'ui'],
        checklist: [
          { id: '1', text: '차트 컴포넌트 구현', completed: true },
          { id: '2', text: '필터링 기능 추가', completed: true },
          { id: '3', text: '반응형 디자인 적용', completed: false },
          { id: '4', text: '다크모드 지원', completed: false }
        ],
        columnId: 'in-progress',
        order: 0
      },
      {
        title: '고객 데이터 가져오기 기능',
        description: 'CSV/Excel 파일로부터 고객 데이터 대량 가져오기 기능 구현',
        status: 'in-progress',
        priority: 'high',
        assignee: '박민수',
        dueDate: '2025-07-13',
        startDate: '2025-07-06',
        labels: ['backend', 'feature'],
        checklist: [
          { id: '1', text: 'CSV 파싱 로직 구현', completed: true },
          { id: '2', text: 'Excel 파싱 로직 구현', completed: true },
          { id: '3', text: '검증 로직 추가', completed: false },
          { id: '4', text: '에러 핸들링', completed: false }
        ],
        columnId: 'in-progress',
        order: 1
      },
      {
        title: '알림 시스템 구현',
        description: '이메일 및 인앱 알림 시스템 구현',
        status: 'in-progress',
        priority: 'medium',
        assignee: '이지은',
        dueDate: '2025-07-17',
        startDate: '2025-07-07',
        labels: ['backend', 'feature'],
        columnId: 'in-progress',
        order: 2
      },

      // 검토 (review)
      {
        title: '사용자 인증 모듈',
        description: 'JWT 기반 사용자 인증 및 권한 관리 시스템',
        status: 'review',
        priority: 'urgent',
        assignee: '김철수',
        dueDate: '2025-07-10',
        startDate: '2025-07-01',
        labels: ['backend', 'security', 'auth'],
        checklist: [
          { id: '1', text: '로그인 API 구현', completed: true },
          { id: '2', text: '토큰 갱신 로직', completed: true },
          { id: '3', text: '권한 검증 미들웨어', completed: true },
          { id: '4', text: '보안 테스트', completed: true }
        ],
        columnId: 'review',
        order: 0
      },
      {
        title: '고객 상세 정보 페이지',
        description: '고객 프로필, 구매 이력, 상담 내역을 보여주는 상세 페이지',
        status: 'review',
        priority: 'high',
        assignee: '정수민',
        dueDate: '2025-07-11',
        startDate: '2025-07-02',
        labels: ['frontend', 'ui'],
        columnId: 'review',
        order: 1
      },

      // 완료 (done)
      {
        title: '프로젝트 초기 설정',
        description: '개발 환경 구성 및 CI/CD 파이프라인 설정',
        status: 'done',
        priority: 'high',
        assignee: '김철수',
        dueDate: '2025-06-30',
        startDate: '2025-06-25',
        labels: ['devops', 'setup'],
        columnId: 'done',
        order: 0
      },
      {
        title: '데이터베이스 설계',
        description: 'PostgreSQL 기반 CRM 데이터베이스 설계 및 구축',
        status: 'done',
        priority: 'high',
        assignee: '박민수',
        dueDate: '2025-07-02',
        startDate: '2025-06-28',
        labels: ['backend', 'database'],
        columnId: 'done',
        order: 1
      },
      {
        title: 'UI/UX 디자인',
        description: 'CRM 시스템 전체 UI/UX 디자인 및 스타일 가이드 작성',
        status: 'done',
        priority: 'high',
        assignee: '정수민',
        dueDate: '2025-07-01',
        startDate: '2025-06-26',
        labels: ['design', 'ui'],
        columnId: 'done',
        order: 2
      },
      {
        title: '기본 CRUD API 구현',
        description: '고객, 상품, 주문 관련 기본 CRUD API 구현',
        status: 'done',
        priority: 'medium',
        assignee: '이지은',
        dueDate: '2025-07-05',
        startDate: '2025-07-01',
        labels: ['backend', 'api'],
        columnId: 'done',
        order: 3
      }
    ]
  },

  // 쇼핑몰 웹사이트 개발 프로젝트
  'shopping-mall': {
    name: '쇼핑몰 웹사이트 개발',
    tasks: [
      // 할 일 (todo)
      {
        title: '결제 모듈 통합',
        description: 'PG사 결제 모듈 연동 및 테스트',
        status: 'todo',
        priority: 'urgent',
        assignee: '이지은',
        dueDate: '2025-07-14',
        labels: ['backend', 'payment', 'integration'],
        columnId: 'todo',
        order: 0
      },
      {
        title: '모바일 최적화',
        description: '모바일 기기에서의 UX 개선 및 성능 최적화',
        status: 'todo',
        priority: 'high',
        assignee: '정수민',
        dueDate: '2025-07-16',
        labels: ['frontend', 'mobile', 'optimization'],
        columnId: 'todo',
        order: 1
      },
      {
        title: 'SEO 최적화',
        description: 'Next.js SEO 최적화 및 메타 태그 설정',
        status: 'todo',
        priority: 'medium',
        assignee: '김철수',
        dueDate: '2025-07-18',
        labels: ['frontend', 'seo'],
        columnId: 'todo',
        order: 2
      },

      // 진행 중 (in-progress)
      {
        title: '상품 상세 페이지 개발',
        description: 'Next.js를 사용한 상품 상세 페이지 및 이미지 갤러리 구현',
        status: 'in-progress',
        priority: 'high',
        assignee: '정수민',
        dueDate: '2025-07-12',
        startDate: '2025-07-05',
        labels: ['frontend', 'nextjs', 'feature'],
        checklist: [
          { id: '1', text: '이미지 갤러리 컴포넌트', completed: true },
          { id: '2', text: '상품 옵션 선택 UI', completed: true },
          { id: '3', text: '리뷰 섹션 구현', completed: false },
          { id: '4', text: '관련 상품 추천', completed: false }
        ],
        columnId: 'in-progress',
        order: 0
      },
      {
        title: '장바구니 기능 구현',
        description: 'Redux를 사용한 장바구니 상태 관리 및 localStorage 연동',
        status: 'in-progress',
        priority: 'high',
        assignee: '박민수',
        dueDate: '2025-07-11',
        startDate: '2025-07-04',
        labels: ['frontend', 'feature', 'redux'],
        checklist: [
          { id: '1', text: 'Redux store 설정', completed: true },
          { id: '2', text: '장바구니 추가/삭제', completed: true },
          { id: '3', text: '수량 변경 기능', completed: false },
          { id: '4', text: 'localStorage 동기화', completed: false }
        ],
        columnId: 'in-progress',
        order: 1
      },

      // 검토 (review)
      {
        title: '회원가입/로그인 페이지',
        description: 'NextAuth.js를 사용한 소셜 로그인 및 이메일 인증',
        status: 'review',
        priority: 'high',
        assignee: '김철수',
        dueDate: '2025-07-08',
        startDate: '2025-07-01',
        labels: ['frontend', 'auth'],
        columnId: 'review',
        order: 0
      },
      {
        title: '상품 목록 페이지',
        description: '무한 스크롤, 필터링, 정렬 기능이 포함된 상품 목록',
        status: 'review',
        priority: 'high',
        assignee: '이지은',
        dueDate: '2025-07-09',
        startDate: '2025-07-02',
        labels: ['frontend', 'feature'],
        columnId: 'review',
        order: 1
      },

      // 완료 (done)
      {
        title: 'Next.js 프로젝트 셋업',
        description: 'Next.js 13 App Router 기반 프로젝트 초기 설정',
        status: 'done',
        priority: 'high',
        assignee: '김철수',
        dueDate: '2025-06-28',
        startDate: '2025-06-25',
        labels: ['setup', 'nextjs'],
        columnId: 'done',
        order: 0
      },
      {
        title: '홈페이지 레이아웃',
        description: '메인 페이지 레이아웃 및 네비게이션 구현',
        status: 'done',
        priority: 'high',
        assignee: '정수민',
        dueDate: '2025-07-01',
        startDate: '2025-06-28',
        labels: ['frontend', 'ui'],
        columnId: 'done',
        order: 1
      },
      {
        title: 'Tailwind CSS 설정',
        description: 'Tailwind CSS 설정 및 커스텀 테마 구성',
        status: 'done',
        priority: 'medium',
        assignee: '박민수',
        dueDate: '2025-06-29',
        startDate: '2025-06-27',
        labels: ['frontend', 'styling'],
        columnId: 'done',
        order: 2
      }
    ]
  },

  // 모바일 앱 개발 프로젝트
  'mobile-app': {
    name: '모바일 앱 개발',
    tasks: [
      // 할 일 (todo)
      {
        title: '앱 스토어 배포 준비',
        description: 'iOS App Store 및 Google Play Store 배포를 위한 준비 작업',
        status: 'todo',
        priority: 'urgent',
        assignee: '김철수',
        dueDate: '2025-07-20',
        labels: ['deployment', 'release'],
        columnId: 'todo',
        order: 0
      },
      {
        title: '푸시 알림 테스트',
        description: 'FCM 기반 푸시 알림 전체 시나리오 테스트',
        status: 'todo',
        priority: 'high',
        assignee: '이지은',
        dueDate: '2025-07-15',
        labels: ['testing', 'notification'],
        columnId: 'todo',
        order: 1
      },
      {
        title: '성능 프로파일링',
        description: 'React Native 앱 성능 분석 및 최적화',
        status: 'todo',
        priority: 'medium',
        assignee: '박민수',
        dueDate: '2025-07-17',
        labels: ['performance', 'optimization'],
        columnId: 'todo',
        order: 2
      },

      // 진행 중 (in-progress)
      {
        title: '채팅 기능 구현',
        description: 'Socket.io를 사용한 실시간 채팅 기능 구현',
        status: 'in-progress',
        priority: 'high',
        assignee: '박민수',
        dueDate: '2025-07-13',
        startDate: '2025-07-06',
        labels: ['feature', 'react-native', 'realtime'],
        checklist: [
          { id: '1', text: 'Socket.io 연결 설정', completed: true },
          { id: '2', text: '메시지 송수신 구현', completed: true },
          { id: '3', text: '채팅방 목록 UI', completed: false },
          { id: '4', text: '메시지 알림 처리', completed: false }
        ],
        columnId: 'in-progress',
        order: 0
      },
      {
        title: '오프라인 모드 지원',
        description: 'AsyncStorage를 사용한 오프라인 데이터 캐싱',
        status: 'in-progress',
        priority: 'medium',
        assignee: '정수민',
        dueDate: '2025-07-14',
        startDate: '2025-07-07',
        labels: ['feature', 'storage'],
        columnId: 'in-progress',
        order: 1
      },

      // 검토 (review)
      {
        title: '사용자 프로필 기능',
        description: '프로필 이미지 업로드 및 정보 수정 기능',
        status: 'review',
        priority: 'high',
        assignee: '이지은',
        dueDate: '2025-07-10',
        startDate: '2025-07-03',
        labels: ['feature', 'user'],
        columnId: 'review',
        order: 0
      },
      {
        title: '지도 기능 통합',
        description: 'React Native Maps를 사용한 위치 기반 서비스',
        status: 'review',
        priority: 'medium',
        assignee: '김철수',
        dueDate: '2025-07-11',
        startDate: '2025-07-04',
        labels: ['feature', 'maps'],
        columnId: 'review',
        order: 1
      },

      // 완료 (done)
      {
        title: 'React Native 프로젝트 설정',
        description: 'React Native CLI 프로젝트 초기 설정 및 환경 구성',
        status: 'done',
        priority: 'high',
        assignee: '김철수',
        dueDate: '2025-06-30',
        startDate: '2025-06-26',
        labels: ['setup', 'react-native'],
        columnId: 'done',
        order: 0
      },
      {
        title: '네비게이션 구조 설계',
        description: 'React Navigation 기반 앱 네비게이션 구조 구현',
        status: 'done',
        priority: 'high',
        assignee: '박민수',
        dueDate: '2025-07-02',
        startDate: '2025-06-29',
        labels: ['navigation', 'architecture'],
        columnId: 'done',
        order: 1
      },
      {
        title: '로그인 화면 UI',
        description: '로그인 및 회원가입 화면 UI 구현',
        status: 'done',
        priority: 'high',
        assignee: '정수민',
        dueDate: '2025-07-03',
        startDate: '2025-06-30',
        labels: ['ui', 'auth'],
        columnId: 'done',
        order: 2
      },
      {
        title: 'API 연동 설정',
        description: 'Axios 설정 및 API 인터셉터 구현',
        status: 'done',
        priority: 'medium',
        assignee: '이지은',
        dueDate: '2025-07-04',
        startDate: '2025-07-01',
        labels: ['api', 'setup'],
        columnId: 'done',
        order: 3
      }
    ]
  }
}

async function addSampleTasks() {
  try {
    // 관리자 계정으로 로그인
    console.log('로그인 중...')
    await signInWithEmailAndPassword(auth, 'admin@codeb.com', 'admin123!')
    console.log('로그인 성공!')

    // 현재 프로젝트 목록 가져오기
    const projectsRef = ref(database, 'projects')
    const snapshot = await get(projectsRef)
    
    if (!snapshot.exists()) {
      console.log('프로젝트가 없습니다. 먼저 프로젝트를 생성해주세요.')
      return
    }

    const projects = snapshot.val()
    const projectEntries = Object.entries(projects)
    
    // 각 프로젝트에 작업 추가
    for (const [projectId, project] of projectEntries) {
      const projectName = (project as any).name
      console.log(`\n${projectName} 프로젝트 처리 중...`)

      // 프로젝트 이름에 맞는 작업 데이터 찾기
      let tasksData = null
      if (projectName.includes('CRM')) {
        tasksData = projectTasks['crm-system']
      } else if (projectName.includes('쇼핑몰')) {
        tasksData = projectTasks['shopping-mall']
      } else if (projectName.includes('모바일')) {
        tasksData = projectTasks['mobile-app']
      }

      if (!tasksData) {
        console.log(`${projectName}에 대한 작업 데이터를 찾을 수 없습니다.`)
        continue
      }

      // 기존 작업 삭제 (선택적)
      // const tasksRef = ref(database, `projects/${projectId}/tasks`)
      // await set(tasksRef, null)

      // 작업 추가
      for (const task of tasksData.tasks) {
        const tasksRef = ref(database, `projects/${projectId}/tasks`)
        const newTaskRef = push(tasksRef)
        
        const taskData = {
          ...task,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: auth.currentUser?.uid,
          assigneeId: auth.currentUser?.uid // 실제로는 팀원의 ID를 사용해야 함
        }

        await set(newTaskRef, taskData)
        console.log(`  ✓ 작업 추가됨: ${task.title}`)
      }

      // 프로젝트 진행률 업데이트
      const tasksRef = ref(database, `projects/${projectId}/tasks`)
      const tasksSnapshot = await get(tasksRef)
      
      if (tasksSnapshot.exists()) {
        const tasks = Object.values(tasksSnapshot.val())
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((task: any) => task.status === 'done').length
        const activeTasks = tasks.filter((task: any) => task.status === 'in-progress').length
        const progress = Math.round((completedTasks / totalTasks) * 100)

        await set(ref(database, `projects/${projectId}/progress`), progress)
        await set(ref(database, `projects/${projectId}/totalTasks`), totalTasks)
        await set(ref(database, `projects/${projectId}/completedTasks`), completedTasks)
        await set(ref(database, `projects/${projectId}/activeTasks`), activeTasks)
        
        console.log(`  ✓ 프로젝트 진행률 업데이트: ${progress}%`)
      }
    }

    console.log('\n✅ 모든 작업이 성공적으로 추가되었습니다!')
    process.exit(0)
  } catch (error) {
    console.error('오류 발생:', error)
    process.exit(1)
  }
}

// 환경 변수 체크
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.error('Firebase 환경 변수가 설정되지 않았습니다.')
  console.error('.env.local 파일에 Firebase 설정을 추가해주세요.')
  process.exit(1)
}

addSampleTasks()